import { apiPost } from './api';

const SESSION_KEY = 'smk_mapan_visit_session';

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid =
      (globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Catat satu page view ke API. Role/user diambil dari token oleh server.
export async function trackVisit(path) {
  try {
    await apiPost('/public/visits', {
      path,
      session_id: getSessionId(),
      user_agent: navigator.userAgent.slice(0, 300),
    });
  } catch {
    // analytics tidak boleh mengganggu UX
  }
}

// Login event dicatat otomatis oleh server saat POST /auth/login berhasil,
// jadi tidak ada pencatatan terpisah dari klien.
export async function trackLogin() {}