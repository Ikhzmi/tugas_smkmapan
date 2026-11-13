import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  ArrowUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SCHOOL_INFO, MAJORS_DATA } from '../data/schoolData';
import { ASSETS } from '../data/assets';
import { useContent } from '../context/ContentContext';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const { schoolInfo = SCHOOL_INFO } = useContent();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="global-footer">
      {/* Top Banner Accent */}
      <div className="footer-top-accent"></div>

      <div className="container footer-container">
        {/* Main Footer Columns Grid */}
        <div className="footer-grid">
          {/* Column 1: School Identity */}
          <div className="footer-col col-brand">
            <div className="footer-brand-header">
              <img
                src={ASSETS.logos.official}
                alt="Logo SMK Muhammadiyah 8 Medan"
                className="footer-logo"
                width="44"
                height="44"
              />
              <div className="footer-brand-title">
                <span className="footer-school-name">SMK MUHAMMADIYAH 8</span>
                <span className="footer-city">MEDAN</span>
              </div>
            </div>

            <p className="footer-mission-text">
              Sekolah Menengah Kejuruan berpredikat <strong>SMK Pusat Keunggulan</strong> dengan
              akreditasi &ldquo;A&rdquo; BAN-SM. Berkomitmen mencetak lulusan berkarakter Islami,
              terampil secara teknologi, dan terserap optimal di industri era AI & 4.0.
            </p>

            {/* Vocational Badges */}
            <div className="vocational-badges-strip">
              <div className="vokasi-tag">
                <ShieldCheck size={14} className="text-orange" />
                <span>Vokasi Kuat, Menguatkan Indonesia</span>
              </div>
              <div className="vokasi-tag">
                <CheckCircle2 size={14} className="text-green" />
                <span>SMK Bisa &mdash; Hebat</span>
              </div>
            </div>

            {/* Official Partner Logos */}
            <div className="footer-partner-logos" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
              <img src={ASSETS.logos.vokasi} alt="Vokasi Kemdikbud" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
              <img src={ASSETS.logos.smkHebat} alt="SMK Bisa Hebat" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Column 2: Program Keahlian */}
          <div className="footer-col">
            <h4 className="footer-col-title">Program Keahlian</h4>
            <ul className="footer-links-list">
              {MAJORS_DATA.map((major) => (
                <li key={major.id}>
                  <a href="#jurusan" className="footer-link">
                    <span>{major.name} ({major.code})</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="#fasilitas" className="footer-link">
                  <span>Cloud Networking Lab (Cisco)</span>
                </a>
              </li>
              <li>
                <a href="#fasilitas" className="footer-link">
                  <span>Motion & 3D Render Studio</span>
                </a>
              </li>
              <li>
                <a href="#fasilitas" className="footer-link">
                  <span>Mini Bank Syariah & Tax Center</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigasi Cepat & Layanan */}
          <div className="footer-col">
            <h4 className="footer-col-title">Layanan & Akses</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#jurusan" className="footer-link">
                  <span>Informasi Program Keahlian</span>
                </a>
              </li>
              <li>
                <a href="#fasilitas" className="footer-link">
                  <span>Fasilitas & Lab Komputer</span>
                </a>
              </li>
              <li>
                <a href="#guru" className="footer-link">
                  <span>Direktori Guru & Konsultasi</span>
                </a>
              </li>
              <li>
                <a href="#kontak" className="footer-link">
                  <span>Lokasi Sekolah & Peta Rute</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Kontak Resmi */}
          <div className="footer-col col-contact">
            <h4 className="footer-col-title">Hubungi Kami</h4>
            <div className="footer-contact-block">
              <div className="f-contact-item">
                <MapPin size={16} className="text-orange flex-shrink-0 mt-1" />
                <span>{SCHOOL_INFO.address}</span>
              </div>
              <div className="f-contact-item">
                <Phone size={16} className="text-orange flex-shrink-0" />
                <a href={`https://wa.me/${SCHOOL_INFO.hotlineRaw}`} target="_blank" rel="noopener noreferrer">
                  {SCHOOL_INFO.hotline}
                </a>
              </div>
              <div className="f-contact-item">
                <Mail size={16} className="text-orange flex-shrink-0" />
                <span>{SCHOOL_INFO.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="footer-bottom-bar">
          <div className="bottom-left">
            <p className="copyright-text">
              &copy; {CURRENT_YEAR} <strong>{schoolInfo.name}</strong>. Seluruh Hak Cipta Dilindungi.
            </p>
            <span className="accreditation-copy">NPSN: {schoolInfo.npsn} &bull; Akreditasi: {schoolInfo.accreditation}</span>
          </div>

          <div className="bottom-right">
            <button onClick={scrollToTop} className="back-to-top-btn" aria-label="Kembali ke Atas Halaman">
              <span>Ke Atas</span>
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
