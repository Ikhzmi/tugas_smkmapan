import React, { useMemo, useState } from 'react';
import {
  ClipboardList, Download, FileSpreadsheet, FileText, Loader2, Inbox,
  ShieldAlert, CheckCircle2, PlayCircle, Search, RefreshCw,
} from 'lucide-react';
import './ExamRecapCard.css';
import Pagination from './ui/Pagination';






const STATUS_META = {
  selesai: { label: 'Selesai', tone: 'is-ok' },
  berjalan: { label: 'Sedang dikerjakan', tone: 'is-live' },
  dibatalkan: { label: 'Dihentikan', tone: 'is-danger' },
};

const statusInfo = (status) => STATUS_META[status] || STATUS_META.selesai;

const formatWaktu = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const tanggalFile = () => new Date().toISOString().slice(0, 10);

const PAGE_SIZE = 15;

export default function ExamRecapCard({
  attempts = [],
  exams = [],
  showTeacher = false,
  title = 'Rekapan Ujian Siswa',
}) {
  const [q, setQ] = useState('');
  const [fKelas, setFKelas] = useState('semua');
  const [fMapel, setFMapel] = useState('semua');
  const [fUjian, setFUjian] = useState('semua');
  const [fStatus, setFStatus] = useState('semua');
  const [busy, setBusy] = useState('');
  const [page, setPage] = useState(1);

  const examMap = useMemo(() => new Map(exams.map((x) => [x.id, x])), [exams]);

  const rows = useMemo(() => {
    return attempts.map((a) => {
      const exam = examMap.get(a.exam_id);
      const info = statusInfo(a.status);
      const nilai = a.nilai_akhir;
      return {
        id: a.id,
        nama: a.students?.nama || 'Siswa',
        nisn: a.students?.nisn || '—',
        kelas: a.students?.classes?.nama || '—',
        mapel: exam?.subjects?.nama || '—',
        ujian: exam?.judul || 'Ujian',
        guru: exam?.teachers?.nama || '—',
        status: a.status || 'selesai',
        statusLabel: info.label,
        statusTone: info.tone,
        nilai: nilai == null || Number.isNaN(Number(nilai)) ? null : Number(nilai),
        nilaiText: nilai == null ? '—' : String(nilai),
        mulai: a.dimulai_at,
        selesai: a.dikumpulkan_at || a.dihentikan_at || null,
        catatan: a.status === 'dibatalkan'
          ? (a.alasan_berhenti ? `Dihentikan: ${a.alasan_berhenti}` : 'Dihentikan karena pelanggaran')
          : '',
      };
    }).sort((a, b) => (
      a.kelas.localeCompare(b.kelas, 'id')
      || a.ujian.localeCompare(b.ujian, 'id')
      || a.nama.localeCompare(b.nama, 'id')
    ));
  }, [attempts, examMap]);

  const options = useMemo(() => {
    const kelas = new Set();
    const mapel = new Set();
    const ujian = new Set();
    rows.forEach((r) => {
      if (r.kelas !== '—') kelas.add(r.kelas);
      if (r.mapel !== '—') mapel.add(r.mapel);
      ujian.add(r.ujian);
    });
    return {
      kelas: [...kelas].sort((a, b) => a.localeCompare(b, 'id')),
      mapel: [...mapel].sort((a, b) => a.localeCompare(b, 'id')),
      ujian: [...ujian].sort((a, b) => a.localeCompare(b, 'id')),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (fKelas !== 'semua' && r.kelas !== fKelas) return false;
      if (fMapel !== 'semua' && r.mapel !== fMapel) return false;
      if (fUjian !== 'semua' && r.ujian !== fUjian) return false;
      if (fStatus !== 'semua' && r.status !== fStatus) return false;
      if (key && !`${r.nama} ${r.nisn}`.toLowerCase().includes(key)) return false;
      return true;
    });
  }, [rows, q, fKelas, fMapel, fUjian, fStatus]);

  // Tabel bisa berisi ratusan baris di admin — potong per halaman (audit A15).
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const ringkas = useMemo(() => {
    const selesai = filtered.filter((r) => r.status !== 'berjalan' && r.status !== 'dibatalkan');
    const berjalan = filtered.filter((r) => r.status === 'berjalan');
    const dihentikan = filtered.filter((r) => r.status === 'dibatalkan');
    const bernilai = selesai.filter((r) => r.nilai != null);
    const rata = bernilai.length
      ? (bernilai.reduce((sum, r) => sum + r.nilai, 0) / bernilai.length)
      : null;
    return {
      total: filtered.length,
      selesai: selesai.length,
      berjalan: berjalan.length,
      dihentikan: dihentikan.length,
      rata,
    };
  }, [filtered]);

  const headerRow = [
    'No',
    'Nama Siswa',
    'NISN',
    'Kelas',
    'Mata Pelajaran',
    ...(showTeacher ? ['Guru'] : []),
    'Ujian',
    'Status',
    'Nilai',
    'Mulai',
    'Dikumpulkan / Dihentikan',
    'Catatan',
  ];

  const exportRows = filtered.map((r, i) => [
    i + 1,
    r.nama,
    r.nisn,
    r.kelas,
    r.mapel,
    ...(showTeacher ? [r.guru] : []),
    r.ujian,
    r.statusLabel,
    r.nilai != null ? r.nilai : '',
    formatWaktu(r.mulai),
    formatWaktu(r.selesai),
    r.catatan,
  ]);

  const namaFile = (ext) => `rekapan-ujian-siswa-${tanggalFile()}.${ext}`;

  const filterRingkas = () => {
    const parts = [];
    if (fKelas !== 'semua') parts.push(`Kelas: ${fKelas}`);
    if (fMapel !== 'semua') parts.push(`Mapel: ${fMapel}`);
    if (fUjian !== 'semua') parts.push(`Ujian: ${fUjian}`);
    if (fStatus !== 'semua') parts.push(`Status: ${statusInfo(fStatus).label}`);
    if (q.trim()) parts.push(`Pencarian: "${q.trim()}"`);
    return parts.join(' • ');
  };

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

  const handleExportCsv = () => {
    const lines = [headerRow, ...exportRows].map((row) => row.map(csvCell).join(';'));
    
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    unduhBlob(blob, namaFile('csv'));
  };

  const handleExportExcel = async () => {
    setBusy('xlsx');
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([headerRow, ...exportRows]);
      ws['!cols'] = headerRow.map((h) => ({
        wch: h === 'No' ? 5 : h === 'Nama Siswa' ? 24 : h === 'Ujian' || h === 'Mata Pelajaran' ? 28 : h === 'Catatan' ? 30 : 16,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Ujian');
      XLSX.writeFile(wb, namaFile('xlsx'));
    } catch (err) {
      window.alert(`Gagal membuat file Excel: ${err.message || err}`);
    } finally {
      setBusy('');
    }
  };

  const handleExportPdf = async () => {
    setBusy('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const lebar = doc.internal.pageSize.getWidth();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(title, 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`SMK Muhammadiyah 8 Medan • Dicetak ${formatWaktu(new Date().toISOString())} WIB`, 40, 52);
      if (filterRingkas()) doc.text(`Filter — ${filterRingkas()}`, 40, 66);

      autoTable(doc, {
        head: [headerRow],
        body: exportRows.map((row) => row.map((cell) => (cell == null ? '' : String(cell)))),
        startY: filterRingkas() ? 76 : 62,
        margin: { left: 40, right: 40 },
        styles: {
          font: 'helvetica',
          fontSize: 7.2,
          cellPadding: 3,
          overflow: 'linebreak',
          textColor: [51, 65, 85],
        },
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.4,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: () => {
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `LMS MAPAN 4.0 • ${title}`,
            40,
            doc.internal.pageSize.getHeight() - 18,
          );
          doc.text(
            `Halaman ${doc.internal.getNumberOfPages()}`,
            lebar - 40,
            doc.internal.pageSize.getHeight() - 18,
            { align: 'right' },
          );
        },
      });

      doc.save(namaFile('pdf'));
    } catch (err) {
      window.alert(`Gagal membuat file PDF: ${err.message || err}`);
    } finally {
      setBusy('');
    }
  };

  const adaData = rows.length > 0;

  return (
    <section className="erc-card">
      <header className="erc-head">
        <div className="erc-head-title">
          <span className="erc-head-icon"><ClipboardList size={18} /></span>
          <div>
            <h3>{title}</h3>
            <p>
              Tabel pengerjaan ujian per siswa. Gunakan filter untuk klasifikasi kelas,
              mapel, ujian, dan status sebelum diekspor.
            </p>
          </div>
        </div>

        <div className="erc-actions">
          <button
            type="button"
            className="erc-btn is-csv"
            onClick={handleExportCsv}
            disabled={!filtered.length || !!busy}
            title="Unduh data yang tampil sebagai CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className="erc-btn is-xlsx"
            onClick={handleExportExcel}
            disabled={!filtered.length || !!busy}
            title="Unduh data yang tampil sebagai Excel (.xlsx)"
          >
            {busy === 'xlsx' ? <Loader2 size={14} className="erc-spin" /> : <FileSpreadsheet size={14} />}
            <span>Excel</span>
          </button>
          <button
            type="button"
            className="erc-btn is-pdf"
            onClick={handleExportPdf}
            disabled={!filtered.length || !!busy}
            title="Unduh data yang tampil sebagai PDF"
          >
            {busy === 'pdf' ? <Loader2 size={14} className="erc-spin" /> : <FileText size={14} />}
            <span>PDF</span>
          </button>
        </div>
      </header>

      {adaData && (
        <>
          <div className="erc-filters">
            <div className="erc-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Cari nama / NISN..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
              />
            </div>

            <select value={fKelas} onChange={(e) => { setFKelas(e.target.value); setPage(1); }}>
              <option value="semua">Semua Kelas</option>
              {options.kelas.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>

            <select value={fMapel} onChange={(e) => { setFMapel(e.target.value); setPage(1); }}>
              <option value="semua">Semua Mapel</option>
              {options.mapel.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select value={fUjian} onChange={(e) => { setFUjian(e.target.value); setPage(1); }}>
              <option value="semua">Semua Ujian</option>
              {options.ujian.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>

            <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1); }}>
              <option value="semua">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="berjalan">Sedang dikerjakan</option>
              <option value="dibatalkan">Dihentikan</option>
            </select>

            <button
              type="button"
              className="erc-reset-filter"
              onClick={() => {
                setQ('');
                setFKelas('semua');
                setFMapel('semua');
                setFUjian('semua');
                setFStatus('semua');
                setPage(1);
              }}
              title="Bersihkan filter"
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          </div>

          <div className="erc-stats">
            <span className="erc-chip is-total">Total: <strong>{ringkas.total}</strong></span>
            <span className="erc-chip is-ok">Selesai: <strong>{ringkas.selesai}</strong></span>
            <span className="erc-chip is-live">Berjalan: <strong>{ringkas.berjalan}</strong></span>
            <span className="erc-chip is-danger">Dihentikan: <strong>{ringkas.dihentikan}</strong></span>
            <span className="erc-chip is-avg">
              Rata-rata nilai: <strong>{ringkas.rata == null ? '—' : ringkas.rata.toFixed(1)}</strong>
            </span>
          </div>

          <div className="erc-table-wrap">
            <table className="erc-table">
              <thead>
                <tr>
                  <th className="is-num">No</th>
                  <th>Nama Siswa</th>
                  <th>NISN</th>
                  <th>Kelas</th>
                  <th>Mata Pelajaran</th>
                  {showTeacher && <th>Guru</th>}
                  <th>Ujian</th>
                  <th>Status</th>
                  <th className="is-num">Nilai</th>
                  <th>Mulai</th>
                  <th>Dikumpulkan / Dihentikan</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={r.id} className={r.status === 'dibatalkan' ? 'is-danger' : ''}>
                    <td className="is-num">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="is-name">{r.nama}</td>
                    <td className="is-mono">{r.nisn}</td>
                    <td>{r.kelas}</td>
                    <td>{r.mapel}</td>
                    {showTeacher && <td>{r.guru}</td>}
                    <td>{r.ujian}</td>
                    <td><span className={`erc-badge ${r.statusTone}`}>{r.statusLabel}</span></td>
                    <td className="is-num is-score">{r.nilaiText}</td>
                    <td className="is-mono">{formatWaktu(r.mulai)}</td>
                    <td className="is-mono">{formatWaktu(r.selesai)}</td>
                    <td className="is-note">{r.catatan || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filtered.length && (
              <div className="erc-no-match">
                Tidak ada data yang cocok dengan filter. Tekan <strong>Reset</strong> untuk menampilkan semua.
              </div>
            )}
          </div>

          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onChange={setPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            label="pengerjaan"
          />

          <footer className="erc-foot">
            <span>
              Total <strong>{filtered.length}</strong> dari <strong>{rows.length}</strong> pengerjaan
              {fStatus === 'semua' && ringkas.dihentikan > 0 && (
                <> • <ShieldAlert size={12} className="erc-foot-icon" /> {ringkas.dihentikan} dihentikan</>
              )}
            </span>
            <span className="erc-foot-legend">
              <CheckCircle2 size={12} /> Selesai
              <PlayCircle size={12} /> Berjalan
              <ShieldAlert size={12} /> Dihentikan
            </span>
          </footer>
        </>
      )}

      {!adaData && (
        <div className="erc-empty">
          <Inbox size={30} />
          <strong>Belum ada pengerjaan ujian</strong>
          <span>Data akan muncul di sini setelah siswa mulai mengerjakan ujian.</span>
        </div>
      )}
    </section>
  );
}
