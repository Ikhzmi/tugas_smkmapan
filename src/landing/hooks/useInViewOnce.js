import { useEffect, useRef, useState } from 'react'

/**
 * true setelah elemen mendekati viewport, dan tetap true sesudahnya.
 *
 * Dipakai menunda mount visual berat (WebGL / three.js) sampai benar-benar
 * dibutuhkan. Tanpa ini, kembali ke beranda lewat tombol back harus menyiapkan
 * semua kanvas sekaligus dan memblokir main thread ~1,5 detik.
 */
export default function useInViewOnce({ rootMargin = '400px 0px', threshold = 0 } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (inView) return undefined
    const node = ref.current
    if (!node) return undefined
    if (typeof IntersectionObserver !== 'function') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, rootMargin, threshold])

  return [ref, inView]
}
