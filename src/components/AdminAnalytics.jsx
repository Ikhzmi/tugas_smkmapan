import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  Activity, Eye, Users, LogIn, BookOpen, GraduationCap, Trophy,
  Building2, Camera, MessageSquare, UserCog, ShieldCheck,
  Copy, Check, RefreshCw, Database,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useContent } from '../context/ContentContext';
import { DashboardSkeleton } from './ui/Skeleton';
import './AdminAnalytics.css';

const ROLE_COLOR = { guru: '#9333ea', siswa: '#0284c7', admin: '#ea580c' };
const ROLE_LABEL = { guru: 'Guru', siswa: 'Siswa', admin: 'Admin' };

// Supabase membatasi 1000 baris per select; ambil berhalaman sampai habis.
async function fetchAll(table, cols, sinceCol, since, cap = 30000) {
  const batch = 1000;
  let from = 0;
  const out = [];
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .gte(sinceCol, since)
      .order(sinceCol, { ascending: true })
      .range(from, from + batch - 1);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...data);
    if (data.length < batch || out.length >= cap) break;
    from += batch;
  }
  return out;
}

const isMissingTable = (err) =>
  /could not find the table|could not find the relation|does not exist|schema cache|PGRST205|42P01/i.test(
    `${err?.message || ''} ${err?.details || ''}`,
  );

const ANALYTICS_SQL = `-- Statistik kunjungan & login (jalankan sekali di SQL Editor)
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visited_at timestamptz not null default now(),
  path text,
  role text not null default 'anon'
    check (role in ('anon','admin','guru','siswa')),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  user_agent text
);
alter table public.site_visits enable row level security;
create index if not exists site_visits_visited_at_idx on public.site_visits (visited_at desc);
create index if not exists site_visits_session_idx on public.site_visits (session_id);
create index if not exists site_visits_role_idx on public.site_visits (role);

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  logged_in_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete set null,
  role text not null check (role in ('admin','guru','siswa')),
  nama text
);
alter table public.login_events enable row level security;
create index if not exists login_events_logged_in_at_idx on public.login_events (logged_in_at desc);
create index if not exists login_events_role_idx on public.login_events (role);
create index if not exists login_events_user_idx on public.login_events (user_id);

drop policy if exists "catat kunjungan publik" on public.site_visits;
create policy "catat kunjungan publik"
  on public.site_visits for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin baca kunjungan" on public.site_visits;
create policy "admin baca kunjungan"
  on public.site_visits for select
  to authenticated
  using (public.is_admin());

drop policy if exists "catat login sendiri" on public.login_events;
create policy "catat login sendiri"
  on public.login_events for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "admin baca login" on public.login_events;
create policy "admin baca login"
  on public.login_events for select
  to authenticated
  using (public.is_admin());`;

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
  const [visits, setVisits] = useState([]);
  const [logins, setLogins] = useState([]);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    try {
      const [v, l] = await Promise.all([
        fetchAll('site_visits', 'visited_at, role, session_id, user_id', 'visited_at', since),
        fetchAll('login_events', 'logged_in_at, role, nama, user_id', 'logged_in_at', since),
      ]);
      setError('');
      setSetupNeeded(false);
      setVisits(v);
      setLogins(l);
    } catch (e) {
      if (isMissingTable(e)) {
        setError('');
        setSetupNeeded(true);
      } else {
        setSetupNeeded(false);
        setError(e?.message || 'Gagal memuat statistik.');
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  useEffect(() => {
    let active = true;
    supabase.from('profiles').select('role').then(({ data, error: err }) => {
      if (!active || err || !data) return;
      const counts = { admin: 0, guru: 0, siswa: 0 };
      for (const row of data) if (counts[row.role] != null) counts[row.role] += 1;
      setAccounts(counts);
    });
    return () => { active = false; };
  }, []);

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(ANALYTICS_SQL);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = ANALYTICS_SQL;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dailySeries = useMemo(() => {
    const counts = new Map();
    for (let i = days - 1; i >= 0; i--) {
      counts.set(dayKey(daysAgo(i)), 0);
    }
    for (const v of visits) {
      const k = dayKey(v.visited_at);
      if (counts.has(k)) counts.set(k, counts.get(k) + 1);
    }
    return [...counts.entries()].map(([key, total]) => ({ day: shortDay(key), total }));
  }, [visits, days]);

  const loginByRole = useMemo(() => {
    const c = { guru: 0, siswa: 0, admin: 0 };
    for (const l of logins) if (c[l.role] != null) c[l.role]++;
    return ['guru', 'siswa', 'admin'].map((role) => ({
      role: ROLE_LABEL[role], key: role, count: c[role], fill: ROLE_COLOR[role],
    }));
  }, [logins]);

  const topUsers = useMemo(() => {
    const map = new Map();
    for (const l of logins) {
      if (!l.user_id) continue;
      const e = map.get(l.user_id) || { nama: l.nama || 'Tanpa nama', role: l.role, count: 0 };
      e.count++;
      e.nama = l.nama || e.nama;
      map.set(l.user_id, e);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [logins]);

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
        {!setupNeeded && (
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
        )}
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

      {setupNeeded ? (
        <div className="cms-info-card analytics-setup">
          <div className="analytics-setup__head">
            <span className="analytics-setup__icon"><Database size={24} /></span>
            <div>
              <h4>Aktifkan Statistik Kunjungan</h4>
              <p>
                Ringkasan data di atas sudah aktif dan terhubung ke database. Untuk menampilkan grafik
                kunjungan dan frekuensi login, buat dua tabel analitik di Supabase (dijalankan sekali saja).
              </p>
            </div>
          </div>
          <ol className="analytics-setup__steps">
            <li>Buka dashboard Supabase Anda, masuk ke <strong>SQL Editor</strong>, lalu klik <strong>New query</strong>.</li>
            <li>Salin SQL di bawah lewat tombol <strong>Salin SQL</strong> — atau jalankan file <code>md/supabase_analytics.sql</code> dari proyek ini.</li>
            <li>Klik <strong>Run</strong>, lalu tekan <strong>Muat Ulang Statistik</strong>. Data akan terisi otomatis saat pengunjung membuka website.</li>
          </ol>
          <div className="analytics-setup__actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={copySql}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'SQL Disalin' : 'Salin SQL'}</span>
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={load}>
              <RefreshCw size={15} />
              <span>Muat Ulang Statistik</span>
            </button>
          </div>
          <details className="analytics-setup__details">
            <summary>Lihat SQL lengkap</summary>
            <pre>{ANALYTICS_SQL}</pre>
          </details>
        </div>
      ) : loading ? (
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
                <span className="stat-number">{visits.length.toLocaleString('id-ID')}</span>
                <span className="stat-name">Total Page Views</span>
              </div>
            </div>

            <div className="cms-stat-box">
              <div className="stat-icon-wrap bg-purple"><LogIn size={22} /></div>
              <div className="stat-data">
                <span className="stat-number">{logins.length.toLocaleString('id-ID')}</span>
                <span className="stat-name">Total Login</span>
              </div>
            </div>
            <div className="cms-stat-box">
              <div className="stat-icon-wrap bg-orange"><Activity size={22} /></div>
              <div className="stat-data">
                <span className="stat-number">
                  {days ? Math.round(visits.length / days).toLocaleString('id-ID') : 0}
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
    <div className="cms-panel animate-fade-in">
      {inner}
    </div>
  );
}
