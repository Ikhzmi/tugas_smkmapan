import React from 'react';
import { Music, Shield, Trophy, Zap } from 'lucide-react';
import './Extracurricular.css';

const ESKUL_DATA = [
  {
    id: 'band',
    name: 'Band Sekolah',
    category: 'Seni & Musik',
    icon: Music,
    color: '#f59e0b',
    colorSoft: '#fffbeb',
    borderColor: '#fde68a',
  },
  {
    id: 'tapak-suci',
    name: 'Tapak Suci Muhammadiyah',
    category: 'Olahraga & Bela Diri',
    icon: Shield,
    color: '#e55a00',
    colorSoft: '#fff7ed',
    borderColor: '#fed7aa',
  },
  {
    id: 'paskibra',
    name: 'PASKIBRA Satuan Mapan',
    category: 'Kedisiplinan & Kepemimpinan',
    icon: Trophy,
    color: '#0284c7',
    colorSoft: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  {
    id: 'futsal',
    name: 'Tim Futsal MAPAN',
    category: 'Olahraga & Prestasi',
    icon: Zap,
    color: '#059669',
    colorSoft: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
];

export default function Extracurricular() {
  return (
    <section id="eskul" className="eskul-section reveal-on-scroll">
      <div className="eskul-bg-blob blob-1" />
      <div className="eskul-bg-blob blob-2" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="section-badge">
            <Zap size={14} />
            <span>Pengembangan Potensi Siswa</span>
          </div>
          <h2 className="section-title">
            Ekstrakurikuler <span className="text-orange">Unggulan</span>
          </h2>
          <p className="section-subtitle">
            Wadah kegiatan untuk mengembangkan bakat, minat, karakter, dan prestasi siswa di SMK Muhammadiyah.
          </p>
        </div>

        {/* 4 Ekstrakurikuler Items */}
        <div className="eskul-cards-grid">
          {ESKUL_DATA.map((eskul) => {
            const Icon = eskul.icon;
            return (
              <div
                key={eskul.id}
                className="eskul-simple-card"
                style={{
                  '--eskul-color': eskul.color,
                  '--eskul-color-soft': eskul.colorSoft,
                  '--eskul-border-color': eskul.borderColor,
                }}
              >
                <div className="eskul-simple-icon">
                  <Icon size={26} style={{ color: eskul.color }} />
                </div>
                <div className="eskul-simple-info">
                  <span className="eskul-simple-cat">{eskul.category}</span>
                  <h3 className="eskul-simple-name">{eskul.name}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
