import React, { useState } from 'react';
import {
  Building2,
  Target,
  Compass,
  Award,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Quote,
  HeartHandshake,
  Leaf,
  Cpu,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ASSETS } from '../data/assets';
import { useContent } from '../context/ContentContext';
import './SchoolProfile.css';

export default function SchoolProfile({ onOpenPpdb }) {
  const [activeTab, setActiveTab] = useState('sambutan');
  const { schoolInfo, profileExtras } = useContent();

  const principal = {
    name: schoolInfo.principal || 'Sulastri, S.Pd.I',
    role: `Kepala ${schoolInfo.shortName || schoolInfo.name || 'SMK Muhammadiyah 8 Medan'}`,
    image: schoolInfo.principalPhoto || ASSETS.teachers?.umiSulastri
  };

  const missions = [
    {
      num: '01',
      icon: HeartHandshake,
      title: 'Al-Islam & Kemuhammadiyahan',
      desc: 'Memberikan pembelajaran secara optimal dalam penanaman akidah, ibadah, dan akhlak karimah berlandaskan nilai Al-Qur\'an dan As-Sunnah.',
      color: 'blue'
    },
    {
      num: '02',
      icon: Cpu,
      title: 'Pembelajaran Berbasis Teknologi (IT)',
      desc: 'Menyelenggarakan ekosistem belajar digital, lab modern, simulasi jaringan, dan integrasi kecerdasan digital menuju era Industri 4.0.',
      color: 'cyan'
    },
    {
      num: '03',
      icon: Briefcase,
      title: 'Pelatihan & Magang Industri (DUDI)',
      desc: 'Meningkatkan kompetensi guru dan siswa melalui sertifikasi industri berstandar BNSP, sinkronisasi kurikulum, dan teaching factory nyata.',
      color: 'orange'
    },
    {
      num: '04',
      icon: GraduationCap,
      title: 'Profil Pelajar Pancasila & Wirausaha',
      desc: 'Mencetak lulusan yang sigap, tanggap, berjiwa entrepreneurship, mandiri, dan berdaya saing tinggi di pasar kerja global.',
      color: 'purple'
    },
    {
      num: '05',
      icon: Leaf,
      title: 'Eco & Green School yang Asri',
      desc: 'Mewujudkan lingkungan sekolah vokasi yang hijau, nyaman, ramah anak, dan kondusif untuk eksplorasi kreativitas.',
      color: 'green'
    }
  ];

  const mapanValues = [
    { letter: 'M', word: 'MANDIRI', desc: 'Mampu berdikari, menyelesaikan tantangan industri, dan berani memulai usaha mandiri.' },
    { letter: 'A', word: 'AMANAH', desc: 'Berakhlak mulia, berintegritas tinggi, dan memegang teguh kejujuran di dunia kerja.' },
    { letter: 'P', word: 'PRESTASI', desc: 'Berorientasi pada pencapaian terbaik di bidang akademik, sains, seni, dan teknologi.' },
    { letter: 'A', word: 'ADAPTIF', desc: 'Cepat menyesuaikan diri dengan disrupsi digital, AI, dan standar industri modern.' },
    { letter: 'N', word: 'NYATA', desc: 'Menghasilkan portofolio dan produk karya nyata yang dirasakan manfaatnya oleh masyarakat.' },
  ];

  const schoolDetails = [
    { label: 'Nama Resmi', val: schoolInfo.name || 'SMK Muhammadiyah 8 Medan (MAPAN)' },
    { label: 'NPSN / NSS', val: schoolInfo.npsn || '3344076007096' },
    { label: 'Nomor Data Sekolah (NDS)', val: 'G.17094208' },
    { label: 'SK Pendirian / SIOP', val: '421.5 / 203' },
    { label: 'Jenjang Akreditasi', val: schoolInfo.accreditation || 'Akreditasi A (Amat Baik)', highlight: true },
    { label: 'Status Sekolah', val: schoolInfo.predicate || 'SMK Pusat Keunggulan (SMK PK)', highlight: true },
    { label: 'Kurikulum Operasional', val: 'Kurikulum Merdeka Terintegrasi DUDI' },
    { label: 'Kepemilikan Gedung', val: 'Milik Sendiri (Gedung Permanen 3 Lantai)' },
    { label: 'Alamat Sekolah', val: schoolInfo.address || 'Jl. Abdul Hakim No. 2, Tj. Sari, Medan Selayang' },
    { label: 'Kota / Provinsi', val: 'Kota Medan, Sumatera Utara - 20132' }
  ];

  return (
    <section id="profil" className="school-profile-section reveal-on-scroll">
      <div className="container">

        {/* Section Header */}
        <div className="section-head text-center">
          <div className="badge-pill mb-3">
            <Building2 size={15} />
            <span>Profil Resmi Lembaga</span>
          </div>
          <h2 className="section-title">
            Mengenal Lebih Dekat <span className="text-gradient">SMK Muhammadiyah 8 Medan</span>
          </h2>
          <p className="section-subtitle">
            Lembaga pendidikan kejuruan berprestasi dengan Akreditasi "A", mencetak generasi muda berakhlak mulia,
            terampil berteknologi, dan siap kerja maupun wirausaha.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-wrapper">
          <div className="profile-tabs" role="tablist">
            <button
              className={`profile-tab-btn ${activeTab === 'sambutan' ? 'active' : ''}`}
              onClick={() => setActiveTab('sambutan')}
              role="tab"
              aria-selected={activeTab === 'sambutan'}
            >
              <Quote size={18} />
              <span>Sambutan Kepala Sekolah</span>
            </button>

            <button
              className={`profile-tab-btn ${activeTab === 'visimisi' ? 'active' : ''}`}
              onClick={() => setActiveTab('visimisi')}
              role="tab"
              aria-selected={activeTab === 'visimisi'}
            >
              <Target size={18} />
              <span>Visi, Misi & Tujuan</span>
            </button>

            <button
              className={`profile-tab-btn ${activeTab === 'mapan' ? 'active' : ''}`}
              onClick={() => setActiveTab('mapan')}
              role="tab"
              aria-selected={activeTab === 'mapan'}
            >
              <Sparkles size={18} />
              <span>Nilai Karakter MAPAN</span>
            </button>

            <button
              className={`profile-tab-btn ${activeTab === 'identitas' ? 'active' : ''}`}
              onClick={() => setActiveTab('identitas')}
              role="tab"
              aria-selected={activeTab === 'identitas'}
            >
              <ShieldCheck size={18} />
              <span>Identitas & Legalitas</span>
            </button>
          </div>
        </div>

        {/* Tab Content 1: Sambutan Kepala Sekolah */}
        {activeTab === 'sambutan' && (
          <div className="profile-tab-content active-panel animate-fade-in">
            <div className="principal-grid">

              {/* Photo & Card Side */}
              <div className="principal-card-col">
                <div className="principal-photo-card">
                  <div className="photo-backdrop"></div>
                  <img
                    src={principal.image}
                    alt={principal.name}
                    className="principal-portrait-img"
                  />
                  <div className="principal-floating-badge">
                    <Award size={18} className="badge-icon" />
                    <div>
                      <strong>Kepala Sekolah</strong>
                      <span>SMK Muhammadiyah 8 Medan</span>
                    </div>
                  </div>
                </div>

                <div className="principal-meta-card">
                  <h3 className="principal-meta-name">{principal.name}</h3>
                  <p className="principal-meta-role">NIP / Pendidik Profesional Vokasi</p>
                  <div className="principal-tags">
                    <span className="p-tag"><CheckCircle2 size={13} /> SMK Pusat Keunggulan</span>
                    <span className="p-tag"><CheckCircle2 size={13} /> Transformasi Digital</span>
                  </div>
                </div>
              </div>

              {/* Message Side */}
              <div className="principal-message-col">
                <div className="quote-mark-bubble">
                  <Quote size={28} />
                </div>
                <div className="message-header">
                  <span className="welcome-tag">KATA SAMBUTAN RESMI</span>
                  <h3 className="welcome-headline">
                    "Selamat Datang di SMK Muhammadiyah 08 Medan: Sekolah Pencetak Generasi Unggul & Berakhlak Mulia"
                  </h3>
                </div>

                <div className="message-paragraphs">
                  {profileExtras?.principalSpeech ? (
                    profileExtras.principalSpeech.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))
                  ) : (
                    <>
                      <p>
                        Sebagai Kepala Sekolah, saya dengan penuh rasa bangga menyambut seluruh calon peserta didik,
                        orang tua, dan mitra industri ke ekosistem pendidikan <strong>{schoolInfo.name}</strong>.
                      </p>
                      <p>
                        Di SMK Muhammadiyah 8 Medan, <strong>siswa adalah pusat dari segala inovasi pembelajaran</strong>.
                      </p>
                    </>
                  )}
                </div>

                <div className="principal-footer-action">
                  <button
                    onClick={onOpenPpdb}
                    className="btn btn-primary"
                  >
                    <span>Daftar PPDB Online Sekarang</span>
                    <ChevronRight size={16} />
                  </button>

                  <a href="#jurusan" className="btn btn-outline">
                    <span>Lihat 4 Program Keahlian</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab Content 2: Visi & Misi */}
        {activeTab === 'visimisi' && (
          <div className="profile-tab-content active-panel animate-fade-in">
            {/* Vision Banner */}
            <div className="vision-banner-card">
              <div className="vision-icon-wrap">
                <Compass size={32} />
              </div>
              <div className="vision-body">
                <span className="vision-badge">VISI SEKOLAH</span>
                <blockquote className="vision-statement">
                  "{profileExtras?.visi || 'Mewujudkan Pendidikan Vokasi yang Bermutu, Menghasilkan Sumber Daya Manusia yang Berakhlak Mulia, Memiliki Karakter Wirausaha, Sesuai dengan IMTAQ & IPTEK Menuju Daya Saing Global.'}"
                </blockquote>
              </div>
            </div>

            {/* Missions Grid */}
            <div className="missions-section-wrap mt-5">
              <div className="text-center mb-4">
                <span className="badge-pill">Langkah Strategis</span>
                <h3 className="subsection-title">5 Pilar Misi SMK Muhammadiyah 8 Medan</h3>
              </div>

              <div className="missions-grid">
                {missions.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.num} className={`mission-card color-${m.color}`}>
                      <div className="mission-top">
                        <span className="mission-num">{m.num}</span>
                        <div className="mission-icon">
                          <Icon size={22} />
                        </div>
                      </div>
                      <h4 className="mission-title">{m.title}</h4>
                      <p className="mission-desc">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Purpose Highlight */}
            <div className="purpose-highlight-box mt-5">
              <div className="purpose-content">
                <GraduationCap size={30} className="purpose-icon" />
                <div>
                  <h4>Tujuan Institusional Kami</h4>
                  <p>
                    Menjembatani kesenjangan antara teori akademis dan kebutuhan riil industri modern,
                    membentuk lulusan yang tidak hanya pencari kerja (job seeker), melainkan juga
                    pencipta lapangan kerja (job creator) yang tangguh dan berintegritas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Nilai MAPAN */}
        {activeTab === 'mapan' && (
          <div className="profile-tab-content active-panel animate-fade-in">
            <div className="mapan-intro text-center mb-5">
              <span className="badge-pill">Filosofi Karakter</span>
              <h3 className="subsection-title">Nilai Utama Budaya Sekolah "MAPAN"</h3>
              <p className="mapan-subtitle">
                Setiap peserta didik SMK Muhammadiyah 8 Medan dibina dengan lima prinsip inti yang menjadi
                kompas moral dan profesionalisme mereka.
              </p>
            </div>

            <div className="mapan-grid">
              {mapanValues.map((val, idx) => (
                <div key={idx} className="mapan-card">
                  <div className="mapan-letter-circle">{val.letter}</div>
                  <h4 className="mapan-word">{val.word}</h4>
                  <p className="mapan-desc">{val.desc}</p>
                  <div className="mapan-card-accent"></div>
                </div>
              ))}
            </div>

            <div className="mapan-motto-strip mt-5">
              <Sparkles size={24} className="text-orange" />
              <p>
                <strong>Motto:</strong> "SMK Bisa, SMK Hebat, Muhammadiyah Berkemajuan — MAPAN untuk Indonesia!"
              </p>
            </div>
          </div>
        )}

        {/* Tab Content 4: Identitas & Legalitas */}
        {activeTab === 'identitas' && (
          <div className="profile-tab-content active-panel animate-fade-in">
            <div className="identity-grid">

              {/* Data Table Side */}
              <div className="identity-table-col">
                <div className="identity-card-head">
                  <ShieldCheck size={24} className="text-blue" />
                  <div>
                    <h3>Data Legalitas & Statistik Resmi</h3>
                    <p>Terdaftar resmi di Kemendikbudristek dan Majelis Dikdasmen Muhammadiyah</p>
                  </div>
                </div>

                <div className="school-specs-list">
                  {schoolDetails.map((item, idx) => (
                    <div key={idx} className={`spec-row ${item.highlight ? 'highlight-spec' : ''}`}>
                      <span className="spec-label">{item.label}</span>
                      <span className="spec-val">
                        {item.val}
                        {item.highlight && <span className="verified-badge"><CheckCircle2 size={13} /> Terakreditasi</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campus Highlights Side */}
              <div className="identity-highlights-col">
                <div className="campus-img-card">
                  <img
                    src={ASSETS.facilities?.gedungUtama || ASSETS.facilities?.gedungKelas}
                    alt="Gedung SMK Muhammadiyah 8 Medan"
                    className="campus-preview-img"
                  />
                  <div className="campus-img-caption">
                    <strong>Sekolah Vokasi Unggulan</strong>
                    <span>Jl. Abdul Hakim No. 2, Tanjung Sari - Medan Selayang</span>
                  </div>
                </div>

                <div className="quick-stats-trio mt-4">
                  <div className="stat-trio-box">
                    <span className="trio-num">A</span>
                    <span className="trio-label">Akreditasi BAN-SM</span>
                  </div>
                  <div className="stat-trio-box">
                    <span className="trio-num">4</span>
                    <span className="trio-label">Kompetensi Keahlian</span>
                  </div>
                  <div className="stat-trio-box">
                    <span className="trio-num">100%</span>
                    <span className="trio-label">Siap Kerja & Kuliah</span>
                  </div>
                </div>

                <div className="identity-cta-box mt-4">
                  <p>Ingin berkunjung atau konsultasi langsung dengan tim humas sekolah?</p>
                  <a
                    href="https://wa.me/6281370806663"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-block"
                  >
                    <span>Hubungi Humas via WhatsApp (0813-7080-6663)</span>
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
