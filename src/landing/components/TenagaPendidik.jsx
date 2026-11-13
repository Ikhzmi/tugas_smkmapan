import { useState } from 'react'
import { CometCard } from '@/components/ui/comet-card'
import { teachers as staticTeachers } from '@/data/teachers'
import { useContent } from '../../context/ContentContext'
import './TenagaPendidik.css'

function TeacherCard({ teacher }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <CometCard className="mx-3 flex-shrink-0">
      <button
        type="button"
        className="group flex w-64 cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 saturate-0 transition-[filter] duration-300 hover:saturate-100 md:p-3"
        aria-label={`Lihat profil ${teacher.name}`}
        style={{
          transformStyle: 'preserve-3d',
          transform: 'none',
          opacity: 1,
        }}
      >
        <div className="mx-1 flex-1">
          <div className="relative mt-1 aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-[#000000]">
            {teacher.photo && !imageFailed ? (
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover object-top contrast-75"
                alt={teacher.name}
                src={teacher.photo}
                onError={() => setImageFailed(true)}
                style={{
                  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 5px 6px 0px',
                  opacity: 1,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center rounded-[16px] bg-[#1b1e1e] font-mono text-5xl text-white/30">
                {teacher.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 flex flex-shrink-0 items-center px-3 py-3 font-mono text-white">
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[11px]">{teacher.name}</div>
            <div className="truncate text-[10px] text-gray-300 opacity-50">
              {teacher.role}
            </div>
          </div>
        </div>
      </button>
    </CometCard>
  )
}

function MarqueeRow({ items, direction }) {
  const loop = [...items, ...items]

  return (
    <div className="marquee-row marquee-fade overflow-hidden">
      <div
        className={`flex w-max py-6 ${
          direction === 'left' ? 'marquee-track-left' : 'marquee-track-right'
        }`}
      >
        {loop.map((teacher, i) => (
          <TeacherCard key={`${teacher.id}-${i}`} teacher={teacher} />
        ))}
      </div>
    </div>
  )
}

export function TenagaPendidik() {
  const { teachers, sectionCopy } = useContent()
  const c = sectionCopy?.tenaga || {}
  const list = teachers?.length
    ? teachers.map((t) => ({ id: t.id, name: t.name, role: t.role, photo: t.image }))
    : staticTeachers
  const midpoint = Math.ceil(list.length / 2)
  const topRow = list.slice(0, midpoint)
  const bottomRow = list.slice(midpoint)

  return (
    <section
      id="tenaga-pendidik"
      className="tenaga"
      aria-labelledby="tenaga-title"
    >
      <div className="tenaga__inner">
        <div className="tenaga__head">
          <span className="tenaga__eyebrow">{c.eyebrow}</span>
          <h2 id="tenaga-title" className="tenaga__title">
            {c.titleStart} <em>{c.titleAccent}</em> {c.titleEnd}
          </h2>
          <p className="tenaga__lead">{c.lead}</p>
          <div className="tenaga__meta">
            <span>Berpengalaman</span>
            <i aria-hidden="true" />
            <span>Profesional</span>
            <i aria-hidden="true" />
            <span>Berkarakter</span>
          </div>
        </div>

        <div className="tenaga__marquees">
          <MarqueeRow items={topRow} direction="left" />
          <MarqueeRow items={bottomRow} direction="right" />
        </div>
      </div>
    </section>
  )
}
