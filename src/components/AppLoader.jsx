import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../hooks/useTheme';
import './AppLoader.css';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(REDUCED_MOTION_QUERY).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event) => setReduced(event.matches);
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, []);

  return reduced;
}

/* Loader satu: tiga titik memantul — animasi "LoaderOne" Aceternity UI. */
function BouncingDots({ reduced }) {
  return (
    <div className="app-loader__dots" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="app-loader__dot"
          initial={{ y: 0 }}
          animate={reduced ? { y: 0 } : { y: [0, 10, 0] }}
          transition={{
            duration: 1,
            repeat: reduced ? 0 : Infinity,
            repeatType: 'loop',
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* Loader lima: teks bergelombang per huruf — animasi "LoaderFive" Aceternity UI. */
function WaveText({ text, reduced }) {
  return (
    <div className="app-loader__text" aria-hidden="true">
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className="app-loader__char"
          initial={{ scale: 1, opacity: reduced ? 1 : 0.45 }}
          animate={
            reduced
              ? { scale: 1, opacity: 1 }
              : {
                  scale: [1, 1.08, 1],
                  textShadow: [
                    '0 0 0 rgba(255, 107, 0, 0)',
                    '0 0 14px rgba(255, 107, 0, 0.45)',
                    '0 0 0 rgba(255, 107, 0, 0)',
                  ],
                  opacity: [0.45, 1, 0.45],
                }
          }
          transition={{
            duration: 0.5,
            repeat: reduced ? 0 : Infinity,
            repeatType: 'loop',
            delay: index * 0.05,
            ease: 'easeInOut',
            repeatDelay: reduced ? 0 : 1.4,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
}

/**
 * Layar tunggu bertema untuk dashboard admin/guru/siswa.
 * Menggantikan layar kosong saat sesi & profil masih diverifikasi.
 */
export default function AppLoader({ text = 'Menyiapkan dashboard' }) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();

  return (
    <div
      className="app-loader"
      data-theme={theme}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-loader__stage">
        <span className="app-loader__mark" aria-hidden="true">
          <img src="/logo.png" alt="" className="app-loader__logo" width="58" height="58" />
        </span>
        <WaveText text={text} reduced={reduced} />
        <BouncingDots reduced={reduced} />
      </div>
      <span className="app-loader__sr">{text}, mohon tunggu.</span>
    </div>
  );
}
