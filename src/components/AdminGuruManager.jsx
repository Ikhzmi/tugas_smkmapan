import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, UserPlus, Edit3, Trash2, KeyRound, RefreshCw, AlertCircle, X, UserCheck, Camera, Loader2, Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { teacherPhoto } from '../lib/teacherPhoto';
import { uploadImage } from '../lib/uploadImage';
import Pagination from './ui/Pagination';
import { TableSkeleton } from './ui/Skeleton';
import './AdminPeopleManager.css';

const PAGE_SIZE = 8;

const emptyForm = {
  nama: '',
  gelar: '',
  jabatan: '',
  department: '',
  email: '',
  jam_kerja: '',
  foto_url: '',
  buat_akun: true,
  username: '',
  password: '',
};

export default function AdminGuruManager({ onNotify, onDataChange }) {
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [form, setForm] = useState(null); // null | { mode:'add' } | { mode:'edit', id, ... }
  const [resetTarget, setResetTarget] = useState(null); // { user_id, email, nama }
  const [resetPw, setResetPw] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const photoInputRef = useRef(null);

  const load = useCallback(async () => {
    const [tRes, aRes] = await Promise.all([
      supabase.from('teachers').select('*').order('nama'),
      supabase.rpc('admin_list_accounts'),
    ]);
    setError('');
    if (tRes.error) setError('Gagal memuat data guru: ' + tRes.error.message);
    if (aRes.error && aRes.error.message !== 'Akses ditolak: hanya admin yang boleh melihat daftar akun.') {
      setError((prev) => prev || 'Gagal memuat daftar akun: ' + aRes.error.message);
    }
    setRows(tRes.data || []);
    setAccounts(aRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const accByProfile = {};
  accounts.forEach((a) => { accByProfile[a.user_id] = a; });

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => [t.nama, t.gelar, t.jabatan, t.department, t.email]
      .some((v) => (v || '').toLowerCase().includes(q)));
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoUploading(true);
    setModalError('');
    try {
      const url = await uploadImage('teacher-photos', file);
      setForm((f) => (f ? { ...f, foto_url: url } : f));
    } catch (err) {
      setModalError('Gagal mengunggah foto: ' + err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photoUploading) return;
    setSaving(true);
    setError('');
    setModalError('');
    try {
      if (form.mode === 'add') {
        const { data: teacherId, error: err } = await supabase.rpc('admin_create_guru', {
          p_nama: form.nama.trim(),
          p_gelar: form.gelar.trim() || null,
          p_jabatan: form.jabatan.trim() || null,
          p_department: form.department.trim() || null,
          p_email: form.email.trim() || null,
          p_jam_kerja: form.jam_kerja.trim() || null,
          p_username: form.username.trim().toLowerCase() || null,
          p_password: form.password || null,
          p_buat_akun: form.buat_akun,
        });
        if (err) throw err;
        if (form.foto_url && teacherId) {
          const { error: photoErr } = await supabase
            .from('teachers')
            .update({ foto_url: form.foto_url })
            .eq('id', teacherId);
          if (photoErr) {
            onNotify?.('Guru dibuat, tetapi foto gagal disimpan: ' + photoErr.message);
          }
        }
        onNotify?.(form.buat_akun
          ? 'Guru baru beserta akun loginnya berhasil dibuat.'
          : 'Data guru baru berhasil ditambahkan.');
      } else {
        const { error: err } = await supabase
          .from('teachers')
          .update({
            nama: form.nama.trim(),
            gelar: form.gelar.trim() || null,
            jabatan: form.jabatan.trim() || null,
            department: form.department.trim() || null,
            email: form.email.trim() || null,
            jam_kerja: form.jam_kerja.trim() || null,
            foto_url: form.foto_url || null,
          })
          .eq('id', form.id);
        if (err) throw err;
        onNotify?.('Data guru berhasil diperbarui.');
      }
      setForm(null);
      await load();
      await onDataChange?.();
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
      ? `Hapus guru "${row.nama}" SEKALIGUS akun login ${acc.email}? Data jadwal/materi miliknya akan ikut kebijakan database (on delete set null / cascade).`
      : `Hapus guru "${row.nama}" dari direktori?`;
    if (!window.confirm(pesan)) return;
    setError('');
    try {
      if (acc) {
        const { error: err } = await supabase.rpc('admin_delete_account', { p_user_id: acc.user_id });
        if (err) throw err;
      }
      const { error: err2 } = await supabase.from('teachers').delete().eq('id', row.id);
      if (err2) throw err2;
      onNotify?.('Data guru berhasil dihapus.');
      await load();
      await onDataChange?.();
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
      const { error: err } = await supabase.rpc('admin_reset_password', {
        p_user_id: resetTarget.user_id,
        p_password: resetPw,
      });
      if (err) throw err;
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
          <h3>Data Guru & Akun Login</h3>
          <p>Kelola direktori guru/staf sekaligus akun portal guru ({rows.length} data).</p>
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
            <span>Tambah Guru</span>
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
            placeholder="Cari nama / jabatan / department / email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari guru"
          />
        </div>
        <span className="apm-muted">{filteredRows.length} dari {rows.length} guru</span>
      </div>

      {loading ? (
        <div className="mt-4">
          <TableSkeleton rows={6} template="64px 1.4fr 1fr 1fr 1.3fr 170px" withToolbar={false} />
        </div>
      ) : (
        <>
      <div className="cms-table-wrapper mt-4">
        <table className="cms-data-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nama</th>
              <th>Jabatan</th>
              <th>Department</th>
              <th>Akun Login</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4">{search ? 'Tidak ada guru yang cocok dengan pencarian.' : 'Belum ada data guru.'}</td></tr>
            ) : (
              pagedRows.map((t) => {
                const acc = t.profile_id ? accByProfile[t.profile_id] : null;
                const foto = t.foto_url || teacherPhoto(`${t.nama} ${t.gelar || ''}`);
                return (
                  <tr key={t.id}>
                    <td>
                      {foto ? (
                        <img className="apm-avatar" src={foto} alt={t.nama || 'Foto guru'} />
                      ) : (
                        <span className="apm-avatar apm-avatar-empty">{(t.nama || '?').charAt(0)}</span>
                      )}
                    </td>
                    <td>
                      <strong>{t.nama}</strong>
                      {t.gelar ? <span className="apm-muted">, {t.gelar}</span> : null}
                    </td>
                    <td>{t.jabatan || '-'}</td>
                    <td>{t.department || '-'}</td>
                    <td>
                      {acc ? (
                        <span className="apm-badge apm-badge-ok">
                          <UserCheck size={12} />
                          {acc.email}
                        </span>
                      ) : (
                        <span className="apm-badge apm-badge-none">Belum punya akun</span>
                      )}
                    </td>
                    <td>
                      <div className="apm-row-actions">
                        <button
                          className="apm-btn-small"
                          title="Edit data guru"
                          onClick={() => {
                            setError('');
                            setModalError('');
                            setForm({
                              mode: 'edit',
                              id: t.id,
                              nama: t.nama || '',
                              gelar: t.gelar || '',
                              jabatan: t.jabatan || '',
                              department: t.department || '',
                              email: t.email || '',
                              jam_kerja: t.jam_kerja || '',
                              foto_url: t.foto_url || '',
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
                          title="Hapus guru"
                          onClick={() => handleDelete(t)}
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
        label="guru"
      />
        </>
      )}

      {form && createPortal(
        <div className="apm-modal-overlay" onClick={() => setForm(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>{form.mode === 'add' ? 'Tambah Guru Baru' : 'Edit Data Guru'}</h4>
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
                    <label>Foto guru</label>
                    <div className="apm-photo-field">
                      <div className="apm-photo-preview">
                        {form.foto_url ? (
                          <img src={form.foto_url} alt="Pratinjau foto guru" />
                        ) : (
                          <span className="apm-photo-initial">
                            {(form.nama || '?').trim().charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="apm-photo-actions">
                        <button
                          type="button"
                          className="apm-btn-small"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={photoUploading}
                        >
                          {photoUploading ? <Loader2 size={13} className="apm-spin" /> : <Camera size={13} />}
                          <span>{photoUploading ? 'Mengunggah…' : form.foto_url ? 'Ganti Foto' : 'Unggah Foto'}</span>
                        </button>
                        {form.foto_url && !photoUploading && (
                          <button
                            type="button"
                            className="apm-btn-small apm-btn-danger-soft"
                            onClick={() => setForm((f) => ({ ...f, foto_url: '' }))}
                          >
                            <Trash2 size={13} />
                            <span>Hapus Foto</span>
                          </button>
                        )}
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="apm-file-input"
                          onChange={handlePhoto}
                        />
                        <p className="apm-hint">
                          JPG/PNG/WEBP maks. 5 MB. Foto langsung tampil di direktori guru dan
                          halaman website setelah disimpan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="apm-field apm-field-full">
                    <label>Nama lengkap *</label>
                    <input className="apm-input" value={form.nama} onChange={set('nama')} placeholder="Mis. Ahmad Fauzi, S.Kom" required />
                  </div>
                  <div className="apm-field">
                    <label>Gelar</label>
                    <input className="apm-input" value={form.gelar} onChange={set('gelar')} placeholder="S.Kom / M.Pd" />
                  </div>
                  <div className="apm-field">
                    <label>Jabatan</label>
                    <input className="apm-input" value={form.jabatan} onChange={set('jabatan')} placeholder="Guru Produktif TKJ" />
                  </div>
                  <div className="apm-field">
                    <label>Department</label>
                    <input className="apm-input" value={form.department} onChange={set('department')} placeholder="Akademik / Kesiswaan" />
                  </div>
                  <div className="apm-field">
                    <label>Email kontak (publik)</label>
                    <input className="apm-input" type="email" value={form.email} onChange={set('email')} placeholder="nama@smkmuh8medan.sch.id" />
                  </div>
                  <div className="apm-field apm-field-full">
                    <label>Jam kerja</label>
                    <input className="apm-input" value={form.jam_kerja} onChange={set('jam_kerja')} placeholder="Senin – Jumat, 07.30 – 15.00" />
                  </div>

                  {form.mode === 'add' && (
                    <>
                      <label className="apm-checkbox apm-field-full">
                        <input
                          type="checkbox"
                          checked={form.buat_akun}
                          onChange={(e) => setForm((f) => ({ ...f, buat_akun: e.target.checked }))}
                        />
                        Sekalian buatkan akun login portal guru
                      </label>
                      {form.buat_akun && (
                        <div className="apm-account-box apm-field-full">
                          <div className="apm-field">
                            <label>Username akun *</label>
                            <input
                              className="apm-input"
                              value={form.username}
                              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))}
                              placeholder="guru.demo"
                              required
                            />
                          </div>
                          <div className="apm-field">
                            <label>Kata sandi awal * (min. 6 karakter)</label>
                            <input className="apm-input" type="text" value={form.password} onChange={set('password')} placeholder="guru2026" required minLength={6} />
                          </div>
                          <div className="apm-hint" style={{ marginTop: 8 }}>
                            Akun dibuat sebagai <code>{(form.username || 'username')}@smkmuh8.sch.id</code> dengan
                            role <code>guru</code> dan langsung tertaut ke data guru ini
                            (syarat RLS dashboard guru).
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving || photoUploading}>
                  <Users size={15} />
                  <span>
                    {photoUploading
                      ? 'Menunggu unggahan…'
                      : saving
                        ? 'Menyimpan…'
                        : form.mode === 'add' ? 'Simpan & Buat' : 'Simpan Perubahan'}
                  </span>
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
                  <label>Kata sandi baru * (min. 6 karakter)</label>
                  <input
                    className="apm-input"
                    type="text"
                    value={resetPw}
                    onChange={(e) => setResetPw(e.target.value)}
                    placeholder="Kata sandi baru"
                    required
                    minLength={6}
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
