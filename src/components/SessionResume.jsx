import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { SESSION_NOTICE, conflictNotice } from '../hooks/useSessionGuard';
import { ensureSession, resetSessionCache, setNotice, clearNotice } from '../lib/sessionGuard';

const DASHBOARD_BY_ROLE = {
  guru: '/guru/dashboard',
  siswa: '/lms/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Kalau pengguna sudah punya sesi yang masih berlaku (mis. tidak sengaja
 * menutup tab lalu membukanya lagi di bawah 5 menit), langsung arahkan ke
 * dashboard. Hanya sekali per tab supaya halaman publik tetap bisa dibuka.
 */
export default function SessionResume() {
  const { user, profile, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || !profile) return undefined;
    if (pathname !== '/') return undefined;

    let done = false;
    try { done = sessionStorage.getItem('mapan.resume.done') === '1'; } catch { done = false; }
    if (done) return undefined;

    let alive = true;
    (async () => {
      const role = profile.role;
      if (role === 'guru' || role === 'siswa') {
        const result = await ensureSession();
        if (!alive) return;

        try { sessionStorage.setItem('mapan.resume.done', '1'); } catch { /* ignore */ }

        if (result.status === 'expired' || result.status === 'revoked' || result.status === 'conflict') {
          const message = result.status === 'expired'
            ? SESSION_NOTICE.expired
            : result.status === 'revoked'
              ? SESSION_NOTICE.revoked
              : conflictNotice(result.otherLabel);
          setNotice(message);
          resetSessionCache();
          try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
          return;
        }
      } else {
        // Admin (dan role lain) bebas dari aturan 1 perangkat: buang notice
        // sisa sesi guru/siswa supaya tidak muncul di halaman admin.
        clearNotice();
        try { sessionStorage.setItem('mapan.resume.done', '1'); } catch { /* ignore */ }
      }

      const target = DASHBOARD_BY_ROLE[profile.role];
      if (target) navigate(target, { replace: true });
    })();

    return () => { alive = false; };
  }, [loading, user, profile, pathname, navigate]);

  return null;
}
