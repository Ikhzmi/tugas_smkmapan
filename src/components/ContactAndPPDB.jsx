import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  Building,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { useContent } from '../context/ContentContext';
import './ContactAndPPDB.css';

export default function ContactAndPPDB() {
  const { addContactMessage } = useContent();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Pertanyaan PPDB Siswa Baru',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (addContactMessage) {
      addContactMessage(formData);
    }
    setIsSubmitted(true);
    setTimeout(() => {
      // Keep feedback visible for 4s
    }, 4000);
  };

  return (
    <section id="kontak" className="contact-section reveal-on-scroll">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">
            <Sparkles size={14} />
            <span>Pusat Informasi & Pelayanan Terpadu</span>
          </div>
          <h2 className="section-title">
            Layanan Informasi, <span className="text-orange">PPDB & Form Saran</span>
          </h2>
          <p className="section-subtitle">
            Pintu komunikasi resmi SMK Muhammadiyah 8 Medan. Kami siap melayani konsultasi jurusan, 
            informasi pendaftaran, serta menerima masukan demi peningkatan mutu sekolah.
          </p>
        </div>

        <div className="contact-grid">
          {/* Left: Contact Info & Campus Location Map Card */}
          <div className="contact-info-col">
            <div className="info-card">
              <h3 className="info-title">Sekretariat Sekolah & Hotline</h3>
              <p className="info-desc">
                Kunjungi sekolah kami pada hari dan jam kerja, atau hubungi pusat layanan terpadu:
              </p>

              <div className="info-items-list">
                <div className="info-item">
                  <div className="info-icon-box bg-orange">
                    <MapPin size={20} />
                  </div>
                  <div className="info-text-box">
                    <span className="info-lbl">Alamat Resmi Sekolah:</span>
                    <p className="info-val">{SCHOOL_INFO.address}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-box bg-blue">
                    <Phone size={20} />
                  </div>
                  <div className="info-text-box">
                    <span className="info-lbl">Hotline WhatsApp PPDB:</span>
                    <p className="info-val">
                      <a 
                        href={`https://wa.me/${SCHOOL_INFO.hotlineRaw}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hotline-link-text"
                      >
                        {SCHOOL_INFO.hotline}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-box bg-green">
                    <Mail size={20} />
                  </div>
                  <div className="info-text-box">
                    <span className="info-lbl">Email Resmi:</span>
                    <p className="info-val">{SCHOOL_INFO.email}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-box bg-dark">
                    <Clock size={20} />
                  </div>
                  <div className="info-text-box">
                    <span className="info-lbl">Jam Pelayanan Kantor:</span>
                    <p className="info-val">{SCHOOL_INFO.operatingHours}</p>
                  </div>
                </div>
              </div>

              {/* Interactive Map Visual Simulator */}
              <div className="map-embed-wrapper">
                <div className="map-simulated-view">
                  <div className="map-pin-marker">
                    <div className="pin-pulse"></div>
                    <div className="pin-point">
                      <Building size={16} />
                    </div>
                    <div className="pin-card-popup">
                      <strong>SMK Muhammadiyah 8 Medan</strong>
                      <span>Jl. Gedung Arca No. 52</span>
                    </div>
                  </div>
                  <div className="map-badge-corner">
                    <span>Google Maps Integration</span>
                  </div>
                </div>
                <a 
                  href="https://maps.google.com/?q=SMK+Muhammadiyah+8+Medan+Jl+Gedung+Arca+52" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="map-action-link"
                >
                  <Navigation size={14} />
                  <span>Buka Petunjuk Arah di Google Maps</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Feedback & Saran Terpadu Form */}
          <div className="contact-form-col">
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-icon-wrap">
                  <MessageSquare size={20} className="text-orange" />
                </div>
                <div>
                  <h3 className="form-title">Kirim Pesan, Konsultasi & Masukan</h3>
                  <p className="form-sub">Pesan Anda akan langsung diterima tim humas & manajemen sekolah.</p>
                </div>
              </div>

              {isSubmitted ? (
                <div className="form-success-box">
                  <CheckCircle2 size={48} className="text-green mb-3" />
                  <h4 className="success-title">Pesan / Masukan Anda Berhasil Terkirim!</h4>
                  <p className="success-desc">
                    Terima kasih telah menghubungi SMK Muhammadiyah 8 Medan. Tim kami akan segera 
                    merespons melalui WhatsApp atau Email dalam 1x24 jam kerja.
                  </p>
                  <button 
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', category: 'Pertanyaan PPDB Siswa Baru', message: '' });
                    }}
                    className="btn btn-outline btn-sm mt-3"
                  >
                    Kirim Pesan Lainnya
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="actual-contact-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-name">Nama Lengkap *</label>
                    <input 
                      id="input-name"
                      type="text" 
                      required 
                      placeholder="Masukkan nama Anda..." 
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="input-email">Alamat Email *</label>
                      <input 
                        id="input-email"
                        type="email" 
                        required 
                        placeholder="contoh@gmail.com" 
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="input-phone">No. WhatsApp / HP *</label>
                      <input 
                        id="input-phone"
                        type="tel" 
                        required 
                        placeholder="0812-xxxx-xxxx" 
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-category">Kategori Pesan</label>
                    <select 
                      id="input-category"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Pertanyaan PPDB Siswa Baru">Pertanyaan PPDB Siswa Baru</option>
                      <option value="Informasi Biaya & Keringanan SPP">Informasi Biaya & Keringanan SPP</option>
                      <option value="Konsultasi Kurikulum & Praktikum LMS">Konsultasi Kurikulum & Praktikum LMS</option>
                      <option value="Kemitraan Industri / Magang DUDI">Kemitraan Industri / Magang DUDI</option>
                      <option value="Saran & Masukan Mutu Pendidikan">Saran & Masukan Mutu Pendidikan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-message">Pesan / Saran / Pertanyaan *</label>
                    <textarea 
                      id="input-message"
                      rows="4" 
                      required 
                      placeholder="Tuliskan pertanyaan atau masukan Anda dengan jelas..." 
                      className="form-control"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-block btn-submit-message"
                    id="btn-submit-contact"
                  >
                    <Send size={18} />
                    <span>Kirim Pesan Resmi ke Sekolah</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
