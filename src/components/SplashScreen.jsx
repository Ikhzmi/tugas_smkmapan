import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { createSplashSfx } from '../lib/splashSfx';
import './SplashScreen.css';

const WORDS = ['SMK', 'Muhammadiyah', '8', 'Medan'];
const LETTER_DELAY = 0.4;
const LETTER_STEP = 0.024;

/**
 * Pembuka situs: titik kecil tumbuh menjadi logo, lalu wordmark muncul
 * huruf demi huruf di atas latar bersih.
 *
 * Warna mengikuti tema efektif aplikasi: preferensi sistem sebagai default,
 * atau pilihan eksplisit pengguna yang tersimpan dari toggle.
 *
 * Animasi masuk memakai Motion; animasi keluar memakai CSS transition
 * supaya tetap mulus di compositor walau main thread sibuk (WebGL).
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const sfxRef = useRef(null);
  const leaveRef = useRef(null);
  const timersRef = useRef([]);

  const finish = useCallback(() => {
    document.documentElement.classList.remove('splash-lock');
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    document.documentElement.classList.add('splash-lock');

    const sfx = createSplashSfx({ dark: theme === 'dark' });
    sfxRef.current = sfx;
    void sfx.unlock().then((ok) => {
      if (ok) sfx.intro();
    });

    const timers = timersRef.current;

    const leave = () => {
      if (leaveRef.current === null) return;
      leaveRef.current = null;
      setLeaving(true);
      // Timer pengaman: lepas overlay walau transition tidak sempat jalan.
      timers.push(
        window.setTimeout(() => finish(), reduceMotion ? 260 : 520),
      );
    };
    leaveRef.current = leave;

    if (!reduceMotion) {
      timers.push(
        window.setTimeout(() => {
          void sfx.unlock().then((ok) => {
            if (ok) sfx.finish();
          });
        }, 1400),
      );
    }

    timers.push(
      window.setTimeout(leave, reduceMotion ? 520 : 1850),
    );

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') leave();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      leaveRef.current = null;
      timers.forEach((id) => window.clearTimeout(id));
      timers.length = 0;
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('splash-lock');
      sfx.dispose();
      if (sfxRef.current === sfx) sfxRef.current = null;
    };
  }, [finish, reduceMotion, theme, visible]);

  if (!visible) return null;

  let charIndex = 0;

  const wordmark = WORDS.map((word) => (
    <span className="splash__chunk" key={word}>
      {Array.from(word).map((character) => {
        const index = charIndex;
        charIndex += 1;

        return (
          <motion.span
            className="splash__char"
            key={`${word}-${index}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '70%' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: '0%' }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.6,
              delay: reduceMotion ? 0 : LETTER_DELAY + index * LETTER_STEP,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {character}
          </motion.span>
        );
      })}
    </span>
  ));

  return (
    <div
      className="splash"
      data-theme={theme}
      data-leaving={leaving ? 'true' : 'false'}
      aria-hidden={leaving ? 'true' : undefined}
      onClick={() => leaveRef.current?.()}
    >
      <span className="splash__sr" role="status" aria-live="polite">
        Memuat situs
      </span>

      <div className="splash__inner">
        <div className="splash__lockup">
          <div className="splash__mark" aria-hidden="true">
            <motion.span
              className="splash__pulse"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0.5, scale: 0.6 }}
              animate={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.55 }}
              transition={{ duration: reduceMotion ? 0 : 1.05, delay: 0.34, ease: 'easeOut' }}
            />
            <motion.img
              src="/logo.png"
              alt=""
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.16, rotate: -12 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                type: reduceMotion ? 'tween' : 'spring',
                duration: reduceMotion ? 0.2 : undefined,
                stiffness: 160,
                damping: 17,
                mass: 1,
                delay: reduceMotion ? 0 : 0.06,
              }}
            />
          </div>

          <span className="splash__wordmark" aria-hidden="true">
            {wordmark}
          </span>
          <span className="splash__sr">SMK Muhammadiyah 8 Medan</span>
        </div>

        <motion.p
          className="splash__tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: reduceMotion ? 0 : 1.05, ease: 'easeOut' }}
        >
          Mapan Learning Ecosystem
        </motion.p>
      </div>
    </div>
  );
}
