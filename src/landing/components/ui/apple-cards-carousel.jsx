import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Carousel({ items, initialScroll = 0, className }) {
  const carouselRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    el.scrollLeft = initialScroll
    checkScrollability()
    window.addEventListener('resize', checkScrollability)
    return () => window.removeEventListener('resize', checkScrollability)
  }, [initialScroll, checkScrollability])

  const scrollBy = (direction) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollBy({
      left: direction * Math.max(320, el.clientWidth * 0.7),
      behavior: 'smooth',
    })
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={carouselRef}
        onScroll={checkScrollability}
        className="ekskul-track flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.6,
              delay: index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="shrink-0 snap-start"
          >
            {item}
          </motion.div>
        ))}
        <div className="w-px shrink-0 sm:w-6" aria-hidden="true" />
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-[var(--ekskul-muted)]">
          Geser untuk melihat semua ekstrakurikuler
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Sebelumnya"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--ekskul-arrow-border)] bg-[var(--ekskul-arrow-bg)] text-[var(--ekskul-arrow-ink)] transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Berikutnya"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--ekskul-arrow-border)] bg-[var(--ekskul-arrow-bg)] text-[var(--ekskul-arrow-ink)] transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Card({ card, index }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, handleClose])

  return (
    <>
      <motion.button
        type="button"
        layoutId={`ekskul-card-${index}`}
        onClick={() => setOpen(true)}
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        aria-label={`Lihat detail ${card.title}`}
        aria-haspopup="dialog"
        style={{ '--accent': card.accent }}
        className="group relative block h-[27rem] w-[18.5rem] overflow-hidden rounded-[28px] border border-white/15 bg-[#0b1220] text-left shadow-[0_40px_80px_-42px_rgba(8,15,28,0.8)] md:h-[31rem] md:w-[21.5rem]"
      >
        <div className="absolute inset-0 overflow-hidden bg-neutral-800">
          <img
            src={card.src}
            alt={card.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={cn(
              'h-full w-full object-cover grayscale-[65%] transition-[opacity,transform] duration-700 group-hover:scale-[1.04]',
              loaded ? 'opacity-85' : 'opacity-0',
            )}
          />
          <div
            className="absolute inset-0 opacity-60 mix-blend-color"
            style={{
              background: `linear-gradient(155deg, ${card.accent} 8%, #0b1220 82%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-[#05070e]/40 to-[#05070e]/5" />
        </div>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5">
          <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
            {card.category}
          </span>
          <span
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md"
            style={{ color: card.accent }}
          >
            {card.icon}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <motion.p
            layoutId={`ekskul-title-${index}`}
            className="text-2xl font-bold leading-tight tracking-tight text-white"
          >
            {card.title}
          </motion.p>
          <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
            <Clock className="h-3.5 w-3.5" />
            {card.subtitle}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
            Lihat detail
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleClose}
                className="absolute inset-0 bg-[#05070e]/80 backdrop-blur-lg"
              />

              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={card.title}
                initial={{ opacity: 0, y: 26, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-black/10 bg-white p-3 shadow-2xl sm:p-4 dark:border-white/10 dark:bg-[#0b0f17]"
              >
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Tutup detail"
                  className="absolute right-6 top-6 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative h-52 overflow-hidden rounded-[20px] bg-neutral-800 sm:h-64 md:h-72">
                  <img
                    src={card.src}
                    alt={card.title}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 opacity-55 mix-blend-color"
                    style={{
                      background: `linear-gradient(150deg, ${card.accent} 5%, #05070e 90%)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-[#05070e]/25 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                    {card.category}
                  </span>
                  <motion.p
                    layoutId={`ekskul-title-${index}`}
                    className="absolute inset-x-5 bottom-5 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
                  >
                    {card.title}
                  </motion.p>
                </div>

                <div className="px-2 py-5 sm:px-3">
                  {card.content}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
