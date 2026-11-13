import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Play, 
  ExternalLink, 
  Heart, 
  Share2, 
  X,
  Camera,
  Calendar
} from 'lucide-react';
import { SHOWCASE_EPISODES } from '../data/schoolData';
import { ASSETS } from '../data/assets';
import videoAnimasi from '../assets/images/animasi.mp4';
import './StudentShowcase.css';

export default function StudentShowcase() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModalVideo, setActiveModalVideo] = useState(null);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
  const [likes, setLikes] = useState({ ep1: 142, ep2: 98, ep3: 76, ep4: 215 });
  const [likedMap, setLikedMap] = useState({});

  const handleLike = (id, e) => {
    e.stopPropagation();
    if (likedMap[id]) return;
    setLikes((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    setLikedMap((prev) => ({ ...prev, [id]: true }));
  };

  const filteredEpisodes = SHOWCASE_EPISODES.slice(0, 1).filter(
    () => activeFilter === 'all' || activeFilter === 'dkv'
  );

  return (
    <section id="showcase" className="showcase-section reveal-on-scroll">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">
            <Sparkles size={14} />
            <span>Karya Kreatif Siswa & Dokumentasi Sekolah</span>
          </div>
          <h2 className="section-title">
            Showcase <span className="text-orange">Karya Inovasi Vokasi</span>
          </h2>
          <p className="section-subtitle">
            Bukti nyata portofolio kreasi siswa: proyek animasi 3D, rancang bangun infrastruktur server, 
            dan simulasi pembukuan finansial yang siap dipamerkan di industri kreatif.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="showcase-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Semua Karya Siswa
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'dkv' ? 'active' : ''}`}
            onClick={() => setActiveFilter('dkv')}
          >
            DKV - Motion Graphic & 3D
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'tkj' ? 'active' : ''}`}
            onClick={() => setActiveFilter('tkj')}
          >
            TKJ - Server & Jaringan
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'akl' ? 'active' : ''}`}
            onClick={() => setActiveFilter('akl')}
          >
            AKL - Sistem Akuntansi
          </button>
        </div>

        {/* Showcase Grid Cards */}
        <div className="showcase-cards-grid">
          {filteredEpisodes.length > 0 ? (
            filteredEpisodes.map((item) => (
              <div 
                key={item.id} 
                className="showcase-card card-hover"
                onClick={() => setActiveModalVideo(item)}
              >
                <div className="showcase-thumb-wrap">
                  {item.id === 'ep1' ? (
                    <video
                      src={videoAnimasi}
                      className="showcase-thumb-img"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <img src={item.image} alt={item.title} className="showcase-thumb-img" loading="lazy" />
                  )}
                  <div className="showcase-thumb-overlay"></div>
                  <div className="showcase-play-badge">
                    <Play size={20} className="fill-white" />
                  </div>
                  <span className="showcase-ep-tag">{item.epNumber}</span>
                  <span className="showcase-duration-tag">{item.duration}</span>
                </div>

                <div className="showcase-content-wrap">
                  <div className="showcase-creator-row">
                    <span className="creator-badge">{item.creator}</span>
                    <button 
                      className={`like-btn ${likedMap[item.id] ? 'liked' : ''}`}
                      onClick={(e) => handleLike(item.id, e)}
                      title="Apresiasi Karya Siswa"
                    >
                      <Heart size={14} className={likedMap[item.id] ? 'fill-rose' : ''} />
                      <span>{likes[item.id]}</span>
                    </button>
                  </div>

                  <h3 className="showcase-item-title">{item.title}</h3>
                  <p className="showcase-item-desc">{item.description}</p>

                  <div className="showcase-footer-row">
                    <div className="software-pills">
                      {item.software.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="soft-pill">{s}</span>
                      ))}
                    </div>

                    <span className="watch-link">
                      <span>Tonton</span>
                      <ExternalLink size={13} />
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              padding: '48px 24px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--border-light)',
              maxWidth: '560px',
              margin: '0 auto',
              width: '100%'
            }}>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '14px', fontWeight: 600 }}>
                Showreel video karya konsentrasi ini sedang dalam proses kurasi & produksi.
              </p>
              <button 
                onClick={() => setActiveFilter('all')} 
                className="btn btn-primary btn-sm"
              >
                Lihat Karya Tersedia (Ep. 01)
              </button>
            </div>
          )}
        </div>

        {/* Authentic School Activity Photo Gallery */}
        <div className="school-gallery-subblock" style={{ marginTop: '72px' }}>
          <div className="section-header" style={{ marginBottom: '32px' }}>
            <div className="section-badge">
              <Camera size={14} />
              <span>Dokumentasi Kegiatan Siswa</span>
            </div>
            <h3 className="section-title" style={{ fontSize: '1.75rem' }}>
              Galeri Dokumentasi & <span className="text-orange">Aktivitas Sekolah</span>
            </h3>
            <p className="section-subtitle">
              Momen keseharian, upacara peringatan hari besar, pentas seni, serta praktikum vokasi SMK Muhammadiyah 8 Medan.
            </p>
          </div>

          <div className="gallery-masonry-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {ASSETS.gallery.map((item) => (
              <div 
                key={item.id} 
                className="gallery-item-card card-hover"
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1.5px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedGalleryImg(item)}
              >
                <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    className="gallery-img-elem"
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {item.category}
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '4px' }}>
                    {item.title}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} />
                    <span>SMK Muhammadiyah 8 Medan</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox for Gallery Photo */}
      {selectedGalleryImg && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedGalleryImg(null)}>
          <div className="modal-dialog modal-dialog-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', margin: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setSelectedGalleryImg(null)}>
              <X size={20} />
            </button>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <img 
                src={selectedGalleryImg.image} 
                alt={selectedGalleryImg.title} 
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} 
              />
              <h3 style={{ marginTop: '16px', fontSize: '1.25rem', color: 'var(--slate-900)' }}>{selectedGalleryImg.title}</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>{selectedGalleryImg.category} &bull; Dokumentasi Resmi SMK Muhammadiyah 8 Medan</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Video Modal Player */}
      {activeModalVideo && createPortal(
        <div className="modal-overlay" onClick={() => setActiveModalVideo(null)}>
          <div className="modal-dialog modal-dialog-wide" onClick={(e) => e.stopPropagation()} style={{ margin: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setActiveModalVideo(null)}>
              <X size={20} />
            </button>

            <div className="modal-video-wrapper">
              <div className="simulated-fullscreen-video" style={{ background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeModalVideo.id === 'ep1' ? (
                  <video 
                    src={videoAnimasi} 
                    controls 
                    autoPlay 
                    style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <img src={activeModalVideo.image} alt={activeModalVideo.title} />
                    <div className="video-screen-overlay"></div>
                    <div className="video-playback-indicator">
                      <Play size={48} className="text-orange" />
                      <p>Memutar Showreel Portofolio Siswa: {activeModalVideo.title}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-video-info">
                <div className="modal-meta-row">
                  <span className="ep-badge">{activeModalVideo.epNumber}</span>
                  <span className="modal-creator-tag">Kreator: {activeModalVideo.creator}</span>
                  <span className="modal-dur-tag">Durasi: {activeModalVideo.duration}</span>
                </div>

                <h2 className="modal-video-title">{activeModalVideo.title}</h2>
                <p className="modal-video-desc">{activeModalVideo.description}</p>

                <div className="modal-tools-used">
                  <strong>Software & Framework:</strong>
                  <div className="tools-list">
                    {activeModalVideo.software.map((tool, idx) => (
                      <span key={idx} className="tool-chip">{tool}</span>
                    ))}
                  </div>
                </div>

                <div className="modal-footer-actions">
                  <button 
                    onClick={() => {
                      alert(`Tautan karya ${activeModalVideo.title} berhasil disalin ke clipboard!`);
                    }} 
                    className="btn btn-outline btn-sm"
                  >
                    <Share2 size={16} />
                    <span>Bagikan Portofolio</span>
                  </button>
                  <button onClick={() => setActiveModalVideo(null)} className="btn btn-primary btn-sm">
                    <span>Tutup Player</span>
                  </button>
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
