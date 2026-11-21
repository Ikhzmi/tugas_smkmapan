import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Eye, EyeOff, ArrowLeft, LogIn,
  User, Lock
} from 'lucide-react';
import { useAuth, emailForUsername } from '../hooks/useAuth';
import { clearNotice, cancelFreshLogin } from '../lib/sessionGuard';
import { logout as apiLogout } from '../lib/auth';
import { useTheme } from '../hooks/useTheme';
import LightTunnel from '../components/backgrounds/LightTunnel';
import TeddyMascot from '../components/login/TeddyMascot';
import './LoginAdmin.css';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { signInEmail, user, profile, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const isLight = theme === 'light';

  useEffect(() => {
    // Admin bebas dari aturan 1 akun 1 perangkat: buang notice sisa
    // sesi guru/siswa supaya tidak muncul di halaman login admin.
    clearNotice();
    cancelFreshLogin();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user && profile?.role === 'admin') navigate('/admin/dashboard', { replace: true });
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const data = await signInEmail(emailForUsername(username), password);
      if (data?.user?.role !== 'admin') {
        await apiLogout();
        setError('Akun ini tidak memiliki akses admin.');
        return;
      }

      // Admin dikecualikan dari aturan 1 akun 1 perangkat, jadi tidak ada
      // pemeriksaan sesi di sini.
      clearNotice();
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.message || 'Kredensial tidak valid. Hubungi IT Administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldBlur = (event) => {
    const form = event.currentTarget.form;
    if (!form || !form.contains(event.relatedTarget)) {
      setFocusedField(null);
    }
  };

  return (
    <div className="login-page admin-page" data-theme={theme}>
      <div className="login-bg" aria-hidden="true">
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

      <div className="login-shell admin-shell">
        <section className="login-brand-panel">
          <div className="login-brand">
            <img
              src="/logo.png"
              alt="SMK Muhammadiyah 8 Medan"
              className="login-logo"
              width="82"
              height="82"
              loading="eager"
            />
            <div className="login-brand-text">
              <span className="login-brand-name">Admin Portal</span>
              <span className="login-brand-school">SMK Muhammadiyah 8 Medan</span>
            </div>
          </div>

          <div className="login-hero">
            <span className="login-eyebrow">Panel Administrasi</span>
            <h1 className="login-hero-title">
              Kelola Sekolah<br />
              <span className="login-accent">Dalam Satu Panel</span>
            </h1>
            <p className="login-hero-desc">
              Kelola konten, data siswa, pendaftar PPDB, dan pantau
              seluruh infrastruktur digital sekolah secara terpusat.
            </p>
          </div>

          <div className="admin-security-notice">
            <ShieldCheck size={15} />
            <p>Akses admin diverifikasi di server melalui autentikasi akun dan pemeriksaan peran. Hanya personil berwenang yang dapat masuk.</p>
          </div>
        </section>

        <section className="login-form-panel admin-form-panel">
          <TeddyMascot focus={focusedField} showPassword={showPassword} />

          <div className="login-form-glass">
            <header className="login-form-header">
              <h2 className="login-form-title">Login Admin</h2>
            </header>

            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="admin-username">Username</label>
                <div className="login-input-wrap">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="admin-username"
                    type="text"
                    className="login-input"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={handleFieldBlur}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="admin-password">Kata Sandi</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="admin-password"
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

            <p className="admin-form-link">
              Bukan admin?{' '}
              <Link to="/login">Masuk di halaman login</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
