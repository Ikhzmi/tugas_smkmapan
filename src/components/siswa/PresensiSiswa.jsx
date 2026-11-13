import React, { useMemo, useState } from 'react';
import { UserCheck, Clock, CheckCircle2, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './PresensiSiswa.css';

const HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

const STATUS_LABEL = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  izin: 'Izin',
  sakit: 'Sakit',
  alpa: 'Alpa',
};

const pad = (n) => String(n).padStart(2, '0');
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatTanggal = (iso) => {
  if (!iso) return '-';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

const formatTanggalPendek = (iso) => {
  if (!iso) return '-';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatBulan = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const jamSekarang = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const currentDate = () => new Date();

const friendlyError = (err) => {
  const msg = String(err?.message || '');
  if (err?.code === '23505' || msg.includes('duplicate key')) {
    return 'Presensi untuk jadwal ini sudah tercatat hari ini.';
  }
  if (msg.includes('row-level security')) {
    return 'Presensi belum dibuka untuk akun Anda. Hubungi wali kelas.';
  }
  return msg || 'Gagal menyimpan presensi.';
};

export default function PresensiSiswa({ student, schedules = [], attendance = [], onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [bulan, setBulan] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');

  const today = useMemo(() => currentDate(), []);
  const todayKey = toDateKey(today);
  const hariIni = HARI[today.getDay()];

  const scheduleById = useMemo(
    () => new Map(schedules.map((s) => [s.id, s])),
    [schedules],
  );

  const jadwalHariIni = useMemo(
    () => schedules
      .filter((s) => s.hari === hariIni)
      .sort((a, b) => String(a.jam_mulai).localeCompare(String(b.jam_mulai))),
    [schedules, hariIni],
  );

  const presensiHariIni = useMemo(() => {
    const map = new Map();
    attendance
      .filter((a) => a.tanggal === todayKey && a.schedule_id)
      .forEach((a) => map.set(a.schedule_id, a));
    return map;
  }, [attendance, todayKey]);

  
  const stats = useMemo(() => {
    const total = attendance.length;
    const count = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0 };
    attendance.forEach((a) => {
      if (count[a.status] != null) count[a.status] += 1;
    });
    const masuk = count.hadir + count.terlambat;
    return {
      total,
      ...count,
      masuk,
      persen: total ? Math.round((masuk / total) * 100) : 0,
    };
  }, [attendance]);

  
  const bulanList = useMemo(() => {
    const set = new Set();
    attendance.forEach((a) => { if (a.tanggal) set.add(String(a.tanggal).slice(0, 7)); });
    return Array.from(set).sort().reverse();
  }, [attendance]);

  const riwayat = useMemo(() => {
    return attendance
      .filter((a) => (bulan === 'semua' ? true : String(a.tanggal).startsWith(bulan)))
      .filter((a) => (statusFilter === 'semua' ? true : a.status === statusFilter))
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))
        || String(b.jam_masuk || '').localeCompare(String(a.jam_masuk || '')));
  }, [attendance, bulan, statusFilter]);

  
  const handlePresensi = async (schedule) => {
    if (!student?.id) return;
    setError('');
    setFlash('');
    setBusyId(schedule.id);
    try {
      const now = currentDate();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const [jh, jm] = String(schedule.jam_mulai || '00:00').split(':').map(Number);
      const late = nowMinutes > (jh * 60 + jm) + 10;

      const { error: insErr } = await supabase.from('attendance').insert({
        student_id: student.id,
        class_id: student.class_id || schedule.class_id,
        schedule_id: schedule.id,
        tanggal: todayKey,
        jam_masuk: `${jamSekarang()}:00`,
        status: late ? 'terlambat' : 'hadir',
        metode: 'mandiri',
      });
      if (insErr) throw insErr;

      setFlash(`Presensi ${schedule.subjects?.nama || 'mata pelajaran'} tercatat pada ${jamSekarang()}.`);
      setTimeout(() => setFlash(''), 4000);
      if (onChanged) onChanged();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="siswa-tab-pane psr-root">
      
      <div className="psr-stats">
        <div className="psr-stat is-main">
          <span className="psr-stat-label">Persentase Kehadiran</span>
          <strong>{stats.persen}%</strong>
          <span className="psr-stat-sub">{stats.masuk} dari {stats.total} catatan</span>
        </div>
        <div className="psr-stat">
          <span className="psr-stat-label">Hadir</span>
          <strong className="is-hadir">{stats.hadir}</strong>
          <span className="psr-stat-sub">Tepat waktu</span>
        </div>
        <div className="psr-stat">
          <span className="psr-stat-label">Terlambat</span>
          <strong className="is-terlambat">{stats.terlambat}</strong>
          <span className="psr-stat-sub">Masuk lewat jam</span>
        </div>
        <div className="psr-stat">
          <span className="psr-stat-label">Izin / Sakit</span>
          <strong className="is-izin">{stats.izin + stats.sakit}</strong>
          <span className="psr-stat-sub">{stats.izin} izin • {stats.sakit} sakit</span>
        </div>
        <div className="psr-stat">
          <span className="psr-stat-label">Alpa</span>
          <strong className="is-alpa">{stats.alpa}</strong>
          <span className="psr-stat-sub">Tanpa keterangan</span>
        </div>
      </div>

      {error && (
        <div className="psr-alert is-error">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}
      {flash && (
        <div className="psr-alert is-ok">
          <CheckCircle2 size={15} />
          <span>{flash}</span>
        </div>
      )}

      
      <section className="psr-section">
        <div className="psr-section-head">
          <div>
            <h3><CalendarDays size={16} /> Presensi Hari Ini</h3>
            <p>{formatTanggal(todayKey)}</p>
          </div>
          <span className="psr-counter">
            {presensiHariIni.size} / {jadwalHariIni.length} sesi
          </span>
        </div>

        {jadwalHariIni.length === 0 ? (
          <div className="guru-empty-box">
            <CalendarDays size={22} />
            <strong>Tidak ada jadwal hari ini</strong>
            <span>Presensi akan muncul otomatis sesuai jadwal kelas Anda.</span>
          </div>
        ) : (
          <div className="guru-card-grid">
            {jadwalHariIni.map((s) => {
              const rec = presensiHariIni.get(s.id);
              const done = !!rec;
              return (
                <article key={s.id} className={`psr-card ${done ? 'is-done' : ''}`}>
                  <div className="psr-card-head">
                    <span className="psr-card-time">
                      {String(s.jam_mulai).slice(0, 5)}
                      <small>{String(s.jam_selesai).slice(0, 5)}</small>
                    </span>
                    <div className="psr-card-title">
                      <strong>{s.subjects?.nama || 'Mata pelajaran'}</strong>
                      <span>{s.teachers?.nama || 'Guru pengampu'}</span>
                    </div>
                    <span className={`psr-badge is-${done ? rec.status : 'open'}`}>
                      {done ? STATUS_LABEL[rec.status] || rec.status : 'Belum'}
                    </span>
                  </div>

                  {done ? (
                    <div className="psr-card-foot">
                      <span><Clock size={13} /> {String(rec.jam_masuk || '').slice(0, 5) || '—'}</span>
                      <span className="psr-method">
                        {rec.metode === 'guru' ? 'Diinput guru' : 'Presensi mandiri'}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="guru-primary-btn psr-btn"
                      onClick={() => handlePresensi(s)}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id
                        ? <Loader2 size={15} className="gm-spin" />
                        : <UserCheck size={15} />}
                      {busyId === s.id ? 'Menyimpan...' : 'Presensi Sekarang'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      
      <section className="psr-section">
        <div className="guru-toolbar">
          <div className="guru-toolbar-left">
            <select
              className="guru-select"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              aria-label="Filter bulan"
            >
              <option value="semua">Semua bulan</option>
              {bulanList.map((b) => (
                <option key={b} value={b}>{formatBulan(b)}</option>
              ))}
            </select>
            <div className="guru-chips">
              {['semua', 'hadir', 'terlambat', 'izin', 'sakit', 'alpa'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`guru-chip-btn ${statusFilter === st ? 'is-active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'semua' ? 'Semua' : STATUS_LABEL[st]}
                </button>
              ))}
            </div>
          </div>
          <span className="guru-count">{riwayat.length} catatan</span>
        </div>

        {riwayat.length === 0 ? (
          <div className="guru-empty-box">
            <Clock size={22} />
            <strong>Belum ada riwayat presensi</strong>
            <span>Catatan akan muncul setelah Anda melakukan presensi.</span>
          </div>
        ) : (
          <div className="psr-history">
            {riwayat.map((a) => {
              const sch = scheduleById.get(a.schedule_id);
              return (
                <div key={a.id} className="psr-row">
                  <span className={`psr-dot is-${a.status}`} />
                  <div className="psr-row-main">
                    <strong>{formatTanggalPendek(a.tanggal)}</strong>
                    <span>
                      {sch?.subjects?.nama || 'Presensi harian'}
                      {a.jam_masuk ? ` • masuk ${String(a.jam_masuk).slice(0, 5)}` : ''}
                    </span>
                  </div>
                  <span className={`psr-badge is-${a.status}`}>
                    {STATUS_LABEL[a.status] || a.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
