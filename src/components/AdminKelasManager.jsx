import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  School, Plus, Edit3, Trash2, RefreshCw, AlertCircle, X, ChevronRight,
  UserPlus, Upload, ArrowUpCircle, UserCheck,
} from 'lucide-react';
import { apiListAll, apiPost, apiPatch, apiDelete } from '../lib/api';
import { parseStudentFile } from '../lib/studentImport';
import './AdminPeopleManager.css';

const ROMAN_TINGKAT = { 10: 'X', 11: 'XI', 12: 'XII' };

// Tahun ajaran dimulai Juli; sebelum Juli masih tahun ajaran sebelumnya.
const currentAcademicYear = () => {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}/${start + 1}`;
};

const emptyClassForm = () => ({
  mode: 'add',
  nama: '',
  tingkat: '10',
  tahun_ajaran: currentAcademicYear(),
  major_id: '',
  wali_kelas_id: '',
});

const emptyStudentForm = {
  mode: 'add',
  id: null,
  class_id: '',
  nama: '',
  nisn: '',
  no_hp: '',
  alamat: '',
};

// Menu Data Kelas: CRUD kelas + CRUD siswa per kelas (accordion), wali kelas,
// fitur naik kelas massal, dan import siswa per kelas dari CSV/XLSX.
export default function AdminKelasManager({ onNotify }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [majors, setMajors] = useState([]);
  const [openIds, setOpenIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [classForm, setClassForm] = useState(null);
  const [studentForm, setStudentForm] = useState(null);
  const [promote, setPromote] = useState(null); // { sourceId, targetId }
  const [importState, setImportState] = useState(null); // { classId, rows, errors, fileName, sheetName }
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);
  const importClassRef = useRef('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [kelas, siswa, guru, jurusan] = await Promise.all([
        apiListAll('/admin/classes'),
        apiListAll('/admin/students'),
        apiListAll('/admin/teachers'),
        apiListAll('/admin/majors'),
      ]);
      setClasses(kelas.map((c) => ({ ...c, majors: c.major || null, teachers: c.wali_kelas || null })));
      setStudents(siswa.map((s) => ({ ...s, profile_id: s.user_id })));
      setTeachers(guru);
      setMajors(jurusan);
    } catch (err) {
      setError('Gagal memuat data kelas: ' + err.message);
      setClasses([]);
      setStudents([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const studentsByClass = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const key = s.class_id || 'tanpa-kelas';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [students]);

  const toggle = (id) => setOpenIds((prev) => (
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  ));

  const setClass = (key) => (e) => setClassForm((f) => ({ ...f, [key]: e.target.value }));
  const setStudent = (key) => (e) => setStudentForm((f) => ({ ...f, [key]: e.target.value }));

  /* ------------------------- CRUD KELAS ------------------------- */

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const nama = classForm.nama.trim();
    const tahunAjaran = classForm.tahun_ajaran.trim();
    if (!nama) { setModalError('Nama kelas wajib diisi.'); return; }
    if (!tahunAjaran) { setModalError('Tahun ajaran wajib diisi.'); return; }
    const duplicate = classes.some((c) => (
      c.id !== classForm.id
      && (c.nama || '').trim().toLowerCase() === nama.toLowerCase()
      && (c.tahun_ajaran || '').trim() === tahunAjaran
    ));
    if (duplicate) { setModalError('Kelas dengan nama dan tahun ajaran yang sama sudah ada.'); return; }

    setSaving(true);
    setModalError('');
    const payload = {
      nama,
      tingkat: classForm.tingkat ? Number(classForm.tingkat) : null,
      tahun_ajaran: tahunAjaran,
      major_id: classForm.major_id || null,
      wali_kelas_id: classForm.wali_kelas_id || null,
    };
    try {
      if (classForm.mode === 'edit') {
        await apiPatch(`/admin/classes/${classForm.id}`, payload);
        onNotify?.('Data kelas berhasil diperbarui.');
      } else {
        await apiPost('/admin/classes', payload);
        onNotify?.('Kelas baru berhasil ditambahkan.');
      }
      setClassForm(null);
      await load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClassDelete = async (c) => {
    const jumlah = (studentsByClass.get(c.id) || []).length;
    const pesan = jumlah > 0
      ? `Hapus kelas "${c.nama}"? ${jumlah} siswa di kelas ini akan menjadi TANPA KELAS (data siswa tidak hilang).`
      : `Hapus kelas "${c.nama}" dari database?`;
    if (!window.confirm(pesan)) return;
    setError('');
    try {
      await apiDelete(`/admin/classes/${c.id}`);
      onNotify?.('Kelas berhasil dihapus.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleWaliChange = async (c, teacherId) => {
    setError('');
    try {
      await apiPatch(`/admin/classes/${c.id}`, { wali_kelas_id: teacherId || null });
      onNotify?.(teacherId ? 'Wali kelas berhasil ditetapkan.' : 'Wali kelas dikosongkan.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ------------------------- CRUD SISWA ------------------------- */

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const nama = studentForm.nama.trim();
    const nisn = studentForm.nisn.trim();
    if (!nama) { setModalError('Nama siswa wajib diisi.'); return; }
    if (!nisn) { setModalError('NISN wajib diisi (dipersyaratkan oleh API).'); return; }
    setSaving(true);
    setModalError('');
    const payload = {
      nama,
      nisn,
      no_hp: studentForm.no_hp.trim() || null,
      alamat: studentForm.alamat.trim() || null,
      class_id: studentForm.class_id || null,
    };
    try {
      if (studentForm.mode === 'edit') {
        await apiPatch(`/admin/students/${studentForm.id}`, payload);
        onNotify?.('Data siswa berhasil diperbarui.');
      } else {
        await apiPost('/admin/students', payload);
        onNotify?.('Siswa berhasil ditambahkan ke kelas.');
      }
      setStudentForm(null);
      await load();
    } catch (err) {
      setModalError(/nisn|duplicate/i.test(err.message)
        ? 'NISN sudah dipakai siswa lain. Periksa kembali atau kosongkan kolom NISN.'
        : err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStudentDelete = async (s) => {
    const pesan = `Hapus siswa "${s.nama}" dari data kelas? Akun LMS yang tertaut juga akan dihapus.`;
    if (!window.confirm(pesan)) return;
    setError('');
    try {
      await apiDelete(`/admin/students/${s.id}`);
      onNotify?.('Data siswa berhasil dihapus.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ------------------------- NAIK KELAS ------------------------- */

  const handlePromote = async () => {
    if (!promote?.targetId) { setModalError('Kelas tujuan wajib dipilih.'); return; }
    if (saving) return;
    setSaving(true);
    setModalError('');
    try {
      const targets = studentsByClass.get(promote.sourceId) || [];
      await Promise.all(targets.map((s) => apiPatch(`/admin/students/${s.id}`, {
        nama: s.nama,
        nisn: s.nisn,
        class_id: promote.targetId,
      })));
      onNotify?.(`${targets.length} siswa berhasil dinaikkan ke kelas tujuan.`);
      setPromote(null);
      await load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------- IMPORT SISWA ------------------------- */

  const pickImportFile = (classId) => {
    importClassRef.current = classId;
    fileRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const result = await parseStudentFile(file);
      setImportState({ ...result, classId: importClassRef.current });
    } catch (err) {
      setError('Gagal membaca berkas: ' + err.message);
    }
  };

  const handleImportConfirm = async () => {
    if (!importState || importing) return;
    if (importState.rows.length === 0) { setModalError('Tidak ada baris siswa yang bisa diimpor.'); return; }
    setImporting(true);
    setModalError('');
    try {
      const tanpaNisn = importState.rows.filter((r) => !r.nisn);
      if (tanpaNisn.length > 0) {
        setModalError(`Import gagal: ${tanpaNisn.length} baris tidak memiliki NISN. API mewajibkan NISN untuk setiap siswa.`);
        return;
      }
      const payload = importState.rows.map((r) => ({
        nama: r.nama,
        nisn: r.nisn,
        no_hp: r.no_hp || null,
        alamat: r.alamat || null,
        class_id: importState.classId || null,
      }));
      for (const row of payload) {
        await apiPost('/admin/students', row);
      }
      onNotify?.(`${payload.length} siswa berhasil diimpor ke kelas.`);
      setImportState(null);
      await load();
    } catch (err) {
      setModalError(/nisn|duplicate/i.test(err.message)
        ? 'Import gagal: ada NISN duplikat di berkas yang sudah terdaftar di database. Hapus kolom NISN di berkas atau perbaiki datanya.'
        : err.message);
    } finally {
      setImporting(false);
    }
  };

  /* ------------------------- RENDER ------------------------- */

  const renderStudentTable = (list, opts = {}) => (
    <div className="cms-table-wrapper" style={{ marginTop: 10 }}>
      <table className="cms-data-table">
        <thead>
          <tr>
            <th>NISN</th>
            <th>Nama</th>
            <th>No. HP</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-4">
                {opts.emptyText || 'Belum ada siswa di kelas ini.'}
              </td>
            </tr>
          ) : (
            list.map((s) => (
              <tr key={s.id}>
                <td>{s.nisn || s.nis || '-'}</td>
                <td><strong>{s.nama}</strong></td>
                <td>{s.no_hp || '-'}</td>
                <td>
                  <div className="apm-row-actions">
                    <button
                      className="apm-btn-small"
                      title="Edit data siswa"
                      onClick={() => {
                        setModalError('');
                        setStudentForm({
                          mode: 'edit',
                          id: s.id,
                          class_id: s.class_id || '',
                          nama: s.nama || '',
                          nisn: s.nisn || s.nis || '',
                          no_hp: s.no_hp || '',
                          alamat: s.alamat || '',
                        });
                      }}
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                    <button
                      className="btn-icon-delete"
                      title="Hapus siswa"
                      onClick={() => handleStudentDelete(s)}
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
  );

  const renderClassBody = (c) => {
    const list = studentsByClass.get(c.id) || [];
    return (
      <div className="apm-acc-body">
        <div className="apm-form-grid" style={{ marginTop: 4 }}>
          <div className="apm-field">
            <label>Wali kelas</label>
            <select
              className="apm-select"
              value={c.wali_kelas_id || ''}
              onChange={(e) => handleWaliChange(c, e.target.value)}
            >
              <option value="">— Belum ditentukan —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}{t.gelar ? `, ${t.gelar}` : ''}
                </option>
              ))}
            </select>
            <span className="apm-hint" style={{ marginTop: 6 }}>
              Perubahan wali kelas tersimpan otomatis saat dipilih.
            </span>
          </div>
          <div className="apm-field">
            <label>Informasi kelas</label>
            <div className="apm-hint">
              Tingkat {ROMAN_TINGKAT[c.tingkat] || '-'} • Jurusan {c.majors?.kode || c.majors?.nama || 'Umum'} •
              {' '}Tahun ajaran {c.tahun_ajaran} • {list.length} siswa
            </div>
          </div>
        </div>

        <div className="apm-toolbar" style={{ marginTop: 12 }}>
          <strong style={{ fontSize: 13 }}>Daftar Siswa ({list.length})</strong>
          <div className="apm-row-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => pickImportFile(c.id)}
              title="Import daftar siswa dari berkas CSV atau XLSX"
            >
              <Upload size={14} />
              <span>Import CSV/XLSX</span>
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setModalError(''); setPromote({ sourceId: c.id, targetId: '' }); }}
              title="Pindahkan semua siswa kelas ini ke kelas tingkat berikutnya"
            >
              <ArrowUpCircle size={14} />
              <span>Naik Kelas</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setModalError('');
                setStudentForm({ ...emptyStudentForm, class_id: c.id });
              }}
            >
              <UserPlus size={14} />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {renderStudentTable(list)}
      </div>
    );
  };

  const unassigned = studentsByClass.get('tanpa-kelas') || [];

  return (
    <div className="cms-panel animate-fade-in">
      <div className="panel-title-strip">
        <div>
          <h3>Data Kelas & Rombongan Belajar</h3>
          <p>Kelola kelas, wali kelas, dan siswa per kelas. Klik nama kelas untuk membuka/menutup isinya ({classes.length} kelas).</p>
        </div>
        <div className="apm-toolbar">
          <button className="btn btn-outline" onClick={load} title="Muat ulang data">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setModalError(''); setClassForm(emptyClassForm()); }}
          >
            <Plus size={16} />
            <span>Tambah Kelas</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="apm-error-box" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      <div className="mt-4">
        {loading ? (
          <div className="apm-hint">Memuat data kelas…</div>
        ) : classes.length === 0 ? (
          <div className="apm-hint">
            Belum ada kelas. Klik <strong>Tambah Kelas</strong> untuk membuat rombongan belajar pertama.
          </div>
        ) : (
          classes.map((c) => {
            const open = openIds.includes(c.id);
            const jumlah = (studentsByClass.get(c.id) || []).length;
            return (
              <div className={`apm-acc-item ${open ? 'is-open' : ''}`} key={c.id}>
                <div className="apm-acc-head">
                  <button type="button" className="apm-acc-toggle" onClick={() => toggle(c.id)} aria-expanded={open}>
                    <ChevronRight className="apm-acc-chevron" size={18} />
                    <span className="apm-acc-title">{c.nama}</span>
                    <span className="apm-badge apm-badge-none">
                      {ROMAN_TINGKAT[c.tingkat] || '-'} • {c.tahun_ajaran}
                    </span>
                    <span className="apm-badge apm-badge-ok">{c.majors?.kode || c.majors?.nama || 'Umum'}</span>
                    <span className="apm-badge">{jumlah} siswa</span>
                    {c.teachers ? (
                      <span className="apm-badge apm-badge-ok">
                        <UserCheck size={12} />
                        {c.teachers.nama}
                      </span>
                    ) : (
                      <span className="apm-badge apm-badge-none">Wali kelas belum diatur</span>
                    )}
                  </button>
                  <div className="apm-acc-actions">
                    <button
                      className="apm-btn-small"
                      title="Edit data kelas"
                      onClick={() => {
                        setModalError('');
                        setClassForm({
                          mode: 'edit',
                          id: c.id,
                          nama: c.nama || '',
                          tingkat: c.tingkat ? String(c.tingkat) : '10',
                          tahun_ajaran: c.tahun_ajaran || currentAcademicYear(),
                          major_id: c.major_id || '',
                          wali_kelas_id: c.wali_kelas_id || '',
                        });
                      }}
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                    <button
                      className="btn-icon-delete"
                      title="Hapus kelas"
                      onClick={() => handleClassDelete(c)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {open && renderClassBody(c)}
              </div>
            );
          })
        )}

        {unassigned.length > 0 && (
          <div className={`apm-acc-item ${openIds.includes('tanpa-kelas') ? 'is-open' : ''}`}>
            <div className="apm-acc-head">
              <button
                type="button"
                className="apm-acc-toggle"
                onClick={() => toggle('tanpa-kelas')}
                aria-expanded={openIds.includes('tanpa-kelas')}
              >
                <ChevronRight className="apm-acc-chevron" size={18} />
                <span className="apm-acc-title">Tanpa Kelas</span>
                <span className="apm-badge apm-badge-none">{unassigned.length} siswa belum punya kelas</span>
              </button>
            </div>
            {openIds.includes('tanpa-kelas') && (
              <div className="apm-acc-body">
                <div className="apm-hint">
                  Siswa berikut belum masuk rombongan belajar mana pun. Edit siswa untuk memindahkannya ke kelas.
                </div>
                {renderStudentTable(unassigned, { emptyText: 'Tidak ada siswa tanpa kelas.' })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- Modal tambah/edit kelas ---------- */}
      {classForm && createPortal(
        <div className="apm-modal-overlay" onClick={() => setClassForm(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>{classForm.mode === 'add' ? 'Tambah Kelas Baru' : 'Edit Data Kelas'}</h4>
              <button className="apm-modal-close" onClick={() => setClassForm(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleClassSubmit} className="apm-modal-form">
              <div className="apm-modal-body">
                {modalError && (
                  <div className="apm-error-box" role="alert" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="apm-form-grid">
                  <div className="apm-field">
                    <label>Nama kelas *</label>
                    <input className="apm-input" value={classForm.nama} onChange={setClass('nama')} placeholder="Mis. X TKJ 2" required />
                  </div>
                  <div className="apm-field">
                    <label>Tingkat</label>
                    <select className="apm-select" value={classForm.tingkat} onChange={setClass('tingkat')}>
                      <option value="10">X (Kelas 10)</option>
                      <option value="11">XI (Kelas 11)</option>
                      <option value="12">XII (Kelas 12)</option>
                    </select>
                  </div>
                  <div className="apm-field">
                    <label>Tahun ajaran *</label>
                    <input className="apm-input" value={classForm.tahun_ajaran} onChange={setClass('tahun_ajaran')} placeholder="2026/2027" required />
                  </div>
                  <div className="apm-field">
                    <label>Jurusan</label>
                    <select className="apm-select" value={classForm.major_id} onChange={setClass('major_id')}>
                      <option value="">— Tanpa jurusan —</option>
                      {majors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.kode ? `${m.kode} — ${m.nama}` : m.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="apm-field apm-field-full">
                    <label>Wali kelas</label>
                    <select className="apm-select" value={classForm.wali_kelas_id} onChange={setClass('wali_kelas_id')}>
                      <option value="">— Belum ditentukan —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama}{t.gelar ? `, ${t.gelar}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setClassForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <School size={15} />
                  <span>{saving ? 'Menyimpan…' : classForm.mode === 'add' ? 'Tambah Kelas' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ---------- Modal tambah/edit siswa ---------- */}
      {studentForm && createPortal(
        <div className="apm-modal-overlay" onClick={() => setStudentForm(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>{studentForm.mode === 'add' ? 'Tambah Siswa ke Kelas' : 'Edit Data Siswa'}</h4>
              <button className="apm-modal-close" onClick={() => setStudentForm(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="apm-modal-form">
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
                    <input className="apm-input" value={studentForm.nama} onChange={setStudent('nama')} placeholder="Mis. Rian Pratama" required />
                  </div>
                  <div className="apm-field">
                    <label>NISN *</label>
                    <input
                      className="apm-input"
                      value={studentForm.nisn}
                      onChange={(e) => setStudentForm((f) => ({ ...f, nisn: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="10 digit NISN"
                      required
                    />
                  </div>
                  <div className="apm-field">
                    <label>Kelas</label>
                    <select className="apm-select" value={studentForm.class_id} onChange={setStudent('class_id')}>
                      <option value="">— Tanpa kelas —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="apm-field">
                    <label>No. HP / WhatsApp</label>
                    <input className="apm-input" value={studentForm.no_hp} onChange={setStudent('no_hp')} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="apm-field">
                    <label>Alamat</label>
                    <input className="apm-input" value={studentForm.alamat} onChange={setStudent('alamat')} placeholder="Kec., Kota" />
                  </div>
                </div>
                <div className="apm-hint" style={{ marginTop: 10 }}>
                  Akun login LMS tetap dibuat lewat menu <strong>Data Siswa</strong>; menu ini fokus ke data kelas & rombel.
                </div>
              </div>
              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setStudentForm(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving}>
                  <UserPlus size={15} />
                  <span>{saving ? 'Menyimpan…' : studentForm.mode === 'add' ? 'Simpan Siswa' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ---------- Modal naik kelas ---------- */}
      {promote && createPortal(
        <div className="apm-modal-overlay" onClick={() => setPromote(null)}>
          <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>Naik Kelas Massal</h4>
              <button className="apm-modal-close" onClick={() => setPromote(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>

            <form
              className="apm-modal-form"
              onSubmit={(e) => { e.preventDefault(); handlePromote(); }}
            >
              <div className="apm-modal-body">
                {modalError && (
                  <div className="apm-error-box" role="alert" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="apm-hint" style={{ marginBottom: 14 }}>
                  Semua siswa ({(studentsByClass.get(promote.sourceId) || []).length} orang) di kelas{' '}
                  <strong>{classes.find((c) => c.id === promote.sourceId)?.nama}</strong> akan dipindahkan
                  ke kelas tujuan berikut (kolom class_id di database diperbarui).
                </div>
                <div className="apm-field apm-field-full">
                  <label>Kelas tujuan *</label>
                  <select
                    className="apm-select"
                    value={promote.targetId}
                    onChange={(e) => setPromote((p) => ({ ...p, targetId: e.target.value }))}
                    required
                  >
                    <option value="">— Pilih kelas tujuan —</option>
                    {classes
                      .filter((c) => c.id !== promote.sourceId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {ROMAN_TINGKAT[c.tingkat] || '-'} — {c.nama} ({c.tahun_ajaran})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setPromote(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={saving || !promote.targetId}>
                  <ArrowUpCircle size={15} />
                  <span>{saving ? 'Memproses…' : 'Naikkan Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ---------- Modal preview import ---------- */}
      {importState && createPortal(
        <div className="apm-modal-overlay" onClick={() => setImportState(null)}>
          <div className="apm-modal apm-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="apm-modal-head">
              <h4>Preview Import Siswa</h4>
              <button className="apm-modal-close" onClick={() => setImportState(null)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>

            <form
              className="apm-modal-form"
              onSubmit={(e) => { e.preventDefault(); handleImportConfirm(); }}
            >
              <div className="apm-modal-body">
                {modalError && (
                  <div className="apm-error-box" role="alert" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="apm-hint" style={{ marginBottom: 10 }}>
                  Berkas <code>{importState.fileName}</code> (sheet {importState.sheetName}) —{' '}
                  {importState.rows.length} baris siswa siap masuk ke kelas{' '}
                  <strong>{classes.find((c) => c.id === importState.classId)?.nama || 'terpilih'}</strong>.
                </div>
                {importState.errors.length > 0 && (
                  <div className="apm-error-box" style={{ marginBottom: 12 }}>
                    <AlertCircle size={16} />
                    <span>{importState.errors.map((er) => `Baris ${er.baris}: ${er.message}`).join(' ')}</span>
                  </div>
                )}
                <div className="apm-class-table-wrap">
                  <table className="apm-class-table">
                    <thead>
                      <tr>
                        <th>Baris</th>
                        <th>Nama</th>
                        <th>NISN</th>
                        <th>No. HP</th>
                        <th>Alamat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importState.rows.slice(0, 50).map((r) => (
                        <tr key={`${r.baris}-${r.nama}`}>
                          <td>{r.baris}</td>
                          <td><strong>{r.nama}</strong></td>
                          <td>{r.nisn || '-'}</td>
                          <td>{r.no_hp || '-'}</td>
                          <td>{r.alamat || '-'}</td>
                        </tr>
                      ))}
                      {importState.rows.length > 50 && (
                        <tr>
                          <td colSpan="5" className="apm-loading-row">
                            … dan {importState.rows.length - 50} baris lainnya.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="apm-modal-actions">
                <button type="button" className="apm-btn-ghost" onClick={() => setImportState(null)}>Batal</button>
                <button type="submit" className="apm-btn-solid" disabled={importing || importState.rows.length === 0}>
                  <Upload size={15} />
                  <span>{importing ? 'Mengimpor…' : `Import ${importState.rows.length} Siswa`}</span>
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
