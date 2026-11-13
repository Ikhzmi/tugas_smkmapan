import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, UserPlus, Trash2, KeyRound, RefreshCw, AlertCircle, X, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { apiListAll, apiPost, apiPatch, apiDelete } from '../lib/api';
import { TableSkeleton } from './ui/Skeleton';
import './AdminPeopleManager.css';

const ROLES = ['admin', 'guru', 'siswa'];

const emptyForm = { nama: '', email: '', role: 'guru', password: '' };

const fmtTanggal = (iso) => (iso
  ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  : '—');

export default function AdminAccountManager({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPw, setResetPw] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const items = await apiListAll('/admin/accounts');
      setRows(items.map((r) => ({ ...r, login_terakhir: r.last_login_at })));
    } catch (err) {
      setError(err.message);
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter && (r.role || '') !== roleFilter) return false;
      if (!q) return true;
      return [r.email, r.nama, r.role].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [rows, search, roleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', pageCount];
    }
    if (currentPage >= pageCount - 3) {
      return [1, '...', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', pageCount];
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setModalError('');
    try {
      await apiPost('/admin/accounts', {
        name: form.nama.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
        password_confirmation: form.password,
      });
      onNotify?.(`Akun ${form.email.trim().toLowerCase()} berhasil dibuat.`);
      setForm(null);
      await load();
    } catch (err) {
      setError(err.message);
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRole = async (row, role) => {
    if (role === row.role) return;
    setError('');
    try {
      await apiPatch(`/admin/accounts/${row.user_id}/role`, { role });
    } catch (err) {
      setError(err.message);
      return;
    }
    onNotify?.(`Role ${row.email} diubah menjadi ${role}.`);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus akun ${row.email} (role: ${row.role})? Data guru/siswa yang tertaut tidak ikut terhapus, hanya tautan akunnya yang dilepas.`)) return;
    setError('');
    try {
      await apiDelete(`/admin/accounts/${row.user_id}`);
    } catch (err) {
      setError(err.message);
      return;
    }
    onNotify?.(`Akun ${row.email} berhasil dihapus.`);
    await load();
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
      onNotify?.(`Kata sandi ${resetTarget.email} berhasil direset.`);
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
          <h3>Kelola Akun Pengguna</h3>
          <p>Seluruh akun login (admin, guru, siswa): ganti role, reset sandi, atau hapus akun.</p>
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
              setForm({ ...emptyForm });
            }}
          >
            <UserPlus size={16} />
            <span>Buat Akun</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="apm-error-box" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="apm-toolbar mt-4">
        <div className="apm-search-wrap">
          <Search size={15} />
          <input
            className="apm-input"
            placeholder="Cari email / nama / role…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari akun"
          />
        </div>
        <select
          className="apm-select"
          style={{ maxWidth: 180 }}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          title="Filter berdasarkan role"
        >
          <option value="">Semua role</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          className="apm-select"
          style={{ maxWidth: 130 }}
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          title="Tampilkan per halaman"
        >
          <option value={5}>5 / hal</option>
          <option value={10}>10 / hal</option>
          <option value={20}>20 / hal</option>
          <option value={50}>50 / hal</option>
        </select>
        <span className="apm-muted">{filtered.length} dari {rows.length} akun</span>
      </div>

      {loading ? (
        <div className="mt-4">
          <TableSkeleton rows={7} template="1.5fr 1.1fr 120px 150px 190px" withToolbar={false} />
        </div>
      ) : (
        <>
      <div className="adm-att-table-header-info mt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-faint)', padding: '0 4px', flexWrap: 'wrap', gap: 8 }}>
        <span>
          Menampilkan <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> dari <strong>{filtered.length}</strong> akun
        </span>
        {pageCount > 1 && (
          <span>Halaman <strong>{currentPage}</strong> dari <strong>{pageCount}</strong></span>
        )}
      </div>

      <div className="cms-table-wrapper mt-3">
        <table className="cms-data-table">
          <thead>
            <tr>
              <th style={{ width: 48, textAlign: 'center' }}>No</th>
              <th>Email</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Login Terakhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4">Tidak ada akun yang cocok.</td></tr>
            ) : (
              pagedRows.map((r, idx) => (
                <tr key={r.user_id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-faint)', fontWeight: 700, fontSize: '0.8rem' }}>
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td><strong>{r.email}</strong></td>
                  <td>{r.nama}</td>
                  <td>
                    <select
                      className="apm-select"
                      style={{ width: 110, padding: '5px 8px' }}
                      value={r.role}
                      onChange={(e) => handleRole(r, e.target.value)}
                      title="Ganti role akun"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role} disabled={r.role === '-'}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-muted text-xs">{fmtTanggal(r.login_terakhir)}</td>
                  <td>
                    <div className="apm-row-actions">
                      <button
                        className="apm-btn-small"
                        title="Reset kata sandi"
                        onClick={() => {
                          setError('');
                          setModalError('');
                          setResetPw('');
                          setResetTarget(r);
                        }}
                      >
                        <KeyRound size={13} />
                        Reset Sandi
                      </button>
                      <button
                        className="btn-icon-delete"
                        title="Hapus akun"
                        onClick={() => handleDelete(r)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="cms-pagination-bar mt-4">
          <button
            type="button"
            className="cms-pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
            <span>Sebelumnya</span>
          </button>

          <div className="cms-pagination-pills">
            {getPageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`dots-${idx}`} className="cms-pagination-dots" style={{ padding: '0 6px', color: 'var(--text-faint)', userSelect: 'none' }}>
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
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
            aria-label="Halaman Selanjutnya"
          >
            <span>Selanjutnya</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
        </>
      )}

      <div className="apm-hint" style={{ marginTop: 14 }}>
        Proteksi bawaan: admin tidak dapat menghapus/menurunkan role akunnya sendiri,
        dan admin terakhir tidak bisa dihapus atau diturunkan — supaya panel
        tidak terkunci permanen.
      </div>

      {form && createPortal(
        <div className="apm-modal-overlay" onClick={() => setForm(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>Buat Akun Baru</h4>
              <button className="apm-modal-close" onClick={() => setForm(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="apm-modal-form">
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
                    <input className="apm-input" value={form.nama} onChange={set('nama')} placeholder="Mis. Administrator Baru" required />
                  </div>
                  <div className="apm-field apm-field-full">
                    <label>Email login *</label>
                    <input
                      className="apm-input"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value.toLowerCase() }))}
                      placeholder="username@smkmuh8.sch.id / NISN@siswa.smkmuh8.sch.id"
                      required
                    />
                  </div>
                  <div className="apm-field">
                    <label>Role *</label>
                    <select className="apm-select" value={form.role} onChange={set('role')}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="apm-field">
                    <label>Kata sandi awal * (min. 8 karakter)</label>
                    <input className="apm-input" type="text" value={form.password} onChange={set('password')} required minLength={8} />
                  </div>
                  <div className="apm-hint apm-field-full">
                    Supaya sesuai alur login website: guru/admin memakai
                    <code> username@smkmuh8.sch.id</code>, siswa memakai
                    <code> NISN@siswa.smkmuh8.sch.id</code>.
                  </div>
                </div>
              </div>

              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <ShieldCheck size={15} />
                  <span>{saving ? 'Membuat…' : 'Buat Akun'}</span>
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
                  Akun: <code>{resetTarget.email}</code> ({resetTarget.nama})
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
