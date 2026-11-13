import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { trackVisit, trackLogin } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';

// Dicatat sekali per rute (kunjungan) dan sekali per user per sesi browser (login).
export default function AnalyticsTracker() {
  const { pathname } = useLocation();
  const { user, profile, loading } = useAuth();
  const lastVisitPath = useRef(null);
  const lastLoginUser = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (lastVisitPath.current === pathname) return;
    lastVisitPath.current = pathname;
    trackVisit(pathname, user, profile);
  }, [pathname, loading, user, profile]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null;
      if (event === 'SIGNED_OUT') {
        lastLoginUser.current = null;
        return;
      }
      if (event !== 'SIGNED_IN' || !uid) return;
      if (lastLoginUser.current === uid) return;
      lastLoginUser.current = uid;
      const { data: prof } = await supabase
        .from('profiles')
        .select('nama, role')
        .eq('id', uid)
        .single();
      trackLogin(session.user, prof);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
