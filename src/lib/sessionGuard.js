import { supabase } from './supabase';

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

const isUnsupported = (error) =>
  /PGRST202|does not exist|Could not find the function|schema cache/i.test(String(error?.message || ''));

/**
 * Klaim sesi untuk perangkat ini.
 * Hasil: { status: 'ok' | 'conflict' | 'unsupported', sessionId, otherLabel, otherLastSeen }
 *
 * 'conflict' = akun sedang aktif di perangkat lain (masih dalam masa tenggang).
 * Perangkat lama MENANG; perangkat ini harus ditolak, bukan menendang yang lama.
 */
export async function claimUserSession() {
  const { data, error } = await supabase.rpc('claim_user_session', {
    p_device_id: getDeviceId(),
    p_device_label: deviceLabel(),
    p_grace_minutes: GRACE_MINUTES,
  });
  if (error) {
    if (isUnsupported(error)) return { status: 'ok', unsupported: true };
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  const status = row?.status === 'conflict' ? 'conflict' : 'ok';
  if (status === 'ok' && row?.session_id) setSessionId(row.session_id);
  return {
    status,
    sessionId: row?.session_id || '',
    otherLabel: row?.other_device_label || '',
    otherLastSeen: row?.other_last_seen || null,
    unsupported: false,
  };
}

/** Hasil: 'ok' | 'expired' | 'revoked' | 'none' | 'unsupported' */
export async function resumeUserSession(graceMinutes = GRACE_MINUTES) {
  const { data, error } = await supabase.rpc('resume_user_session', {
    p_device_id: getDeviceId(),
    p_grace_minutes: graceMinutes,
  });
  if (error) {
    if (isUnsupported(error)) return 'unsupported';
    throw error;
  }
  return typeof data === 'string' ? data : 'none';
}

/** Heartbeat: true = sesi masih aktif, false = sudah dicabut. */
export async function touchUserSession() {
  const sessionId = getSessionId();
  if (!sessionId) return true;
  const { data, error } = await supabase.rpc('touch_user_session', { p_session_id: sessionId });
  if (error) {
    if (isUnsupported(error)) return true;
    throw error;
  }
  return data === true;
}

/** Logout sukarela: tandai sesi dicabut di server. */
export async function releaseUserSession() {
  const sessionId = getSessionId();
  clearLocalSession();
  if (!sessionId) return;
  try {
    await supabase.rpc('release_user_session', { p_session_id: sessionId });
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
  return { status: 'ok', unsupported: !!claim.unsupported };
};

async function runEnsure() {
  // Belum login (mis. dibuka dari halaman publik): tidak ada yang perlu
  // diklaim, dan RPC akan menolak dengan 'not authenticated'.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { status: 'ok', anonymous: true };

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
    // Perangkat ini belum punya sesi (baris hilang / browser baru).
    // Kalau perangkat lain masih aktif, klaim akan ditolak sebagai 'conflict'.
    return hasilClaim(await claimUserSession());
  }

  if (state === 'unsupported') return { status: 'ok', unsupported: true };

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
