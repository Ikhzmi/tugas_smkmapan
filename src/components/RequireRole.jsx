import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSessionGuard } from '../hooks/useSessionGuard';
import AppLoader from './AppLoader';

export default function RequireRole({ role, redirectTo = '/login', children }) {
  const { user, profile, loading } = useAuth();
  // Admin sengaja dikecualikan dari aturan 1 akun 1 perangkat.
  // `ready` mencegah guard berjalan sebelum role diketahui.
  const { status } = useSessionGuard(user, profile?.role, !!profile);

  // Layar tunggu bertema, bukan halaman kosong, selama sesi belum siap.
  if (loading || (user && !profile)) {
    return <AppLoader text="Menyiapkan dashboard" />;
  }
  if (!user || profile?.role !== role) {
    return <Navigate to={redirectTo} replace />;
  }

  // 'checking' = sedang verifikasi sesi; 'blocked' = sesi dicabut/kedaluwarsa
  // (signOut sedang berjalan, jangan tampilkan isi dashboard dulu).
  if (status === 'checking' || status === 'blocked') {
    return <AppLoader text="Memverifikasi sesi" />;
  }

  return children;
}
