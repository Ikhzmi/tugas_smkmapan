import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  releaseUserSession, clearLocalSession, resetSessionCache, clearResumeFlag,
} from '../lib/sessionGuard';

export const emailForNisn = (nisn) => `${String(nisn).trim()}@siswa.smkmuh8.sch.id`;

export const emailForUsername = (username) => {
  const v = String(username ?? '').trim().toLowerCase();
  if (!v) return v;
  // Kalau user mengetik email lengkap, jangan ditempel domain lagi.
  return v.includes('@') ? v : `${v}@smkmuh8.sch.id`;
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const activeUidRef = useRef('');

  const fetchProfile = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nama, role, foto_url')
      .eq('id', uid)
      .single();
    // Abaikan hasil profil lama kalau akun sudah berganti.
    if (activeUidRef.current !== uid) return;
    if (!error) setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const syncUser = (nextUser) => {
      const nextId = nextUser?.id || '';
      activeUidRef.current = nextId;
      setUser(nextUser);
      // Profil lama tidak boleh dipakai untuk akun baru: ini sumber race
      // yang membuat admin sempat dianggap guru/siswa oleh session guard.
      setProfile((prev) => (prev && prev.id !== nextId ? null : prev));

      if (nextUser) fetchProfile(nextUser.id);
      else setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      syncUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchProfile]);

  const signInSiswa = async (nisn, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailForNisn(nisn),
      password,
    });
    if (error) throw new Error('NISN atau kata sandi salah.');
  };

  const signInEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email atau kata sandi salah.');
  };

  const signOut = async () => {
    // Admin tidak terikat aturan 1 akun 1 perangkat: jangan sentuh sesi server.
    if (profile?.role === 'admin') {
      clearLocalSession();
    } else {
      try {
        await releaseUserSession();
      } catch { /* offline: sesi akan kedaluwarsa sendiri */ }
    }
    resetSessionCache();
    clearResumeFlag();
    // 'local' = hanya perangkat ini yang keluar. Default Supabase adalah
    // 'global' yang ikut mencabut sesi akun yang sama di semua perangkat —
    // ini yang bikin sesi admin saling menendang.
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signInSiswa, signInEmail, signOut };
}
