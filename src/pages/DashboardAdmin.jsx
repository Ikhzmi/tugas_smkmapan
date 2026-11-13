import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCMSDashboard from '../components/AdminCMSDashboard';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  
  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, profile, loading, navigate]);

  // Skeleton memakai .dashboard-shell agar token glass & tema ikut aktif.
  if (loading) {
    return (
      <div className="dashboard-admin-page-root dashboard-shell" style={{ minHeight: '100vh', padding: '32px' }}>
        <DashboardSkeleton cards={4} showHero={true} />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') return null;

  return (
    <div className="dashboard-admin-page-root">
      <AdminCMSDashboard 
        isOpen={true} 
        isFullPage={true}
        onClose={() => navigate('/')}
        onLogout={async () => {
          await signOut();
          navigate('/admin/login');
        }}
      />
    </div>
  );
}
