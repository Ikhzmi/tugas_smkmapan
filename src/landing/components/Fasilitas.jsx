import {
  ArrowUpRight,
  Building2,
  Landmark,
  Library,
  MapPin,
  Monitor,
  Palette,
  Trophy,
  Wrench,
} from 'lucide-react'
import ScrollStack, { ScrollStackItem } from '@/components/ui/scroll-stack'
import { useContent } from '../../context/ContentContext'
import './Fasilitas.css'

const icons = {
  landmark: Landmark,
  monitor: Monitor,
  trophy: Trophy,
  building: Building2,
  wrench: Wrench,
  palette: Palette,
  library: Library,
}

const CATEGORY_LOOK = {
  ibadah: { icon: 'landmark', accent: '#34d399', label: 'Ibadah' },
  praktikum: { icon: 'monitor', accent: '#38bdf8', label: 'Ruang Praktik' },
  olahraga: { icon: 'trophy', accent: '#fb923c', label: 'Olahraga' },
  akademik: { icon: 'building', accent: '#a78bfa', label: 'Gedung Sekolah' },
  lab: { icon: 'monitor', accent: '#38bdf8', label: 'Ruang Praktik' },
  campus: { icon: 'building', accent: '#a78bfa', label: 'Gedung Sekolah' },
  sports: { icon: 'trophy', accent: '#fb923c', label: 'Olahraga' },
  worship: { icon: 'landmark', accent: '#34d399', label: 'Ibadah' },
}

const DEFAULT_LOOK = { icon: 'building', accent: '#a78bfa', label: 'Fasilitas' }

const titleCase = (value) => {
  const text = String(value || '').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

export function Fasilitas() {
  const { facilities, schoolInfo, sectionCopy } = useContent()
  const c = sectionCopy?.fasilitas || {}
  const rows = facilities || []
  const utama = rows
    .filter((f) => String(f.category || '').toLowerCase() !== 'pendukung')
    .map((f) => {
      const look = CATEGORY_LOOK[String(f.category || '').toLowerCase()] || DEFAULT_LOOK
      return {
        id: f.id,
        name: f.title,
        category: look.label || titleCase(f.category),
        icon: look.icon,
        accent: look.accent,
        image: f.image,
        imageSmall: f.image,
        description: f.description,
        facts: f.tags || [],
      }
    })
  const pendukung = rows
    .filter((f) => String(f.category || '').toLowerCase() === 'pendukung')
    .map((f) => ({
      id: f.id,
      name: f.title,
      icon: icons[String(f.badge || '').toLowerCase()] ? String(f.badge).toLowerCase() : 'building',
    }))
  const total = String(utama.length).padStart(2, '0')
  const mapsUrl = schoolInfo?.mapsUrl || 'https://maps.app.goo.gl/7QVjJmF8Z7sJepAK6'

  return (
    <section
      id="fasilitas"
      className="fasilitas"
      aria-labelledby="fasilitas-title"
    >
      <div className="fasilitas__inner">
        <div className="fasilitas__head">
          <span className="fasilitas__eyebrow">{c.eyebrow}</span>
          <h2 id="fasilitas-title" className="fasilitas__title">
            {c.titleStart} <span>{c.titleAccent}</span> {c.titleEnd}
          </h2>
          <p className="fasilitas__lead">{c.lead}</p>
        </div>

        <div className="fasilitas__stage">
          <ScrollStack
            useWindowScroll
            className="fasilitas__stack"
            itemDistance={72}
            itemStackDistance={18}
            stackPosition="17%"
            itemScale={0.045}
            baseScale={0.86}
            dimAmount={0.5}
            blurAmount={1}
            tiltAmount={2.5}
            rotationAmount={0.5}
            holdDistance={160}
            smoothScroll={false}
            snap={false}
          >
            {utama.map((item, index) => {
              const Icon = icons[item.icon]

              return (
                <ScrollStackItem
                  key={item.id}
                  itemClassName="fasilitas-card"
                  style={{ '--accent': item.accent }}
                >
                  <article
                    className="fasilitas-card__article"
                    aria-label={`Fasilitas ${item.name}`}
                  >
                    <img
                      className="fasilitas-card__img"
                      src={item.image}
                      srcSet={`${item.imageSmall} 800w, ${item.image} 1600w`}
                      sizes="(max-width: 900px) 100vw, 1000px"
                      alt={item.name}
                      loading="lazy"
                    />
                    <span className="fasilitas-card__veil" aria-hidden="true" />

                    <div className="fasilitas-card__content">
                      <div className="fasilitas-card__top">
                        <span className="fasilitas-card__count">
                          <strong>{String(index + 1).padStart(2, '0')}</strong>
                          {' / '}
                          {total}
                        </span>
                        <span className="fasilitas-card__tag">
                          <Icon aria-hidden="true" />
                          {item.category}
                        </span>
                      </div>

                      <div className="fasilitas-card__body">
                        <p className="fasilitas-card__kicker">
                          Fasilitas Sekolah
                        </p>
                        <h3 className="fasilitas-card__title">{item.name}</h3>
                        <p className="fasilitas-card__desc">
                          {item.description}
                        </p>
                        <ul className="fasilitas-card__facts">
                          {item.facts.map((fact) => (
                            <li key={fact}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                </ScrollStackItem>
              )
            })}
          </ScrollStack>
        </div>

        <div className="fasilitas__foot">
          <div>
            <p className="fasilitas__support-title">Fasilitas pendukung</p>
            <ul className="fasilitas__support">
              {pendukung.map((item) => {
                const Icon = icons[item.icon]

                return (
                  <li key={item.id}>
                    <Icon aria-hidden="true" />
                    {item.name}
                  </li>
                )
              })}
            </ul>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="fasilitas__map"
          >
            <MapPin aria-hidden="true" />
            Lihat lokasi sekolah
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
