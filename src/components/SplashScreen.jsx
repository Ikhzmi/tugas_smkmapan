import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { createSplashSfx } from '../lib/splashSfx';
import { markSplashDone, markSplashLeaving } from '../lib/splashGate';
import './SplashScreen.css';

const WORDS = ['SMK', 'Muhammadiyah', '8', 'Medan'];

// Tiga babak, semuanya transform/opacity lewat CSS agar jalan di compositor:
//   1. logo besar terbentuk di tengah,
//   2. logo bergeser ke posisi lockup sambil mengecil,
//   3. teks muncul setelah logo mendarat.
const STAGE_MOVE_MS = 800;
const STAGE_TEXT_MS = 750;
const INTRO_FALLBACK_MS = 4000;
const MIN_SPLASH_MS = 3050;
// Dashboard tetap menampilkan splash berlogo, hanya lebih singkat supaya
// tidak menahan pengguna yang baru login.
const MIN_DASHBOARD_SPLASH_MS = 1500;
const MIN_SPLASH_REDUCED_MS = 620;
const MAX_LANDING_WAIT_MS = 25000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Splash tetap diputar di dashboard (logo sekolah jadi pembuka), tetapi
// dengan durasi minimum lebih pendek agar tidak menahan pengguna.
const DASHBOARD_PATHS = ['/admin/dashboard', '/admin/cms', '/guru/dashboard', '/lms/dashboard'];

function isDashboardPath(pathname) {
  return DASHBOARD_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

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
 *   1. logo besar terbentuk di tengah (cincin tipis + logo membesar),
 *   2. logo bergeser ke posisi lockup sambil mengecil,
 *   3. wordmark muncul huruf demi huruf, lalu tagline.
 *
 * Splash juga menahan diri sampai konten hero dari API dan aset visualnya siap,
 * lalu membuka halaman dengan transisi ringan berbasis compositor.
 */
export default function SplashScreen() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [landingAssetsReady, setLandingAssetsReady] = useState(false);
  const { theme } = useTheme();
  const { heroReady, hero } = useContent();
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  // '' → logo terbentuk di tengah, 'lockup' → logo mendarat, 'text' → teks.
  const [stage, setStage] = useState('form');
  // Splash tidak boleh menutup sebelum seluruh koreografi selesai.
  const [introDone, setIntroDone] = useState(prefersReducedMotion);
  const [shiftX, setShiftX] = useState(0);
  const isLanding = pathname === '/';
  const isDashboard = isDashboardPath(pathname);
  const canDismiss = !isLanding || landingAssetsReady;

  const mountedAtRef = useRef(0);
  const leavingRef = useRef(false);
  const sfxRef = useRef(null);
  const finishTimerRef = useRef(null);
  const maxWaitTimerRef = useRef(null);
  const lockupRef = useRef(null);
  const wordmarkRef = useRef(null);
  // Nilai terbaru untuk listener/sfx tanpa memicu effect berjalan ulang.
  const themeRef = useRef(theme);
  const dismissRef = useRef(null);

  const finish = useCallback(() => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    document.documentElement.classList.remove('splash-lock');
    setVisible(false);
    markSplashDone();
  }, []);

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    markSplashLeaving();

    const sfx = sfxRef.current;
    if (sfx) {
      void sfx.unlock().then((ok) => {
        if (ok) sfx.finish();
      });
    }

    // transitionend mempercepat penutupan; timeout tetap jadi fallback.
    finishTimerRef.current = window.setTimeout(finish, reduceMotion ? 220 : 560);
  }, [finish, reduceMotion]);

  // Escape selalu memakai versi terbaru tanpa memasang ulang listener audio.
  useEffect(() => {
    themeRef.current = theme;
    dismissRef.current = dismiss;
  }, [dismiss, theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event) => setReduceMotion(event.matches);
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, []);

  // Saat teks belum muncul, logo digeser agar benar-benar di tengah layar.
  useLayoutEffect(() => {
    if (!visible) return;
    const lockup = lockupRef.current;
    const wordmark = wordmarkRef.current;
    if (!lockup || !wordmark) return;

    const gap = Number.parseFloat(getComputedStyle(lockup).columnGap || '0') || 0;
    const width = wordmark.getBoundingClientRect().width;
    setShiftX(Math.max(0, (width + gap) / 2));
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;

    // Lebar teks bisa berubah setelah webfont siap; perbarui sebelum beranjak.
    let cancelled = false;
    document.fonts?.ready
      ?.then(() => {
        if (cancelled) return;
        const lockup = lockupRef.current;
        const wordmark = wordmarkRef.current;
        if (!lockup || !wordmark) return;
        const gap = Number.parseFloat(getComputedStyle(lockup).columnGap || '0') || 0;
        setShiftX(Math.max(0, (wordmark.getBoundingClientRect().width + gap) / 2));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || reduceMotion) return undefined;

    const toLockup = window.setTimeout(() => {
      setStage('lockup');
      sfxRef.current?.tick();
    }, STAGE_MOVE_MS);

    const toText = window.setTimeout(() => {
      setStage('text');
      sfxRef.current?.tick();
    }, STAGE_MOVE_MS + STAGE_TEXT_MS);

    // Jaring pengaman kalau animasi tagline tidak sempat jalan.
    const done = window.setTimeout(() => setIntroDone(true), INTRO_FALLBACK_MS);

    // Di dashboard, logo + wordmark sudah cukup sebagai pembuka; tagline
    // tidak ditunggu agar pengguna tidak menunggu terlalu lama.
    const quickDone = isDashboard
      ? window.setTimeout(() => setIntroDone(true), STAGE_MOVE_MS + STAGE_TEXT_MS)
      : null;

    return () => {
      window.clearTimeout(toLockup);
      window.clearTimeout(toText);
      window.clearTimeout(done);
      if (quickDone) window.clearTimeout(quickDone);
    };
  }, [isDashboard, reduceMotion, visible]);

  // Audio disiapkan sekali saja: kalau effect ini ikut berjalan ulang karena
  // tema/mode berubah, AudioContext lama ditutup dan suara pembuka terputus.
  useEffect(() => {
    if (!visible) return undefined;

    document.documentElement.classList.add('splash-lock');
    if (!mountedAtRef.current) mountedAtRef.current = Date.now();

    const sfx = createSplashSfx({ dark: themeRef.current === 'dark' });
    sfxRef.current = sfx;

    // Splash menutupi seluruh layar, jadi setiap klik di atasnya sekaligus
    // menutup splash — intro tidak pernah sempat terdengar. Yang perlu disiapkan
    // hanya nada penutup, dan browser baru mengizinkannya setelah ada interaksi:
    // kalau splash ditutup otomatis (tanpa klik), nada itu menyusul pada
    // sentuhan pertama pengguna.
    void sfx.unlock().then((ok) => {
      if (ok && !leavingRef.current) sfx.intro();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dismissRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
      document.documentElement.classList.remove('splash-lock');
      markSplashDone();
      if (sfxRef.current === sfx) sfxRef.current = null;

      // Sudah berbunyi (atau tidak akan pernah bisa): aman ditutup sekarang.
      if (sfx.hasPlayed()) {
        sfx.dispose();
        return;
      }

      // Belum ada interaksi: biarkan konteks siap supaya nada penutup bisa
      // diputar pada gestur pertama, lalu tutup setelah selesai.
      const gestureTypes = ['pointerdown', 'keydown', 'touchstart'];
      let released = false;
      let spareTimer = 0;
      const release = () => {
        if (released) return;
        released = true;
        gestureTypes.forEach((type) =>
          window.removeEventListener(type, onFirstGesture, { capture: true }),
        );
        window.clearTimeout(spareTimer);
        sfx.dispose();
      };
      const onFirstGesture = () => {
        // Nada penutup yang tadi tertahan autoplay diputar sekarang — kecuali
        // dismiss() sudah sempat memutarnya sendiri.
        void sfx.unlock().then((ok) => {
          if (ok && !sfx.hasPlayed()) sfx.finish();
          // Beri waktu nada selesai sebelum konteks ditutup.
          window.setTimeout(release, 2600);
        });
      };
      gestureTypes.forEach((type) =>
        window.addEventListener(type, onFirstGesture, { capture: true, passive: true }),
      );
      spareTimer = window.setTimeout(release, 12000);
    };
  }, [visible]);

  // Batas tunggu aset beranda dipisah agar tidak mengganggu siklus audio.
  useEffect(() => {
    if (!visible || !isLanding) return undefined;

    maxWaitTimerRef.current = window.setTimeout(() => {
      setLandingAssetsReady(true);
    }, MAX_LANDING_WAIT_MS);

    return () => {
      if (maxWaitTimerRef.current) window.clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    };
  }, [isLanding, visible]);

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

    const minimum = reduceMotion
      ? MIN_SPLASH_REDUCED_MS
      : (isDashboard ? MIN_DASHBOARD_SPLASH_MS : MIN_SPLASH_MS);
    const remaining = Math.max(0, minimum - (Date.now() - mountedAtRef.current));
    const timer = window.setTimeout(dismiss, remaining);
    return () => window.clearTimeout(timer);
  }, [canDismiss, dismiss, introDone, isDashboard, leaving, reduceMotion, visible]);

  if (!visible) return null;

  let charIndex = 0;

  const wordmark = WORDS.map((word) => (
    <span className="splash__chunk" key={word}>
      {Array.from(word).map((character) => {
        const index = charIndex;
        charIndex += 1;

        return (
          <span
            className="splash__char"
            key={`${word}-${index}`}
            style={{ '--i': index }}
          >
            {character}
          </span>
        );
      })}
    </span>
  ));

  return (
    <div
      className="splash"
      data-theme={theme}
      data-stage={stage}
      data-leaving={leaving ? 'true' : 'false'}
      onAnimationEnd={(event) => {
        if (event.target.classList.contains('splash__tagline')) setIntroDone(true);
      }}
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
        <div
          className="splash__lockup"
          ref={lockupRef}
          style={{ '--shift-x': `${shiftX}px` }}
        >
          <div className="splash__mark" aria-hidden="true">
            <svg className="splash__ring" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="97" />
            </svg>

            <div className="splash__mark-clip">
              <img src="/logo.png" alt="" />
            </div>
          </div>

          <span className="splash__wordmark" aria-hidden="true" ref={wordmarkRef}>
            {wordmark}
          </span>
          <span className="splash__sr">SMK Muhammadiyah 8 Medan</span>
        </div>

        <p className="splash__tagline">Mapan Learning Ecosystem</p>
      </div>
    </div>
  );
}
