import { apiPost, apiGet, getToken } from './api';

/** Sesi dianggap logout bila perangkat ditinggal lebih dari N menit. */
export const GRACE_MINUTES = 5;

export const SESSION_NOTICE_KEY = 'mapan.session.notice';
const DEVICE_KEY = 'mapan.device.id';
const SESSION_KEY = 'mapan.session.id';
const LAST_SEEN_KEY = 'mapan.session.last_seen';

const safeGet = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* mode privat */ }
};
const safeDel = (key) => {
  try { localStorage.removeItem(key); } catch { /* mode privat */ }
};

function uuid() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fallback di bawah */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** ID perangkat stabil per browser (localStorage). */
export function getDeviceId() {
  let id = safeGet(DEVICE_KEY);
  if (!id) {
    id = uuid();
    safeSet(DEVICE_KEY, id);
  }
  return id;
}

export function deviceLabel() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
      : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome'
          : /Safari\//.test(ua) ? 'Safari'
            : 'Browser';
  const os = /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Windows/.test(ua) ? 'Windows'
        : /Mac OS X/.test(ua) ? 'macOS'
          : /Linux/.test(ua) ? 'Linux'
            : 'Perangkat';
  return `${browser} · ${os}`;
}

export const getSessionId = () => safeGet(SESSION_KEY) || '';
export const setSessionId = (id) => { if (id) safeSet(SESSION_KEY, id); };
export const clearSessionId = () => safeDel(SESSION_KEY);

export const markLocalSeen = () => safeSet(LAST_SEEN_KEY, String(Date.now()));
export const clearLocalSeen = () => safeDel(LAST_SEEN_KEY);
export function localIdleMs() {
  const raw = Number(safeGet(LAST_SEEN_KEY) || 0);
  return raw > 0 ? Date.now() - raw : null;
}

/** Bersihkan penanda sesi lokal tanpa menyentuh server. */
export function clearLocalSession() {
  clearSessionId();
  clearLocalSeen();
}

export function setNotice(message) {
  try { sessionStorage.setItem(SESSION_NOTICE_KEY, message); } catch { /* ignore */ }
}
export function takeNotice() {
  try {
    const message = sessionStorage.getItem(SESSION_NOTICE_KEY);
    sessionStorage.removeItem(SESSION_NOTICE_KEY);
    return message || '';
  } catch {
    return '';
  }
}

export function clearNotice() {
  try { sessionStorage.removeItem(SESSION_NOTICE_KEY); } catch { /* ignore */ }
}

/**
 * Klaim sesi untuk perangkat ini.
 * Hasil: { status: 'ok' | 'conflict', sessionId, otherLabel, otherLastSeen }
 *
 * 'conflict' = akun sedang aktif di perangkat lain (masih dalam masa tenggang).
 * Perangkat lama MENANG; perangkat ini harus ditolak, bukan menendang yang lama.
 */
export async function claimUserSession() {
  try {
    const session = await apiPost('/auth/session/claim', {
      device_id: getDeviceId(),
      device_label: deviceLabel(),
      grace_minutes: GRACE_MINUTES,
    });
    if (session?.id) setSessionId(session.id);
    markLocalSeen();
    return { status: 'ok', sessionId: session?.id || '' };
  } catch (err) {
    if (err?.status === 409 || err?.code === 'SESSION_CONFLICT') {
      return {
        status: 'conflict',
        sessionId: '',
        otherLabel: err?.data?.other_device_label || '',
        otherLastSeen: err?.data?.other_last_seen || null,
      };
    }
    throw err;
  }
}

/** Hasil: 'ok' | 'expired' | 'none' */
export async function resumeUserSession(graceMinutes = GRACE_MINUTES) {
  const result = await apiPost('/auth/session/resume', {
    device_id: getDeviceId(),
    grace_minutes: graceMinutes,
  });
  const status = result?.status || 'none';
  if (status === 'ok' && result?.session?.id) setSessionId(result.session.id);
  return status;
}

/** Heartbeat: true = sesi masih aktif, false = sudah dicabut. */
export async function touchUserSession() {
  const sessionId = getSessionId();
  if (!sessionId) return true;
  const result = await apiPost('/auth/session/heartbeat', { session_id: sessionId });
  return result?.active !== false;
}

/** Status sesi perangkat ini dari server (pengganti realtime Supabase). */
export async function fetchSessionStatus() {
  return apiGet('/auth/session/status', { query: { device_id: getDeviceId() } });
}

/** Logout sukarela: tandai sesi dicabut di server. */
export async function releaseUserSession() {
  const sessionId = getSessionId();
  clearLocalSession();
  if (!sessionId) return;
  try {
    await apiPost('/auth/session/release', { session_id: sessionId });
  } catch { /* offline: biarkan kedaluwarsa sendiri */ }
}

let bootPromise = null;
let freshLogin = false;

/**
 * Dipanggil tepat sebelum sign-in. Saat login baru, sesi harus DIKLAIM
 * (bukan di-resume), supaya perangkat ini menang dan perangkat lain ditendang.
 */
export function markFreshLogin() {
  freshLogin = true;
  bootPromise = null;
}

export function cancelFreshLogin() {
  freshLogin = false;
}

const hasilClaim = (claim) => {
  if (claim.status === 'conflict') {
    return {
      status: 'conflict',
      otherLabel: claim.otherLabel || '',
      otherLastSeen: claim.otherLastSeen || null,
    };
  }
  markLocalSeen();
  return { status: 'ok' };
};

async function runEnsure() {
  // Belum login (mis. dibuka dari halaman publik): tidak ada yang perlu diklaim.
  if (!getToken()) return { status: 'ok', anonymous: true };

  if (freshLogin) {
    freshLogin = false;
    return hasilClaim(await claimUserSession());
  }

  const state = await resumeUserSession();

  if (state === 'ok') {
    markLocalSeen();
    return { status: 'ok' };
  }

  if (state === 'none') {
    // Perangkat ini belum punya sesi aktif. Kalau perangkat lain masih aktif,
    // klaim akan ditolak sebagai 'conflict'.
    return hasilClaim(await claimUserSession());
  }

  return { status: state };
}

/**
 * Dipakai bersama oleh guard dashboard dan redirect di halaman publik.
 * Hasil di-cache per pemuatan halaman supaya RPC tidak dobel.
 */
export function ensureSession() {
  if (!bootPromise) {
    bootPromise = runEnsure()
      .then((result) => {
        // Hasil "belum login" tidak boleh di-cache: setelah sign-in,
        // pemanggil berikutnya harus benar-benar mengklaim sesi.
        if (result?.anonymous) bootPromise = null;
        return result;
      })
      .catch(() => {
        // Jangan simpan kegagalan (mis. RPC dipanggil sebelum login).
        bootPromise = null;
        return { status: 'ok', offline: true };
      });
  }
  return bootPromise;
}

export function resetSessionCache() {
  bootPromise = null;
  freshLogin = false;
}

/** Hapus penanda "sudah auto-redirect" supaya login berikutnya masuk dashboard lagi. */
export function clearResumeFlag() {
  try { sessionStorage.removeItem('mapan.resume.done'); } catch { /* ignore */ }
}
