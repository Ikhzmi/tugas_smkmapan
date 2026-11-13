import successSound from '../assets/notifications/success.mp3';
import warningSound from '../assets/notifications/warning.mp3';
import failedSound from '../assets/notifications/failed.mp3';

const SOURCES = {
  success: successSound,
  warning: warningSound,
  failed: failedSound,
};

const cache = new Map();

/**
 * Putar notifikasi suara.
 * @param {'success'|'warning'|'failed'} kind
 * @param {{ volume?: number }} [options]
 */
export function playNotificationSound(kind, options = {}) {
  const src = SOURCES[kind];
  if (!src || typeof window === 'undefined') return;

  try {
    let audio = cache.get(kind);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      cache.set(kind, audio);
    }

    audio.volume = typeof options.volume === 'number' ? options.volume : 0.7;
    audio.currentTime = 0;

    const played = audio.play();
    if (played && typeof played.catch === 'function') {
      played.catch(() => {
        /* diblokir kebijakan autoplay / belum ada interaksi user */
      });
    }
  } catch {
    /* audio tidak tersedia — abaikan */
  }
}

export const NOTIFICATION_KIND_BY_EVENT = {
  warning: 'warning',
  submitted: 'success',
  terminated: 'failed',
};
