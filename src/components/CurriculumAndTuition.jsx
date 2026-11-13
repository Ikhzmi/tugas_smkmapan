import { useState } from 'react';
import { 
  Network, 
  Sparkles 
} from 'lucide-react';
import { MAJORS_DATA } from '../data/schoolData';
import { useContent } from '../context/ContentContext';
import './CurriculumAndTuition.css';

export default function CurriculumAndTuition() {
  const { majors = MAJORS_DATA } = useContent();
  const [activeMajorId, setActiveMajorId] = useState('tkj');

  const activeMajor = majors.find((m) => m.id === activeMajorId) || majors[0] || MAJORS_DATA[0];

  return (
    <section id="jurusan" className="curriculum-section reveal-on-scroll">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">
            <Sparkles size={14} />
            <span>Pilihan Vokasi Unggulan</span>
          </div>
          <h2 className="section-title">
            Program <span className="text-orange">Keahlian</span>
          </h2>
          <p className="section-subtitle">
            Pilihan program keahlian vokasi unggulan berstandar industri dengan sarana pembelajaran berkualitas untuk mempersiapkan generasi terampil, kompeten, dan siap kerja.
          </p>
        </div>

        {/* Major Selector Navigation Pills */}
        <div className="major-tabs-wrapper">
          {majors.map((major) => {
            const isActive = major.id === activeMajorId;
            return (
              <button
                key={major.id}
                className={`major-nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveMajorId(major.id)}
                id={`pill-major-${major.id}`}
              >
                <div className="pill-icon-wrap" style={{ color: major.color }}>
                  {major.image ? (
                    <img src={major.image} alt={major.code} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  ) : (
                    <Network size={22} />
                  )}
                </div>
                <div className="pill-text-wrap">
                  <span className="pill-code">{major.code}</span>
                  <span className="pill-name">{major.name}</span>
                </div>
                {isActive && <div className="pill-highlight-bar" style={{ background: major.color }} />}
              </button>
            );
          })}
        </div>

        {/* Major Detailed Card Display */}
        <div className="major-display-card">
          <div className="major-display-grid">
            {/* Info */}
            <div className="major-left-details">
              <div className="major-hero-meta">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <span className="major-badge-type" style={{ color: activeMajor.color, background: activeMajor.colorSoft }}>
                      Program Keahlian {activeMajor.code}
                    </span>
                    <h3 className="major-main-name">{activeMajor.name}</h3>
                  </div>
                  {activeMajor.image && (
                    <img 
                      src={activeMajor.image} 
                      alt={activeMajor.name} 
                      style={{ width: '60px', height: '60px', objectFit: 'contain', flexShrink: 0 }} 
                    />
                  )}
                </div>
                <p className="major-tagline-text">{activeMajor.tagline}</p>
                <p className="major-full-desc">{activeMajor.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
