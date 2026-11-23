import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/**
 * Kumpulkan target masuk: anak langsung dari container, atau turun satu level
 * bila container hanya membungkus satu panel (mis. panel tab).
 */
function collectTargets(container, depth) {
  let nodes = Array.from(container.children);
  for (let level = 1; level < depth; level += 1) {
    if (nodes.length !== 1) break;
    nodes = Array.from(nodes[0].children);
  }

  return nodes.filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
}

/**
 * Animasi masuk (fade + naik) untuk item dashboard memakai anime.js.
 *
 * Semua target dianimasikan berurutan dengan stagger, hanya transform/opacity,
 * dan dibatalkan otomatis saat tab berganti atau komponen dilepas. Pengguna
 * dengan preferensi reduced motion langsung melihat konten tanpa animasi.
 */
export function useAnimeEntrance({
  deps = [],
  depth = 2,
  maxTargets = 14,
  distance = 18,
  duration = 620,
  staggerMs = 45,
} = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || document.visibilityState === 'hidden') return undefined;

    let frame = 0;
    let attempts = 0;
    let animation = null;

    // Dashboard kadang baru memasang kontainer setelah profil/kelas siap,
    // jadi tunggu beberapa frame sebelum menyerah.
    const run = () => {
      const container = containerRef.current;
      if (!container) {
        if (attempts < 90) {
          attempts += 1;
          frame = window.requestAnimationFrame(run);
        }
        return;
      }

      const targets = collectTargets(container, depth).slice(0, maxTargets);
      if (targets.length === 0) return;

      animation = animate(targets, {
        opacity: [0, 1],
        translateY: [distance, 0],
        duration,
        delay: stagger(staggerMs, { start: 40 }),
        ease: 'out(3)',
      });
    };

    run();

    return () => {
      window.cancelAnimationFrame(frame);
      animation?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

export default useAnimeEntrance;
