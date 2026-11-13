import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { Grip, Move, RotateCcw } from 'lucide-react'
import {
  DraggableCardBody,
  DraggableCardContainer,
} from '@/components/ui/draggable-card'
import { useContent } from '../../context/ContentContext'
import './Galeri.css'

const layers = [20, 40, 10, 50, 30]
const PER_ROW = 5
const SCATTER_ROTATIONS = [-6, 4, -3, 7, -5, 3, -7, 5]

export function Galeri() {
  const { galeri, sectionCopy } = useContent()
  const c = sectionCopy?.galeri || {}
  const items = (galeri || []).filter((item) => item.image)
  const scattered = items.length > PER_ROW
  const rows = items.reduce((acc, item, index) => {
    const row = Math.floor(index / PER_ROW)
    if (!acc[row]) acc[row] = []
    acc[row].push({ item, index })
    return acc
  }, [])
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { amount: 0.2 })
  const hasEntered = useRef(false)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    if (inView) {
      hasEntered.current = true
      return
    }
    if (hasEntered.current) setResetKey((key) => key + 1)
  }, [inView])

  const renderCard = (item, index, className, rotate, zIndex) => (
    <DraggableCardBody
      key={`${resetKey}-${item.id}`}
      rotate={rotate}
      zIndex={zIndex}
      className={className}
    >
      <span className="galeri-card__tape" aria-hidden="true" />
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        draggable={false}
        className="galeri-card__img"
      />
      <div className="galeri-card__meta">
        <div className="galeri-card__row">
          <span className="galeri-card__category">
            {item.category}
          </span>
          <Grip
            className="galeri-card__grip"
            aria-hidden="true"
          />
        </div>
        <p className="galeri-card__title">{item.title}</p>
        <span className="galeri-card__date">{item.date}</span>
      </div>
    </DraggableCardBody>
  )

  return (
    <section
      id="galeri"
      ref={sectionRef}
      className="galeri"
      aria-labelledby="galeri-title"
    >
      <div className="galeri__inner">
        <div className="galeri__head">
          <span className="galeri__eyebrow">{c.eyebrow}</span>
          <h2 id="galeri-title" className="galeri__title">
            {c.titleStart} <span>{c.titleAccent}</span> {c.titleEnd}
          </h2>
          <p className="galeri__lead">{c.lead}</p>
        </div>

        <DraggableCardContainer
          className={`galeri__stage${scattered ? ' galeri__stage--scatter' : ''}`}
        >
          {scattered
            ? items.map((item, index) => renderCard(
              item,
              index,
              'galeri-card',
              SCATTER_ROTATIONS[index % SCATTER_ROTATIONS.length],
              20 + (index % 5) * 5,
            ))
            : rows.map((rowItems, rowIndex) => (
              <div className="galeri__row" key={`row-${rowIndex}`}>
                {rowItems.map(({ item, index }) => {
                  const column = index % PER_ROW
                  return renderCard(
                    item,
                    index,
                    `galeri-card galeri-card--${column + 1}`,
                    item.rotate,
                    layers[column] ?? 10,
                  )
                })}
              </div>
            ))}
        </DraggableCardContainer>

        <div className="galeri__footer">
          <span className="galeri__hint">
            <Move aria-hidden="true" />
            Tarik kartu untuk menjelajah. Posisi dirapikan otomatis saat
            section ditinggalkan.
          </span>
          <button
            type="button"
            onClick={() => setResetKey((key) => key + 1)}
            className="galeri__reset"
          >
            <RotateCcw aria-hidden="true" />
            Rapikan
          </button>
        </div>
      </div>
    </section>
  )
}
