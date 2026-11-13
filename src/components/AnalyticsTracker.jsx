import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackVisit } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';

// Dicatat sekali per rute (kunjungan). Login event dicatat server saat login.
export default function AnalyticsTracker() {
  const { pathname } = useLocation();
  const { loading } = useAuth();
  const lastVisitPath = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (lastVisitPath.current === pathname) return;
    lastVisitPath.current = pathname;
    trackVisit(pathname);
  }, [pathname, loading]);

  return null;
}