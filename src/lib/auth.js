// Autentikasi terhadap API: login Sanctum, profil, dan sesi perangkat.
import { apiPost, apiGet, apiPatch, setAuth, clearAuth, getToken, getStoredUser } from './api';
import { getDeviceId, deviceLabel, setSessionId, clearLocalSession } from './sessionGuard';

/** Login identifier (NISN siswa / username / email) + kata sandi. */
export async function login(identifier, password) {
  const data = await apiPost('/auth/login', {
    identifier: String(identifier).trim(),
    password,
    device_id: getDeviceId(),
    device_label: deviceLabel(),
  }, { auth: false });

  setAuth({
    token: data.token,
    user: data.user,
    expiresAt: data.expires_at,
  });
  if (data.session?.id) setSessionId(data.session.id);
  return data;
}

/** Logout: cabut token + sesi di server, lalu bersihkan state lokal. */
export async function logout() {
  try {
    if (getToken()) await apiPost('/auth/logout', {});
  } catch { /* offline: token tetap dibuang di bawah */ }
  clearLocalSession();
  clearAuth();
}

/** Profil user aktif dari server (sekaligus validasi token). */
export async function fetchMe() {
  const user = await apiGet('/auth/me');
  setAuth({ user });
  return user;
}

export async function updateProfile(patch) {
  const user = await apiPatch('/auth/profile', patch);
  setAuth({ user });
  return user;
}

export async function changePassword(currentPassword, password) {
  await apiPost('/auth/change-password', {
    current_password: currentPassword,
    password,
    password_confirmation: password,
  });
}

export { getToken, getStoredUser, clearAuth };