import { useState, useEffect, useCallback } from 'react';
import { getToken, getStoredUser, onAuthChange } from '../lib/api';
import { login as apiLogin, logout as apiLogout, fetchMe } from '../lib/auth';
import {
  releaseUserSession, clearLocalSession, resetSessionCache, clearResumeFlag,
} from '../lib/sessionGuard';

// Identifier siswa = NISN; guru/admin = username atau email.
// API yang menerjemahkan identifier, jadi tidak ada lagi email sintetis.
export const emailForNisn = (nisn) => String(nisn).trim();

export const emailForUsername = (username) => String(username ?? '').trim();

const toProfile = (user) => (user ? {
  id: user.id,
  nama: user.name,
  role: user.role,
  foto_url: user.foto_url || null,
  username: user.username || null,
  email: user.email || null,
  teacher_id: user.teacher_id || null,
  student_id: user.student_id || null,
} : null);

export function useAuth() {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [profile, setProfile] = useState(() => (getToken() ? toProfile(getStoredUser()) : null));
  const [loading, setLoading] = useState(() => !!getToken());

  const syncUser = useCallback((nextUser) => {
    setUser(nextUser || null);
    setProfile(toProfile(nextUser));
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;

    const boot = async () => {
      if (!getToken()) {
        syncUser(null);
        return;
      }
      try {
        const me = await fetchMe();
        if (alive) syncUser(me);
      } catch (err) {
        if (!alive) return;
        if (err?.status === 401 || err?.status === 403) {
          // Token kedaluwarsa / dicabut: bersihkan sesi lokal.
          syncUser(null);
        } else {
          // Server tidak terjangkau: pakai profil tersimpan (mode offline).
          syncUser(getStoredUser());
        }
      }
    };
    boot();

    const off = onAuthChange(() => {
      if (!alive) return;
      if (!getToken()) {
        syncUser(null);
        return;
      }
      const stored = getStoredUser();
      if (stored) syncUser(stored);
    });
    return () => { alive = false; off(); };
  }, [syncUser]);

  const signInSiswa = async (nisn, password) => {
    const data = await apiLogin(nisn, password);
    syncUser(data.user);
    return data;
  };

  const signInEmail = async (identifier, password) => {
    const data = await apiLogin(identifier, password);
    syncUser(data.user);
    return data;
  };

  const signOut = async () => {
    // Admin tidak terikat aturan 1 akun 1 perangkat: jangan sentuh sesi server.
    if (profile?.role !== 'admin') {
      try {
        await releaseUserSession();
      } catch { /* offline: sesi akan kedaluwarsa sendiri */ }
    } else {
      clearLocalSession();
    }
    resetSessionCache();
    clearResumeFlag();
    await apiLogout();
    syncUser(null);
  };

  return { user, profile, loading, signInSiswa, signInEmail, signOut };
}