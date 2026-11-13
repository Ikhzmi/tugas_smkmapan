import { useEffect, useRef } from 'react';
import { apiList } from '../lib/api';

/**
 * Memantau event ujian (warning / submitted / terminated) untuk guru pemilik
 * ujian dengan polling REST GET /guru/exams/events?since=ISO.
 *
 * @param {object} options
 * @param {string|null} options.teacherId  id guru (tabel teachers)
 * @param {(event: object) => void} options.onEvent  dipanggil tiap event baru
 * @param {boolean} [options.enabled]
 */
export function useExamLiveEvents({ teacherId, onEvent, enabled = true }) {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !teacherId) return undefined;

    let cancelled = false;
    let timer = null;
    let since = new Date().toISOString();

    const poll = async () => {
      try {
        const { items } = await apiList('/guru/exams/events', { since, per_page: 100 });
        if (cancelled) return;
        const fresh = items
          .filter((e) => e?.created_at && e.created_at > since)
          .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
        fresh.forEach((e) => { if (handlerRef.current) handlerRef.current(e); });
        since = items.reduce(
          (max, e) => (e?.created_at && e.created_at > max ? e.created_at : max),
          since,
        );
      } catch { /* gangguan polling diabaikan, coba lagi siklus berikut */ }
      if (!cancelled) timer = setTimeout(poll, 5000);
    };

    timer = setTimeout(poll, 5000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [teacherId, enabled]);
}
