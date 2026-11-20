import React, { useMemo, useState } from 'react';
import {
  UserCheck, CalendarDays, Loader2, CheckCircle2, AlertTriangle,
  Users, Save, CheckCheck,
} from 'lucide-react';
import { apiPost } from '../../lib/api';
import './PresensiGuru.css';

const STATUS = [
  { key: 'hadir', label: 'Hadir', short: 'H' },
  { key: 'terlambat', label: 'Terlambat', short: 'T' },
  { key: 'izin', label: 'Izin', short: 'I' },
  { key: 'sakit', label: 'Sakit', short: 'S' },
  { key: 'alpa', label: 'Alpa', short: 'A' },
];

const HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

const pad = (n) => String(n).padStart(2, '0');
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatTanggal = (iso) => {
  if (!iso) return '-';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

const friendlyError = (err) => {
  if (err?.code === 'ATTENDANCE_STUDENT_NOT_IN_CLASS') {
    return 'Sebagian siswa sudah tidak terdaftar di kelas ini. Muat ulang lalu simpan lagi.';
  }
  return err?.message || 'Gagal menyimpan presensi.';
};

const EMPTY_EDITS = {};

export default function PresensiGuru({ schedules = [], students = [], attendance = [], onSaved }) {
  const [scheduleId, setScheduleId] = useState('');
  const [tanggal, setTanggal] = useState(() => toDateKey(new Date()));
  const [draftState, setDraftState] = useState({ key: '', edits: EMPTY_EDITS });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const effectiveScheduleId = scheduleId || schedules[0]?.id || '';

  const schedule = useMemo(
    () => schedules.find((s) => s.id === effectiveScheduleId) || null,
    [schedules, effectiveScheduleId],
  );

  const siswaKelas = useMemo(() => {
    if (!schedule) return [];
    return students
      .filter((s) => s.class_id === schedule.class_id)
      .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));
  }, [students, schedule]);

  const tersimpan = useMemo(() => {
    const map = new Map();
    if (!schedule) return map;
    attendance
      .filter((a) => a.schedule_id === schedule.id && a.tanggal === tanggal)
      .forEach((a) => map.set(a.student_id, a));
    return map;
  }, [attendance, schedule, tanggal]);

  const draftKey = `${effectiveScheduleId}|${tanggal}`;
  const draftEdits = draftState.key === draftKey ? draftState.edits : EMPTY_EDITS;

  const draft = useMemo(() => {
    const next = {};
    tersimpan.forEach((a, sid) => { next[sid] = a.status; });
    return { ...next, ...draftEdits };
  }, [tersimpan, draftEdits]);

  const updateDraft = (updater) => {
    setDraftState((prev) => {
      const base = prev.key === draftKey ? prev.edits : {};
      return { key: draftKey, edits: typeof updater === 'function' ? updater(base) : updater };
    });
  };

  const ringkasan = useMemo(() => {
    const c = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, kosong: 0 };
    siswaKelas.forEach((s) => {
      const st = draft[s.id];
      if (st) c[st] += 1; else c.kosong += 1;
    });
    return c;
  }, [siswaKelas, draft]);

  const adaPerubahan = useMemo(() => {
    return siswaKelas.some((s) => {
      const saved = tersimpan.get(s.id)?.status || null;
      const now = draft[s.id] || null;
      return saved !== now;
    });
  }, [siswaKelas, tersimpan, draft]);

  
  const rekap = useMemo(() => {
    if (!schedule) return [];
    const rows = new Map();
    siswaKelas.forEach((s) => rows.set(s.id, {
      id: s.id, nama: s.nama, nisn: s.nisn,
      hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, total: 0,
    }));
    attendance
      .filter((a) => a.class_id === schedule.class_id)
      .forEach((a) => {
        const r = rows.get(a.student_id);
        if (!r) return;
        r.total += 1;
        if (r[a.status] != null) r[a.status] += 1;
      });
    return Array.from(rows.values())
      .map((r) => ({ ...r, persen: r.total ? Math.round(((r.hadir + r.terlambat) / r.total) * 100) : 0 }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [attendance, siswaKelas, schedule]);

  const setStatus = (studentId, status) => {
    updateDraft((prev) => ({ ...prev, [studentId]: status }));
    setFlash('');
  };

  const tandaiSemua = (status) => {
    const next = {};
    siswaKelas.forEach((s) => { next[s.id] = status; });
    updateDraft(next);
  };

  const handleSave = async () => {
    if (!schedule) return;
    const entries = siswaKelas
      .filter((s) => draft[s.id] && (tersimpan.get(s.id)?.status || null) !== draft[s.id])
      .map((s) => ({ student_id: s.id, status: draft[s.id] }));

    if (!entries.length) return;

    setBusy(true);
    setError('');
    setFlash('');
    try {
      const saved = await apiPost('/guru/attendance/bulk', {
        schedule_id: schedule.id,
        tanggal,
        entries,
      });

      setFlash(`Presensi tersimpan untuk ${entries.length} siswa.`);
      setTimeout(() => setFlash(''), 4000);
      setDraftState({ key: '', edits: EMPTY_EDITS });
      if (onSaved) onSaved(saved);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const bedaHari = schedule && schedule.hari && HARI[new Date(`${tanggal}T00:00:00`).getDay()] !== schedule.hari;

  return (
    <div className="siswa-tab-pane pgr-root">
      
      <div className="pgr-toolbar">
        <div className="pgr-field">
          <label htmlFor="pgr-jadwal">Jadwal</label>
          <select
            id="pgr-jadwal"
            className="guru-select"
            value={effectiveScheduleId}
            onChange={(e) => {
              setScheduleId(e.target.value);
              setError('');
              setFlash('');
            }}
          >
            {schedules.length === 0 && <option value="">Belum ada jadwal</option>}
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.classes?.nama || 'Kelas'} • {s.subjects?.nama || 'Mapel'} • {s.hari} {String(s.jam_mulai).slice(0, 5)}
              </option>
            ))}
          </select>
        </div>

        <div className="pgr-field">
          <label htmlFor="pgr-tanggal">Tanggal</label>
          <input
            id="pgr-tanggal"
            type="date"
            className="guru-input"
            value={tanggal}
            onChange={(e) => {
              setTanggal(e.target.value);
              setError('');
              setFlash('');
            }}
          />
        </div>

        <div className="pgr-field is-actions">
          <button type="button" className="pgr-ghost" onClick={() => tandaiSemua('hadir')}>
            <CheckCheck size={14} /> Tandai Semua Hadir
          </button>
        </div>
      </div>

      {bedaHari && (
        <div className="pgr-alert is-warn">
          <AlertTriangle size={15} />
          <span>
            Jadwal ini hari <strong>{schedule.hari}</strong>, sedangkan tanggal yang dipilih
            jatuh pada hari <strong>{HARI[new Date(`${tanggal}T00:00:00`).getDay()]}</strong>.
            Presensi tetap bisa disimpan.
          </span>
        </div>
      )}

      {error && (
        <div className="pgr-alert is-error">
          <AlertTriangle size={15} /><span>{error}</span>
        </div>
      )}
      {flash && (
        <div className="pgr-alert is-ok">
          <CheckCircle2 size={15} /><span>{flash}</span>
        </div>
      )}

      
      <div className="pgr-summary">
        <div className="pgr-sum-item is-head">
          <span className="pgr-sum-label">{formatTanggal(tanggal)}</span>
          <strong>{siswaKelas.length} siswa</strong>
        </div>
        {STATUS.map((st) => (
          <div key={st.key} className={`pgr-sum-item is-${st.key}`}>
            <span className="pgr-sum-label">{st.label}</span>
            <strong>{ringkasan[st.key]}</strong>
          </div>
        ))}
        <div className="pgr-sum-item is-kosong">
          <span className="pgr-sum-label">Belum</span>
          <strong>{ringkasan.kosong}</strong>
        </div>
      </div>

      
      {!schedule ? (
        <div className="guru-empty-box">
          <CalendarDays size={22} />
          <strong>Belum ada jadwal mengajar</strong>
          <span>Presensi akan tersedia setelah admin menambahkan jadwal Anda.</span>
        </div>
      ) : siswaKelas.length === 0 ? (
        <div className="guru-empty-box">
          <Users size={22} />
          <strong>Belum ada siswa di kelas ini</strong>
          <span>Hubungi admin untuk mendaftarkan siswa ke {schedule.classes?.nama || 'kelas ini'}.</span>
        </div>
      ) : (
        <div className="pgr-list">
          {siswaKelas.map((s, i) => {
            const active = draft[s.id];
            const saved = tersimpan.get(s.id);
            return (
              <div key={s.id} className={`pgr-row ${active ? `is-${active}` : ''}`}>
                <span className="pgr-num">{i + 1}</span>
                <div className="pgr-who">
                  <strong>{s.nama}</strong>
                  <span>{s.nisn || '-'}{saved ? ' • sudah tersimpan' : ''}</span>
                </div>
                <div className="pgr-options">
                  {STATUS.map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      className={`pgr-opt is-${st.key} ${active === st.key ? 'is-active' : ''}`}
                      onClick={() => setStatus(s.id, st.key)}
                      title={st.label}
                    >
                      {st.short}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      
      {schedule && siswaKelas.length > 0 && (
        <div className="pgr-savebar">
          <span>
            {ringkasan.kosong > 0
              ? `${ringkasan.kosong} siswa belum ditandai`
              : 'Semua siswa sudah ditandai'}
            {adaPerubahan ? ' • ada perubahan belum disimpan' : ''}
          </span>
          <button
            type="button"
            className="guru-primary-btn"
            onClick={handleSave}
            disabled={busy || !adaPerubahan}
          >
            {busy ? <Loader2 size={15} className="gm-spin" /> : <Save size={15} />}
            {busy ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>
        </div>
      )}

      
      {schedule && rekap.length > 0 && (
        <section className="pgr-rekap">
          <div className="pgr-rekap-head">
            <h3><UserCheck size={16} /> Rekap Kehadiran — {schedule.classes?.nama || 'Kelas'}</h3>
            <span>Seluruh riwayat kelas ini</span>
          </div>
          <div className="pgr-rekap-list">
            {rekap.map((r) => (
              <div key={r.id} className="pgr-rekap-row">
                <div className="pgr-rekap-who">
                  <strong>{r.nama}</strong>
                  <span>{r.total} catatan</span>
                </div>
                <div className="pgr-rekap-bar">
                  <span style={{ width: `${r.persen}%` }} />
                </div>
                <span className="pgr-rekap-pct">{r.persen}%</span>
                <div className="pgr-rekap-detail">
                  <span className="is-hadir">{r.hadir} H</span>
                  <span className="is-terlambat">{r.terlambat} T</span>
                  <span className="is-izin">{r.izin} I</span>
                  <span className="is-sakit">{r.sakit} S</span>
                  <span className="is-alpa">{r.alpa} A</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
