import { useCallback, useEffect, useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TabActiveContext } from '@/components/ui/tab-active'
import { cn } from '@/lib/utils'

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}) => {
  const uid = useId()
  const reduceMotion = useReducedMotion()
  // Urutan & tab aktif disimpan sebagai VALUE (bukan elemen), supaya konten
  // panel selalu memakai props terbaru — data dari API yang datang belakangan
  // tetap tampil tanpa perlu klik tab ulang.
  const [order, setOrder] = useState(() => propTabs.map((t) => t.value))
  const [active, setActive] = useState(propTabs[0])
  const [hovering, setHovering] = useState(false)

  const tabValues = propTabs.map((t) => t.value).join('|')
  useEffect(() => {
    setOrder((prev) => {
      const fresh = propTabs.map((t) => t.value)
      const kept = prev.filter((value) => fresh.includes(value))
      const added = fresh.filter((value) => !kept.includes(value))
      return [...kept, ...added]
    })
  }, [tabValues]) // eslint-disable-line react-hooks/exhaustive-deps

  const orderedTabs = order
    .map((value) => propTabs.find((t) => t.value === value))
    .filter(Boolean)

  const moveSelectedTabToTop = useCallback((idx) => {
    const selected = propTabs[idx]
    if (!selected) return
    setOrder((prev) => [selected.value, ...prev.filter((v) => v !== selected.value)])
    setActive(selected)
    window.dispatchEvent(
      new CustomEvent('profil-tab-change', {
        detail: { tabIndex: idx, tabValue: selected.value },
      }),
    )
  }, [propTabs])

  // Mendengarkan pergantian tab dari navbar (misal: memilih Visi & Misi di navbar langsung membuka tab 2)
  useEffect(() => {
    const handleSwitch = (e) => {
      const { tabIndex, tabValue } = e.detail || {}
      if (typeof tabIndex === 'number' && propTabs[tabIndex]) {
        moveSelectedTabToTop(tabIndex)
      } else if (tabValue) {
        const found = propTabs.findIndex((t) => t.value === tabValue)
        if (found !== -1) moveSelectedTabToTop(found)
      }
    }
    window.addEventListener('open-profil-tab', handleSwitch)
    return () => window.removeEventListener('open-profil-tab', handleSwitch)
  }, [moveSelectedTabToTop, propTabs])

  return (
    <>
      <div
        className={cn(
          'no-visible-scrollbar relative flex w-full max-w-full flex-row items-center justify-start overflow-auto [perspective:1000px] sm:overflow-visible',
          containerClassName,
        )}
      >
        {propTabs.map((tab, idx) => (
          <button
            key={tab.title}
            type="button"
            onClick={() => moveSelectedTabToTop(idx)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            data-active={active.value === tab.value}
            className={cn('relative rounded-full px-4 py-2', tabClassName)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {active.value === tab.value && (
              <motion.div
                layoutId={`tab-pill-${uid}`}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', bounce: 0.3, duration: 0.5 }
                }
                className={cn(
                  'absolute inset-0 rounded-full bg-gray-200 dark:bg-zinc-800',
                  activeTabClassName,
                )}
              />
            )}

            <span className="relative block">{tab.title}</span>
          </button>
        ))}
      </div>

      <FadeInDiv
        tabs={orderedTabs}
        active={active}
        hovering={hovering}
        reduceMotion={reduceMotion}
        className={cn('mt-8', contentClassName)}
      />
    </>
  )
}

export const FadeInDiv = ({ className, tabs, hovering, reduceMotion }) => {
  const isActive = (tab) => tab.value === tabs[0].value

  return (
    <div className="relative grid">
      {tabs.map((tab, idx) => {
        const active = isActive(tab)

        return (
          <div
            key={tab.value}
            data-active={active}
            aria-hidden={!active}
            inert={!active}
            style={{
              gridArea: '1 / 1',
              zIndex: tabs.length - idx,
              opacity: active ? 1 : idx < 3 ? 1 - idx * 0.1 : 0,
              transform: reduceMotion
                ? 'none'
                : `scale(${active ? 1 : 1 - idx * 0.1})`,
              '--stack-step': !reduceMotion && hovering ? idx : 0,
            }}
            className={cn('relative h-full w-full', className)}
          >
            <TabActiveContext.Provider value={active}>
              {tab.content}
            </TabActiveContext.Provider>
          </div>
        )
      })}
    </div>
  )
}
