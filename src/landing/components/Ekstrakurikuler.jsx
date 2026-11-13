import AccordionGallery from '@/components/ui/accordion-gallery'
import { useContent } from '../../context/ContentContext'
import './Ekstrakurikuler.css'

export function Ekstrakurikuler() {
  const { eskul, schoolInfo, sectionCopy } = useContent()
  const c = sectionCopy?.eskul || {}
  const schoolName = schoolInfo?.name || 'SMK Muhammadiyah 8 Medan'
  const items = (eskul || [])
    .filter((item) => item.image)
    .map((item) => ({
      image: item.image,
      label: item.name,
      alt: `Ekstrakurikuler ${item.name} ${schoolName}`,
    }))

  return (
    <section
      id="ekstrakurikuler"
      className="ekskul"
      aria-labelledby="ekskul-title"
    >
      <div className="ekskul__inner">
        <div className="ekskul__head">
          <span className="ekskul__eyebrow">{c.eyebrow}</span>
          <h2 id="ekskul-title" className="ekskul__title">
            {c.titleStart} <span>{c.titleAccent}</span> {c.titleEnd}
          </h2>
          <p className="ekskul__lead">{c.lead}</p>
        </div>

        <AccordionGallery
          items={items}
          className="ekskul__accordion"
          defaultIndex={0}
          accentColor="#FE4000"
          overlayColor="#060910"
          textColor="#ffffff"
          height={480}
          gap={12}
          radius={24}
          expandRatio={0.5}
          tilt={6}
          parallax={0.5}
          duration={0.65}
          trigger="hover"
          grayscale
          showLabels
        />

        <p className="ekskul__hint">
          Arahkan kursor ke panel untuk menjelajah kegiatan ekstrakurikuler.
        </p>
      </div>
    </section>
  )
}
