import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Angka yang dianimasikan naik dari 0 saat konten selesai dimuat.
const NUMBER_SELECTOR = [
  '.magic-bento__figure-value',
  '.kpi-val',
  '.kpi-value',
  '.cms-kpi-value',
  '.stat-number',
  '[data-count]',
].join(', ');

// Angka yang sudah pernah dihitung tidak diulang saat tab berganti.
const countedNodes = new WeakSet();

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

// "1.234" (ribuan gaya Indonesia) dan "12,5" (desimal koma) sama-sama dikenali.
function parseNumberText(raw) {
  if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    return { value: Number(raw.replace(/\./g, '')), decimals: 0, grouped: true };
  }
  if (/^\d+,\d+$/.test(raw)) {
    return { value: Number(raw.replace(',', '.')), decimals: raw.split(',')[1].length, grouped: false };
  }
  if (/^\d+$/.test(raw)) {
    return { value: Number(raw), decimals: 0, grouped: false };
  }
  return null;
}

function formatNumber(value, { decimals, grouped }) {
  if (grouped) return Math.round(value).toLocaleString('id-ID');
  return decimals > 0 ? value.toFixed(decimals).replace('.', ',') : String(Math.round(value));
}

/**
 * Animasi masuk dashboard memakai anime.js.
 *
 * Dipakai khusus untuk momen skeleton/shimmer selesai: `ready` false → tidak
 * ada animasi (konten masih kerangka), `ready` true → blok konten masuk
 * berurutan (fade + naik) dan angka KPI menghitung naik dari 0.
 * Semua hanya transform/opacity + textContent, dan dibatalkan otomatis saat
 * tab berganti atau komponen dilepas.
 */
export function useAnimeEntrance({
  deps = [],
  ready = true,
  depth = 2,
  selector = '',
  maxTargets = 16,
  distance = 18,
  duration = 620,
  staggerMs = 45,
  countUp = true,
} = {}) {
  const containerRef = useRef(null);
  // Hitung naik hanya sekali per pemasangan, supaya ganti tab tidak mengulang
  // angka dari 0 (kedip).
  const countedOnceRef = useRef(false);

  useEffect(() => {
    if (!ready) return undefined;
    if (prefersReducedMotion() || document.visibilityState === 'hidden') return undefined;

    let frame = 0;
    let attempts = 0;
    let revealAnimation = null;
    const numberAnimations = [];
    const restoreText = [];

    const runCountUp = (container) => {
      const nodes = Array.from(container.querySelectorAll(NUMBER_SELECTOR));
      nodes.forEach((node, index) => {
        if (countedNodes.has(node)) return;
        const original = node.textContent;
        const parsed = parseNumberText(String(original ?? '').trim());
        if (!parsed || !Number.isFinite(parsed.value) || parsed.value === 0) return;

        countedNodes.add(node);
        const shape = { decimals: parsed.decimals, grouped: parsed.grouped };
        const proxy = { value: 0 };
        restoreText.push(() => {
          node.textContent = original;
        });
        node.textContent = formatNumber(0, shape);

        numberAnimations.push(
          animate(proxy, {
            value: parsed.value,
            duration: 900,
            delay: 140 + index * 70,
            ease: 'out(4)',
            onUpdate: () => {
              node.textContent = formatNumber(proxy.value, shape);
            },
            onComplete: () => {
              node.textContent = original;
            },
          }),
        );
      });
    };

    // Konten dashboard baru terpasang setelah data siap; tunggu beberapa frame.
    const run = () => {
      const container = containerRef.current;
      if (!container) {
        if (attempts < 90) {
          attempts += 1;
          frame = window.requestAnimationFrame(run);
        }
        return;
      }

      const targets = (selector
        ? Array.from(container.querySelectorAll(selector))
        : collectTargets(container, depth)
      )
        .filter((node) => node instanceof HTMLElement && node.offsetParent !== null)
        .slice(0, maxTargets);
      if (targets.length > 0) {
        revealAnimation = animate(targets, {
          opacity: [0, 1],
          translateY: [distance, 0],
          duration,
          delay: stagger(staggerMs, { start: 40 }),
          ease: 'out(3)',
        });
      }

      if (countUp && !countedOnceRef.current) {
        countedOnceRef.current = true;
        runCountUp(container);
      }
    };

    run();

    return () => {
      window.cancelAnimationFrame(frame);
      revealAnimation?.revert();
      numberAnimations.forEach((animation) => animation.revert());
      restoreText.forEach((restore) => restore());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, ready]);

  return containerRef;
}

export default useAnimeEntrance;
