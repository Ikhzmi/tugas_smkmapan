import { supabase } from './supabase';

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

// Catat satu page view. `profile` boleh null untuk pengunjung anonim.
export async function trackVisit(path, user, profile) {
  try {
    await supabase.from('site_visits').insert({
      path,
      role: profile?.role ?? 'anon',
      user_id: user?.id ?? null,
      session_id: getSessionId(),
      user_agent: navigator.userAgent.slice(0, 300),
    });
  } catch {
    // analytics tidak boleh mengganggu UX
  }
}

// Catat satu login berhasil beserta snapshot role + nama.
export async function trackLogin(user, profile) {
  if (!user || !profile?.role) return;
  try {
    await supabase.from('login_events').insert({
      user_id: user.id,
      role: profile.role,
      nama: profile.nama ?? null,
    });
  } catch {
    // analytics tidak boleh mengganggu UX
  }
}
