import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  Activity, Eye, Users, LogIn, BookOpen, GraduationCap, Trophy,
  Building2, Camera, MessageSquare, UserCog, ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { apiGet, apiListAll } from '../lib/api';
import { useContent } from '../context/ContentContext';
import { DashboardSkeleton } from './ui/Skeleton';
import { useAnimeEntrance } from '../hooks/useAnimeEntrance';
import './AdminAnalytics.css';

const ROLE_COLOR = { guru: '#9333ea', siswa: '#0284c7', admin: '#ea580c' };
const ROLE_LABEL = { guru: 'Guru', siswa: 'Siswa', admin: 'Admin' };

const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const shortDay = (key) => {
  const [, m, d] = key.split('-');
  return `${d}/${m}`;
};

export default function AdminAnalytics({ embedded = false }) {
  const {
    majors, teachers, eskul, facilities, galeri, contactMessages,
  } = useContent();
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Statistik muncul setelah skeleton panel selesai; animasikan saat itu.
  const contentRevealRef = useAnimeEntrance({
    deps: [days],
    ready: !loading,
    selector: '.cms-stat-box, .analytics-chart-card, .analytics-rank li',
    duration: 560,
    staggerMs: 38,
    distance: 14,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/admin/analytics', { query: { range: days } });
      setError('');
      setAnalytics(data || null);
    } catch (e) {
      setError(e?.message || 'Gagal memuat statistik.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  useEffect(() => {
    let active = true;
    apiListAll('/admin/accounts')
      .then((rows) => {
        if (!active) return;
        const counts = { admin: 0, guru: 0, siswa: 0 };
        for (const row of rows) if (counts[row.role] != null) counts[row.role] += 1;
        setAccounts(counts);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const visitsTotal = analytics?.visits_total || 0;
  const loginsTotal = analytics?.logins_total || 0;

  const dailySeries = useMemo(() => {
    const byDay = analytics?.visits_by_day || {};
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = dayKey(daysAgo(i));
      out.push({ day: shortDay(key), total: Number(byDay[key] || 0) });
    }
    return out;
  }, [analytics, days]);

  const loginByRole = useMemo(() => {
    const c = analytics?.logins_by_role || {};
    return ['guru', 'siswa', 'admin'].map((role) => ({
      role: ROLE_LABEL[role], key: role, count: Number(c[role] || 0), fill: ROLE_COLOR[role],
    }));
  }, [analytics]);

  const topUsers = useMemo(() => {
    const map = new Map();
    for (const l of analytics?.latest_logins || []) {
      if (!l.user_id) continue;
      const e = map.get(l.user_id) || { nama: l.nama || 'Tanpa nama', role: l.role, count: 0 };
      e.count++;
      e.nama = l.nama || e.nama;
      map.set(l.user_id, e);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [analytics]);

  const summaryItems = [
    { label: 'Program Keahlian', value: majors.length, icon: BookOpen, color: 'bg-blue' },
    { label: 'Guru & Tenaga Pendidik', value: teachers.length, icon: GraduationCap, color: 'bg-green' },
    { label: 'Ekstrakurikuler', value: eskul.length, icon: Trophy, color: 'bg-purple' },
    { label: 'Fasilitas', value: facilities.length, icon: Building2, color: 'bg-orange' },
    { label: 'Foto Galeri', value: galeri.length, icon: Camera, color: 'bg-blue' },
    { label: 'Pesan Masuk', value: contactMessages.length, icon: MessageSquare, color: 'bg-purple' },
    { label: 'Akun Guru', value: accounts ? accounts.guru : '—', icon: UserCog, color: 'bg-orange' },
    { label: 'Akun Siswa', value: accounts ? accounts.siswa : '—', icon: Users, color: 'bg-blue' },
    { label: 'Akun Admin', value: accounts ? accounts.admin : '—', icon: ShieldCheck, color: 'bg-green' },
  ];

  const inner = (
    <>
      <div className="analytics-embedded-header mt-4">
        <h4 className="analytics-section-title" style={{ margin: 0 }}>Statistik &amp; Aktivitas</h4>
        <div className="analytics-range">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              className={`range-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}
            >
              {d} hari
            </button>
          ))}
        </div>
      </div>

      <h4 className="analytics-section-title">Ringkasan Data Saat Ini</h4>
      <div className="cms-stats-grid">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="cms-stat-box">
              <div className={`stat-icon-wrap ${item.color}`}><Icon size={22} /></div>
              <div className="stat-data">
                <span className="stat-number">{typeof item.value === 'number' ? item.value.toLocaleString('id-ID') : item.value}</span>
                <span className="stat-name">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <h4 className="analytics-section-title analytics-section-title--spaced">Aktivitas Website ({days} Hari Terakhir)</h4>

      {loading ? (
        <DashboardSkeleton cards={4} showHero={false} />
      ) : error ? (
        <div className="analytics-error">
          <p>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={load}>
            <RefreshCw size={15} />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : (
        <>
          <div className="cms-stats-grid">
            <div className="cms-stat-box">
              <div className="stat-icon-wrap bg-blue"><Eye size={22} /></div>
              <div className="stat-data">
                <span className="stat-number">{visitsTotal.toLocaleString('id-ID')}</span>
                <span className="stat-name">Total Page Views</span>
              </div>
            </div>

            <div className="cms-stat-box">
              <div className="stat-icon-wrap bg-purple"><LogIn size={22} /></div>
              <div className="stat-data">
                <span className="stat-number">{loginsTotal.toLocaleString('id-ID')}</span>
                <span className="stat-name">Total Login</span>
              </div>
            </div>
            <div className="cms-stat-box">
              <div className="stat-icon-wrap bg-orange"><Activity size={22} /></div>
              <div className="stat-data">
                <span className="stat-number">
                  {days ? Math.round(visitsTotal / days).toLocaleString('id-ID') : 0}
                </span>
                <span className="stat-name">Rata-rata / Hari</span>
              </div>
            </div>
          </div>

          <div className="analytics-chart-card mt-4">
            <h4>Kunjungan Harian ({days} hari terakhir)</h4>
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailySeries} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" name="Kunjungan" stroke="#ea580c" strokeWidth={2} fill="url(#visitFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-grid-2 mt-4">
            <div className="analytics-chart-card">
              <h4>Frekuensi Login per Peran</h4>
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={loginByRole} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" name="Login" radius={[6, 6, 0, 0]}>
                      {loginByRole.map((r) => <Cell key={r.key} fill={r.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-chart-card">
              <h4>Pengguna Paling Aktif</h4>
              {topUsers.length === 0 ? (
                <p className="text-muted analytics-empty">Belum ada data login pada periode ini.</p>
              ) : (
                <ol className="analytics-rank">
                  {topUsers.map((u, i) => (
                    <li key={i}>
                      <span className="rank-pos">{i + 1}</span>
                      <span className="rank-name">{u.nama}</span>
                      <span className="rank-role" style={{ color: ROLE_COLOR[u.role] || '#64748b' }}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                      <span className="rank-count">{u.count}×</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );

  if (embedded) return inner;
  return (
    <div className="cms-panel animate-fade-in" ref={contentRevealRef}>
      {inner}
    </div>
  );
}
