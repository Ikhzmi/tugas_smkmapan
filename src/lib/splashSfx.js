/**
 * SFX pembuka situs.
 *
 * Nada disintesis langsung lewat Web Audio API supaya tidak menambah berkas
 * audio baru. Browser tetap bisa memblokir suara sebelum ada interaksi
 * pengguna (kebijakan autoplay); dalam kondisi itu animasi berjalan tanpa suara
 * dan tidak ada error yang dilempar.
 */

// Kunci lama dari splash versi sebelumnya yang punya tombol suara. Nilai 'off'
// di sana membuat splash bisu selamanya karena tombolnya sudah tidak ada,
// jadi kunci itu dibersihkan dan suara selalu aktif.
const LEGACY_STORAGE_KEY = 'smk-mapan-splash-sound';

export function clearLegacySoundPreference() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* penyimpanan diblokir */
  }
}

clearLegacySoundPreference();

// Guard kecil untuk StrictMode: intro tidak diputar dua kali beruntun.
let lastIntroAt = 0;

export function createSplashSfx({ dark = false } = {}) {
  const Ctor =
    typeof window !== 'undefined'
      ? window.AudioContext || window.webkitAudioContext
      : null;

  let ctx = null;
  let master = null;
  let disposed = false;

  const ensureContext = () => {
    if (disposed || !Ctor) return null;
    if (ctx) return ctx;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
      master = null;
    }
    return ctx;
  };

  const tone = (
    frequency,
    { at = 0, duration = 0.6, gain = 0.08, type = 'sine', glide = 0 } = {},
  ) => {
    const audio = ensureContext();
    if (!audio || !master || audio.state !== 'running') return;

    try {
      const start = audio.currentTime + at;
      const osc = audio.createOscillator();
      const envelope = audio.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, start);
      if (glide) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, glide),
          start + duration,
        );
      }

      // Envelope pendek supaya tidak ada klik di awal/akhir nada.
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, gain),
        start + 0.015,
      );
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(envelope);
      envelope.connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch {
      /* node audio gagal dibuat — abaikan */
    }
  };

  return {
    async unlock() {
      const audio = ensureContext();
      if (!audio) return false;
      if (audio.state === 'running') return true;
      try {
        await audio.resume();
      } catch {
        return false;
      }
      return audio.state === 'running';
    },

    intro() {
      if (Date.now() - lastIntroAt < 700) return;
      lastIntroAt = Date.now();
      const root = dark ? 392 : 440;
      tone(root, { duration: 0.5, gain: 0.07 });
      tone(root * 1.5, { at: 0.08, duration: 0.62, gain: 0.045, type: 'triangle' });
    },

    tick() {
      tone(dark ? 932 : 1046, { duration: 0.08, gain: 0.02, type: 'triangle' });
    },

    finish() {
      const root = dark ? 523.25 : 587.33;
      [1, 1.25, 1.5].forEach((ratio, index) => {
        tone(root * ratio, {
          at: index * 0.045,
          duration: 0.9 - index * 0.1,
          gain: 0.05 - index * 0.008,
        });
      });
    },

    dispose() {
      disposed = true;
      try {
        if (ctx && ctx.state !== 'closed') ctx.close();
      } catch {
        /* abaikan */
      }
      ctx = null;
      master = null;
    },
  };
}
