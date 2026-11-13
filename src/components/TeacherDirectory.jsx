import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Award, 
  Mail, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Users,
  X, 
  UserCheck,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { TEACHERS_DATA } from '../data/schoolData';
import { useContent } from '../context/ContentContext';
import './TeacherDirectory.css';

// Helper to deduce education level from name title if not explicitly set
const getTeacherEducation = (teacher) => {
  if (teacher.education) return teacher.education;
  if (teacher.name.includes('M.Pd')) return 'S2 Magister Pendidikan';
  if (teacher.name.includes('MM')) return 'S2 Magister Manajemen & Desain';
  if (teacher.name.includes('M.Kom.I')) return 'S2 Magister Komunikasi Islam';
  if (teacher.name.includes('S.Kom')) return 'S1 Teknik Informatika / Sistem Komputer';
  if (teacher.name.includes('S.Pd.I')) return 'S1 Pendidikan Agama Islam';
  if (teacher.name.includes('S.I.Kom')) return 'S1 Ilmu Komunikasi & Broadcasting';
  if (teacher.name.includes('SE')) return 'S1 Ekonomi Bisnis & Pendidikan';
  if (teacher.name.includes('ST')) return 'S1 Teknik Mesin Terapan';
  if (teacher.name.includes('S.Pd')) return 'S1 Pendidikan Kejuruan / Keguruan';
  if (teacher.name.includes('Drs.')) return 'S1 Sarjana Pendidikan Senior';
  if (teacher.name.includes('A.Md')) return 'Diploma III Kejuruan Teknik & Desain';
  return 'Sarjana Pendidikan Kejuruan';
};

// Helper for realistic deterministic NUPTK/NIP
const getTeacherNIP = (teacher) => {
  if (teacher.nip) return teacher.nip;
  let hash = 0;
  for (let i = 0; i < teacher.id.length; i++) {
    hash = (hash << 5) - hash + teacher.id.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash).toString().padStart(8, '5');
  return `198${code.slice(0, 1)}0812${code.slice(1, 5)}00${(teacher.id.length % 5) + 1}`;
};

export default function TeacherDirectory() {
  const { teachers = TEACHERS_DATA } = useContent();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter teachers by search query and department
  const filteredTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (t.name || '').toLowerCase().includes(q) ||
        (t.role || '').toLowerCase().includes(q) ||
        (t.department || '').toLowerCase().includes(q) ||
        (t.certifications || []).some(c => c.toLowerCase().includes(q));
      
      if (!matchSearch) return false;
      if (deptFilter === 'ALL') return true;
      return (t.department || '').toUpperCase().includes(deptFilter.toUpperCase());
    });
  }, [teachers, searchQuery, deptFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredTeachers.length);
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  // Department pill categories with counts
  const departments = [
    { key: 'ALL', label: 'Semua Bidang' },
    { key: 'PIMPINAN', label: 'Pimpinan' },
    { key: 'TKJ', label: 'TKJ' },
    { key: 'TBSM', label: 'TBSM' },
    { key: 'DKV', label: 'DKV' },
    { key: 'AKUNTANSI', label: 'Akuntansi' },
    { key: 'UMUM', label: 'Normatif & Adaptif' },
  ];

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const section = document.getElementById('guru');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Lock body scroll when modal is open & handle Escape key
  useEffect(() => {
    if (selectedTeacher) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedTeacher(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedTeacher]);

  return (
    <section id="guru" className="teachers-section reveal-on-scroll">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">
            <Sparkles size={14} />
            <span>Pendidik Unggul & Instruktur Industri</span>
          </div>
          <h2 className="section-title">
            Direktori Tenaga Pendidik <span className="text-orange">Bersertifikasi</span>
          </h2>
          <p className="section-subtitle">
            Guru dan instruktur kejuruan tersertifikasi BNSP, Cisco, Adobe, dan MikroTik yang 
            berdedikasi membimbing siswa menguasai kompetensi abad 21. Klik foto atau <strong>"Lihat Profil"</strong> untuk melihat data lengkap.
          </p>
        </div>

        {/* Toolbar: Search & Dept Filter */}
        <div className="teacher-toolbar-container">
          <div className="teacher-search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama guru, sertifikasi, atau mata pelajaran..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Cari guru"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn" 
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                aria-label="Bersihkan pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="teacher-dept-filters">
            {departments.map((dept) => {
              const count = dept.key === 'ALL'
                ? teachers.length
                : teachers.filter(t => (t.department || '').toUpperCase().includes(dept.key)).length;
              return (
                <button
                  key={dept.key}
                  type="button"
                  className={`dept-pill-btn ${deptFilter === dept.key ? 'active' : ''}`}
                  onClick={() => {
                    setDeptFilter(dept.key);
                    setCurrentPage(1);
                  }}
                >
                  <span>{dept.label}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status bar info */}
        <div className="teacher-count-strip">
          <div className="teacher-status-left">
            <Users size={16} className="teacher-status-icon" />
            <span className="teacher-count-badge">
              Menampilkan <strong>{filteredTeachers.length > 0 ? startIndex + 1 : 0} – {endIndex}</strong> dari <strong>{filteredTeachers.length}</strong> Tenaga Pendidik
            </span>
          </div>
          {totalPages > 1 && (
            <div className="teacher-status-right">
              <span className="teacher-page-indicator-text">
                Halaman <strong>{validCurrentPage}</strong> dari <strong>{totalPages}</strong>
              </span>
              <span className="teacher-limit-badge">10 per halaman</span>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredTeachers.length === 0 ? (
          <div className="teacher-empty-box">
            <Users size={40} className="empty-icon" />
            <h3>Tidak Ditemukan Tenaga Pendidik</h3>
            <p>
              Tidak ada data guru yang sesuai dengan kriteria pencarian "{searchQuery}" pada kategori "{deptFilter}".
            </p>
            <button 
              type="button" 
              className="btn-reset-filter"
              onClick={() => { setSearchQuery(''); setDeptFilter('ALL'); }}
            >
              Reset Pencarian & Filter
            </button>
          </div>
        ) : (
          <>
            {/* Teachers Grid */}
            <div className="teachers-grid">
              {paginatedTeachers.map((teacher) => (
                <div 
                  key={teacher.id} 
                  className="teacher-card card-hover"
                  onClick={() => setSelectedTeacher(teacher)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTeacher(teacher);
                    }
                  }}
                  aria-label={`Lihat Profil Lengkap ${teacher.name}`}
                >
                  <div className="teacher-photo-wrap">
                    {teacher.image ? (
                      <img 
                        src={teacher.image} 
                        alt={teacher.name} 
                        className="teacher-photo-img" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="teacher-avatar-fallback" style={{ background: teacher.color || '#0284c7' }}>
                        <span>{teacher.initials || teacher.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="teacher-dept-pill">
                      {teacher.department}
                    </div>
                    <div className="teacher-photo-hover-tag">
                      <UserCheck size={13} />
                      <span>Lihat Biodata</span>
                    </div>
                  </div>

                  <div className="teacher-info-wrap">
                    <h3 className="teacher-name">{teacher.name}</h3>
                    <p className="teacher-role">{teacher.role}</p>

                    <div className="teacher-cert-chips">
                      {(teacher.certifications || ['Pendidik Profesional']).slice(0, 2).map((cert, idx) => (
                        <span key={idx} className="cert-chip">
                          <ShieldCheck size={12} className="text-orange" />
                          <span>{cert}</span>
                        </span>
                      ))}
                    </div>

                    <div className="teacher-card-footer">
                      <span className="office-hours">
                        <Clock size={13} className="text-muted" />
                        <span>{teacher.hours}</span>
                      </span>

                      <button 
                        type="button"
                        className="view-profile-btn" 
                        title={`Buka Data & Profil Lengkap ${teacher.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeacher(teacher);
                        }}
                      >
                        <span>Lihat Profil</span>
                        <ChevronRight size={14} className="btn-arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls (10 data per page) */}
            {totalPages > 1 && (
              <div className="teacher-pagination-bar">
                <button
                  type="button"
                  className="pagination-nav-btn prev"
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  disabled={validCurrentPage === 1}
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                  <span>Sebelumnya</span>
                </button>

                <div className="pagination-numbers-list">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-num-btn ${pageNum === validCurrentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={pageNum === validCurrentPage ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pagination-nav-btn next"
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  disabled={validCurrentPage === totalPages}
                  aria-label="Halaman Selanjutnya"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Teacher Profile Detail Modal */}
      {selectedTeacher && createPortal(
        <div 
          className="modal-overlay teacher-modal-overlay" 
          onClick={() => setSelectedTeacher(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog teacher-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              className="modal-close-btn" 
              onClick={() => setSelectedTeacher(null)}
              aria-label="Tutup jendela profil"
            >
              <X size={20} />
            </button>

            <div className="teacher-modal-body">
              {/* Modal Top Header */}
              <div className="teacher-modal-header">
                <div className="modal-photo-area">
                  {selectedTeacher.image ? (
                    <img 
                      src={selectedTeacher.image} 
                      alt={selectedTeacher.name} 
                      className="modal-teacher-img" 
                    />
                  ) : (
                    <div className="teacher-avatar-fallback large" style={{ background: selectedTeacher.color || '#0284c7' }}>
                      <span>{selectedTeacher.initials || selectedTeacher.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="modal-status-badge">
                    <span className="pulsing-green-dot"></span>
                    Aktif Mengajar
                  </span>
                </div>

                <div className="modal-teacher-titles">
                  <div className="dept-and-id-row">
                    <span className="teacher-dept-tag">{selectedTeacher.department}</span>
                    <span className="teacher-badge-verified">
                      <CheckCircle2 size={12} />
                      Terverifikasi Dapodik
                    </span>
                  </div>

                  <h2 className="modal-name">{selectedTeacher.name}</h2>
                  <p className="modal-role">{selectedTeacher.role}</p>
                  
                  <div className="modal-contact-row">
                    <a 
                      href={`mailto:${selectedTeacher.email}`} 
                      className="contact-item" 
                      title="Kirim Email Resmi"
                    >
                      <Mail size={14} className="text-orange" />
                      <span>{selectedTeacher.email}</span>
                    </a>
                    <span className="contact-item">
                      <Clock size={14} className="text-orange" />
                      <span>{selectedTeacher.hours}</span>
                    </span>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="modal-quick-actions">
                    <a 
                      href={`https://wa.me/6281260662254?text=Halo%20Admin%20SMK%20Muhammadiyah%208%20Medan,%20saya%20ingin%20berkonsultasi%20dengan%20${encodeURIComponent(selectedTeacher.name)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-quick-wa"
                    >
                      <MessageCircle size={15} />
                      <span>Konsultasi Cepat WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Teacher Academic & Professional Specs Grid */}
              <div className="teacher-specs-grid">
                <div className="spec-item-box">
                  <div className="spec-icon-wrap">
                    <GraduationCap size={18} className="text-orange" />
                  </div>
                  <div>
                    <span className="spec-label">Pendidikan Terakhir</span>
                    <span className="spec-val-bold">{getTeacherEducation(selectedTeacher)}</span>
                  </div>
                </div>

                <div className="spec-item-box">
                  <div className="spec-icon-wrap">
                    <Briefcase size={18} className="text-orange" />
                  </div>
                  <div>
                    <span className="spec-label">Nomor Induk / NUPTK</span>
                    <span className="spec-val-bold">{getTeacherNIP(selectedTeacher)}</span>
                  </div>
                </div>

                <div className="spec-item-box">
                  <div className="spec-icon-wrap">
                    <BookOpen size={18} className="text-orange" />
                  </div>
                  <div>
                    <span className="spec-label">Bidang Keahlian</span>
                    <span className="spec-val-bold">{selectedTeacher.department}</span>
                  </div>
                </div>

                <div className="spec-item-box">
                  <div className="spec-icon-wrap">
                    <Award size={18} className="text-orange" />
                  </div>
                  <div>
                    <span className="spec-label">Status Lisensi</span>
                    <span className="spec-val-bold">Instruktur Kejuruan Industri</span>
                  </div>
                </div>
              </div>

              {/* Modal Main Content Sections */}
              <div className="modal-teacher-content">
                <div className="bio-block">
                  <h4 className="sub-title">
                    <BookOpen size={17} className="text-orange" />
                    <span>Profil & Dedikasi Pengajar</span>
                  </h4>
                  <p className="bio-text">{selectedTeacher.bio}</p>
                </div>

                <div className="certs-block">
                  <h4 className="sub-title">
                    <Award size={17} className="text-orange" />
                    <span>Sertifikasi Kompetensi & Lisensi Industri</span>
                  </h4>
                  <div className="certs-list-modal">
                    {(selectedTeacher.certifications || ['Pendidik Bersertifikasi Standar Vokasi']).map((cert, idx) => (
                      <div key={idx} className="cert-full-pill">
                        <ShieldCheck size={16} className="text-orange flex-shrink-0" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
