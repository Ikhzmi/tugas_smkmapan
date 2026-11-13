import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowLeft, LogIn, User, Lock,
  BookOpen, Monitor, Clock, CheckCircle2
} from 'lucide-react';
import { useAuth, emailForUsername } from '../hooks/useAuth';
import { SESSION_NOTICE, conflictNotice } from '../hooks/useSessionGuard';
import {
  markFreshLogin,
  cancelFreshLogin,
  ensureSession,
  resetSessionCache,
  setNotice as writeNotice,
  takeNotice,
  clearNotice,
} from '../lib/sessionGuard';
import { logout as apiLogout } from '../lib/auth';
import { useTheme } from '../hooks/useTheme';
import LightTunnel from '../components/backgrounds/LightTunnel';
import TeddyMascot from '../components/login/TeddyMascot';
import './LoginPortal.css';

export default function LoginPortal() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { signInSiswa, signInEmail, user, profile, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [notice, setNoticeMsg] = useState(() => takeNotice());

  const isLight = theme === 'light';

  // Sudah punya sesi? Cek dulu masih berlaku (grace 5 menit), lalu langsung
  // masuk dashboard tanpa perlu mengetik ulang kata sandi.
  useEffect(() => {
    if (authLoading || loading || !user || !profile) return undefined;

    let alive = true;
    (async () => {
      const role = profile.role;

      // Aturan 1 akun 1 perangkat hanya berlaku untuk guru & siswa.
      if (role === 'guru' || role === 'siswa') {
        const result = await ensureSession();
        if (!alive) return;

        if (result.status === 'expired' || result.status === 'revoked' || result.status === 'conflict') {
          const message = result.status === 'expired'
            ? SESSION_NOTICE.expired
            : result.status === 'revoked'
              ? SESSION_NOTICE.revoked
              : conflictNotice(result.otherLabel);
          writeNotice(message);
          setNoticeMsg(message);
          resetSessionCache();
          try {
            await apiLogout();
          } catch { /* biarkan form login tampil */ }
          return;
        }
      } else if (role === 'admin') {
        // Admin bebas aturan perangkat: jangan pernah tampilkan notice
        // sisa sesi guru/siswa di halaman login admin.
        clearNotice();
        setNoticeMsg('');
      }

      if (profile.role === 'guru') navigate('/guru/dashboard', { replace: true });
      else if (profile.role === 'siswa') navigate('/lms/dashboard', { replace: true });
      else if (profile.role === 'admin') navigate('/admin/dashboard', { replace: true });
    })();

    return () => { alive = false; };
  }, [user, profile, authLoading, loading, navigate]);

  const handleFieldBlur = (event) => {
    const form = event.currentTarget.form;
    if (!form || !form.contains(event.relatedTarget)) {
      setFocusedField(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const id = identifier.trim();
    if (!id || !password) {
      setError('Username dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    markFreshLogin();
    try {
      // API menerima NISN (siswa), username, atau email sebagai identifier.
      const data = /^\d+$/.test(id)
        ? await signInSiswa(id, password)
        : await signInEmail(emailForUsername(id), password);

      const role = data?.user?.role;
      const target = role === 'guru'
        ? '/guru/dashboard'
        : role === 'siswa'
          ? '/lms/dashboard'
          : role === 'admin'
            ? '/admin/dashboard'
            : '';

      if (!target) {
        cancelFreshLogin();
        await apiLogout();
        setError('Akun ini tidak memiliki akses ke portal.');
        return;
      }

      // Aturan 1 akun = 1 perangkat: kalau akun masih aktif di perangkat lain,
      // login ini DITOLAK dan sesi yang sedang berjalan tidak diganggu.
      // Hanya guru/siswa; admin bebas login di banyak perangkat.
      if (role === 'guru' || role === 'siswa') {
        const sesi = await ensureSession();
        if (sesi.status === 'conflict') {
          resetSessionCache();
          await apiLogout();
          setError(conflictNotice(sesi.otherLabel));
          return;
        }
        if (sesi.status === 'expired' || sesi.status === 'revoked') {
          resetSessionCache();
          await apiLogout();
          setError(sesi.status === 'expired' ? SESSION_NOTICE.expired : SESSION_NOTICE.revoked);
          return;
        }
      } else if (role === 'admin') {
        // Jangan tinggalkan flag fresh-login yang bisa memicu klaim sesi
        // kalau ada kode lain memanggil ensureSession setelah ini.
        cancelFreshLogin();
        clearNotice();
        setNoticeMsg('');
      }

      // Login berhasil: notice lama tidak relevan lagi.
      clearNotice();
      setNoticeMsg('');
      navigate(target);
    } catch (err) {
      cancelFreshLogin();
      if (err?.status === 409 || err?.code === 'SESSION_CONFLICT') {
        setError(conflictNotice(err?.data?.other_device_label));
      } else {
        setError(err.message || 'Kredensial salah. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Monitor size={16} />, label: 'Akses 24/7' },
    { icon: <BookOpen size={16} />, label: 'Modul Pembelajaran' },
    { icon: <Clock size={16} />, label: 'Jadwal & Nilai' },
  ];

  return (
    <div className="login-page" data-theme={theme}>
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-grid" />
        <div className="login-bg-orb3" />
        <LightTunnel
          className="login-tunnel"
          lightMode={isLight}
          cableColor={isLight ? '#c2410c' : '#ff6b00'}
          pulseColor={isLight ? '#7c2d12' : '#ffb347'}
          tunnelColor={isLight ? '#0f172a' : '#1e293b'}
          tunnelOpacity={isLight ? 0 : 0.08}
          opacity={isLight ? 0.85 : 1}
          brightness={isLight ? 1.1 : 1.2}
          cableCount={64}
          thickness={0.5}
          pulseDensity={0.6}
          speed={0.08}
          pulseSpeed={1.7}
          glow={1.15}
          mouseStrength={0.08}
        />
      </div>

      <Link to="/" className="login-back-btn" aria-label="Kembali ke Beranda" title="Kembali ke Beranda">
        <ArrowLeft size={16} />
        <span>Beranda</span>
      </Link>

      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand">
            <img
              src="/logo.png"
              alt="SMK Muhammadiyah 8 Medan"
              className="login-logo"
              width="56"
              height="56"
              loading="eager"
            />
            <div className="login-brand-text">
              <span className="login-brand-name">Portal Akademik</span>
              <span className="login-brand-school">SMK Muhammadiyah 8 Medan</span>
            </div>
          </div>

          <div className="login-hero">
            <span className="login-eyebrow">Selamat Datang</span>
            <h1 className="login-hero-title">
              Masuk ke <span className="login-accent">Portal Akademik</span>
            </h1>
            <p className="login-hero-desc">
              Gunakan akun yang telah terdaftar untuk mengakses layanan
              akademik sekolah.
            </p>
          </div>

          <div className="login-features">
            {features.map((feature) => (
              <div key={feature.label} className="login-feature">
                {feature.icon}
                <span>{feature.label}</span>
              </div>
            ))}
          </div>

        </section>

        <section className="login-form-panel">
          <TeddyMascot focus={focusedField} showPassword={showPassword} />

          <div className="login-form-glass">
            <header className="login-form-header">
              <h2 className="login-form-title">Login</h2>
              <p className="login-form-subtitle">Masuk ke akun portal Anda</p>
            </header>

            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="portal-identifier">NISN / Username</label>
                <div className="login-input-wrap">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="portal-identifier"
                    type="text"
                    className="login-input"
                    placeholder="Masukkan NISN atau username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={handleFieldBlur}
                    maxLength={40}
                    autoComplete="username"
                  />
                  {identifier.trim() && (
                    <CheckCircle2 size={18} className="login-field-check" />
                  )}
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="portal-password">Kata Sandi</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="portal-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={handleFieldBlur}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {notice && !error && (
                <div className="login-notice" role="status">
                  {notice}
                </div>
              )}

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
