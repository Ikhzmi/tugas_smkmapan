import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap, UserPlus, Edit3, Trash2, KeyRound, RefreshCw, AlertCircle, X, UserCheck, Search,
} from 'lucide-react';
import { apiListAll, apiPost, apiPatch, apiDelete } from '../lib/api';
import Pagination from './ui/Pagination';
import { TableSkeleton, SkeletonLine } from './ui/Skeleton';
import './AdminPeopleManager.css';

const PAGE_SIZE = 10;

const emptyForm = {
  nama: '',
  nisn: '',
  class_id: '',
  no_hp: '',
  alamat: '',
  buat_akun: true,
  password: '',
};


export default function AdminSiswaManager({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError('');
    try {
      const [students, kelas, accs] = await Promise.all([
        apiListAll('/admin/students'),
        apiListAll('/admin/classes'),
        apiListAll('/admin/accounts').catch(() => []),
      ]);
      const classById = {};
      kelas.forEach((c) => { classById[c.id] = c; });
      setRows(students.map((s) => ({
        ...s,
        profile_id: s.user_id,
        classes: s.class_id ? { nama: classById[s.class_id]?.nama } : null,
      })));
      setClasses(kelas.map((c) => ({ ...c, majors: c.major || null })));
      setAccounts(accs);
    } catch (err) {
      setError('Gagal memuat data siswa: ' + err.message);
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const accByProfile = {};
  accounts.forEach((a) => { accByProfile[a.user_id] = a; });

  const classGroups = useMemo(() => {
    const groups = new Map();
    classes.forEach((c) => {
      const label = c.majors
        ? `${c.majors.kode || ''} — ${c.majors.nama || 'Tanpa nama jurusan'}`.trim()
        : 'Tanpa Jurusan';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(c);
    });
    return [...groups.entries()];
  }, [classes]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (classFilter && s.class_id !== classFilter) return false;
      if (!q) return true;
      return [s.nama, s.nisn, s.nis, s.classes?.nama, s.no_hp]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [rows, search, classFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setModalError('');
    try {
      const profil = {
        nama: form.nama.trim(),
        nisn: form.nisn.trim(),
        class_id: form.class_id || null,
        no_hp: form.no_hp.trim() || null,
        alamat: form.alamat.trim() || null,
      };
      if (form.mode === 'add') {
        const payload = { ...profil, create_account: form.buat_akun };
        if (form.buat_akun) {
          payload.password = form.password;
          payload.password_confirmation = form.password;
        }
        await apiPost('/admin/students', payload);
        onNotify?.(form.buat_akun
          ? 'Siswa baru beserta akun LMS-nya berhasil dibuat.'
          : 'Data siswa baru berhasil ditambahkan.');
      } else {
        await apiPatch(`/admin/students/${form.id}`, profil);
        onNotify?.('Data siswa berhasil diperbarui.');
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(err.message);
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const acc = row.profile_id ? accByProfile[row.profile_id] : null;
    const pesan = acc
      ? `Hapus siswa "${row.nama}" (${row.nisn || row.nis}) SEKALIGUS akun LMS ${acc.email}? Riwayat tugas & nilainya mengikuti kebijakan database.`
      : `Hapus siswa "${row.nama}" (${row.nisn || row.nis}) dari data?`;
    if (!window.confirm(pesan)) return;
    setError('');
    try {
      await apiDelete(`/admin/students/${row.id}`);
      onNotify?.('Data siswa berhasil dihapus.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setModalError('');
    try {
      await apiPost(`/admin/accounts/${resetTarget.user_id}/reset-password`, {
        password: resetPw,
        password_confirmation: resetPw,
      });
      onNotify?.(`Kata sandi ${resetTarget.email || resetTarget.username} berhasil direset.`);
      setResetTarget(null);
      setResetPw('');
    } catch (err) {
      setError(err.message);
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-panel animate-fade-in">
      <div className="panel-title-strip">
        <div>
          <h3>Data Siswa & Akun LMS</h3>
          <p>
            Kelola data peserta didik sekaligus akun login LMS{' '}
            {loading && !rows.length
              ? <SkeletonLine height={11} width={58} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
              : `(${rows.length} data)`}.
          </p>
        </div>
        <div className="apm-toolbar">
          <button className="btn btn-outline" onClick={load} title="Muat ulang data">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError('');
              setModalError('');
              setForm({ mode: 'add', ...emptyForm });
            }}
          >
            <UserPlus size={16} />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="apm-error-box" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {classes.length === 0 && !loading && (
        <div className="apm-hint" style={{ marginTop: 12 }}>
          Belum ada kelas di database. Tambahkan lewat menu <strong>Kelas</strong> di sidebar
          sebelum membagi siswa ke rombongan belajar.
        </div>
      )}

      <div className="apm-toolbar mt-4">
        <div className="apm-search-wrap">
          <Search size={15} />
          <input
            className="apm-input"
            placeholder="Cari nama / NISN / kelas / no. HP…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari siswa"
          />
        </div>
        <select
          className="apm-select"
          style={{ maxWidth: 260 }}
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          title="Filter berdasarkan kelas"
        >
          <option value="">Semua kelas</option>
          {classGroups.map(([majorLabel, items]) => (
            <optgroup key={majorLabel} label={majorLabel}>
              {items.map((c) => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="apm-muted">
          {loading && !rows.length
            ? <SkeletonLine height={11} width={96} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            : `${filteredRows.length} dari ${rows.length} siswa`}
        </span>
      </div>

      {loading ? (
        <div className="mt-4">
          <TableSkeleton rows={7} template="80px 1.4fr 1fr 1.3fr 170px" withToolbar={false} />
        </div>
      ) : (
        <>
      <div className="cms-table-wrapper mt-4">
        <table className="cms-data-table">
          <thead>
            <tr>
              <th>NISN</th>
              <th>Nama</th>
              <th>Kelas</th>
              <th>No. HP</th>
              <th>Akun LMS</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4">
                {search || classFilter ? 'Tidak ada siswa yang cocok dengan filter.' : 'Belum ada data siswa.'}
              </td></tr>
            ) : (
              pagedRows.map((s) => {
                const acc = s.profile_id ? accByProfile[s.profile_id] : null;
                return (
                  <tr key={s.id}>
                    <td>{s.nisn || s.nis || '-'}</td>
                    <td><strong>{s.nama}</strong></td>
                    <td>{s.classes?.nama || '-'}</td>
                    <td>{s.no_hp || '-'}</td>
                    <td>
                      {acc ? (
                        <span className="apm-badge apm-badge-ok">
                          <UserCheck size={12} />
                          {acc.email || acc.username}
                        </span>
                      ) : (
                        <span className="apm-badge apm-badge-none">Belum punya akun</span>
                      )}
                    </td>
                    <td>
                      <div className="apm-row-actions">
                        <button
                          className="apm-btn-small"
                          title="Edit data siswa"
                          onClick={() => {
                            setError('');
                            setModalError('');
                            setForm({
                              mode: 'edit',
                              id: s.id,
                              nama: s.nama || '',
                              nisn: s.nisn || s.nis || '',
                              class_id: s.class_id || '',
                              no_hp: s.no_hp || '',
                              alamat: s.alamat || '',
                            });
                          }}
                        >
                          <Edit3 size={13} />
                          Edit
                        </button>
                        {acc && (
                          <button
                            className="apm-btn-small"
                            title="Reset kata sandi akun"
                            onClick={() => {
                              setError('');
                              setModalError('');
                              setResetPw('');
                              setResetTarget(acc);
                            }}
                          >
                            <KeyRound size={13} />
                            Reset Sandi
                          </button>
                        )}
                        <button
                          className="btn-icon-delete"
                          title="Hapus siswa"
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={currentPage}
        pageCount={pageCount}
        onChange={setPage}
        total={filteredRows.length}
        pageSize={PAGE_SIZE}
        label="siswa"
      />
        </>
      )}

      {form && createPortal(
        <div className="apm-modal-overlay" onClick={() => setForm(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>{form.mode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}</h4>
              <button className="apm-modal-close" onClick={() => setForm(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="apm-modal-form">
              <div className="apm-modal-body">
                {modalError && (
                  <div className="apm-error-box" role="alert" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="apm-form-grid">
                  <div className="apm-field apm-field-full">
                    <label>Nama lengkap *</label>
                    <input className="apm-input" value={form.nama} onChange={set('nama')} placeholder="Mis. Rian Pratama" required />
                  </div>
                  <div className="apm-field">
                    <label>NISN *</label>
                    <input
                      className="apm-input"
                      value={form.nisn}
                      onChange={(e) => setForm((f) => ({ ...f, nisn: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="10 digit NISN"
                      required
                    />
                  </div>
                  <div className="apm-field">
                    <label>Kelas</label>
                    <select className="apm-select" value={form.class_id} onChange={set('class_id')}>
                      <option value="">— Tanpa kelas —</option>
                      {classGroups.map(([majorLabel, items]) => (
                        <optgroup key={majorLabel} label={majorLabel}>
                          {items.map((c) => (
                            <option key={c.id} value={c.id}>{c.nama}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <span className="apm-hint" style={{ marginTop: 6 }}>
                      Daftar kelas dikelola lewat menu <strong>Kelas</strong> di sidebar.
                    </span>
                  </div>
                  <div className="apm-field">
                    <label>No. HP / WhatsApp</label>
                    <input className="apm-input" value={form.no_hp} onChange={set('no_hp')} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="apm-field">
                    <label>Alamat</label>
                    <input className="apm-input" value={form.alamat} onChange={set('alamat')} placeholder="Kec., Kota" />
                  </div>

                  {form.mode === 'add' && (
                    <>
                      <label className="apm-checkbox apm-field-full">
                        <input
                          type="checkbox"
                          checked={form.buat_akun}
                          onChange={(e) => setForm((f) => ({ ...f, buat_akun: e.target.checked }))}
                        />
                        Sekalian buatkan akun login LMS siswa
                      </label>
                      {form.buat_akun && (
                        <div className="apm-account-box apm-field-full">
                          <div className="apm-field">
                            <label>Kata sandi awal * (min. 8 karakter)</label>
                            <input className="apm-input" type="text" value={form.password} onChange={set('password')} placeholder="mis. mapan2026" required minLength={8} />
                          </div>
                          <div className="apm-hint" style={{ marginTop: 8 }}>
                            Akun dibuat dengan username <code>{form.nisn || 'NISN'}</code> dan
                            role <code>siswa</code>. Siswa masuk memakai NISN tersebut.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <GraduationCap size={15} />
                  <span>{saving ? 'Menyimpan…' : form.mode === 'add' ? 'Simpan & Buat' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {resetTarget && createPortal(
        <div className="apm-modal-overlay" onClick={() => setResetTarget(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>Reset Kata Sandi</h4>
              <button className="apm-modal-close" onClick={() => setResetTarget(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReset} className="apm-modal-form">
              <div className="apm-modal-body">
                {modalError && (
                  <div className="apm-error-box" role="alert" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="apm-hint" style={{ marginBottom: 14 }}>
                  Akun: <code>{resetTarget.email || resetTarget.username}</code> ({resetTarget.nama})
                </div>
                <div className="apm-field apm-field-full">
                  <label>Kata sandi baru * (min. 8 karakter)</label>
                  <input
                    className="apm-input"
                    type="text"
                    value={resetPw}
                    onChange={(e) => setResetPw(e.target.value)}
                    placeholder="Kata sandi baru"
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
              </div>
              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setResetTarget(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <KeyRound size={15} />
                  <span>{saving ? 'Memproses…' : 'Reset Sandi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
