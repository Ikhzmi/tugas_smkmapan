import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Clock,
  Award,
  FileCheck2,
  Download,
  CheckCircle2,
  UploadCloud,
  UserCheck,
  Check,
} from 'lucide-react';
import { LMS_DAILY_SCHEDULE } from '../data/schoolData';
import './StudentLmsModal.css';

export default function StudentLmsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal', 'tugas', 'nilai', 'materi'
  const [attendanceChecked, setAttendanceChecked] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  if (!isOpen) return null;

  const studentProfile = {
    name: "Rian Pratama",
    nisn: "0068192341",
    major: "Teknik Komputer dan Jaringan (TKJ)",
    classGrade: "Kelas XII TKJ 1",
    attendanceRate: "98.5%",
    completedModules: "18 / 18",
    academicGpa: "94.2 (Predikat A)",
    advisor: "Rahmat Hidayat, S.Kom"
  };

  const tasksList = [
    {
      id: "t1",
      title: "Konfigurasi Dynamic Routing OSPF Multi-Area",
      subject: "Administrasi Infrastruktur Jaringan",
      dueDate: "Hari Ini, 23:59 WIB",
      status: "Selesai",
      grade: "96 / 100",
      teacher: "Rahmat Hidayat, S.Kom"
    },
    {
      id: "t2",
      title: "Desain Topologi VLAN & Subnetting CIDR /26",
      subject: "Teknologi Jaringan Berbasis Luas",
      dueDate: "Kemarin",
      status: "Selesai",
      grade: "92 / 100",
      teacher: "Rahmat Hidayat, S.Kom"
    },
    {
      id: "t3",
      title: "Technical Writing: IT Network Documentation",
      subject: "Bahasa Inggris Kejuruan",
      dueDate: "Besok, 12:00 WIB",
      status: "Berjalan",
      grade: "Menunggu Penilaian",
      teacher: "Agung Didik Sinugroho, S.Pd"
    }
  ];

  const libraryMaterials = [
    {
      id: "m1",
      title: "Modul Praktikum MikroTik MTCNA Resmi 2026",
      pages: "148 Halaman (PDF)",
      size: "8.4 MB",
      category: "TKJ / Networking"
    },
    {
      id: "m2",
      title: "Panduan Konfigurasi Cisco Packet Tracer v8.2",
      pages: "96 Halaman (PDF)",
      size: "12.1 MB",
      category: "TKJ / Simulation"
    },
    {
      id: "m3",
      title: "Vocational English for IT Infrastructure Engineers",
      pages: "64 Halaman (PDF)",
      size: "4.8 MB",
      category: "Bahasa Inggris Kejuruan"
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-wide lms-portal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Tutup Dashboard">
          <X size={20} />
        </button>

        {/* Dashboard Top Header Bar */}
        <div className="lms-header-bar">
          <div className="lms-header-left">
            <div className="student-avatar-box">
              <span>RP</span>
            </div>
            <div className="student-info-meta">
              <div className="student-name-row">
                <h3 className="student-name">{studentProfile.name}</h3>
                <span className="student-status-badge">Siswa Aktif</span>
              </div>
              <p className="student-sub">
                NISN: {studentProfile.nisn} &bull; {studentProfile.classGrade} &bull; {studentProfile.major}
              </p>
            </div>
          </div>

          <div className="lms-header-right">
            <div className="school-pill">
              <span className="status-dot"></span>
              <span>LMS MAPAN 4.0 LIVE</span>
            </div>
          </div>
        </div>

        {/* Internal Dashboard Tabs */}
        <div className="lms-nav-tabs">
          <button 
            className={`lms-nav-tab ${activeTab === 'jadwal' ? 'active' : ''}`}
            onClick={() => setActiveTab('jadwal')}
          >
            <Clock size={16} />
            <span>Jadwal & Presensi</span>
          </button>

          <button 
            className={`lms-nav-tab ${activeTab === 'tugas' ? 'active' : ''}`}
            onClick={() => setActiveTab('tugas')}
          >
            <FileCheck2 size={16} />
            <span>Tugas & Pengumpulan</span>
          </button>

          <button 
            className={`lms-nav-tab ${activeTab === 'nilai' ? 'active' : ''}`}
            onClick={() => setActiveTab('nilai')}
          >
            <Award size={16} />
            <span>Transkrip Nilai</span>
          </button>

          <button 
            className={`lms-nav-tab ${activeTab === 'materi' ? 'active' : ''}`}
            onClick={() => setActiveTab('materi')}
          >
            <BookOpen size={16} />
            <span>E-Library & Modul</span>
          </button>
        </div>

        {/* Tab 1: Jadwal & Presensi */}
        {activeTab === 'jadwal' && (
          <div className="lms-tab-content">
            <div className="attendance-card">
              <div className="att-left">
                <span className="att-title">Presensi Kehadiran Praktikum Hari Ini</span>
                <p className="att-sub">Senin, Jam Pelajaran Ke-1 s/d Ke-3 (Lab Cisco & Cloud 201)</p>
              </div>
              <div className="att-right">
                {attendanceChecked ? (
                  <span className="btn-attendance-done">
                    <CheckCircle2 size={16} className="text-green" />
                    <span>Hadir Terverifikasi (07.45 WIB)</span>
                  </span>
                ) : (
                  <button 
                    onClick={() => setAttendanceChecked(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <UserCheck size={16} />
                    <span>Konfirmasi Presensi Mandiri</span>
                  </button>
                )}
              </div>
            </div>

            <div className="schedule-detail-list">
              <h4 className="detail-list-title">Agenda Pembelajaran Kelas Hari Ini</h4>
              <div className="timeline-items">
                {LMS_DAILY_SCHEDULE.map((sch, idx) => (
                  <div key={idx} className="timeline-card">
                    <div className="timeline-badge" style={{ background: sch.color }}>
                      {sch.major}
                    </div>
                    <div className="timeline-body">
                      <div className="sch-top">
                        <span className="sch-time">{sch.time}</span>
                        <span className="sch-status-pill">{sch.status}</span>
                      </div>
                      <h4 className="sch-subject">{sch.subject}</h4>
                      <p className="sch-teacher">Pengajar: {sch.teacher} &bull; {sch.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tugas & Pengumpulan */}
        {activeTab === 'tugas' && (
          <div className="lms-tab-content">
            <div className="tasks-grid">
              <div className="tasks-list-col">
                <h4 className="detail-list-title">Daftar Penugasan Kejuruan</h4>
                <div className="tasks-cards-stack">
                  {tasksList.map((t) => (
                    <div key={t.id} className="task-item-card">
                      <div className="task-item-header">
                        <span className="task-subject">{t.subject}</span>
                        <span className={`task-badge ${t.status === 'Selesai' ? 'badge-done' : 'badge-pending'}`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="task-item-title">{t.title}</h4>
                      <div className="task-item-footer">
                        <span className="task-due">Batas: {t.dueDate}</span>
                        <span className="task-grade">Nilai: <strong>{t.grade}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dropzone-col">
                <h4 className="detail-list-title">Unggah Lembar Kerja Praktikum</h4>
                <div className="upload-dropzone-box">
                  <UploadCloud size={42} className="text-orange" />
                  <p className="dropzone-text">Tarik & Lepas File Tugas Anda ke Sini</p>
                  <span className="dropzone-sub">Mendukung format .pkt (Packet Tracer), .pdf, .zip (Maks. 25 MB)</span>
                  
                  {uploadedFile ? (
                    <div className="file-ready-alert">
                      <Check size={16} className="text-green" />
                      <span>{uploadedFile} (Siap Dikirim)</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setUploadedFile('Laporan_Praktikum_OSPF_RianPratama_XII_TKJ.pkt')}
                      className="btn btn-outline btn-sm mt-3"
                    >
                      Pilih File Dari Komputer
                    </button>
                  )}

                  {uploadedFile && (
                    <button 
                      onClick={() => {
                        alert(`File ${uploadedFile} berhasil dikumpulkan ke portal instruktur Rahmat Hidayat, S.Kom!`);
                        setUploadedFile(null);
                      }}
                      className="btn btn-primary btn-sm mt-2"
                    >
                      Kirim Tugas Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Transkrip Nilai */}
        {activeTab === 'nilai' && (
          <div className="lms-tab-content">
            <div className="grades-summary-banner">
              <div className="summary-left">
                <span className="summary-label">Indeks Prestasi Kumulatif (IPK) Siswa</span>
                <span className="summary-score">{studentProfile.academicGpa}</span>
              </div>
              <div className="summary-right">
                <span className="badge-cert">Siap Uji Sertifikasi BNSP</span>
              </div>
            </div>

            <table className="grades-table">
              <thead>
                <tr>
                  <th>Mata Pelajaran / Kompetensi</th>
                  <th>Instruktur</th>
                  <th>Teori</th>
                  <th>Praktikum Lab</th>
                  <th>Nilai Akhir</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Administrasi Infrastruktur Jaringan</strong></td>
                  <td>Rahmat Hidayat, S.Kom</td>
                  <td>94</td>
                  <td>98</td>
                  <td><strong className="text-green">96.0</strong></td>
                  <td><span className="status-pill live">Sangat Kompeten</span></td>
                </tr>
                <tr>
                  <td><strong>Teknologi Jaringan Berbasis Luas (WAN)</strong></td>
                  <td>Rahmat Hidayat, S.Kom</td>
                  <td>90</td>
                  <td>94</td>
                  <td><strong className="text-green">92.0</strong></td>
                  <td><span className="status-pill live">Sangat Kompeten</span></td>
                </tr>
                <tr>
                  <td><strong>Bahasa Inggris Kejuruan Komputer</strong></td>
                  <td>Agung Didik Sinugroho, S.Pd</td>
                  <td>92</td>
                  <td>95</td>
                  <td><strong className="text-green">93.5</strong></td>
                  <td><span className="status-pill live">Sangat Kompeten</span></td>
                </tr>
                <tr>
                  <td><strong>Pendidikan Karakter & Kemuhammadiyahan</strong></td>
                  <td>Ustadz Drs. H. Ahmad Dahlan</td>
                  <td>95</td>
                  <td>96</td>
                  <td><strong className="text-green">95.5</strong></td>
                  <td><span className="status-pill live">Sangat Baik</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: E-Library & Modul */}
        {activeTab === 'materi' && (
          <div className="lms-tab-content">
            <div className="library-grid">
              {libraryMaterials.map((mat) => (
                <div key={mat.id} className="material-card">
                  <div className="mat-icon-wrap">
                    <BookOpen size={24} className="text-orange" />
                  </div>
                  <div className="mat-info">
                    <span className="mat-cat">{mat.category}</span>
                    <h4 className="mat-title">{mat.title}</h4>
                    <span className="mat-specs">{mat.pages} &bull; {mat.size}</span>
                  </div>
                  <button 
                    onClick={() => alert(`Mengunduh dokumen: ${mat.title}`)}
                    className="btn btn-outline btn-sm btn-download-mat"
                  >
                    <Download size={15} />
                    <span>Unduh PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
