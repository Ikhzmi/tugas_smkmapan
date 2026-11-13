import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Berlangganan event ujian (warning / submitted / terminated) secara realtime
 * untuk guru pemilik ujian.
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

    const channel = supabase
      .channel(`exam-events-${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exam_events',
          filter: `teacher_id=eq.${teacherId}`,
        },
        (payload) => {
          if (payload?.new && handlerRef.current) handlerRef.current(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, enabled]);
}
