import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays, Plus, Edit3, Trash2, RefreshCw, AlertCircle, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AdminPeopleManager.css';

const HARI_LIST = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const HARI_LABEL = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
};

const emptyForm = {
  mode: 'add',
  class_id: '',
  subject_id: '',
  teacher_id: '',
  hari: 'senin',
  jam_mulai: '07:00',
  jam_selesai: '08:30',
};

const toMinutes = (t) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const fmtJam = (t) => String(t || '').slice(0, 5);

// CRUD jadwal roster (tabel public.schedules). Baris jadwal inilah yang
// dibaca dashboard siswa (per kelas) dan dashboard guru (per teacher_id).
export default function AdminJadwalManager({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterHari, setFilterHari] = useState('');

  const load = useCallback(async () => {
    const [jRes, cRes, sRes, tRes] = await Promise.all([
      supabase
        .from('schedules')
        .select('id, class_id, subject_id, teacher_id, hari, jam_mulai, jam_selesai, classes(nama, tingkat), subjects(nama, kode), teachers(nama, gelar)'),
      supabase
        .from('classes')
        .select('id, nama, tingkat, major_id, majors(kode, nama)')
        .order('tingkat')
        .order('nama'),
      supabase
        .from('subjects')
        .select('id, kode, nama')
        .order('nama'),
      supabase
        .from('teachers')
        .select('id, nama, gelar')
        .order('nama'),
    ]);
    setError('');
    if (jRes.error) setError('Gagal memuat jadwal roster: ' + jRes.error.message);
    if (cRes.error) setError((prev) => prev || 'Gagal memuat daftar kelas: ' + cRes.error.message);
    if (sRes.error) setError((prev) => prev || 'Gagal memuat daftar mapel: ' + sRes.error.message);
    if (tRes.error) setError((prev) => prev || 'Gagal memuat daftar guru: ' + tRes.error.message);
    setRows(jRes.data || []);
    setClasses(cRes.data || []);
    setSubjects(sRes.data || []);
    setTeachers(tRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const sorted = useMemo(() => [...rows].sort(
    (a, b) => HARI_LIST.indexOf(a.hari) - HARI_LIST.indexOf(b.hari)
      || String(a.jam_mulai).localeCompare(String(b.jam_mulai))
      || (a.classes?.nama || '').localeCompare(b.classes?.nama || ''),
  ), [rows]);

  const filtered = useMemo(() => sorted.filter((r) => (
    (!filterClass || r.class_id === filterClass)
    && (!filterHari || r.hari === filterHari)
  )), [sorted, filterClass, filterHari]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.class_id) {
      setModalError('Kelas wajib dipilih. Jika daftar kelas kosong, tambahkan lewat Data Siswa → Kelola Kelas.');
      return;
    }
    if (!form.subject_id) {
      setModalError('Mata pelajaran wajib dipilih. Jika daftar kosong, tambahkan lewat panel Mapel.');
      return;
    }
    if (toMinutes(form.jam_selesai) <= toMinutes(form.jam_mulai)) {
      setModalError('Jam selesai harus setelah jam mulai.');
      return;
    }
    // Cegah double-booking: kelas atau guru yang sama di jam bertumpang tindih.
    const bentrok = rows.find((r) => (
      r.id !== form.id
      && r.hari === form.hari
      && (r.class_id === form.class_id || (form.teacher_id && r.teacher_id === form.teacher_id))
      && toMinutes(form.jam_mulai) < toMinutes(r.jam_selesai)
      && toMinutes(r.jam_mulai) < toMinutes(form.jam_selesai)
    ));
    if (bentrok) {
      const siapa = bentrok.class_id === form.class_id
        ? `Kelas ${bentrok.classes?.nama || 'terpilih'}`
        : `Guru ${bentrok.teachers?.nama || 'terpilih'}`;
      setModalError(
        `Jadwal bentrok: ${siapa} sudah punya jadwal ${HARI_LABEL[bentrok.hari]} `
        + `${fmtJam(bentrok.jam_mulai)}–${fmtJam(bentrok.jam_selesai)} `
        + `(${bentrok.subjects?.nama || 'mapel'}).`,
      );
      return;
    }

    setSaving(true);
    setModalError('');
    const payload = {
      class_id: form.class_id,
      subject_id: form.subject_id,
      teacher_id: form.teacher_id || null,
      hari: form.hari,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
    };
    try {
      if (form.mode === 'edit') {
        const { error: err } = await supabase.from('schedules').update(payload).eq('id', form.id);
        if (err) throw err;
        onNotify?.('Jadwal roster berhasil diperbarui.');
      } else {
        const { error: err } = await supabase.from('schedules').insert(payload);
        if (err) throw err;
        onNotify?.('Jadwal roster baru tersimpan & langsung tampil di dashboard siswa & guru terkait.');
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
    const pesan = `Hapus jadwal ${HARI_LABEL[row.hari] || row.hari} ${fmtJam(row.jam_mulai)}–${fmtJam(row.jam_selesai)} `
      + `${row.subjects?.nama || ''} (${row.classes?.nama || ''})? Jadwal ini akan hilang dari dashboard siswa & guru.`;
    if (!window.confirm(pesan)) return;
    setError('');
    try {
      const { error: err } = await supabase.from('schedules').delete().eq('id', row.id);
      if (err) throw err;
      onNotify?.('Jadwal roster berhasil dihapus.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cms-panel animate-fade-in">
      <div className="panel-title-strip">
        <div>
          <h3>Jadwal Roster Kelas</h3>
          <p>Atur kapan setiap mapel masuk per kelas & guru pengajarnya ({rows.length} baris jadwal).</p>
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
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="apm-error-box" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="apm-toolbar mt-3">
        <select
          className="apm-select"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          title="Filter berdasarkan kelas"
        >
          <option value="">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.nama}</option>
          ))}
        </select>
        <select
          className="apm-select"
          value={filterHari}
          onChange={(e) => setFilterHari(e.target.value)}
          title="Filter berdasarkan hari"
        >
          <option value="">Semua Hari</option>
          {HARI_LIST.map((h) => (
            <option key={h} value={h}>{HARI_LABEL[h]}</option>
          ))}
        </select>
      </div>

      {classes.length === 0 && !loading && (
        <div className="apm-hint" style={{ marginTop: 12 }}>
          Belum ada kelas di database. Tambahkan lewat <strong>Data Siswa → Kelola Kelas</strong> sebelum
          membuat jadwal roster.
        </div>
      )}
      {subjects.length === 0 && !loading && (
        <div className="apm-hint" style={{ marginTop: 12 }}>
          Belum ada mata pelajaran. Tambahkan lewat panel <strong>Mapel</strong> agar bisa dijadwalkan.
        </div>
      )}

      <div className="cms-table-wrapper mt-3">
        <table className="cms-data-table">
          <thead>
            <tr>
              <th>Hari</th>
              <th>Jam</th>
              <th>Kelas</th>
              <th>Mata Pelajaran</th>
              <th>Guru Pengajar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="apm-loading-row">Memuat jadwal roster…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  {rows.length === 0
                    ? 'Belum ada jadwal roster. Klik Tambah Jadwal untuk membuat baris pertama.'
                    : 'Tidak ada jadwal yang cocok dengan filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td><strong>{HARI_LABEL[r.hari] || r.hari}</strong></td>
                  <td>{fmtJam(r.jam_mulai)} – {fmtJam(r.jam_selesai)}</td>
                  <td>{r.classes?.nama || '-'}</td>
                  <td>
                    {r.subjects
                      ? `${r.subjects.nama}${r.subjects.kode ? ` (${r.subjects.kode})` : ''}`
                      : '-'}
                  </td>
                  <td>
                    {r.teachers
                      ? `${r.teachers.nama}${r.teachers.gelar ? `, ${r.teachers.gelar}` : ''}`
                      : <span className="apm-badge apm-badge-none">Belum ditentukan</span>}
                  </td>
                  <td>
                    <div className="apm-row-actions">
                      <button
                        className="apm-btn-small"
                        title="Edit jadwal"
                        onClick={() => {
                          setError('');
                          setModalError('');
                          setForm({
                            mode: 'edit',
                            id: r.id,
                            class_id: r.class_id || '',
                            subject_id: r.subject_id || '',
                            teacher_id: r.teacher_id || '',
                            hari: r.hari || 'senin',
                            jam_mulai: fmtJam(r.jam_mulai) || '07:00',
                            jam_selesai: fmtJam(r.jam_selesai) || '08:30',
                          });
                        }}
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>
                      <button
                        className="btn-icon-delete"
                        title="Hapus jadwal"
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
              <h4>{form.mode === 'add' ? 'Tambah Jadwal Roster' : 'Edit Jadwal Roster'}</h4>
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
                  <div className="apm-field">
                    <label>Kelas *</label>
                    <select className="apm-select" value={form.class_id} onChange={set('class_id')} required>
                      <option value="">— Pilih kelas —</option>
                      {classGroups.map(([majorLabel, items]) => (
                        <optgroup key={majorLabel} label={majorLabel}>
                          {items.map((c) => (
                            <option key={c.id} value={c.id}>{c.nama}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="apm-field">
                    <label>Mata pelajaran *</label>
                    <select className="apm-select" value={form.subject_id} onChange={set('subject_id')} required>
                      <option value="">— Pilih mapel —</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.kode ? `${s.kode} — ${s.nama}` : s.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="apm-field apm-field-full">
                    <label>Guru pengajar</label>
                    <select className="apm-select" value={form.teacher_id} onChange={set('teacher_id')}>
                      <option value="">— Belum ditentukan —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama}{t.gelar ? `, ${t.gelar}` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="apm-hint" style={{ marginTop: 6 }}>
                      Isi agar jadwal ini muncul di dashboard guru bersangkutan ("kapan & di kelas mana mengajar").
                    </span>
                  </div>
                  <div className="apm-field">
                    <label>Hari *</label>
                    <select className="apm-select" value={form.hari} onChange={set('hari')} required>
                      {HARI_LIST.map((h) => (
                        <option key={h} value={h}>{HARI_LABEL[h]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="apm-field">
                    <label>Jam mulai *</label>
                    <input className="apm-input" type="time" value={form.jam_mulai} onChange={set('jam_mulai')} required />
                  </div>
                  <div className="apm-field">
                    <label>Jam selesai *</label>
                    <input className="apm-input" type="time" value={form.jam_selesai} onChange={set('jam_selesai')} required />
                  </div>
                </div>
              </div>

              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <CalendarDays size={15} />
                  <span>{saving ? 'Menyimpan…' : form.mode === 'add' ? 'Simpan Jadwal' : 'Simpan Perubahan'}</span>
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
