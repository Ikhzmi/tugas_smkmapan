import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users, AlertTriangle, Search,
  CheckCircle2, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ListSkeleton } from './ui/Skeleton';
import './AdminAttendance.css';

const STATUS = [
  { key: 'hadir', label: 'Hadir', short: 'H' },
  { key: 'terlambat', label: 'Terlambat', short: 'T' },
  { key: 'izin', label: 'Izin', short: 'I' },
  { key: 'sakit', label: 'Sakit', short: 'S' },
  { key: 'alpa', label: 'Alpa', short: 'A' },
];

const pad = (n) => String(n).padStart(2, '0');
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const awalBulan = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};

const ITEMS_PER_PAGE = 10;

export default function AdminAttendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kelas, setKelas] = useState('semua');
  const [dari, setDari] = useState(awalBulan);
  const [sampai, setSampai] = useState(() => toDateKey(new Date()));
  const [cari, setCari] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const [cls, stu, att] = await Promise.all([
        supabase.from('classes').select('id, nama, tingkat').order('nama'),
        supabase.from('students').select('id, nama, nisn, class_id').order('nama'),
        supabase
          .from('attendance')
          .select('id, student_id, class_id, schedule_id, tanggal, status, metode')
          .gte('tanggal', dari)
          .lte('tanggal', sampai)
          .order('tanggal', { ascending: false })
          .limit(5000),
      ]);
      setError('');
      if (cls.error) throw cls.error;
      if (stu.error) throw stu.error;
      if (att.error) throw att.error;
      setClasses(cls.data || []);
      setStudents(stu.data || []);
      setAttendance(att.data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data presensi.');
    } finally {
      setLoading(false);
    }
  }, [dari, sampai]);

  useEffect(() => { queueMicrotask(loadData); }, [loadData]);

  const namaKelas = useMemo(
    () => new Map(classes.map((c) => [c.id, c.nama])),
    [classes],
  );

  const siswaFilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return students.filter((s) => {
      if (kelas !== 'semua' && s.class_id !== kelas) return false;
      if (!q) return true;
      return (s.nama || '').toLowerCase().includes(q) || (s.nisn || '').includes(q);
    });
  }, [students, kelas, cari]);

  
  const rekap = useMemo(() => {
    const byStudent = new Map();
    attendance.forEach((a) => {
      let row = byStudent.get(a.student_id);
      if (!row) {
        row = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
        byStudent.set(a.student_id, row);
      }
      row.total += 1;
      if (row[a.status] != null) row[a.status] += 1;
    });

    return siswaFilter.map((s) => {
      const r = byStudent.get(s.id) || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
      const masuk = r.hadir + r.terlambat;
      return {
        ...s,
        kelas_nama: namaKelas.get(s.class_id) || '-',
        ...r,
        persen: r.total ? Math.round((masuk / r.total) * 100) : 0,
      };
    }).sort((a, b) => b.persen - a.persen || a.nama.localeCompare(b.nama));
  }, [attendance, siswaFilter, namaKelas]);

  const ringkasan = useMemo(() => {
    const c = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
    rekap.forEach((r) => {
      STATUS.forEach((st) => { c[st.key] += r[st.key]; });
      c.total += r.total;
    });
    const masuk = c.hadir + c.terlambat;
    return { ...c, persen: c.total ? Math.round((masuk / c.total) * 100) : 0 };
  }, [rekap]);

  const exportCsv = () => {
    const header = ['Nama', 'NISN', 'Kelas', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa', 'Total', 'Persentase'];
    const lines = [header.join(';')].concat(
      rekap.map((r) => [
        r.nama, r.nisn || '', r.kelas_nama,
        r.hadir, r.terlambat, r.izin, r.sakit, r.alpa, r.total, `${r.persen}%`,
      ].join(';')),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-presensi-${dari}-${sampai}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(rekap.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pagedRekap = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rekap.slice(start, start + ITEMS_PER_PAGE);
  }, [rekap, currentPage]);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="adm-att">
      
      <div className="adm-att-toolbar">
        <div className="adm-att-field">
          <label htmlFor="adm-kelas">Kelas</label>
          <select id="adm-kelas" value={kelas} onChange={(e) => { setKelas(e.target.value); setPage(1); }}>
            <option value="semua">Semua kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nama}</option>
            ))}
          </select>
        </div>
        <div className="adm-att-field">
          <label htmlFor="adm-dari">Dari</label>
          <input id="adm-dari" type="date" value={dari} onChange={(e) => { setDari(e.target.value); setPage(1); }} />
        </div>
        <div className="adm-att-field">
          <label htmlFor="adm-sampai">Sampai</label>
          <input id="adm-sampai" type="date" value={sampai} onChange={(e) => { setSampai(e.target.value); setPage(1); }} />
        </div>
        <div className="adm-att-field is-search">
          <label htmlFor="adm-cari">Cari siswa</label>
          <div className="adm-att-search">
            <Search size={14} />
            <input
              id="adm-cari"
              type="text"
              placeholder="Nama atau NISN..."
              value={cari}
              onChange={(e) => { setCari(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <button type="button" className="adm-att-export" onClick={exportCsv} disabled={!rekap.length}>
          <Download size={14} /> Ekspor CSV
        </button>
      </div>

      {error && (
        <div className="adm-att-alert">
          <AlertTriangle size={15} /><span>{error}</span>
        </div>
      )}

      
      <div className="adm-att-stats">
        <div className="adm-att-stat is-main">
          <span>Kehadiran</span>
          <strong>{ringkasan.persen}%</strong>
          <small>{ringkasan.total} catatan</small>
        </div>
        {STATUS.map((st) => (
          <div key={st.key} className={`adm-att-stat is-${st.key}`}>
            <span>{st.label}</span>
            <strong>{ringkasan[st.key]}</strong>
          </div>
        ))}
      </div>

      
      {loading ? (
        <ListSkeleton rows={6} height={46} className="mt-4" />
      ) : rekap.length === 0 ? (
        <div className="adm-att-empty">
          <Users size={24} />
          <strong>Belum ada data presensi</strong>
          <span>Belum ada catatan kehadiran pada rentang tanggal ini.</span>
        </div>
      ) : (
        <>
          <div className="adm-att-table-header-info">
            <span>
              Menampilkan <strong>{rekap.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> - <strong>{Math.min(currentPage * ITEMS_PER_PAGE, rekap.length)}</strong> dari <strong>{rekap.length}</strong> siswa
            </span>
            {totalPages > 1 && (
              <span>Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong></span>
            )}
          </div>

          <div className="adm-att-table-wrap">
            <table className="adm-att-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>No</th>
                  <th>Siswa</th>
                  <th>Kelas</th>
                  {STATUS.map((st) => <th key={st.key} className="is-num">{st.short}</th>)}
                  <th className="is-num">Total</th>
                  <th>Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {pagedRekap.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="adm-att-row-num">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td>
                      <div className="adm-att-who">
                        <strong>{r.nama}</strong>
                        <span>{r.nisn || '-'}</span>
                      </div>
                    </td>
                    <td className="adm-att-kelas">{r.kelas_nama}</td>
                    {STATUS.map((st) => (
                      <td key={st.key} className={`is-num is-${st.key}`}>
                        {r[st.key] || '·'}
                      </td>
                    ))}
                    <td className="is-num">{r.total || '·'}</td>
                    <td>
                      <div className="adm-att-bar">
                        <span style={{ width: `${r.persen}%` }} />
                      </div>
                      <span className="adm-att-pct">{r.persen}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="cms-pagination-bar adm-att-pagination">
              <button
                type="button"
                className="cms-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft size={16} />
                <span>Sebelumnya</span>
              </button>

              <div className="cms-pagination-pills">
                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="cms-pagination-dots">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`cms-page-pill ${p === currentPage ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="cms-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Halaman Selanjutnya"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <p className="adm-att-foot">
        <CheckCircle2 size={13} />
        Rekap dihitung dari catatan presensi pada rentang tanggal yang dipilih.
      </p>
    </div>
  );
}
