import React, { useState, useEffect } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { SCHOOL_INFO } from '../data/schoolData';
import { ASSETS } from '../data/assets';
import { useContent } from '../context/ContentContext';
import './Hero.css';

export default function Hero({ onScrollToCurriculum }) {
  const { schoolInfo = SCHOOL_INFO } = useContent();

  // Carousel background slides with authentic school campus photos
  const slides = [
    {
      id: 'gedung-utama',
      image: ASSETS.facilities.gedungUtama
    },
    {
      id: 'gedung-kelas',
      image: ASSETS.facilities.gedungKelas
    },
    {
      id: 'foto-sekolah',
      image: ASSETS.facilities.fotoSekolah
    },
    {
      id: 'lab-dkv',
      image: ASSETS.facilities.labDkv
    }
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-slide effect for photo backdrop
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section id="beranda" className="hero-section">
      {/* Authentic Dynamic Full-Bleed Photo Background (Gedung Sekolah & Lab) */}
      <div className="hero-photo-backdrop" aria-hidden="true">
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`hero-bg-photo-slide ${idx === currentSlideIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
        {/* Cinematic dark frosted glass overlay for pristine contrast and high prestige */}
        <div className="hero-photo-gradient-overlay" />
      </div>

      {/* Decorative Background Mesh */}
      <div className="hero-bg-glow"></div>
      <div className="hero-grid-pattern"></div>

      <div className="hero-container">
        {/* Content Column */}
        <div className="hero-content">
          {/* Institutional Badge */}
          <div className="hero-badge">
            <span className="hero-badge-icon">
              <Sparkles size={14} />
            </span>
            <span>SMK Pusat Keunggulan</span>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            Selamat Datang di <br />
            <span className="hero-title-highlight">{schoolInfo.predicate || 'SMK Pusat Keunggulan'}</span> <br />
            {schoolInfo.name || 'SMK Muhammadiyah 08 Medan'}
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="hero-subtitle">
            SMK MUHAMMADIYAH 8 MEDAN, terletak di kota Medan, Sumatera Utara, adalah lembaga pendidikan kejuruan unggulan. Sekolah ini menawarkan beragam program keahlian untuk menciptakan generasi muda yang terampil, siap bersaing di dunia kerja, dan berkarakter baik. Dengan fasilitas yang memadai, guru berkualitas, dan komitmen terhadap pendidikan bermutu, SMK Muhammadiyah 8 Medan menjadi pilihan utama di Medan.
          </p>

          {/* Primary CTA */}
          <div className="hero-cta-group">
            <button
              onClick={() => onScrollToCurriculum && onScrollToCurriculum('tkj')}
              className="btn btn-primary btn-lg"
              id="hero-cta-tuition"
            >
              <FileText size={20} />
              <span>Jurusan</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
