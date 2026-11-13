import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowDown,
  ArrowRight,
  Award,
  Briefcase,
  ChevronRight,
  GraduationCap,
  Play,
  Users,
} from 'lucide-react'
import StarBorder from '@/components/ui/star-border'
import { useContent, HERO_DEFAULTS } from '../../context/ContentContext'
import { VideoProfileModal } from './VideoProfileModal'
import './Hero.css'

const statIcons = [Users, Award, Briefcase]

export function Hero({ onOpenPpdb }) {
  const reduceMotion = useReducedMotion()
  const [videoOpen, setVideoOpen] = useState(false)
  const { hero } = useContent()
  const h = { ...HERO_DEFAULTS, ...(hero || {}) }
  const stats = (h.stats || HERO_DEFAULTS.stats).map((s, i) => ({
    ...s,
    icon: statIcons[i] || Award,
  }))
  const [scriptWord1, scriptWord2, scriptWord3] = h.scriptWords?.length === 3
    ? h.scriptWords
    : HERO_DEFAULTS.scriptWords

  /* Helper: fade-up dari bawah (elemen copy utama) */
  const fadeUp = (delay = 0, distance = 26) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: distance },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] },
        }

  /* Helper: fade-in murni (latar / overlay) */
  const fadeIn = (delay = 0, duration = 1.1) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration, delay, ease: 'easeOut' },
        }

  /* Helper: zoom-in ringan untuk backdrop foto */
  const zoomIn = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, scale: 1.06 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] },
        }

  /* Helper: slide masuk dari kanan untuk hero-script */
  const slideFromRight = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, x: 40, rotate: -6 },
          animate: { opacity: 1, x: 0, rotate: -6 },
          transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] },
        }

  /* Helper: slide naik dari bawah untuk footer */
  const slideUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
        }

  const handleScroll = () => {
    document
      .getElementById('profil')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <section id="beranda" className="hero" aria-labelledby="hero-title">
      {/* Backdrop foto — zoom-in halus */}
      <motion.img
        className="hero-backdrop"
        src={h.backgroundImage || '/images/hero-bg.jpg'}
        alt=""
        aria-hidden="true"
        {...zoomIn(0)}
      />
      {/* Veil overlay — fade-in */}
      <motion.span className="hero-veil" aria-hidden="true" {...fadeIn(0.2, 1.0)} />

      <div className="hero-inner">
        <div className="hero-copy">
          {/* Eyebrow tag */}
          <motion.p className="hero-eyebrow" {...fadeUp(0.1)}>
            <span className="hero-eyebrow__line" />
            {h.eyebrow}
          </motion.p>

          {/* Judul utama */}
          <motion.h1 id="hero-title" className="hero-title" {...fadeUp(0.18)}>
            <span>{h.titleLine1}</span>
            <span className="hero-title__accent">{h.titleAccent}</span>
            <span>{h.titleLine2}</span>
          </motion.h1>

          {/* Deskripsi */}
          <motion.p className="hero-desc" {...fadeUp(0.26)}>
            {h.desc}
          </motion.p>

          {/* CTA buttons */}
          <motion.div className="hero-actions" {...fadeUp(0.34)}>
            <StarBorder
              as="button"
              type="button"
              className="hero-cta"
              onClick={onOpenPpdb}
              color="#fff4ec"
              trailColor="#ffffff"
              duration={4.8}
              thickness={1.4}
              radius={999}
              trailLength={0.26}
              stars={1}
              glow={0.8}
              sparkle
              direction="clockwise"
              hover="lap"
              theme="dark"
              backgroundColor="transparent"
              borderColor="rgba(255, 255, 255, 0.24)"
              style={{
                background:
                  'linear-gradient(120deg, #ff5a0c 0%, #fe4000 58%, #f03200 100%)',
              }}
            >
              <GraduationCap className="hero-cta__icon" />
              <span>{h.ctaLabel}</span>
              <span className="hero-cta__arrow">
                <ArrowRight />
              </span>
            </StarBorder>

            <button
              type="button"
              className="hero-play"
              aria-label="Tonton video profil sekolah"
              aria-haspopup="dialog"
              onClick={() => setVideoOpen(true)}
            >
              <span className="hero-play__icon">
                <Play fill="currentColor" />
              </span>
              <span className="hero-play__label" style={{ whiteSpace: 'pre-line' }}>
                {h.videoLabel}
              </span>
            </button>
          </motion.div>

          {/* Stat cards — tiap card masuk staggered */}
          <ul className="hero-stats">
            {stats.map((stat, index) => (
              <motion.li
                key={index}
                className="hero-stat"
                {...(reduceMotion ? {} : {
                  initial: { opacity: 0, y: 32, scale: 0.96 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: {
                    duration: 0.65,
                    delay: 0.44 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  },
                })}
              >
                <stat.icon className="hero-stat__icon" />
                <span className="hero-stat__value">{stat.value}</span>
                <span className="hero-stat__label">{stat.label}</span>
                <span className="hero-stat__chevron">
                  <ChevronRight />
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Tagline handwritten — slide dari kanan */}
        {!reduceMotion ? (
          <motion.p className="hero-script" aria-hidden="true" {...slideFromRight(0.55)}>
            <span className="hero-script__quote">&ldquo;</span>
            <span className="hero-script__line">{scriptWord1}</span>
            <span className="hero-script__line hero-script__line--second">
              <span className="hero-script__underline">{scriptWord2}</span> {scriptWord3}
            </span>
          </motion.p>
        ) : (
          <p className="hero-script" aria-hidden="true">
            <span className="hero-script__quote">&ldquo;</span>
            <span className="hero-script__line">{scriptWord1}</span>
            <span className="hero-script__line hero-script__line--second">
              <span className="hero-script__underline">{scriptWord2}</span> {scriptWord3}
            </span>
          </p>
        )}

        {/* Footer — pagination & scroll button */}
        <div className="hero-footer">
          <motion.div className="hero-pagination" aria-hidden="true" {...slideUp(0.65)}>
            <span className="hero-pagination__item is-active">01</span>
            <span className="hero-pagination__track" />
            <span className="hero-pagination__item">02</span>
            <span className="hero-pagination__item">03</span>
          </motion.div>

          <motion.button
            type="button"
            className="hero-scroll"
            onClick={handleScroll}
            aria-label="Scroll untuk menjelajahi halaman"
            {...slideUp(0.72)}
          >
            <span className="hero-scroll__circle">
              <motion.span
                className="hero-scroll__arrow-icon"
                {...(reduceMotion ? {} : {
                  animate: { y: [0, 6, 0] },
                  transition: {
                    duration: 1.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1.2,
                  },
                })}
              >
                <ArrowDown />
              </motion.span>
            </span>
            <span className="hero-scroll__label">
              Scroll
              <br />
              untuk Jelajahi
            </span>
          </motion.button>
        </div>
      </div>

      <VideoProfileModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        src={h.videoUrl || '/profil.mp4'}
      />
    </section>
  )
}
