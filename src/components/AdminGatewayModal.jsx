import React from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Server, 
  Users, 
  Activity, 
  Database
} from 'lucide-react';
import './AdminGatewayModal.css';

export default function AdminGatewayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup Admin Panel">
          <X size={20} />
        </button>

        <div className="admin-modal-header">
          <div className="admin-icon-box">
            <Lock size={22} />
          </div>
          <div>
            <h3 className="admin-title">Portal Administrasi & Server Telemetri</h3>
            <span className="admin-sub">SMK Pusat Keunggulan - SMK Muhammadiyah 8 Medan</span>
          </div>
        </div>

        <div className="admin-modal-body">
          <div className="telemetry-stats-grid">
            <div className="telemetry-stat-card">
              <div className="t-icon-wrap bg-blue">
                <Users size={18} />
              </div>
              <div className="t-meta">
                <span className="t-val">842</span>
                <span className="t-lbl">Siswa Aktif</span>
              </div>
            </div>

            <div className="telemetry-stat-card">
              <div className="t-icon-wrap bg-green">
                <Server size={18} />
              </div>
              <div className="t-meta">
                <span className="t-val">100%</span>
                <span className="t-lbl">Server Uptime</span>
              </div>
            </div>

            <div className="telemetry-stat-card">
              <div className="t-icon-wrap bg-orange">
                <Activity size={18} />
              </div>
              <div className="t-meta">
                <span className="t-val">128</span>
                <span className="t-lbl">Pendaftar PPDB Baru</span>
              </div>
            </div>

            <div className="telemetry-stat-card">
              <div className="t-icon-wrap bg-purple">
                <Database size={18} />
              </div>
              <div className="t-meta">
                <span className="t-val">3 Node</span>
                <span className="t-lbl">Cluster MikroTik / Cisco</span>
              </div>
            </div>
          </div>

          <div className="admin-server-list">
            <h4 className="admin-sec-title">Status Layanan Digital Sekolah</h4>
            <div className="server-item">
              <div className="s-name-col">
                <span className="status-dot"></span>
                <strong>Server Web Utama (Docker Pod #1)</strong>
              </div>
              <span className="s-status text-green">Optimal (0.4ms)</span>
            </div>

            <div className="server-item">
              <div className="s-name-col">
                <span className="status-dot"></span>
                <strong>Sistem Database & Cloud Backup</strong>
              </div>
              <span className="s-status text-green">Online & Sinkron</span>
            </div>

            <div className="server-item">
              <div className="s-name-col">
                <span className="status-dot"></span>
                <strong>Database PostgreSQL 16 Cluster</strong>
              </div>
              <span className="s-status text-green">Connected (Replicated)</span>
            </div>

            <div className="server-item">
              <div className="s-name-col">
                <span className="status-dot"></span>
                <strong>Gateway PPDB & E-Payment Bank Syariah</strong>
              </div>
              <span className="s-status text-green">Active (Sync Realtime)</span>
            </div>
          </div>

          <div className="admin-notice-box">
            <ShieldCheck size={18} className="text-orange flex-shrink-0" />
            <p className="admin-notice-text">
              Portal administrasi ini diproteksi oleh Autentikasi Dua Faktor (2FA) internal sekolah. 
              Pendidik dapat menggunakan kredensial NUPTK resmi untuk login ke ruang guru.
            </p>
          </div>

          <div className="admin-footer-btn">
            <button 
              onClick={() => {
                alert('Mengarahkan ke Halaman Single Sign-On (SSO) Guru & Staf SMK Mapan...');
              }}
              className="btn btn-primary btn-block"
            >
              <span>Login SSO Guru & Staff (NUPTK / NIP)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
