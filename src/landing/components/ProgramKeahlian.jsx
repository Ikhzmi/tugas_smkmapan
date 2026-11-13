import { useRef } from 'react'
import { useInView } from 'motion/react'
import { ArrowUpRight, Calculator, Network, Palette, Wrench } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import { programKeahlian as staticPrograms } from '@/data/program'
import { useContent } from '../../context/ContentContext'
import './ProgramKeahlian.css'

const icons = {
  network: Network,
  palette: Palette,
  calculator: Calculator,
  wrench: Wrench,
}

const iconByCode = { tkj: 'network', dkv: 'palette', akl: 'calculator', tbsm: 'wrench' }
const invertByCode = { akl: true, tbsm: true }

function waLink(number, name) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return '#program'
  const text = encodeURIComponent(
    `Assalamu'alaikum saya ingin bertanya, apakah pendaftaran untuk jurusan '${name}' masih terbuka?`,
  )
  return `https://wa.me/${digits}?text=${text}`
}

function iconFor(m, code) {
  const fromDb = String(m.icon || '').toLowerCase()
  return icons[fromDb] ? fromDb : (iconByCode[code] || 'network')
}

function clipText(value, max) {
  const text = String(value || '').trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function mapMajorToProgram(m, whatsapp) {
  const code = String(m.code || m.id || '').toLowerCase()
  return {
    id: m.id,
    shortName: clipText(m.code || code.toUpperCase(), 8),
    name: clipText(m.name, 70),
    description: clipText(m.description || m.tagline || '', 300),
    features: (m.curriculum || []).slice(0, 4).map((item) => clipText(item, 72)),
    icon: iconFor(m, code),
    accent: m.color || '#38BDF8',
    image: m.facilityImage || m.image,
    // Ilustrasi bawaan AKL/TBSM diinversi agar kontras di kartu gelap;
    // foto hasil unggahan admin tidak boleh ikut dibalik warnanya.
    imageInvert: !m.photo && (invertByCode[code] || false),
    href: waLink(whatsapp, m.name),
  }
}

export function ProgramKeahlian() {
  const stageRef = useRef(null)
  const inView = useInView(stageRef, { amount: 0.35 })
  const { majors, schoolInfo, sectionCopy } = useContent()
  const programKeahlian = majors?.length
    ? majors.map((m) => mapMajorToProgram(m, schoolInfo?.whatsapp || schoolInfo?.hotlineRaw))
    : staticPrograms
  const count = programKeahlian.length
  const fanMode = count <= 4
  const c = sectionCopy?.program || {}

  return (
    <section id="program" className="program" aria-labelledby="program-title">
      <div className="program__inner">
        <div className="program__head">
          <span className="program__eyebrow">{c.eyebrow}</span>
          <h2 id="program-title" className="program__title">
            {c.titleStart} <span>{c.titleAccent}</span> {c.titleEnd}
          </h2>
          <p className="program__lead">{c.lead}</p>
        </div>

        <div
          ref={stageRef}
          className={`program-stage${fanMode ? '' : ' program-stage--grid'}${inView ? ' is-open' : ''}`}
          style={{ '--count': count }}
        >
          {programKeahlian.map((program, index) => {
            const Icon = icons[program.icon]

            return (
              <article
                key={program.id}
                className="program-card"
                style={{
                  '--i': index,
                  '--program-accent': program.accent,
                  zIndex: 40 - index,
                }}
              >
                <div className="program-card__aura" aria-hidden="true" />
                <div className="program-card__top">
                  <span className="program-card__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="program-card__badge">
                    {program.shortName}
                  </span>
                </div>
                <div className="program-card__media">
                  <img
                    className={program.imageInvert ? 'is-inverted' : undefined}
                    src={program.image}
                    alt={`Ilustrasi ${program.name}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="program-card__spacer" />
                <h3 className="program-card__name">{program.name}</h3>
                {program.description && (
                  <p className="program-card__desc">{program.description}</p>
                )}
                {program.features.length > 0 && (
                  <ul className="program-card__features">
                    {program.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                )}
                <a
                  className="program-card__cta"
                  href={program.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Info Pendaftaran
                  <ArrowUpRight aria-hidden="true" />
                </a>
                <GlowingEffect
                  spread={40}
                  glow
                  disabled={false}
                  proximity={70}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
