import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './VideoProfileModal.css'

export function VideoProfileModal({ open, onClose, src, title = 'Video Profil Sekolah' }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="video-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="video-modal__panel">
        <div className="video-modal__bar">
          <div className="video-modal__meta">
            <span className="video-modal__dot" aria-hidden="true" />
            <div>
              <p className="video-modal__eyebrow">SMK Muhammadiyah 8 Medan</p>
              <p className="video-modal__title">{title}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="video-modal__close"
            onClick={onClose}
            aria-label="Tutup video"
          >
            <X />
          </button>
        </div>

        <div className="video-modal__stage">
          <video
            src={src}
            poster="/images/profil-poster.jpg"
            controls
            autoPlay
            playsInline
            preload="metadata"
          >
            Browser Anda tidak mendukung pemutaran video.
          </video>
        </div>
      </div>
    </div>,
    document.body,
  )
}
