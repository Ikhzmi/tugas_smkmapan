import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { createSplashSfx } from '../lib/splashSfx';
import './SplashScreen.css';

const WORDS = ['SMK', 'Muhammadiyah', '8', 'Medan'];
const LETTER_DELAY = 0.4;
const LETTER_STEP = 0.024;
const MIN_SPLASH_MS = 1850;
const MAX_LANDING_WAIT_MS = 25000;

function waitForImage(image, timeoutMs = 12000) {
  if (!image) return Promise.resolve();

  const decode = () => {
    if (typeof image.decode !== 'function') return Promise.resolve();
    return image.decode().catch(() => undefined);
  };

  if (image.complete) {
    return image.naturalWidth > 0 ? decode() : Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', finish);
      void decode().finally(resolve);
    };
    const handleLoad = () => finish();
    const timeoutId = window.setTimeout(finish, timeoutMs);

    image.addEventListener('load', handleLoad, { once: true });
    image.addEventListener('error', finish, { once: true });
    if (image.complete) finish();
  });
}

function nextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

async function waitForLandingVisuals() {
  await nextFrame();

  const heroImage = document.querySelector('.hero-backdrop');
  const splashLogo = document.querySelector('.splash__mark img');
  const brandLogo = document.querySelector('.landing-root img[alt^="Logo"]');

  const imagePromises = [heroImage, splashLogo, brandLogo]
    .filter(Boolean)
    .map((image) => waitForImage(image));

  const fontsPromise = document.fonts?.ready
    ? Promise.race([
        document.fonts.ready.catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 1800)),
      ])
    : Promise.resolve();

  await Promise.all([...imagePromises, fontsPromise]);
  await nextFrame();
}

/**
 * Splash pembuka menunggu konten beranda dari API dan aset visual hero siap,
 * lalu membuka halaman dengan transisi ringan berbasis compositor.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [landingAssetsReady, setLandingAssetsReady] = useState(false);
  const { theme } = useTheme();
  const { heroReady, hero } = useContent();
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const isLanding = pathname === '/';
  const canDismiss = !isLanding || landingAssetsReady;
  const mountedAtRef = useRef(0);
  const leavingRef = useRef(false);
  const sfxRef = useRef(null);
  const finishTimerRef = useRef(null);
  const maxWaitTimerRef = useRef(null);

  const finish = useCallback(() => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    document.documentElement.classList.remove('splash-lock');
    setVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);

    const sfx = sfxRef.current;
    if (sfx) {
      void sfx.unlock().then((ok) => {
        if (ok) sfx.finish();
      });
    }

    // transitionend mempercepat penutupan; timeout tetap jadi fallback.
    finishTimerRef.current = window.setTimeout(finish, reduceMotion ? 220 : 560);
  }, [finish, reduceMotion]);

  useEffect(() => {
    if (!visible) return undefined;

    document.documentElement.classList.add('splash-lock');
    if (!mountedAtRef.current) mountedAtRef.current = Date.now();

    const sfx = createSplashSfx({ dark: theme === 'dark' });
    sfxRef.current = sfx;
    void sfx.unlock().then((ok) => {
      if (ok) sfx.intro();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);

    if (isLanding) {
      maxWaitTimerRef.current = window.setTimeout(() => {
        setLandingAssetsReady(true);
      }, MAX_LANDING_WAIT_MS);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (maxWaitTimerRef.current) window.clearTimeout(maxWaitTimerRef.current);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
      maxWaitTimerRef.current = null;
      finishTimerRef.current = null;
      document.documentElement.classList.remove('splash-lock');
      sfx.dispose();
      if (sfxRef.current === sfx) sfxRef.current = null;
    };
  }, [dismiss, isLanding, theme, visible]);

  useEffect(() => {
    if (!visible || !isLanding || !heroReady) return undefined;

    let cancelled = false;
    void waitForLandingVisuals().then(() => {
      if (!cancelled) setLandingAssetsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [hero.backgroundImage, heroReady, isLanding, visible]);

  useEffect(() => {
    if (!visible || leaving || !canDismiss) return undefined;

    const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAtRef.current));
    const timer = window.setTimeout(dismiss, remaining);
    return () => window.clearTimeout(timer);
  }, [canDismiss, dismiss, leaving, visible]);

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
      onClick={dismiss}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === 'opacity' && leaving) {
          finish();
        }
      }}
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
