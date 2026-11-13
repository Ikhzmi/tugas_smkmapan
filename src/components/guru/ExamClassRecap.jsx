import React, { useMemo, useState } from 'react';
import {
  BarChart3, Download, FileSpreadsheet, FileText, Loader2, Inbox,
  Users, Award, CheckCircle2, Clock, Search, RefreshCw, ShieldAlert,
  TrendingUp, UserX,
} from 'lucide-react';
import './ExamClassRecap.css';

/**
 * Rekap nilai CBT per kelas.
 *
 * Sudut pandang guru: pilih kelas yang diampu, lalu lihat matriks
 * siswa (baris) x ujian (kolom) khusus mapel yang diajarkan di kelas itu.
 * Ujian diambil dari exams milik guru (teacher_id) yang subject_id-nya
 * ada di jadwal mengajar kelas tersebut.
 */

const KKM_DEFAULT = 75;

const TINGKAT_LABEL = { 10: 'X', 11: 'XI', 12: 'XII' };
const labelTingkat = (t) => TINGKAT_LABEL[t] || (t ? String(t) : '');

const angka = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtNilai = (n) => (n == null ? '—' : String(Math.round(n * 10) / 10));
const fmtRata = (n) => (n == null ? '—' : n.toFixed(1));
const tanggalFile = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const waktuOf = (x) => new Date(x.waktu_mulai || x.created_at || 0).getTime();

const statusTeks = {
  pass: 'Tuntas',
  fail: 'Belum tuntas',
  running: 'Sedang dikerjakan',
  stopped: 'Dihentikan',
  empty: 'Belum mengerjakan',
};

/** Ambil satu attempt terbaik per siswa+ujian: nilai tertinggi yang sah. */
const pilihAttempt = (list) => {
  const sah = list.filter((a) => a.nilai_akhir != null && a.status !== 'dibatalkan');
  if (sah.length) {
    return sah.sort(
      (a, b) => Number(b.nilai_akhir) - Number(a.nilai_akhir)
        || new Date(b.dikumpulkan_at || b.dimulai_at || 0) - new Date(a.dikumpulkan_at || a.dimulai_at || 0),
    )[0];
  }
  const jalan = list.find((a) => a.status === 'berjalan');
  if (jalan) return jalan;
  const batal = list.find((a) => a.status === 'dibatalkan');
  return batal || list[0];
};

export default function ExamClassRecap({
  students = [],
  attempts = [],
  exams = [],
  schedules = [],
  taughtClasses = [],
  loading = false,
}) {
  const [activeClassId, setActiveClassId] = useState('');
  const [mapel, setMapel] = useState('semua');
  const [kkm, setKkm] = useState(KKM_DEFAULT);
  const [q, setQ] = useState('');
  const [urut, setUrut] = useState('nama');
  const [hanyaAdaNilai, setHanyaAdaNilai] = useState(false);
  const [busy, setBusy] = useState('');

  /* ---------- kelas aktif: default kelas pertama yang diampu ---------- */
  const kelasId = useMemo(() => {
    if (activeClassId && taughtClasses.some((c) => c.id === activeClassId)) return activeClassId;
    return taughtClasses[0]?.id || '';
  }, [activeClassId, taughtClasses]);

  const kelasAktif = taughtClasses.find((c) => c.id === kelasId) || null;

  /* ---------- mapel yang diajarkan per kelas ---------- */
  const mapelPerKelas = useMemo(() => {
    const map = new Map();
    schedules.forEach((s) => {
      if (!s.class_id || !s.subject_id) return;
      if (!map.has(s.class_id)) map.set(s.class_id, new Map());
      map.get(s.class_id).set(s.subject_id, s.subjects?.nama || 'Mapel');
    });
    return map;
  }, [schedules]);

  const siswaPerKelas = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (!s.class_id) return;
      if (!map.has(s.class_id)) map.set(s.class_id, []);
      map.get(s.class_id).push(s);
    });
    return map;
  }, [students]);

  /* ---------- attempt per siswa+ujian ---------- */
  const attemptIndex = useMemo(() => {
    const raw = new Map();
    attempts.forEach((a) => {
      if (!a.student_id || !a.exam_id) return;
      const key = `${a.student_id}|${a.exam_id}`;
      if (!raw.has(key)) raw.set(key, []);
      raw.get(key).push(a);
    });
    const out = new Map();
    raw.forEach((list, key) => out.set(key, pilihAttempt(list)));
    return out;
  }, [attempts]);

  /* ---------- daftar ujian yang relevan untuk tiap kelas ---------- */
  const ujianPerKelas = useMemo(() => {
    const map = new Map();
    taughtClasses.forEach((c) => {
      const mapelIds = mapelPerKelas.get(c.id) || new Map();
      const siswa = siswaPerKelas.get(c.id) || [];
      const siswaIds = new Set(siswa.map((s) => s.id));
      const cols = exams
        .filter((x) => {
          if (x.subject_id) return mapelIds.has(x.subject_id);
          // ujian tanpa mapel: ikut tampil hanya bila ada siswanya yang mengerjakan
          return attempts.some((a) => a.exam_id === x.id && siswaIds.has(a.student_id));
        })
        .sort((a, b) => waktuOf(a) - waktuOf(b));
      map.set(c.id, cols);
    });
    return map;
  }, [taughtClasses, mapelPerKelas, siswaPerKelas, exams, attempts]);

  /* ---------- ringkasan tiap kelas (untuk chip pemilih) ---------- */
  const ringkasKelas = useMemo(() => {
    const out = new Map();
    taughtClasses.forEach((c) => {
      const siswa = siswaPerKelas.get(c.id) || [];
      const cols = ujianPerKelas.get(c.id) || [];
      let jumlah = 0;
      let total = 0;
      siswa.forEach((s) => {
        cols.forEach((x) => {
          const a = attemptIndex.get(`${s.id}|${x.id}`);
          const n = a && a.status !== 'dibatalkan' ? angka(a.nilai_akhir) : null;
          if (n != null) {
            jumlah += 1;
            total += n;
          }
        });
      });
      out.set(c.id, {
        siswa: siswa.length,
        ujian: cols.length,
        dinilai: jumlah,
        rata: jumlah ? total / jumlah : null,
      });
    });
    return out;
  }, [taughtClasses, siswaPerKelas, ujianPerKelas, attemptIndex]);

  /* ---------- detail kelas terpilih ---------- */
  const detail = useMemo(() => {
    const siswa = [...(siswaPerKelas.get(kelasId) || [])].sort((a, b) =>
      String(a.nama || '').localeCompare(String(b.nama || ''), 'id'));
    const mapelKelas = mapelPerKelas.get(kelasId) || new Map();
    let cols = ujianPerKelas.get(kelasId) || [];

    if (mapel !== 'semua') cols = cols.filter((x) => x.subject_id === mapel);
    if (hanyaAdaNilai) {
      cols = cols.filter((x) => siswa.some((s) => {
        const a = attemptIndex.get(`${s.id}|${x.id}`);
        return a && a.status !== 'dibatalkan' && angka(a.nilai_akhir) != null;
      }));
    }

    const baris = siswa.map((s) => {
      const cells = cols.map((x) => {
        const a = attemptIndex.get(`${s.id}|${x.id}`);
        if (!a) return { state: 'empty', nilai: null };
        if (a.status === 'dibatalkan') return { state: 'stopped', nilai: null };
        const n = angka(a.nilai_akhir);
        if (n == null) {
          return { state: a.status === 'berjalan' ? 'running' : 'empty', nilai: null };
        }
        return { state: n >= kkm ? 'pass' : 'fail', nilai: n };
      });
      const dinilai = cells.filter((c) => c.nilai != null);
      return {
        id: s.id,
        nama: s.nama || 'Siswa',
        nisn: s.nisn || '—',
        cells,
        dinilai: dinilai.length,
        tuntas: cells.filter((c) => c.state === 'pass').length,
        rata: dinilai.length
          ? dinilai.reduce((t, c) => t + c.nilai, 0) / dinilai.length
          : null,
      };
    });

    if (urut === 'nilai') {
      baris.sort((a, b) => {
        if (a.rata == null && b.rata == null) return a.nama.localeCompare(b.nama, 'id');
        if (a.rata == null) return 1;
        if (b.rata == null) return -1;
        return b.rata - a.rata;
      });
    }

    const kolom = cols.map((x, i) => {
      const nilai = baris
        .map((b) => b.cells[i]?.nilai)
        .filter((n) => n != null);
      const total = nilai.reduce((t, n) => t + n, 0);
      return {
        id: x.id,
        judul: x.judul || 'Ujian',
        mapel: x.subjects?.nama || mapelKelas.get(x.subject_id) || '—',
        jumlah: nilai.length,
        rata: nilai.length ? total / nilai.length : null,
        tertinggi: nilai.length ? Math.max(...nilai) : null,
        terendah: nilai.length ? Math.min(...nilai) : null,
        tuntas: nilai.filter((n) => n >= kkm).length,
      };
    });

    const dinilai = baris.reduce((t, b) => t + b.dinilai, 0);
    const totalNilai = baris.reduce(
      (t, b) => t + b.cells.reduce((s, c) => s + (c.nilai ?? 0), 0),
      0,
    );
    const tuntasSiswa = baris.filter(
      (b) => b.dinilai > 0 && b.tuntas === b.dinilai && b.dinilai === cols.length,
    ).length;
    const belumMengerjakan = baris.filter((b) => b.dinilai === 0).length;
    const sedangMengerjakan = baris.reduce(
      (t, b) => t + b.cells.filter((c) => c.state === 'running').length,
      0,
    );

    return {
      baris,
      kolom,
      tampilMapel: new Set(cols.map((x) => x.subject_id || '')).size > 1,
      mapelKelas: [...mapelKelas.entries()].map(([id, nama]) => ({ id, nama })),
      jumlahSiswa: baris.length,
      jumlahUjian: cols.length,
      dinilai,
      rata: dinilai ? totalNilai / dinilai : null,
      tuntasSiswa,
      belumMengerjakan,
      sedangMengerjakan,
    };
  }, [siswaPerKelas, mapelPerKelas, ujianPerKelas, attemptIndex, kelasId, mapel, hanyaAdaNilai, kkm, urut]);

  const barisTampil = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return detail.baris;
    return detail.baris.filter((b) =>
      `${b.nama} ${b.nisn}`.toLowerCase().includes(key));
  }, [detail.baris, q]);

  /* ---------- ekspor ---------- */
  const header = useMemo(() => [
    'No',
    'Nama Siswa',
    'NISN',
    ...detail.kolom.map((k) => k.judul),
    'Rata-rata',
    'Tuntas',
    'Dinilai',
  ], [detail.kolom]);

  const body = useMemo(() => barisTampil.map((b, i) => [
    i + 1,
    b.nama,
    b.nisn,
    ...b.cells.map((c) => (c.nilai == null ? '' : Math.round(c.nilai * 10) / 10)),
    b.rata == null ? '' : Number(b.rata.toFixed(1)),
    b.tuntas,
    b.dinilai,
  ]), [barisTampil]);

  const namaFile = (ext) => `rekap-nilai-${(kelasAktif?.nama || 'kelas')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${tanggalFile()}.${ext}`;

  const unduhBlob = (blob, nama) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nama;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsv = () => {
    const lines = [header, ...body].map((row) => row.map(csvCell).join(';'));
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    unduhBlob(blob, namaFile('csv'));
  };

  const handleExcel = async () => {
    setBusy('xlsx');
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
      ws['!cols'] = header.map((h) => ({
        wch: h === 'No' ? 5 : h === 'Nama Siswa' ? 26 : h === 'NISN' ? 14 : 16,
      }));
      XLSX.utils.book_append_sheet(wb, ws, 'Nilai per Siswa');

      const ringkas = [
        [`Rekap Nilai CBT — ${kelasAktif?.nama || 'Kelas'}`],
        ['SMK Muhammadiyah 8 Medan'],
        [`KKM: ${kkm}`, `Jumlah siswa: ${detail.jumlahSiswa}`, `Jumlah ujian: ${detail.jumlahUjian}`],
        [`Rata-rata kelas: ${fmtRata(detail.rata)}`, `Sudah dinilai: ${detail.dinilai}`, `Belum mengerjakan: ${detail.belumMengerjakan}`],
        [],
        ['Ujian', 'Mata Pelajaran', 'Peserta', 'Rata-rata', 'Tertinggi', 'Terendah', 'Tuntas'],
        ...detail.kolom.map((k) => [
          k.judul, k.mapel, k.jumlah,
          k.rata == null ? '' : Number(k.rata.toFixed(1)),
          k.tertinggi ?? '', k.terendah ?? '', k.tuntas,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(ringkas);
      ws2['!cols'] = [{ wch: 40 }, { wch: 26 }, { wch: 10 }, { wch: 12 }, { wch: 11 }, { wch: 11 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Ujian');

      XLSX.writeFile(wb, namaFile('xlsx'));
    } catch (err) {
      window.alert(`Gagal membuat file Excel: ${err.message || err}`);
    } finally {
      setBusy('');
    }
  };

  const handlePdf = async () => {
    setBusy('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const lebar = doc.internal.pageSize.getWidth();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(`Rekap Nilai CBT — ${kelasAktif?.nama || 'Kelas'}`, 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('SMK Muhammadiyah 8 Medan • Dicetak '
        + new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB', 40, 52);
      doc.text(
        `KKM ${kkm} • ${detail.jumlahSiswa} siswa • ${detail.jumlahUjian} ujian • `
        + `Rata-rata kelas ${fmtRata(detail.rata)}${mapel !== 'semua' ? ' • Filter mapel aktif' : ''}`,
        40, 66,
      );

      autoTable(doc, {
        head: [header],
        body: body.map((row) => row.map((c) => (c == null ? '' : String(c)))),
        startY: 78,
        margin: { left: 32, right: 32 },
        styles: {
          font: 'helvetica', fontSize: 7.2, cellPadding: 3,
          overflow: 'linebreak', textColor: [51, 65, 85],
        },
        headStyles: {
          fillColor: [234, 88, 12], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7.2,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 22, halign: 'center' }, 1: { cellWidth: 120 } },
        didDrawPage: () => {
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text('LMS MAPAN 4.0 • Rekap Nilai CBT', 32, doc.internal.pageSize.getHeight() - 16);
          doc.text(`Halaman ${doc.internal.getNumberOfPages()}`, lebar - 32,
            doc.internal.pageSize.getHeight() - 16, { align: 'right' });
        },
      });

      doc.save(namaFile('pdf'));
    } catch (err) {
      window.alert(`Gagal membuat file PDF: ${err.message || err}`);
    } finally {
      setBusy('');
    }
  };

  const adaData = barisTampil.length > 0;

  return (
    <section className="ecr-card guru-item-card">
      <header className="ecr-head guru-item-head">
        <div className="ecr-head-title">
          <span className="ecr-head-icon guru-item-icon"><BarChart3 size={18} /></span>
          <div className="guru-item-heading">
            <strong>Rekap Nilai CBT per Kelas</strong>
            <p className="guru-item-sub">
              Pilih kelas yang Anda ampu, lalu lihat nilai setiap siswa pada ujian
              mapel yang Anda ajarkan di kelas tersebut.
            </p>
          </div>
        </div>

        <div className="ecr-actions">
          <button type="button" className="ecr-btn is-csv" onClick={handleCsv}
            disabled={!adaData || !!busy} title="Unduh CSV">
            <Download size={14} /><span>CSV</span>
          </button>
          <button type="button" className="ecr-btn is-xlsx" onClick={handleExcel}
            disabled={!adaData || !!busy} title="Unduh Excel (.xlsx)">
            {busy === 'xlsx' ? <Loader2 size={14} className="ecr-spin" /> : <FileSpreadsheet size={14} />}
            <span>Excel</span>
          </button>
          <button type="button" className="ecr-btn is-pdf" onClick={handlePdf}
            disabled={!adaData || !!busy} title="Unduh PDF">
            {busy === 'pdf' ? <Loader2 size={14} className="ecr-spin" /> : <FileText size={14} />}
            <span>PDF</span>
          </button>
        </div>
      </header>

      {loading ? (
        <p className="ecr-empty"><Loader2 size={15} className="ecr-spin" /> Memuat data nilai...</p>
      ) : taughtClasses.length === 0 ? (
        <div className="ecr-empty-box">
          <Inbox size={28} />
          <strong>Belum ada kelas yang diampu</strong>
          <span>Kelas muncul otomatis dari jadwal mengajar Anda. Hubungi admin bila jadwal belum diisi.</span>
        </div>
      ) : (
        <>
          {/* Pemilih kelas */}
          <div className="ecr-class-strip">
            {taughtClasses.map((c) => {
              const st = ringkasKelas.get(c.id) || { siswa: 0, ujian: 0, rata: null };
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`ecr-class-chip ${c.id === kelasId ? 'is-active' : ''}`}
                  onClick={() => setActiveClassId(c.id)}
                >
                  <span className="ecr-chip-top">
                    <strong>{c.nama}</strong>
                    {c.tingkat ? <em className="ecr-chip-tingkat">{labelTingkat(c.tingkat)}</em> : null}
                  </span>
                  <span className="ecr-chip-meta">
                    <Users size={11} /> {st.siswa} siswa
                    <Award size={11} /> {st.ujian} ujian
                  </span>
                  <span className="ecr-chip-avg">
                    Rata-rata <strong>{fmtRata(st.rata)}</strong>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter */}
          <div className="ecr-toolbar">
            <div className="ecr-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Cari nama / NISN siswa..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <select value={mapel} onChange={(e) => setMapel(e.target.value)}>
              <option value="semua">Semua mapel di kelas ini</option>
              {detail.mapelKelas.map((m) => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>

            <label className="ecr-kkm">
              <span>KKM</span>
              <input
                type="number"
                min="0"
                max="100"
                value={kkm}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setKkm(Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : KKM_DEFAULT);
                }}
              />
            </label>

            <select value={urut} onChange={(e) => setUrut(e.target.value)}>
              <option value="nama">Urut: Nama A-Z</option>
              <option value="nilai">Urut: Nilai tertinggi</option>
            </select>

            <label className="ecr-toggle">
              <input
                type="checkbox"
                checked={hanyaAdaNilai}
                onChange={(e) => setHanyaAdaNilai(e.target.checked)}
              />
              <span>Sembunyikan ujian tanpa pengerjaan</span>
            </label>

            <button
              type="button"
              className="ecr-reset"
              onClick={() => { setQ(''); setMapel('semua'); setKkm(KKM_DEFAULT); setUrut('nama'); setHanyaAdaNilai(false); }}
              title="Bersihkan filter"
            >
              <RefreshCw size={13} /><span>Reset</span>
            </button>
          </div>

          {/* Ringkasan kelas terpilih */}
          <div className="ecr-stats">
            <span className="ecr-chip is-total"><Users size={12} /> Siswa: <strong>{detail.jumlahSiswa}</strong></span>
            <span className="ecr-chip is-total"><Award size={12} /> Ujian: <strong>{detail.jumlahUjian}</strong></span>
            <span className="ecr-chip is-ok"><CheckCircle2 size={12} /> Sudah dinilai: <strong>{detail.dinilai}</strong></span>
            <span className="ecr-chip is-warn"><Clock size={12} /> Sedang mengerjakan: <strong>{detail.sedangMengerjakan}</strong></span>
            <span className="ecr-chip is-danger"><UserX size={12} /> Belum mengerjakan: <strong>{detail.belumMengerjakan}</strong></span>
            <span className="ecr-chip is-avg"><TrendingUp size={12} /> Rata-rata kelas: <strong>{fmtRata(detail.rata)}</strong></span>
          </div>

          {detail.kolom.length === 0 ? (
            <div className="ecr-empty-box">
              <Inbox size={26} />
              <strong>Belum ada ujian untuk kelas ini</strong>
              <span>
                Rekap hanya menampilkan ujian pada mapel yang Anda ajarkan di
                {` ${kelasAktif?.nama || 'kelas ini'}`}. Buat ujian di tab Ujian / CBT.
              </span>
            </div>
          ) : detail.jumlahSiswa === 0 ? (
            <div className="ecr-empty-box">
              <Inbox size={26} />
              <strong>Belum ada siswa di kelas ini</strong>
              <span>Data siswa diambil dari kelas {kelasAktif?.nama || 'ini'}. Hubungi admin untuk memetakan siswa.</span>
            </div>
          ) : (
            <>
              <div className="ecr-table-wrap">
                <table className="ecr-table">
                  <thead>
                    <tr>
                      <th className="is-num">No</th>
                      <th className="is-name-col">Nama Siswa</th>
                      <th>NISN</th>
                      {detail.kolom.map((k) => (
                        <th key={k.id} className="is-exam" title={`${k.judul} • ${k.mapel}`}>
                          <span className="ecr-th-exam">{k.judul}</span>
                          {detail.tampilMapel && <span className="ecr-th-mapel">{k.mapel}</span>}
                        </th>
                      ))}
                      <th className="is-num is-avg-col">Rata²</th>
                      <th className="is-num">Tuntas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barisTampil.map((b, i) => (
                      <tr key={b.id}>
                        <td className="is-num">{i + 1}</td>
                        <td className="is-name-col is-name">{b.nama}</td>
                        <td className="is-mono">{b.nisn}</td>
                        {b.cells.map((c, ci) => (
                          <td
                            key={detail.kolom[ci]?.id || ci}
                            className={`is-num is-cell is-${c.state}`}
                            title={statusTeks[c.state] || ''}
                          >
                            {c.state === 'running' ? '···' : fmtNilai(c.nilai)}
                          </td>
                        ))}
                        <td className="is-num is-avg-col">
                          <strong>{fmtRata(b.rata)}</strong>
                        </td>
                        <td className="is-num">
                          <span className={`ecr-pill ${b.dinilai === 0 ? 'is-empty' : b.tuntas === detail.jumlahUjian ? 'is-ok' : 'is-warn'}`}>
                            {b.dinilai === 0 ? '—' : `${b.tuntas}/${detail.jumlahUjian}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="is-foot-label">Rata-rata per ujian</td>
                      {detail.kolom.map((k) => (
                        <td key={k.id} className="is-num is-foot-val" title={`${k.jumlah} peserta`}>
                          {fmtRata(k.rata)}
                        </td>
                      ))}
                      <td className="is-num is-foot-val">{fmtRata(detail.rata)}</td>
                      <td className="is-num is-foot-val">{detail.tuntasSiswa}</td>
                    </tr>
                  </tfoot>
                </table>

                {!barisTampil.length && (
                  <div className="ecr-no-match">
                    Tidak ada siswa yang cocok dengan pencarian. Tekan <strong>Reset</strong> untuk menampilkan semua.
                  </div>
                )}
              </div>

              {/* Tampilan daftar untuk layar kecil: tabel matriks diganti kartu per siswa */}
              <div className="ecr-mobile-list">
                {barisTampil.map((b) => (
                  <article key={b.id} className="ecr-mcard">
                    <header className="ecr-mcard-head">
                      <div>
                        <strong>{b.nama}</strong>
                        <span className="ecr-mcard-nisn">{b.nisn}</span>
                      </div>
                      <div className="ecr-mcard-avg">
                        <em>{fmtRata(b.rata)}</em>
                        <span>{b.dinilai === 0 ? 'belum ada nilai' : `${b.dinilai}/${detail.jumlahUjian} dinilai`}</span>
                      </div>
                    </header>
                    <ul className="ecr-mcard-list">
                      {b.cells.map((c, ci) => (
                        <li key={detail.kolom[ci]?.id || ci} className={`is-${c.state}`}>
                          <span className="ecr-m-exam">
                            {detail.kolom[ci]?.judul}
                            {detail.tampilMapel && <em>{detail.kolom[ci]?.mapel}</em>}
                          </span>
                          <span className="ecr-m-val">
                            {c.state === 'running' ? '···' : fmtNilai(c.nilai)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <footer className="ecr-foot">
                <span>
                  Menampilkan <strong>{barisTampil.length}</strong> dari <strong>{detail.jumlahSiswa}</strong> siswa
                  {` • ${detail.jumlahUjian} ujian • KKM ${kkm}`}
                </span>
                <span className="ecr-legend">
                  <i className="ecr-dot is-pass" /> Tuntas
                  <i className="ecr-dot is-fail" /> Belum tuntas
                  <i className="ecr-dot is-running" /> Sedang dikerjakan
                  <i className="ecr-dot is-stopped" /> Dihentikan
                  <i className="ecr-dot is-empty" /> Belum mengerjakan
                </span>
              </footer>
            </>
          )}
        </>
      )}

      {!loading && taughtClasses.length > 0 && detail.kolom.length > 0 && (
        <p className="ecr-note">
          <ShieldAlert size={12} />
          Nilai diambil dari pengerjaan tertinggi yang sah. Pengerjaan yang dihentikan
          karena pelanggaran tidak dihitung.
        </p>
      )}
    </section>
  );
}
