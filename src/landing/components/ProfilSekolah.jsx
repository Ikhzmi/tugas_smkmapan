import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AtSign, BadgeCheck, BookOpen, Clock, ExternalLink, GraduationCap, Hash, IdCard, Mail, MapPin, MousePointer2, Phone, ShieldCheck } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { useTabActive } from '@/components/ui/tab-active'
import { useContent } from '../../context/ContentContext'
import { renderPrincipalCard } from '../../lib/principalCard'
import './ProfilSekolah.css'

const lanyardModule = import('@/components/ui/lanyard')
const Lanyard = lazy(() => lanyardModule)

function supportsWebGL() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

function StaticPrincipalCard({ src }) {
  if (!src) return null
  return (
    <img
      className="profil-head__card"
      src={src}
      alt=""
      width={1024}
      height={1440}
    />
  )
}

function PrincipalCard({ data }) {
  const active = useTabActive()
  const [webgl] = useState(supportsWebGL)

  return (
    <div className="profil-head__media">
      <p className="sr-only">
        Kartu identitas {data.name}, {data.role}.
        {active && webgl
          ? ' Kartu dapat ditarik dan dibalik untuk melihat sisi belakang.'
          : ''}
      </p>
      <div className="profil-head__stage">
        {webgl ? (
          <Suspense fallback={<StaticPrincipalCard src={data.cardFront} />}>
            <Lanyard
              frontImage={data.cardFront}
              backImage={data.cardBack}
              imageFit="contain"
              cardColor="#0b1524"
              orientation="portrait"
              finish="glossy"
              cornerRadius={0.26}
              size={0.64}
              anchor="center"
              strapLength={0.2}
              strapColor="#e8501a"
              strapWidth={0.62}
              metal="silver"
              gravity={1}
              damping={0.5}
              elasticity={0.5}
              breeze={active ? 0.5 : 0}
              interactive
              intro={false}
            />
          </Suspense>
        ) : (
          <StaticPrincipalCard src={data.cardFront} />
        )}
      </div>
      <p className="profil-head__hint" aria-hidden="true">
        <MousePointer2 />
        <span>Tarik kartu · klik untuk membalik</span>
      </p>
    </div>
  )
}

const statIcons = {
  NPSN: Hash,
  NSS: BadgeCheck,
  Akreditasi: ShieldCheck,
  Kurikulum: BookOpen,
}

const contactIcons = {
  Telepon: Phone,
  Email: Mail,
  Instagram: AtSign,
}

function SejarahPanel({ data }) {
  return (
    <article className="profil-panel profil-split">
      {data.image ? (
        <div className="profil-split__media">
          <img
            src={data.image}
            alt={data.imageAlt}
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="profil-split__body">
        <h3 className="profil-h3">{data.title}</h3>
        {data.paragraphs.map((paragraph) => (
          <p key={paragraph} className="profil-text">
            {paragraph}
          </p>
        ))}
        <ul className="profil-milestones">
          {data.milestones.map((milestone) => (
            <li key={milestone.year} className="profil-milestone">
              <span className="profil-milestone__year">{milestone.year}</span>
              <span className="profil-milestone__label">
                {milestone.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function VisiMisiPanel({ data }) {
  return (
    <article className="profil-panel profil-vm">
      <div className="profil-vm__visi">
        <span className="profil-label">Visi</span>
        <p className="profil-vm__quote">{data.visi}</p>
      </div>
      <div className="profil-vm__misi">
        <span className="profil-label">Misi</span>
        <ol className="profil-misi">
          {data.misi.map((item, index) => (
            <li key={item} className="profil-misi__item">
              <span className="profil-misi__num">{index + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="profil-vm__tujuan">
          <strong>Tujuan</strong> {data.tujuan}
        </p>
      </div>
    </article>
  )
}

function KepalaSekolahPanel({ data }) {
  return (
    <article className="profil-panel profil-head">
      <PrincipalCard data={data} />
      <div className="profil-head__body">
        <p className="profil-head__greeting">&ldquo;{data.greeting}&rdquo;</p>
        {data.message.map((paragraph) => (
          <p key={paragraph} className="profil-text">
            {paragraph}
          </p>
        ))}
        <div className="profil-head__meta">
          <span className="profil-head__name">{data.name}</span>
          <span className="profil-head__role">{data.role}</span>
        </div>
      </div>
    </article>
  )
}

function IdentitasPanel({ data }) {
  return (
    <article className="profil-panel profil-id">
      <header className="profil-id__head">
        <span className="profil-id__logo">
          <img src={data.logo} alt="" width={44} height={44} loading="lazy" />
        </span>
        <div className="profil-id__intro">
          <span className="profil-id__eyebrow">
            <IdCard aria-hidden="true" />
            {data.title}
          </span>
          <h3 className="profil-id__name">{data.name}</h3>
          {data.tagline ? (
            <p className="profil-id__tagline">{data.tagline}</p>
          ) : null}
        </div>
        {data.badge ? (
          <span className="profil-id__badge">
            <GraduationCap aria-hidden="true" />
            {data.badge}
          </span>
        ) : null}
      </header>

      <div className="profil-id__body">
        <ul className="profil-id__stats">
          {data.stats.map((row) => {
            const Icon = statIcons[row.label] || Hash
            return (
              <li key={row.label} className="profil-id__stat">
                <span className="profil-id__stat-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="profil-id__stat-text">
                  <span className="profil-id__stat-label">{row.label}</span>
                  <span className="profil-id__stat-value">{row.value}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="profil-id__panel">
          <span className="profil-id__panel-title">
            <MapPin aria-hidden="true" />
            Kontak &amp; Lokasi
          </span>

          <p className="profil-id__address">
            <span>{data.address}</span>
            {data.mapsUrl ? (
              <a
                className="profil-id__map"
                href={data.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka peta
                <ExternalLink aria-hidden="true" />
              </a>
            ) : null}
          </p>

          <ul className="profil-id__contact">
            {data.contacts.map((row) => {
              const Icon = contactIcons[row.label] || AtSign
              const body = (
                <>
                  <span className="profil-id__contact-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="profil-id__contact-label">
                    {row.label}
                  </span>
                  <span className="profil-id__value">{row.value}</span>
                </>
              )

              return (
                <li key={row.label}>
                  {row.href ? (
                    <a
                      className="profil-id__contact-link"
                      href={row.href}
                      {...(row.external
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                    >
                      {body}
                    </a>
                  ) : (
                    <span className="profil-id__contact-link">{body}</span>
                  )}
                </li>
              )
            })}
          </ul>

          {data.hours ? (
            <p className="profil-id__hours">
              <Clock aria-hidden="true" />
              <span>{data.hours}</span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function ProfilSekolah() {
  const { profileExtras, schoolInfo, sectionCopy, teachers, appearance } = useContent()
  const c = sectionCopy?.profil || {}
  const reduceMotion = useReducedMotion()

  const principalPhoto =
    (teachers || []).find((t) => /kepala sekolah/i.test(t.role || ''))?.image || ''
  const principalName = schoolInfo?.principal || ''
  const schoolName = schoolInfo?.name || 'SMK Muhammadiyah 8 Medan'
  const brandTagline = appearance?.tagline || 'Tunas Bangsa Berkarakter'
  const brandLogo = appearance?.logoUrl || ''

  const [generatedCard, setGeneratedCard] = useState('')
  const genToken = useRef(0)
  useEffect(() => {
    if (profileExtras?.kartuDepan) return
    const token = ++genToken.current
    renderPrincipalCard({
      photoUrl: principalPhoto,
      name: principalName,
      schoolName,
      tagline: brandTagline,
      logoUrl: brandLogo,
    })
      .then((url) => {
        if (token === genToken.current && url) setGeneratedCard(url)
      })
      .catch(() => {})
  }, [profileExtras?.kartuDepan, principalPhoto, principalName, schoolName, brandTagline, brandLogo])

  const sekolahName = schoolInfo?.name || 'SMK Muhammadiyah 8 Medan'

  const sejarah = {
    title: profileExtras?.sejarahJudul || '',
    paragraphs: profileExtras?.sejarahParagraf || [],
    milestones: profileExtras?.sejarahMilestones || [],
    image: profileExtras?.sejarahFoto || '',
    imageAlt: `Gedung ${sekolahName}`,
  }

  const visiMisi = {
    visi: profileExtras?.visi || '',
    misi: profileExtras?.misi || [],
    tujuan: profileExtras?.tujuan || '',
  }

  const kepalaSekolah = {
    name: schoolInfo?.principal || '',
    role: 'Kepala SMK Muhammadiyah 8 Medan',
    greeting: profileExtras?.kepsekSambutan || '',
    message: profileExtras?.kepsekPesan || [],
    cardFront: profileExtras?.kartuDepan || generatedCard || principalPhoto,
    cardBack: profileExtras?.kartuBelakang || '',
  }

  const instagramHandle = String(schoolInfo?.instagram || '')
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/+$/, '')

  const identitas = {
    title: 'Identitas sekolah',
    logo: brandLogo,
    name: schoolInfo?.name || '',
    tagline: brandTagline,
    badge: schoolInfo?.predicate || '',
    address: schoolInfo?.address || '',
    mapsUrl: schoolInfo?.mapsUrl || '',
    hours: schoolInfo?.operatingHours || '',
    // Website tidak lagi ditampilkan; kartu memakai kanal resmi yang dikelola CMS.
    stats: [
      { label: 'NPSN', value: schoolInfo?.npsn || '' },
      { label: 'NSS', value: schoolInfo?.nss || '' },
      { label: 'Akreditasi', value: schoolInfo?.accreditation || '' },
      { label: 'Kurikulum', value: schoolInfo?.curriculum || '' },
    ],
    contacts: [
      schoolInfo?.phone && {
        label: 'Telepon',
        value: schoolInfo.phone,
        href: `tel:${String(schoolInfo.phone).replace(/[^\d+]/g, '')}`,
      },
      schoolInfo?.email && {
        label: 'Email',
        value: schoolInfo.email,
        href: `mailto:${schoolInfo.email}`,
      },
      instagramHandle && {
        label: 'Instagram',
        value: `@${instagramHandle}`,
        href: `https://instagram.com/${instagramHandle}`,
        external: true,
      },
    ].filter(Boolean),
  }

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 32 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
        }

  const tabs = [
    {
      title: 'Sejarah',
      value: 'sejarah',
      content: <SejarahPanel data={sejarah} />,
    },
    {
      title: 'Visi & Misi',
      value: 'visi-misi',
      content: <VisiMisiPanel data={visiMisi} />,
    },
    {
      title: 'Kepala Sekolah',
      value: 'kepala-sekolah',
      content: <KepalaSekolahPanel data={kepalaSekolah} />,
    },
    {
      title: 'Identitas',
      value: 'identitas',
      content: <IdentitasPanel data={identitas} />,
    },
  ]

  return (
    <section id="profil" className="profil" aria-labelledby="profil-title">
      <div className="profil__inner">
        <motion.div className="profil__head" {...reveal(0)}>
          <h2 id="profil-title" className="profil__title">
            {c.titleStart}{' '}
            <span>{c.titleAccent || schoolInfo?.name || 'SMK Muhammadiyah 8 Medan'}</span>{' '}
            {c.titleEnd}
          </h2>
          <p className="profil__lead">{c.lead}</p>
        </motion.div>

        <motion.div {...reveal(0.1)}>
          <Tabs
            tabs={tabs}
            containerClassName="profil__tabbar"
            tabClassName="profil__tab"
            activeTabClassName="profil__pill"
            contentClassName="profil__stack-card"
          />
        </motion.div>
      </div>
    </section>
  )
}
