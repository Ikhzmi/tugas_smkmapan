import { useEffect, useRef, useState } from 'react';
import { logout as apiLogout } from '../lib/auth';
import {
  GRACE_MINUTES, ensureSession, touchUserSession, fetchSessionStatus,
  getSessionId, setNotice, markLocalSeen,
} from '../lib/sessionGuard';

export const SESSION_NOTICE = {
  expired: `Sesi kamu berakhir karena lebih dari ${GRACE_MINUTES} menit tidak aktif. Silakan masuk lagi.`,
  revoked: 'Sesi di perangkat ini sudah berakhir karena akun dipakai di perangkat lain.',
  idle: `Sesi berakhir karena tidak aktif lebih dari ${GRACE_MINUTES} menit.`,
  logout: 'Sesi ini sudah berakhir. Silakan masuk lagi.',
};

/** Perangkat baru ditolak karena akun masih aktif di perangkat lain. */
export const conflictNotice = (label) =>
  `Akun ini sedang aktif di ${label || 'perangkat lain'}. `
  + `Keluar dulu di perangkat itu, atau tunggu ${GRACE_MINUTES} menit tanpa aktivitas di sana.`;

const HEARTBEAT_MS = 30000;

/**
 * Menjaga aturan "1 akun = 1 perangkat".
 * - Saat halaman dibuka: cek sesi (resume). Lewat 5 menit -> dipaksa logout.
 * - Heartbeat 30 detik: kalau sesi dicabut, langsung keluar.
 * - Polling status sesi: perangkat tahu ketika sesinya dicabut perangkat lain.
 *
 * Role 'admin' DIKECUALIKAN: admin boleh login di banyak perangkat
 * (mis. memantau ujian dari komputer lab sambil tetap terbuka di laptop).
 * Guard juga hanya berjalan untuk guru/siswa — role lain (termasuk yang
 * belum termuat) tidak pernah menyentuh sesi server.
 *
 * `ready` = role sudah diketahui. Selama profil belum termuat, guard
 * TIDAK boleh jalan: kalau jalan, admin sempat diperiksa sebagai user
 * biasa dan langsung ditendang sebelum role-nya ketahuan.
 */
export function useSessionGuard(user, role = '', ready = true) {
  const [status, setStatus] = useState('checking');
  const kickedRef = useRef(false);
  const userId = user?.id || '';
  const skip = role !== 'guru' && role !== 'siswa';
  const active = !!userId && ready && !skip;

  useEffect(() => {
    if (!active) return undefined;

    let alive = true;
    let timer = null;

    const kick = async (message) => {
      if (kickedRef.current) return;
      kickedRef.current = true;
      setNotice(message);
      setStatus('blocked');
      try {
        await apiLogout();
      } catch { /* biarkan RequireRole mengarahkan ke login */ }
    };

    const boot = async () => {
      const result = await ensureSession();
      if (!alive) return;

      if (result.status === 'expired') {
        await kick(SESSION_NOTICE.expired);
        return;
      }
      if (result.status === 'revoked') {
        await kick(SESSION_NOTICE.revoked);
        return;
      }
      if (result.status === 'conflict') {
        // Akun masih dipakai di perangkat lain -> perangkat ini yang mundur.
        await kick(conflictNotice(result.otherLabel));
        return;
      }

      setStatus('ok');
      markLocalSeen();

      timer = setInterval(async () => {
        if (document.visibilityState === 'hidden') return;
        let stillActive = true;
        try {
          stillActive = await touchUserSession();
          // Heartbeat hanya menyentuh baris sesi perangkat ini; cek juga
          // apakah sesi sudah dicabut (mis. login dari perangkat lain).
          if (stillActive && getSessionId()) {
            const st = await fetchSessionStatus();
            stillActive = st?.active !== false;
          }
        } catch {
          stillActive = true;
        }
        if (!alive) return;
        if (!stillActive) {
          await kick(SESSION_NOTICE.revoked);
          return;
        }
        markLocalSeen();
      }, HEARTBEAT_MS);
    };

    boot();

    const touch = () => {
      markLocalSeen();
      touchUserSession().catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') touch();
      else touchUserSession().catch(() => {});
    };

    window.addEventListener('pagehide', touch);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      window.removeEventListener('pagehide', touch);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId, active]);

  // Admin (dan profil yang belum termuat) tidak pernah diperiksa, jadi
  // jangan sampai tertahan di 'checking'.
  const effective = (!userId || skip) ? 'ok' : (ready ? status : 'checking');
  return { status: effective, isBlocked: effective === 'blocked' };
}
