import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PpdbModal from './components/PpdbModal';
import RequireRole from './components/RequireRole';
import AdminCMSDashboard from './components/AdminCMSDashboard';
import { ContentProvider } from './context/ContentContext';
import LoginAdmin from './pages/LoginAdmin';
import LoginPortal from './pages/LoginPortal';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardSiswa from './pages/DashboardSiswa';
import DashboardGuru from './pages/DashboardGuru';
import AnalyticsTracker from './components/AnalyticsTracker';
import SessionResume from './components/SessionResume';
import LandingPage from './landing/LandingPage';
import './App.css';

function AdminCmsRoute() {
  const navigate = useNavigate();

  return (
    <AdminCMSDashboard
      isOpen
      onClose={() => navigate('/admin/dashboard')}
    />
  );
}

export default function App() {
  const [isPpdbModalOpen, setIsPpdbModalOpen] = useState(false);

  return (
    <ContentProvider>
      <AnalyticsTracker />
      <SessionResume />
      <Routes>
        {/* Route: Login Admin */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/login/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Route: Dashboard Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <RequireRole role="admin" redirectTo="/admin/login">
              <DashboardAdmin />
            </RequireRole>
          }
        />

        {/* Route: Admin CMS */}
        <Route
          path="/admin/cms"
          element={
            <RequireRole role="admin" redirectTo="/admin/login">
              <AdminCmsRoute />
            </RequireRole>
          }
        />

        {/* Route: Login Portal */}
        <Route path="/login" element={<LoginPortal />} />
        <Route path="/login/guru" element={<Navigate to="/login" replace />} />
        <Route path="/login/siswa" element={<Navigate to="/login" replace />} />
        <Route path="/elearning" element={<Navigate to="/login" replace />} />
        <Route path="/lms" element={<Navigate to="/login" replace />} />
        <Route path="/lms/login" element={<Navigate to="/login" replace />} />

        {/* Route: Dashboard Guru */}
        <Route
          path="/guru/dashboard"
          element={
            <RequireRole role="guru" redirectTo="/login">
              <DashboardGuru />
            </RequireRole>
          }
        />

        {/* Route: Dashboard Siswa LMS */}
        <Route
          path="/lms/dashboard"
          element={
            <RequireRole role="siswa" redirectTo="/login">
              <DashboardSiswa />
            </RequireRole>
          }
        />

        {/* Route: Homepage */}
        <Route
          path="/"
          element={
            <>
              <LandingPage onOpenPpdb={() => setIsPpdbModalOpen(true)} />

              <PpdbModal
                isOpen={isPpdbModalOpen}
                onClose={() => setIsPpdbModalOpen(false)}
                preselectedMajorId="tkj"
              />
            </>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ContentProvider>
  );
}
