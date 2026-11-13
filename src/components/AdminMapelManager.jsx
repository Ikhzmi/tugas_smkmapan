import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen, Plus, Edit3, Trash2, RefreshCw, AlertCircle, X, Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AdminPeopleManager.css';

const emptyForm = { mode: 'add', kode: '', nama: '', major_id: '' };

// CRUD mata pelajaran (tabel public.subjects). Data ini dipakai dropdown
// jadwal roster dan muncul di dashboard siswa melalui jadwal kelasnya.
export default function AdminMapelManager({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const [sRes, mRes] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, kode, nama, major_id, majors(kode, nama)')
        .order('nama'),
      supabase
        .from('majors')
        .select('id, kode, nama')
        .order('kode'),
    ]);
    setError('');
    if (sRes.error) setError('Gagal memuat mata pelajaran: ' + sRes.error.message);
    if (mRes.error) setError((prev) => prev || 'Gagal memuat daftar jurusan: ' + mRes.error.message);
    setRows(sRes.data || []);
    setMajors(mRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => (
      (r.nama || '').toLowerCase().includes(term)
      || (r.kode || '').toLowerCase().includes(term)
      || (r.majors?.nama || '').toLowerCase().includes(term)
    ));
  }, [rows, q]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const nama = form.nama.trim();
    if (!nama) {
      setModalError('Nama mata pelajaran wajib diisi.');
      return;
    }
    setSaving(true);
    setModalError('');
    const payload = {
      nama,
      kode: form.kode.trim() || null,
      major_id: form.major_id || null,
    };
    try {
      if (form.mode === 'edit') {
        const { error: err } = await supabase.from('subjects').update(payload).eq('id', form.id);
        if (err) throw err;
        onNotify?.('Mata pelajaran berhasil diperbarui.');
      } else {
        const { error: err } = await supabase.from('subjects').insert(payload);
        if (err) throw err;
        onNotify?.('Mata pelajaran baru berhasil ditambahkan.');
      }
      setForm(null);
      await load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const pesan = `Hapus mata pelajaran "${row.nama}"? Baris jadwal roster yang memakai mapel ini akan kehilangan referensi mapelnya di dashboard siswa & guru.`;
    if (!window.confirm(pesan)) return;
    setError('');
    try {
      const { error: err } = await supabase.from('subjects').delete().eq('id', row.id);
      if (err) throw err;
      onNotify?.('Mata pelajaran berhasil dihapus.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cms-panel animate-fade-in">
      <div className="panel-title-strip">
        <div>
          <h3>Mata Pelajaran</h3>
          <p>Kelola daftar mapel yang bisa dijadwalkan ke kelas lewat Jadwal Roster ({rows.length} mapel).</p>
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
            <Plus size={16} />
            <span>Tambah Mapel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="apm-error-box" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="cms-search-box mt-3">
        <Search size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama mapel, kode, atau jurusan..."
        />
      </div>

      <div className="cms-table-wrapper mt-3">
        <table className="cms-data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Mata Pelajaran</th>
              <th>Jurusan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="apm-loading-row">Memuat mata pelajaran…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  {rows.length === 0
                    ? 'Belum ada mata pelajaran. Klik Tambah Mapel untuk menambahkan.'
                    : 'Tidak ada mapel yang cocok dengan pencarian.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.kode || '-'}</td>
                  <td><strong>{r.nama}</strong></td>
                  <td>
                    {r.majors ? (
                      <span className="apm-badge apm-badge-ok">
                        {r.majors.kode ? `${r.majors.kode} — ${r.majors.nama}` : r.majors.nama}
                      </span>
                    ) : (
                      <span className="apm-badge apm-badge-none">Umum (semua jurusan)</span>
                    )}
                  </td>
                  <td>
                    <div className="apm-row-actions">
                      <button
                        className="apm-btn-small"
                        title="Edit mata pelajaran"
                        onClick={() => {
                          setError('');
                          setModalError('');
                          setForm({
                            mode: 'edit',
                            id: r.id,
                            kode: r.kode || '',
                            nama: r.nama || '',
                            major_id: r.major_id || '',
                          });
                        }}
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>
                      <button
                        className="btn-icon-delete"
                        title="Hapus mata pelajaran"
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

      {form && createPortal(
        <div className="apm-modal-overlay" onClick={() => setForm(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>{form.mode === 'add' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran'}</h4>
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
                    <label>Nama mata pelajaran *</label>
                    <input
                      className="apm-input"
                      value={form.nama}
                      onChange={set('nama')}
                      placeholder="Mis. Administrasi Server"
                      required
                    />
                  </div>
                  <div className="apm-field">
                    <label>Kode mapel</label>
                    <input
                      className="apm-input"
                      value={form.kode}
                      onChange={set('kode')}
                      placeholder="Mis. TKJ-03"
                    />
                  </div>
                  <div className="apm-field">
                    <label>Jurusan</label>
                    <select className="apm-select" value={form.major_id} onChange={set('major_id')}>
                      <option value="">— Umum (semua jurusan) —</option>
                      {majors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.kode ? `${m.kode} — ${m.nama}` : m.nama}
                        </option>
                      ))}
                    </select>
                    <span className="apm-hint" style={{ marginTop: 6 }}>
                      Pilih jurusan jika mapel ini hanya diajarkan di jurusan tertentu.
                    </span>
                  </div>
                </div>
              </div>

              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <BookOpen size={15} />
                  <span>{saving ? 'Menyimpan…' : form.mode === 'add' ? 'Simpan Mapel' : 'Simpan Perubahan'}</span>
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
