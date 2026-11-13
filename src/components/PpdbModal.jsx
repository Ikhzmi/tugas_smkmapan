import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Network, 
  Palette, 
  Calculator, 
  Wrench, 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { SCHOOL_INFO, MAJORS_DATA } from '../data/schoolData';
import { useContent } from '../context/ContentContext';
import './PpdbModal.css';

const MAJOR_ICONS = { Network, Palette, Calculator, Wrench };
const POPULAR_MAJOR_CODE = 'DKV';

const DEFAULT_COLOR = '#0284c7';

function rgba(hex, alpha) {
  const value = String(hex || '').replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num) || full.length < 6) return `rgba(2, 132, 199, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

const price = (amount, fallback) => {
  const value = Number(amount);
  if (value > 0) return `Rp ${value.toLocaleString('id-ID')},00`;
  return fallback || 'Gratis';
};

export default function PpdbModal({ isOpen, onClose }) {
  const { majors, schoolInfo, sectionCopy } = useContent();

  if (!isOpen) return null;

  const school = schoolInfo || SCHOOL_INFO;
  const copy = sectionCopy?.ppdb || {};
  const hotline = school.hotlineRaw || school.whatsapp || '6281370806663';

  const source = majors?.length ? majors : MAJORS_DATA;
  const plans = source.map((major) => {
    const themeColor = major.color || DEFAULT_COLOR;
    return {
      id: major.id,
      code: major.code,
      title: major.name,
      isPopular: String(major.code || '').toUpperCase() === POPULAR_MAJOR_CODE,
      icon: MAJOR_ICONS[major.icon] || Network,
      themeColor,
      themeBg: major.colorSoft || rgba(themeColor, 0.12),
      themeGlow: rgba(themeColor, 0.3),
      regFee: price(major.registrationFee, major.registrationFormatted),
      sppFee: price(major.monthlySpp, major.sppFormatted),
      features: major.curriculum?.length ? major.curriculum : (major.careers || [])
    };
  });

  const getWhatsappUrl = (majorTitle) => {
    const message = `Halo Admin PPDB ${school.name}, saya ingin mendaftar untuk jurusan *${majorTitle}*. Mohon informasi panduan pra-pendaftaran dan persyaratan berkasnya. Terima kasih!`;
    return `https://wa.me/${hotline.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const modalContent = (
    <div className="modal-overlay ppdb-pra-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="ppdb-pra-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Floating Close Button */}
        <button 
          className="ppdb-pra-close-btn" 
          onClick={onClose} 
          aria-label="Tutup Modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="ppdb-pra-header-block">
          <div className="ppdb-pra-top-badge">
            <Sparkles size={14} className="text-orange" />
            <span>{copy.eyebrow}</span>
          </div>
          <h2 className="ppdb-pra-main-title">
            {copy.titleStart} <span className="title-gradient">{copy.titleAccent}</span> {copy.titleEnd}
          </h2>
          <p className="ppdb-pra-sub-title">
            {copy.lead}
          </p>
        </div>

        {/* 4 Cards Responsive Grid */}
        <div className="ppdb-pra-cards-grid">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div 
                key={plan.id} 
                className={`ppdb-pra-card ${plan.isPopular ? 'popular-card' : ''}`}
                style={{
                  '--card-theme': plan.themeColor,
                  '--card-theme-bg': plan.themeBg,
                  '--card-theme-glow': plan.themeGlow
                }}
              >
                {/* Popular / Featured Badge */}
                {plan.isPopular && (
                  <div className="card-popular-pill">
                    <Sparkles size={12} />
                    <span>Rekomendasi Favorit</span>
                  </div>
                )}

                {/* Card Top Identity */}
                <div className="card-head-area">
                  <div className="card-icon-bubble">
                    <IconComponent size={22} color={plan.themeColor} />
                  </div>
                  <span className="card-code-pill">{plan.code}</span>
                </div>

                <h3 className="ppdb-pra-card-title">{plan.title}</h3>

                {/* Pricing Box Block */}
                <div className="ppdb-pra-pricing-box">
                  <div className="pricing-row">
                    <div className="pricing-meta">
                      <span className="pricing-label">Pendaftaran</span>
                      <span className="pricing-period">Sekali bayar</span>
                    </div>
                    <span className="pricing-amount reg-price">{plan.regFee}</span>
                  </div>

                  <div className="pricing-divider" />

                  <div className="pricing-row spp-row">
                    <div className="pricing-meta">
                      <span className="pricing-label">SPP / bulan</span>
                      <span className="pricing-period">SPP reguler</span>
                    </div>
                    <div className="spp-amount-wrap">
                      <span className="pricing-amount spp-price">{plan.sppFee}</span>
                    </div>
                  </div>
                </div>

                {/* Curriculum Competencies Checklist */}
                {plan.features.length > 0 && (
                <div className="ppdb-pra-competencies">
                  <span className="competencies-header-lbl">Kompetensi Keahlian:</span>
                  <ul className="ppdb-pra-features-list">
                    {plan.features.map((item, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={14} className="feature-check-icon" style={{ color: plan.themeColor }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                )}

                {/* Action CTA Button */}
                <a 
                  href={getWhatsappUrl(plan.title)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ppdb-pra-btn"
                >
                  <MessageCircle size={16} className="btn-wa-icon" />
                  <span>Daftar Sekarang</span>
                  <ArrowRight size={14} className="btn-arrow-icon" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer Support Info */}
        <div className="ppdb-pra-footer-bar">
          <div className="footer-support-item">
            <PhoneCall size={15} className="text-orange" />
            <span>Butuh informasi lebih lanjut? Hubungi Hotline: <strong>{school.hotline}</strong>{school.operatingHours ? ` (${school.operatingHours})` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
