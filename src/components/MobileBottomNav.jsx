import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MobileBottomNav.css';

const slideVariants = {
  enter: (direction) => ({ opacity: 0, x: direction >= 0 ? 56 : -56 }),
  center: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction >= 0 ? -56 : 56 }),
};

export default function MobileBottomNav({
  items = [],
  maxPerSlide = 4,
  className = '',
  label = 'Navigasi utama',
}) {
  const slides = useMemo(() => {
    if (!items.length) return [];
    const total = Math.ceil(items.length / maxPerSlide);
    const perSlide = Math.ceil(items.length / total);
    const result = [];
    for (let i = 0; i < items.length; i += perSlide) {
      result.push(items.slice(i, i + perSlide));
    }
    return result;
  }, [items, maxPerSlide]);

  const activeIndex = items.findIndex((item) => item.active);
  const slideCount = Math.max(1, slides.length);
  const perSlide = items.length ? Math.ceil(items.length / slideCount) : 1;
  const activeSlide = activeIndex >= 0
    ? Math.min(slideCount - 1, Math.floor(activeIndex / perSlide))
    : 0;

  // Saat user menekan dot/panah, posisi slide "dipin" sampai tab aktif berubah.
  const [view, setView] = useState({ slide: null, activeIndex: null });
  const [direction, setDirection] = useState(1);
  const isBrowsing = view.slide !== null && view.activeIndex === activeIndex;
  const current = isBrowsing
    ? Math.min(view.slide, slideCount - 1)
    : activeSlide;

  const goToSlide = (index) => {
    const next = Math.max(0, Math.min(index, slideCount - 1));
    if (next === current) return;
    setDirection(next > current ? 1 : -1);
    setView({ slide: next, activeIndex });
  };

  if (!slides.length) return null;

  const hasPrevious = current > 0;
  const hasNext = current < slides.length - 1;

  const handleItemClick = (item) => {
    setView({ slide: null, activeIndex: null });
    item.onClick?.();
  };

  return (
    <nav className={`ps-mobile-nav ${className}`.trim()} aria-label={label}>
      <motion.div
        className="ps-mobile-nav__wrap"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        {slides.length > 1 && (
          <div className="ps-mobile-nav__dots">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`ps-mobile-nav__dot ${current === index ? 'is-active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Halaman navigasi ${index + 1}`}
                aria-current={current === index ? 'true' : undefined}
              />
            ))}
          </div>
        )}

        <div className="ps-mobile-nav__shell">
          <div className="ps-mobile-nav__row">
            <button
              type="button"
              className={`ps-mobile-nav__arrow ${hasPrevious ? '' : 'is-hidden'}`}
              onClick={() => goToSlide(current - 1)}
              aria-label="Navigasi sebelumnya"
              tabIndex={hasPrevious ? 0 : -1}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="ps-mobile-nav__viewport">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={slideVariants}
                  className="ps-mobile-nav__slide"
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  {slides[current].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`ps-mobile-nav__item ${item.active ? 'is-active' : ''}`}
                        onClick={() => handleItemClick(item)}
                        aria-current={item.active ? 'page' : undefined}
                      >
                        {item.active && (
                          <motion.span
                            layoutId="psMobileActiveBg"
                            className="ps-mobile-nav__active-bg"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="ps-mobile-nav__content">
                          <Icon size={20} />
                          <AnimatePresence initial={false}>
                            {item.active && (
                              <motion.span
                                className="ps-mobile-nav__label"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              className={`ps-mobile-nav__arrow ${hasNext ? '' : 'is-hidden'}`}
              onClick={() => goToSlide(current + 1)}
              aria-label="Navigasi berikutnya"
              tabIndex={hasNext ? 0 : -1}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}
