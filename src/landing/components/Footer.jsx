import { useContent } from '../../context/ContentContext'
import './Footer.css'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  const { schoolInfo, appearance, majors } = useContent()
  const name = schoolInfo?.name || 'SMK Muhammadiyah 8 Medan'
  const address = schoolInfo?.address || 'Jl. Pelajar, Medan, Sumatera Utara'
  const email = schoolInfo?.email || 'humas@smkm8medan.sch.id'
  const brand = appearance?.brand || 'SMKM 8 MEDAN'
  const navigation = appearance?.footerNav?.length
    ? appearance.footerNav
    : [
        { label: 'Beranda', href: '#beranda' },
        { label: 'Profil Sekolah', href: '#profil' },
        { label: 'Program Keahlian', href: '#program' },
        { label: 'Fasilitas', href: '#fasilitas' },
        { label: 'Ekstrakurikuler', href: '#ekstrakurikuler' },
        { label: 'Galeri', href: '#galeri' },
      ]
  const programs = (majors || []).map((major) => ({
    label: major.name,
    href: '#program',
  }))
  const instagramUrl = schoolInfo?.instagram
    ? `https://instagram.com/${String(schoolInfo.instagram).replace(/^@|^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`
    : '#'

  return (
    <footer className="relative w-full overflow-hidden border-t border-white/20 bg-[var(--color-primary)] text-white/80 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-neutral-400">
      <div className="footer-grid pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-6 pt-16 md:px-10 md:pt-20">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <p className="text-sm font-semibold tracking-[0.2em] text-white">
              {brand}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/80 dark:text-neutral-500">
              {name} — membentuk generasi terampil, siap
              bersaing di dunia kerja, dan berkarakter.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/90 dark:text-neutral-300">
                Navigasi
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {navigation.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-white/75 transition-colors hover:text-white dark:text-neutral-500 dark:hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/90 dark:text-neutral-300">
                Program Keahlian
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {programs.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-white/75 transition-colors hover:text-white dark:text-neutral-500 dark:hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/90 dark:text-neutral-300">
                Kontak
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/80 dark:text-neutral-500">
                <li>{address}</li>
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="transition-colors hover:text-white dark:hover:text-white"
                  >
                    {email}
                  </a>
                </li>
                {schoolInfo?.phone && (
                  <li>
                    <a
                      href={`tel:+62${String(schoolInfo.phone).replace(/\D/g, '').replace(/^0/, '')}`}
                      className="transition-colors hover:text-white dark:hover:text-white"
                    >
                      {schoolInfo.phone}
                    </a>
                  </li>
                )}
                {instagramUrl !== '#' && (
                  <li>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-white dark:hover:text-white"
                    >
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/20 pt-6 text-xs text-white/65 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:text-neutral-600">
          <p>© {CURRENT_YEAR} {name}. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6">
            <a
              href={appearance?.privacyUrl || '#'}
              className="transition-colors hover:text-white dark:hover:text-white"
            >
              Kebijakan Privasi
            </a>
            <a
              href={appearance?.termsUrl || '#'}
              className="transition-colors hover:text-white dark:hover:text-white"
            >
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>

      <div className="footer-wordmark px-4 pb-[0.06em] pt-8 md:pt-12">
        {appearance?.wordmark || brand}
      </div>
    </footer>
  )
}
