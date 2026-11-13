import { useState, useEffect, useRef } from 'react';

/**
 * useHeaderScroll — hook auto-hide header saat scroll ke bawah,
 * dan reveal kembali (bertumpang tindih / floating overlay) saat scroll ke atas.
 * Mendukung window scroll, container scroll (capture phase), serta wheel direction.
 */
export function useHeaderScroll(threshold = 50) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = (e) => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const target = e?.target;
        let currentScrollY = 0;

        if (target && target !== window && target !== document && typeof target.scrollTop === 'number' && target.scrollTop > 0) {
          currentScrollY = target.scrollTop;
        } else {
          currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        }

        const delta = currentScrollY - lastScrollY.current;

        // Scroll ke bawah melewati threshold -> sembunyikan header
        if (delta > 6 && currentScrollY > threshold) {
          setIsHeaderHidden(true);
        }
        // Scroll ke atas sedikit saja atau kembali mendekati puncak -> langsung munculkan kembali (bertumpang tindih)
        else if (delta < -3 || currentScrollY <= threshold) {
          setIsHeaderHidden(false);
        }

        lastScrollY.current = Math.max(0, currentScrollY);
        ticking = false;
      });
    };

    // Backup listener untuk arah roda mouse (wheel) agar saat scroll ke atas langsung responsif
    const handleWheel = (e) => {
      if (e.deltaY < -10) {
        // User memutar roda mouse ke atas -> langsung reveal header bertumpang tindih
        setIsHeaderHidden(false);
      } else if (e.deltaY > 25) {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        if (y > threshold) {
          setIsHeaderHidden(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('wheel', handleWheel);
    };
  }, [threshold]);

  return isHeaderHidden;
}

