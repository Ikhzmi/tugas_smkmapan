import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react'
import DotGrid from '@/components/ui/dot-grid'
import useInViewOnce from '../hooks/useInViewOnce'
import { useContent } from '../../context/ContentContext'
import './Kontak.css'

function waLink(number, text) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

function waDisplay(number) {
  const digits = String(number).replace(/\D/g, '')
  if (!digits.startsWith('62') || digits.length < 11) return number
  return `+${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`
}

function useDarkTheme() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains('dark'))
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

export function Kontak() {
  const isDark = useDarkTheme()
  const { addContactMessage, schoolInfo, sectionCopy } = useContent()
  const c = sectionCopy?.kontak || {}
  const [form, setForm] = useState({ name: '', contact: '', message: '' })
  const [status, setStatus] = useState('idle')
  // Latar dot-grid WebGL baru dibuat saat bagian kontak mendekati viewport.
  const [dotsRef, dotsVisible] = useInViewOnce()

  const schoolName = schoolInfo?.name || 'SMK Muhammadiyah 8 Medan'
  const whatsapp = schoolInfo?.whatsapp || schoolInfo?.hotlineRaw || ''
  const phone = schoolInfo?.phone || ''
  const email = schoolInfo?.email || ''
  const mapsUrl = schoolInfo?.mapsUrl || ''
  const address = schoolInfo?.address || ''

  const channels = [
    whatsapp && {
      label: 'WhatsApp Humas',
      value: waDisplay(whatsapp),
      href: waLink(
        whatsapp,
        `Assalamu'alaikum, saya ingin bertanya kepada Humas ${schoolName}.`,
      ),
      icon: MessageCircle,
      external: true,
    },
    phone && {
      label: 'Telepon sekolah',
      value: phone,
      href: `tel:+62${phone.replace(/\D/g, '').replace(/^0/, '')}`,
      icon: Phone,
    },
    email && {
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      icon: Mail,
    },
  ].filter(Boolean)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return

    const name = form.name.trim()
    const contact = form.contact.trim()
    const message = form.message.trim()
    if (!name || !message) return

    setStatus('sending')
    try {
      // Masuk ke tabel suggestions → tampil di tab Pesan CMS admin sekolah.
      await addContactMessage({
        name,
        email: contact.includes('@') ? contact : '',
        phone: contact && !contact.includes('@') ? contact : '',
        category: 'Website',
        message,
      })
      setForm({ name: '', contact: '', message: '' })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      id="kontak"
      className="kontak"
      aria-labelledby="kontak-title"
    >
      <div className="kontak__dots" aria-hidden="true" ref={dotsRef}>
        {dotsVisible ? <DotGrid
          className="kontak__dot-grid"
          baseColor={isDark ? '#2b3546' : '#a99d91'}
          activeColor={isDark ? '#ff6a2b' : '#FE4000'}
          dotSize={4}
          gap={22}
          proximity={150}
          strength={0.85}
          bounce={0.5}
          tension={0.34}
          returnDuration={0.8}
          shockRadius={330}
          shockStrength={4.5}
          swell={0.75}
          stretch={0.55}
          glow={0.55}
          fade={0.15}
          opacity={isDark ? 0.85 : 0.75}
        /> : null}
      </div>

      <div className="kontak__inner">
        <div className="kontak__head">
          <div className="kontak__head-main">
            <span className="kontak__eyebrow">{c.eyebrow}</span>
            <h2 id="kontak-title" className="kontak__title">
              {c.titleStart} <span>{c.titleAccent}</span> {c.titleEnd}
            </h2>
          </div>

          <div className="kontak__head-side">
            <p className="kontak__lead">{c.lead}</p>
            <span className="kontak__status">
              <span className="kontak__status-dot" aria-hidden="true" />
              {c.status}
            </span>
          </div>
        </div>

        <div className="kontak__grid">
          <article className="kontak__card kontak__card--channels">
            <div className="kontak__card-head">
              <span className="kontak__kicker">
                <MessageCircle aria-hidden="true" />
                Kontak langsung
              </span>
              <span className="kontak__index">01</span>
            </div>

            <div className="kontak__channels">
              {channels.map((channel) => (
                <a
                  key={channel.label}
                  className="kontak__channel"
                  href={channel.href}
                  target={channel.external ? '_blank' : undefined}
                  rel={channel.external ? 'noreferrer' : undefined}
                >
                  <span className="kontak__channel-icon">
                    <channel.icon aria-hidden="true" />
                  </span>
                  <span className="kontak__channel-copy">
                    <span className="kontak__channel-label">
                      {channel.label}
                    </span>
                    <strong>{channel.value}</strong>
                  </span>
                  <ArrowUpRight
                    className="kontak__channel-arrow"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>

            <a
              className="kontak__address"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span className="kontak__address-icon">
                <MapPin aria-hidden="true" />
              </span>
              <span className="kontak__address-copy">
                <span className="kontak__channel-label">Alamat Sekolah</span>
                <strong>{address}</strong>
              </span>
              <span className="kontak__address-link">
                Buka peta
                <ArrowUpRight aria-hidden="true" />
              </span>
            </a>

            <p className="kontak__note">
              Layanan administrasi tersedia pada hari sekolah. Untuk kunjungan
              rombongan, silakan hubungi humas terlebih dahulu.
            </p>
          </article>

          <article className="kontak__card kontak__card--form">
            {status === 'sent' ? (
              <div className="kontak__success" role="status">
                <div className="kontak__card-head">
                  <span className="kontak__kicker">
                    <Send aria-hidden="true" />
                    Pesan terkirim
                  </span>
                  <span className="kontak__index">02</span>
                </div>

                <span className="kontak__success-icon">
                  <CheckCircle2 aria-hidden="true" />
                </span>

                <h3 className="kontak__form-title">Pesan Anda sudah masuk.</h3>
                <p className="kontak__form-lead">
                  Pesan tersimpan di kotak pesan CMS admin sekolah dan akan
                  ditindaklanjuti petugas pada hari kerja. Pastikan kontak yang
                  Anda cantumkan aktif agar kami bisa membalas.
                </p>

                <button
                  type="button"
                  className="kontak__submit"
                  onClick={() => setStatus('idle')}
                >
                  Kirim pesan lain
                  <ArrowUpRight aria-hidden="true" />
                </button>
              </div>
            ) : (
              <form className="kontak__form" onSubmit={handleSubmit}>
                <div className="kontak__card-head">
                  <span className="kontak__kicker">
                    <Send aria-hidden="true" />
                    Kirim pesan
                  </span>
                  <span className="kontak__index">02</span>
                </div>

                <h3 className="kontak__form-title">
                  Ceritakan kebutuhan Anda.
                </h3>
                <p className="kontak__form-lead">
                  Isi kolom di bawah. Pesan langsung masuk ke kotak pesan admin
                  sekolah, tanpa dialihkan ke WhatsApp.
                </p>

                <div className="kontak__fields">
                  <label className="kontak__field">
                    <span>Nama</span>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Nama lengkap"
                      required
                      value={form.name}
                      onChange={(event) =>
                        updateField('name', event.target.value)
                      }
                    />
                  </label>

                  <label className="kontak__field">
                    <span>
                      Email / WhatsApp
                      <em>opsional</em>
                    </span>
                    <input
                      type="text"
                      name="contact"
                      autoComplete="email"
                      placeholder="Cara menghubungi Anda"
                      value={form.contact}
                      onChange={(event) =>
                        updateField('contact', event.target.value)
                      }
                    />
                  </label>
                </div>

                <label className="kontak__field kontak__field--message">
                  <span>Pesan</span>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Tulis pertanyaan atau kebutuhan Anda..."
                    required
                    value={form.message}
                    onChange={(event) =>
                      updateField('message', event.target.value)
                    }
                  />
                </label>

                {status === 'error' && (
                  <p className="kontak__form-error" role="alert">
                    Pesan gagal dikirim. Periksa koneksi lalu coba lagi.
                  </p>
                )}

                <button
                  type="submit"
                  className="kontak__submit"
                  disabled={status === 'sending'}
                >
                  {status === 'sending'
                    ? 'Mengirim...'
                    : 'Kirim ke Admin Sekolah'}
                  <ArrowUpRight aria-hidden="true" />
                </button>

                <p className="kontak__form-note">
                  Pesan tercatat di kotak pesan CMS admin sekolah dan
                  ditindaklanjuti pada hari kerja.
                </p>
              </form>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
