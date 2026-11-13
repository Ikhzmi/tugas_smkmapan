import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Building2,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  LayoutGrid,
  FlaskConical,
  Dumbbell,
  Heart,
  X,
  ZoomIn
} from 'lucide-react';
import { ASSETS } from '../data/assets';
import { useContent } from '../context/ContentContext';
import './CampusFacilities.css';

const CATEGORIES = [
  { id: 'all', label: 'Semua Fasilitas', icon: LayoutGrid },
  { id: 'lab', label: 'Laboratorium', icon: FlaskConical },
  { id: 'campus', label: 'Gedung & Kelas', icon: Building2 },
  { id: 'sports', label: 'Olahraga', icon: Dumbbell },
  { id: 'worship', label: 'Ibadah & Karakter', icon: Heart },
];

export default function CampusFacilities() {
  const { facilities: dynamicFacilities } = useContent();
  const [activeTab, setActiveTab] = useState('all');
  const [zoomedFac, setZoomedFac] = useState(null);

  const defaultFacilities = [
    {
      id: 'f1',
      title: 'Laboratorium Multimedia & Desain Komunikasi Visual (DKV)',
      category: 'lab',
      image: ASSETS.facilities.labDkv,
      specs: 'Lab Komputer iMac & Core-i7, Drawing Tablet, Green Screen, Soundproof Studio',
      description: 'Ruang praktikum terintegrasi dengan jaringan komputer cepat dan perangkat grafis industri untuk render animasi 3D, editing video, dan motion graphics.',
      tags: ['Adobe CC', 'Blender 3D', 'iMac Retina', 'Green Screen'],
      badge: 'Lab DKV'
    },
    {
      id: 'f2',
      title: 'Gedung Sekolah Utama SMK Muhammadiyah 8 Medan',
      category: 'campus',
      image: ASSETS.facilities.gedungUtama,
      specs: 'Gedung Representatif, Smart Classroom, Ruang Administrasi Terpadu, WiFi Fiber',
      description: 'Lingkungan sekolah vokasi yang asri dan representatif dengan infrastruktur modern untuk kenyamanan dan keamanan proses belajar mengajar.',
      tags: ['Smart Classroom', 'WiFi Fiber', 'CCTV', 'AC Full'],
      badge: 'Gedung Utama'
    },
    {
      id: 'f3',
      title: 'Gedung Kelas Permanen & Ruang Teori Interaktif',
      category: 'campus',
      image: ASSETS.facilities.gedungKelas,
      specs: 'Ruang Kelas Nyaman, Proyektor Digital, Sirkulasi Udara Sehat, Audio Visual Terintegrasi',
      description: 'Fasilitas ruang belajar berstandar nasional yang mendukung metode active learning, diskusi kelompok, dan penguasaan teori kejuruan.',
      tags: ['Proyektor Digital', 'Active Learning', 'Standar Nasional'],
      badge: 'Ruang Kelas'
    },
    {
      id: 'f4',
      title: 'Lapangan Olahraga & Arena Basket Multifungsi',
      category: 'sports',
      image: ASSETS.facilities.lapBasket,
      specs: 'Lapangan Basket Cor Halus, Lapangan Futsal, Tiang Ring Standar, Area Apel Upacara',
      description: 'Sarana olahraga dan pembinaan fisik siswa untuk kegiatan ekstrakurikuler, apel kedisiplinan, latihan Tapak Suci, serta kejuaraan antarsekolah.',
      tags: ['Basket', 'Futsal', 'Tapak Suci', 'Upacara'],
      badge: 'Area Olahraga'
    },
    {
      id: 'f5',
      title: 'Masjid Sekolah & Pusat Pembinaan Karakter Islami',
      category: 'worship',
      image: ASSETS.facilities.mesjid,
      specs: 'Masjid Nyaman Berkarpet, Tempat Wudhu Bersih, Sound System Adzan, Ruang Kajian',
      description: 'Pusat ibadah sholat berjamaah harian, kajian Al-Islam, dan pembinaan karakter religius Kemuhammadiyahan bagi seluruh warga sekolah.',
      tags: ['Sholat Berjamaah', 'Kajian Islami', 'Kemuhammadiyahan'],
      badge: 'Masjid Sekolah'
    },
    {
      id: 'f6',
      title: 'Ruang Belajar Praktik & Kolaborasi Siswa',
      category: 'lab',
      image: ASSETS.facilities.belajar,
      specs: 'Meja Praktik Fleksibel, Jaringan LAN Terpasang, Modul Bahan Ajar Mandiri',
      description: 'Wadah kolaborasi antarsiswa dalam menuntaskan proyek kejuruan, praktikum akuntansi, simulasi perbankan syariah, dan perakitan sistem.',
      tags: ['Proyek Kejuruan', 'LAN Network', 'Kolaboratif'],
      badge: 'Lab Kolaborasi'
    },
    {
      id: 'f7',
      title: 'Kegiatan MPLS & Orientasi Siswa Baru',
      category: 'campus',
      image: ASSETS.facilities.mpls,
      specs: 'Ruang Serbaguna, Aula Sekolah, Sound System, Panggung Presentasi',
      description: 'Fasilitas pendukung kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS), seminar, dan kegiatan kelembagaan resmi sekolah.',
      tags: ['MPLS', 'Aula Serbaguna', 'Seminar', 'Presentasi'],
      badge: 'Aula Sekolah'
    },
    {
      id: 'f8',
      title: 'Foto Lingkungan & Sarana Sekolah',
      category: 'campus',
      image: ASSETS.facilities.fotoSekolah,
      specs: 'Lingkungan Asri, Taman Sekolah, Area Parkir, Kantin Bersih',
      description: 'Lingkungan belajar yang nyaman, asri, dan mendukung konsentrasi siswa dengan tata ruang yang terencana baik.',
      tags: ['Lingkungan Asri', 'Area Parkir', 'Kantin Bersih'],
      badge: 'Lingkungan'
    }
  ];

  const facilities = dynamicFacilities || defaultFacilities;

  const filtered = activeTab === 'all'
    ? facilities
    : facilities.filter(f => f.category === activeTab);

  return (
    <section id="fasilitas" className="facilities-section reveal-on-scroll">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">
            <Sparkles size={14} />
            <span>Infrastruktur Standar Industri</span>
          </div>
          <h2 className="section-title">
            Fasilitas Laboratorium & <span className="text-orange">Gedung Sekolah</span>
          </h2>
          <p className="section-subtitle">
            Ruang praktikum terintegrasi dan fasilitas sekolah yang dirancang menyerupai standar operasional industri (DUDI),
            menjadikan proses belajar mengajar relevan dengan tuntutan dunia kerja modern.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="facilities-filter-tabs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = cat.id === 'all'
              ? facilities.length
              : facilities.filter(f => f.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className={`fac-filter-tab ${activeTab === cat.id ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
                <span className="fac-filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Facilities Grid */}
        <div className="facilities-grid">
          {filtered.map((fac) => (
            <div
              key={fac.id}
              className="facility-card card-hover"
              onClick={() => setZoomedFac(fac)}
            >
              <div className="facility-img-wrap">
                <img src={fac.image} alt={fac.title} className="facility-img" loading="lazy" />
                <div className="facility-overlay" />
                <span className="fac-spec-badge">{fac.badge}</span>
                <button
                  className="fac-zoom-btn"
                  onClick={(e) => { e.stopPropagation(); setZoomedFac(fac); }}
                  aria-label="Lihat foto penuh"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              <div className="facility-info-box">
                <h3 className="facility-title">{fac.title}</h3>
                <p className="facility-desc">{fac.description}</p>

                {/* Tags */}
                <div className="facility-tags-row">
                  {fac.tags.map((tag, i) => (
                    <span key={i} className="fac-tag">
                      <CheckCircle2 size={10} className="text-orange" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="facility-spec-line">
                  <span className="spec-lbl">Perangkat:</span>
                  <span className="spec-val">{fac.specs}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="facilities-summary-strip">
          <div className="fac-sum-item">
            <ShieldCheck size={20} className="text-orange" />
            <div>
              <span className="fac-sum-val">8+</span>
              <span className="fac-sum-lbl">Fasilitas Lengkap</span>
            </div>
          </div>
          <div className="fac-sum-divider" />
          <div className="fac-sum-item">
            <Cpu size={20} className="text-orange" />
            <div>
              <span className="fac-sum-val">Cisco & Adobe</span>
              <span className="fac-sum-lbl">Certified Equipment</span>
            </div>
          </div>
          <div className="fac-sum-divider" />
          <div className="fac-sum-item">
            <Layers size={20} className="text-orange" />
            <div>
              <span className="fac-sum-val">Standar DUDI</span>
              <span className="fac-sum-lbl">Industri & Vokasi</span>
            </div>
          </div>
          <div className="fac-sum-divider" />
          <div className="fac-sum-item">
            <CheckCircle2 size={20} className="text-orange" />
            <div>
              <span className="fac-sum-val">1000+ Siswa</span>
              <span className="fac-sum-lbl">Terfasilitasi Setiap Hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Lightbox */}
      {zoomedFac && createPortal(
        <div className="fac-lightbox-overlay" onClick={() => setZoomedFac(null)}>
          <div className="fac-lightbox-dialog" onClick={(e) => e.stopPropagation()} style={{ margin: 'auto' }}>
            <button className="fac-lightbox-close" onClick={() => setZoomedFac(null)}>
              <X size={20} />
            </button>
            <div className="fac-lightbox-img-wrap">
              <img src={zoomedFac.image} alt={zoomedFac.title} className="fac-lightbox-img" />
            </div>
            <div className="fac-lightbox-info">
              <span className="fac-lightbox-badge">{zoomedFac.badge}</span>
              <h3 className="fac-lightbox-title">{zoomedFac.title}</h3>
              <p className="fac-lightbox-desc">{zoomedFac.description}</p>
              <div className="facility-tags-row" style={{ marginTop: '12px' }}>
                {zoomedFac.tags.map((tag, i) => (
                  <span key={i} className="fac-tag">
                    <CheckCircle2 size={10} className="text-orange" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
