import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  motion,
  useAnimate,
  useMotionValue,
} from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { createSplashSfx } from '../lib/splashSfx';
import './SplashScreen.css';

const WORDS = ['SMK', 'Muhammadiyah', '8', 'Medan'];

// Babak 1: logo besar terbentuk di tengah. Babak 2: logo mengecil ke
// posisi lockup. Babak 3: teks muncul setelah logo mendarat.
const LOGO_DELAY = 0.05;
const LOGO_DURATION = 0.8;
const MARK_SCALE = 1.55;
const MOVE_DURATION = 0.7;
const RIPPLE_DELAY = 0.2;
const RIPPLE_DURATION = 1.15;
const LETTER_STEP = 0.018;
const LETTER_DURATION = 0.55;
const TAGLINE_DELAY = 0.72;
const MIN_SPLASH_MS = 3150;
const MIN_SPLASH_REDUCED_MS = 620;
const INTRO_FALLBACK_MS = 3600;
const MAX_LANDING_WAIT_MS = 25000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

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
  const splashLogo = document.querySelector('.splash__mark-clip img');
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
 * Splash pembuka tiga babak:
 *   1. logo besar terbentuk di tengah (iris membuka + cincin menggambar),
 *   2. logo bergeser ke posisi lockup sambil mengecil,
 *   3. wordmark muncul huruf demi huruf, lalu tagline.
 *
 * Splash juga menahan diri sampai konten hero dari API dan aset visualnya siap,
 * lalu membuka halaman dengan transisi ringan berbasis compositor.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [landingAssetsReady, setLandingAssetsReady] = useState(false);
  const { theme } = useTheme();
  const { heroReady, hero } = useContent();
  const { pathname } = useLocation();
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  // Splash tidak boleh menutup sebelum seluruh koreografi selesai.
  const [introDone, setIntroDone] = useState(prefersReducedMotion);
  const isLanding = pathname === '/';
  const canDismiss = !isLanding || landingAssetsReady;

  const mountedAtRef = useRef(0);
  const leavingRef = useRef(false);
  const sfxRef = useRef(null);
  const finishTimerRef = useRef(null);
  const maxWaitTimerRef = useRef(null);
  const [scope, animateInScope] = useAnimate();
  const lockupRef = useRef(null);
  const wordmarkRef = useRef(null);
  const timelineRef = useRef(null);

  // Saat teks belum muncul, logo digeser agar benar-benar di tengah layar.
  const lockupX = useMotionValue(0);

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
    timelineRef.current?.forEach((controls) => controls.stop?.());

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
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event) => setReduceMotion(event.matches);
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, []);

  // Ukur lebar wordmark (tanpa mengubah layout) sebagai jarak kompensasi.
  useLayoutEffect(() => {
    if (!visible || reduceMotion) return;
    const lockup = lockupRef.current;
    const wordmark = wordmarkRef.current;
    if (!lockup || !wordmark) return;

    const gap = Number.parseFloat(getComputedStyle(lockup).columnGap || '0') || 0;
    const width = wordmark.getBoundingClientRect().width;
    lockupX.set(Math.max(0, (width + gap) / 2));
  }, [lockupX, reduceMotion, visible]);

  useEffect(() => {
    if (!visible || reduceMotion) return undefined;

    // Lebar teks bisa berubah setelah webfont siap; perbarui sebelum beranjak.
    let cancelled = false;
    document.fonts?.ready
      ?.then(() => {
        if (cancelled) return;
        const lockup = lockupRef.current;
        const wordmark = wordmarkRef.current;
        if (!lockup || !wordmark) return;
        const gap = Number.parseFloat(getComputedStyle(lockup).columnGap || '0') || 0;
        lockupX.set(Math.max(0, (wordmark.getBoundingClientRect().width + gap) / 2));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [lockupX, reduceMotion, visible]);

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
      timelineRef.current?.stop?.();
      timelineRef.current = null;
      maxWaitTimerRef.current = null;
      finishTimerRef.current = null;
      document.documentElement.classList.remove('splash-lock');
      sfx.dispose();
      if (sfxRef.current === sfx) sfxRef.current = null;
    };
  }, [dismiss, isLanding, theme, visible]);

  // Babak 2: geser komposisi ke tengah bersamaan dengan munculnya teks.
  // Satu timeline imperatif: babak logo, lalu babak teks. Semua fase
  // dijadwalkan paralel dengan delay masing-masing agar tidak saling menunggu.
  useEffect(() => {
    if (!visible || !scope.current) return undefined;

    timelineRef.current?.forEach((controls) => controls.stop?.());

    const controls = [];
    let cancelled = false;
    // Jaring pengaman bila frame sempat tersendat (landing WebGL sibuk).
    const introFallback = window.setTimeout(() => setIntroDone(true), INTRO_FALLBACK_MS);

    if (reduceMotion) {
      const root = scope.current;
      const clip = root.querySelector('.splash__mark-clip');
      const logo = root.querySelector('.splash__mark-clip img');
      const tagline = root.querySelector('.splash__tagline');

      if (clip) clip.style.clipPath = 'none';
      if (logo) {
        logo.style.opacity = '1';
        logo.style.transform = 'none';
      }
      root.querySelectorAll('.splash__char').forEach((char) => {
        char.style.opacity = '1';
        char.style.transform = 'none';
      });
      if (tagline) tagline.style.opacity = '1';
      const mark = root.querySelector('.splash__mark');
      if (mark) mark.style.transform = 'none';
      lockupX.set(0);
      return () => window.clearTimeout(introFallback);
    }

    // ── Babak 1: logo besar terbentuk dari inti ─────────────────────────
    controls.push(
      animateInScope(
        '.splash__ripple',
        { opacity: [0.42, 0], scale: [0.82, 1.55] },
        {
          duration: RIPPLE_DURATION,
          delay: RIPPLE_DELAY,
          ease: 'easeOut',
        },
      ),
      animateInScope(
        '.splash__mark-clip img',
        { opacity: [0, 1], scale: [1.2, 1], rotate: [-8, 0] },
        { duration: LOGO_DURATION, delay: LOGO_DELAY, ease: [0.16, 1, 0.3, 1] },
      ),
    );

    const formation = animateInScope(
      '.splash__mark-clip',
      { clipPath: ['circle(0% at 50% 50%)', 'circle(100% at 50% 50%)'] },
      { duration: LOGO_DURATION, delay: LOGO_DELAY, ease: [0.65, 0, 0.35, 1] },
    );
    controls.push(formation);

    // ── Babak 2: logo bergeser ke posisi lockup sambil mengecil ──────────
    formation.then(() => {
      if (cancelled) return;
      // Ketukan halus: logo selesai terbentuk, komposisi mulai beranjak.
      sfxRef.current?.tick();

      const move = animateInScope(
        lockupX,
        0,
        { duration: MOVE_DURATION, ease: [0.22, 1, 0.36, 1] },
      );
      controls.push(
        move,
        animateInScope(
          '.splash__mark',
          { scale: 1 },
          { duration: MOVE_DURATION, ease: [0.22, 1, 0.36, 1] },
        ),
      );

      // ── Babak 3: teks muncul, dimulai setelah logo mendarat ───────────
      move.then(() => {
        if (cancelled) return;
        // Ketukan kedua: logo mendarat, teks mulai muncul.
        sfxRef.current?.tick();

        controls.push(
          animateInScope(
            '.splash__char',
            { opacity: [0, 1], y: ['70%', '0%'] },
            {
              duration: LETTER_DURATION,
              delay: (index) => index * LETTER_STEP,
              ease: [0.16, 1, 0.3, 1],
            },
          ),
        );

        const tagline = animateInScope(
          '.splash__tagline',
          { opacity: [0, 1] },
          { duration: 0.45, delay: TAGLINE_DELAY, ease: 'easeOut' },
        );
        controls.push(tagline);
        tagline.then(() => {
          if (!cancelled) setIntroDone(true);
        });
      });
    });

    timelineRef.current = controls;

    return () => {
      cancelled = true;
      window.clearTimeout(introFallback);
      controls.forEach((item) => item.stop?.());
    };
  }, [animateInScope, lockupX, reduceMotion, scope, visible]);

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
    if (!visible || leaving || !canDismiss || !introDone) return undefined;

    const minimum = reduceMotion ? MIN_SPLASH_REDUCED_MS : MIN_SPLASH_MS;
    const remaining = Math.max(0, minimum - (Date.now() - mountedAtRef.current));
    const timer = window.setTimeout(dismiss, remaining);
    return () => window.clearTimeout(timer);
  }, [canDismiss, dismiss, introDone, leaving, reduceMotion, visible]);

  if (!visible) return null;

  let charIndex = 0;

  const wordmark = WORDS.map((word) => (
    <span className="splash__chunk" key={word}>
      {Array.from(word).map((character) => {
        const index = charIndex;
        charIndex += 1;

        return (
          <span className="splash__char" key={`${word}-${index}`}>
            {character}
          </span>
        );
      })}
    </span>
  ));

  return (
    <div
      className="splash"
      ref={scope}
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
        <motion.div
          className="splash__lockup"
          ref={lockupRef}
          style={{ x: reduceMotion ? 0 : lockupX }}
        >
          <div
            className="splash__mark"
            style={{ '--mark-scale': MARK_SCALE }}
            aria-hidden="true"
          >
            <svg className="splash__ring" viewBox="0 0 200 200">
              <circle className="splash__ring-track" cx="100" cy="100" r="97" pathLength="1" />
              <circle
                className="splash__ring-draw"
                cx="100"
                cy="100"
                r="97"
                pathLength="1"
              />
            </svg>

            <span className="splash__ripple" />

            <div className="splash__mark-clip">
              <img src="/logo.png" alt="" />
            </div>
          </div>

          <span className="splash__wordmark" aria-hidden="true" ref={wordmarkRef}>
            {wordmark}
          </span>
          <span className="splash__sr">SMK Muhammadiyah 8 Medan</span>
        </motion.div>

        <p className="splash__tagline">Mapan Learning Ecosystem</p>
      </div>
    </div>
  );
}
