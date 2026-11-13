import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
  Loader2, Send, ListChecks, Flag, Trophy, RotateCcw, Circle, Lock, Unlock,
  CalendarClock, ShieldAlert,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getExamSession, formatExamSession, markReloadPending, isReloadPending,
  setActiveExam, clearActiveExam,
} from '../../lib/examSession';
import { playNotificationSound } from '../../lib/sounds';
import './ExamRunner.css';

const HURUF = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Jumlah peringatan yang masih ditoleransi sebelum ujian dihentikan. */
const MAX_WARNINGS = 3;

/** Jeda minimum antar-peringatan (ms) agar 1 kejadian tidak dihitung berkali-kali. */
const WARNING_COOLDOWN = 1500;

const pad = (n) => String(n).padStart(2, '0');
const mmss = (totalSec) => {
  const s = Math.max(0, Math.floor(totalSec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

const formatWaktu = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const friendlyExamError = (err) => {
  const msg = String(err?.message || '');
  if (msg.includes('terminate_attempt') || msg.includes('reset_exam_attempt')) {
    return 'Fitur pengawasan CBT belum terpasang di database. Jalankan md/supabase_cbt_session_guard.sql.';
  }
  if (msg.includes('verify_exam_code') || msg.includes('exam_unlocks')) {
    return 'Fitur kode akses belum terpasang di database. Jalankan md/supabase_exam_code.sql.';
  }
  if (msg.includes('dihentikan karena pelanggaran')) {
    return 'Ujian ini dihentikan karena pelanggaran. Hubungi admin/guru pengawas untuk mereset ujian.';
  }
  if (msg.includes('sudah Anda kerjakan') || msg.includes('tidak dapat diulang')) {
    return 'Ujian ini sudah Anda kerjakan dan tidak dapat diulang. Nilai Anda sudah tersimpan.';
  }
  if (msg.includes('sedang berjalan')) {
    return 'Anda masih punya ujian ini yang sedang berjalan. Pilih "Lanjutkan Ujian" di dashboard.';
  }
  if (msg.includes('does not exist') && msg.includes('function')) {
    return 'Fungsi penilaian belum dipasang di database. Jalankan md/supabase_exam_attempt.sql terlebih dahulu.';
  }
  if (msg.includes('row-level security')) {
    return 'Sesi ujian belum dibuka atau ujian ini belum tersedia untuk dikerjakan.';
  }
  if (msg.includes('duplicate key')) {
    return 'Anda sudah memiliki percobaan aktif untuk ujian ini.';
  }
  return msg || 'Terjadi kesalahan saat memproses ujian.';
};


const shuffleIds = (ids) => {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};



const TERMINATION_PREFIX = 'smk_cbt_terminated_';
const rememberTermination = (attemptId, reason) => {
  if (!attemptId) return;
  try {
    localStorage.setItem(`${TERMINATION_PREFIX}${attemptId}`, reason || 'Ganti tab');
  } catch {
    
  }
};
const recallTermination = (attemptId) => {
  if (!attemptId) return null;
  try {
    return localStorage.getItem(`${TERMINATION_PREFIX}${attemptId}`);
  } catch {
    return null;
  }
};

export default function ExamRunner({
  open, exam, student, resumeAttempt, completedAttempt,
  needsCode = false, alreadyUnlocked = false, onUnlocked, onClose, onFinished,
}) {
  const completedId = completedAttempt?.id;
  const completedStatus = completedAttempt?.status;
  const completedReason = completedAttempt?.alasan_berhenti;
  const completedAt = completedAttempt?.dihentikan_at;
  const completedSubmittedAt = completedAttempt?.dikumpulkan_at;
  const isTerminated = completedStatus === 'dibatalkan';

  const [phase, setPhase] = useState(isTerminated ? 'terminated' : completedId ? 'submitted' : 'intro'); 
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [attemptId, setAttemptId] = useState(completedId || null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(
    completedId && !isTerminated ? { dikumpulkanAt: completedSubmittedAt || '' } : null,
  );
  const [unlocked, setUnlocked] = useState(alreadyUnlocked);
  const [codeInput, setCodeInput] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeTries, setCodeTries] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [savedFlash, setSavedFlash] = useState('');
  const [terminatedInfo, setTerminatedInfo] = useState(
    isTerminated ? { alasan: completedReason || 'Ganti tab', at: completedAt, stored: true } : null,
  );
  const [warnings, setWarnings] = useState(0);
  const [warningModal, setWarningModal] = useState(null);

  const startedAtRef = useRef(null);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);
  const terminatedRef = useRef(false);
  const phaseRef = useRef(phase);
  const warningsRef = useRef(0);
  const lastViolationRef = useRef(0);
  const cardRef = useRef(null);

  // Di layar kecil kartu soal bisa tergulir jauh ke bawah. Setiap pindah soal,
  // gulir balik ke atas kartu supaya pertanyaan baru langsung terlihat.
  useEffect(() => {
    if (phase !== 'running') return;
    const el = cardRef.current;
    if (!el) return;
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 900px)').matches) return;
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [index, phase]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const session = useMemo(() => getExamSession(exam), [exam]);

  const total = questions.length;
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [questions, answers],
  );
  const current = questions[index];

  
  const markSubmitted = useCallback((att) => {
    setAttemptId(att?.id || null);
    setSubmitted({ dikumpulkanAt: att?.dikumpulkan_at || new Date().toISOString() });
    setPhase('submitted');
    clearActiveExam();
  }, []);

  
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Navigation API menandai reload sebelum pagehide fires, sehingga refresh
  // bisa dibedakan dari menutup tab/meninggalkan halaman.
  useEffect(() => {
    if (!open) return undefined;
    const nav = typeof window !== 'undefined' ? window.navigation : undefined;
    if (!nav || typeof nav.addEventListener !== 'function') return undefined;
    const onNavigate = (e) => {
      if (e?.navigationType === 'reload') markReloadPending();
    };
    nav.addEventListener('navigate', onNavigate);
    return () => nav.removeEventListener('navigate', onNavigate);
  }, [open]);

  // Cache unlock di klien bisa basi (kode diganti/reset oleh guru) ->
  // verifikasi ulang ke server sebelum menyembunyikan form kode.
  useEffect(() => {
    if (!open || !exam || !needsCode || !alreadyUnlocked) return undefined;
    let alive = true;
    supabase.rpc('has_exam_unlock', { p_exam_id: exam.id }).then(({ data, error }) => {
      if (!alive || error) return;
      if (data === false) setUnlocked(false);
    });
    return () => { alive = false; };
  }, [open, exam, needsCode, alreadyUnlocked]);

  
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && phase !== 'running') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, phase, onClose]);

  const finishAttempt = useCallback(async () => {
    if (submittingRef.current || !attemptId) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const { error: rpcErr } = await supabase.rpc('submit_attempt', {
        p_attempt_id: attemptId,
      });
      if (rpcErr) throw rpcErr;

      
      
      markSubmitted({ id: attemptId, dikumpulkan_at: new Date().toISOString() });
      playNotificationSound('success');
      setConfirmSubmit(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (onFinished) onFinished();
    } catch (err) {
      setError(friendlyExamError(err));
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, onFinished, markSubmitted]);

  
  const terminateExam = useCallback(async (reason) => {
    if (terminatedRef.current || submittingRef.current) return;
    if (phaseRef.current !== 'running') return;

    terminatedRef.current = true;
    rememberTermination(attemptId, reason);
    clearActiveExam();
    if (timerRef.current) clearInterval(timerRef.current);
    playNotificationSound('failed');
    setConfirmSubmit(false);
    setWarningModal(null);
    setSavedFlash('');
    setTerminatedInfo({ alasan: reason, at: new Date().toISOString(), pending: !!attemptId });
    setPhase('terminated');

    if (!attemptId) return;
    try {
      const { error: rpcErr } = await supabase.rpc('terminate_attempt', {
        p_attempt_id: attemptId,
        p_alasan: reason,
      });
      if (rpcErr) throw rpcErr;
      setTerminatedInfo((prev) => ({ ...prev, pending: false }));
    } catch (err) {
      setTerminatedInfo((prev) => ({
        ...prev,
        pending: false,
        error: friendlyExamError(err),
      }));
    }
  }, [attemptId]);

  
  const handleViolation = useCallback(async (reason) => {
    if (phaseRef.current !== 'running') return;
    if (terminatedRef.current || submittingRef.current) return;

    const now = Date.now();
    if (now - lastViolationRef.current < WARNING_COOLDOWN) return;
    lastViolationRef.current = now;

    const optimistic = warningsRef.current + 1;
    warningsRef.current = optimistic;
    setWarnings(optimistic);

    
    if (attemptId) {
      try {
        const { data, error: rpcErr } = await supabase.rpc('record_exam_warning', {
          p_attempt_id: attemptId,
        });
        if (!rpcErr && typeof data === 'number' && data > 0) {
          warningsRef.current = data;
          setWarnings(data);
        }
      } catch {
        
      }
    }

    const count = warningsRef.current;

    if (count >= MAX_WARNINGS) {
      await terminateExam(`${reason} (peringatan ke-${count})`);
      return;
    }

    playNotificationSound('warning');
    setWarningModal({ no: count, reason });
  }, [attemptId, terminateExam]);

  useEffect(() => {
    if (phase !== 'running') return undefined;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation('Berpindah tab');
      }
    };
    const onBlur = () => {
      handleViolation('Berpindah jendela/aplikasi');
    };
    const onPageHide = () => {
      // Refresh juga memicu pagehide; ujian harus bisa dilanjutkan kembali,
      // jadi jangan dihentikan saat reload terdeteksi.
      if (isReloadPending()) return;
      terminateExam('Meninggalkan halaman ujian');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onPageHide);
      
      
      if (phaseRef.current === 'running' && !submittingRef.current && !terminatedRef.current && !isReloadPending()) {
        terminateExam('Meninggalkan halaman ujian');
      }
    };
  }, [phase, handleViolation, terminateExam]);

  // Best-effort anti-tangkap layar: blokir PrintScreen, cetak/simpan halaman,
  // klik kanan, dan salin/cut selama ujian berjalan; percobaan dicatat
  // sebagai pelanggaran seperti ganti tab.
  useEffect(() => {
    if (phase !== 'running') return undefined;

    const onKey = (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        handleViolation('Percobaan tangkap layar (PrintScreen)');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleViolation('Percobaan cetak/simpan halaman ujian');
      }
    };
    const onContextMenu = (e) => e.preventDefault();
    const onCopyCut = (e) => {
      e.preventDefault();
      handleViolation('Percobaan menyalin konten ujian');
    };
    const onSelectStart = (e) => e.preventDefault();

    document.addEventListener('keydown', onKey);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopyCut);
    document.addEventListener('cut', onCopyCut);
    document.addEventListener('selectstart', onSelectStart);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopyCut);
      document.removeEventListener('cut', onCopyCut);
      document.removeEventListener('selectstart', onSelectStart);
    };
  }, [phase, handleViolation]);

  
  useEffect(() => {
    if (phase !== 'running') return undefined;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      let left = (exam?.durasi_menit || 60) * 60 - elapsed;

      const sessionEndMs = exam?.waktu_selesai ? new Date(exam.waktu_selesai).getTime() : null;
      if (!exam?.admin_override && sessionEndMs && !Number.isNaN(sessionEndMs)) {
        left = Math.min(left, (sessionEndMs - Date.now()) / 1000);
      }

      setRemaining(left);
      if (left <= 0) {
        clearInterval(timerRef.current);
        finishAttempt();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, exam?.durasi_menit, exam?.waktu_selesai, exam?.admin_override, finishAttempt]);

  
  const handleVerifyCode = async (e) => {
    e?.preventDefault?.();
    if (!exam) return;
    const kode = codeInput.trim().toUpperCase();
    if (kode.length < 4) {
      setCodeError('Kode minimal 4 karakter.');
      return;
    }
    setCodeBusy(true);
    setCodeError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('verify_exam_code', {
        p_exam_id: exam.id,
        p_code: kode,
      });
      if (rpcErr) throw rpcErr;
      if (!data) {
        setCodeTries((n) => n + 1);
        setCodeError('Kode salah. Periksa kembali atau minta kode baru kepada guru.');
        return;
      }
      setUnlocked(true);
      setCodeInput('');
      if (onUnlocked) onUnlocked();
    } catch (err) {
      setCodeError(friendlyExamError(err));
    } finally {
      setCodeBusy(false);
    }
  };

  
  const handleStart = async () => {
    if (!student || !exam) return;
    setError('');
    setLoading(true);
    try {
      let att = resumeAttempt;

      if (att) {
        
        let freshRes = await supabase
          .from('attempts')
          .select('id, exam_id, status, dimulai_at, dikumpulkan_at, question_order, alasan_berhenti, dihentikan_at')
          .eq('id', att.id)
          .maybeSingle();
        if (freshRes.error) {
          
          freshRes = await supabase
            .from('attempts')
            .select('id, exam_id, status, dimulai_at, dikumpulkan_at')
            .eq('id', att.id)
            .maybeSingle();
        }
        if (freshRes.data) att = freshRes.data;

        if (att.status === 'dibatalkan') {
          setAttemptId(att.id);
          setTerminatedInfo({
            alasan: att.alasan_berhenti || 'Ganti tab',
            at: att.dihentikan_at,
            stored: true,
          });
          setPhase('terminated');
          return;
        }

        
        
        const localReason = recallTermination(att.id);
        if (localReason && att.status === 'berjalan') {
          setAttemptId(att.id);
          setTerminatedInfo({
            alasan: localReason,
            at: new Date().toISOString(),
            stored: true,
            pending: true,
          });
          setPhase('terminated');
          try {
            const { error: rpcErr } = await supabase.rpc('terminate_attempt', {
              p_attempt_id: att.id,
              p_alasan: localReason,
            });
            if (rpcErr) throw rpcErr;
            setTerminatedInfo((prev) => ({ ...prev, pending: false }));
          } catch (err) {
            setTerminatedInfo((prev) => ({
              ...prev,
              pending: false,
              error: friendlyExamError(err),
            }));
          }
          return;
        }

        if (att.status !== 'berjalan') {
          markSubmitted(att);
          return;
        }

        
        if (session.ended) {
          const { error: rpcErr } = await supabase.rpc('submit_attempt', {
            p_attempt_id: att.id,
          });
          if (rpcErr) throw rpcErr;
          markSubmitted({ id: att.id, dikumpulkan_at: new Date().toISOString() });
          return;
        }
      } else {
        
        
        let doneRes = await supabase
          .from('attempts')
          .select('id, exam_id, dikumpulkan_at, status, alasan_berhenti, dihentikan_at')
          .eq('exam_id', exam.id)
          .eq('student_id', student.id)
          .neq('status', 'berjalan')
          .order('dimulai_at', { ascending: false })
          .limit(1);
        if (doneRes.error) {
          doneRes = await supabase
            .from('attempts')
            .select('id, exam_id, dikumpulkan_at, status')
            .eq('exam_id', exam.id)
            .eq('student_id', student.id)
            .neq('status', 'berjalan')
            .order('dimulai_at', { ascending: false })
            .limit(1);
        }
        if (doneRes.data && doneRes.data.length) {
          const done = doneRes.data[0];
          if (done.status === 'dibatalkan') {
            setAttemptId(done.id);
            setTerminatedInfo({
              alasan: done.alasan_berhenti || 'Ganti tab',
              at: done.dihentikan_at,
              stored: true,
            });
            setPhase('terminated');
          } else {
            markSubmitted(done);
          }
          return;
        }

        if (!session.canStart) {
          setError(session.message);
          return;
        }
      }

      let qsRes = await supabase
        .from('questions_safe')
        .select('id, pertanyaan, opsi, tipe, bobot, gambar_url')
        .eq('exam_id', exam.id)
        .order('created_at', { ascending: true });
      // View lama belum punya kolom gambar_url -> fallback tanpa gambar.
      if (qsRes.error) {
        qsRes = await supabase
          .from('questions_safe')
          .select('id, pertanyaan, opsi, tipe, bobot')
          .eq('exam_id', exam.id)
          .order('created_at', { ascending: true });
      }
      const { data: qs, error: qErr } = qsRes;
      if (qErr) throw qErr;

      if (!qs || qs.length === 0) {
        setError('Sesi ujian belum dibuka atau ujian ini belum memiliki soal. Hubungi guru Anda.');
        return;
      }

      let ordered = qs;

      if (!att) {
        
        
        const ids = qs.map((q) => q.id);
        const finalOrder = exam.acak_soal === false ? ids : shuffleIds(ids);

        let ins = await supabase
          .from('attempts')
          .insert({
            exam_id: exam.id,
            student_id: student.id,
            status: 'berjalan',
            question_order: finalOrder,
          })
          .select('id, dimulai_at, question_order')
          .single();

        if (ins.error && /question_order/i.test(String(ins.error.message || ''))) {
          
          ins = await supabase
            .from('attempts')
            .insert({ exam_id: exam.id, student_id: student.id, status: 'berjalan' })
            .select('id, dimulai_at')
            .single();
        }
        if (ins.error) throw ins.error;

        att = { ...ins.data, question_order: ins.data?.question_order || finalOrder };
        const byId = new Map(qs.map((q) => [q.id, q]));
        ordered = finalOrder.map((id) => byId.get(id)).filter(Boolean);
      } else {
        const order = Array.isArray(att.question_order) ? att.question_order : [];
        if (order.length) {
          const byId = new Map(qs.map((q) => [q.id, q]));
          const arranged = order.map((id) => byId.get(id)).filter(Boolean);
          const included = new Set(arranged.map((q) => q.id));
          ordered = arranged.concat(qs.filter((q) => !included.has(q.id)));
        }
      }

      
      const { data: saved } = await supabase
        .from('answers')
        .select('question_id, jawaban')
        .eq('attempt_id', att.id);
      const restored = {};
      (saved || []).forEach((r) => {
        if (r.jawaban) restored[r.question_id] = r.jawaban;
      });
      setAnswers(restored);

      const startedMs = att.dimulai_at ? new Date(att.dimulai_at).getTime() : Date.now();
      const elapsed = (Date.now() - startedMs) / 1000;
      const limit = (exam.durasi_menit || 60) * 60;

      let left = limit - elapsed;
      if (!exam.admin_override && session.endMs) {
        left = Math.min(left, (session.endMs - Date.now()) / 1000);
      }

      if (left <= 0) {
        const { error: rpcErr } = await supabase.rpc('submit_attempt', {
          p_attempt_id: att.id,
        });
        if (rpcErr) throw rpcErr;
        markSubmitted({ id: att.id, dikumpulkan_at: new Date().toISOString() });
        return;
      }

      setAttemptId(att.id);
      startedAtRef.current = startedMs;
      setRemaining(left);
      setIndex(0);
      setQuestions(ordered);
      setActiveExam(exam.id);
      setPhase('running');
    } catch (err) {
      setError(friendlyExamError(err));
    } finally {
      setLoading(false);
    }
  };

  
  const pickAnswer = async (qid, val) => {
    if (!attemptId || submitting) return;
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    setSavedFlash('Menyimpan...');
    const { error: upErr } = await supabase
      .from('answers')
      .upsert(
        { attempt_id: attemptId, question_id: qid, jawaban: val },
        { onConflict: 'attempt_id,question_id' },
      );
    if (upErr) {
      setSavedFlash('Gagal menyimpan');
      setError(friendlyExamError(upErr));
      return;
    }
    setSavedFlash('Tersimpan');
    setTimeout(() => setSavedFlash(''), 1400);
  };

  if (!open || !exam) return null;

  const urgent = remaining <= 300;

  return (
    <div className="exr-root" role="dialog" aria-modal="true" aria-label={exam.judul}>
      
      {phase === 'intro' && (
        <div className="exr-intro">
          <div className="exr-intro-card">
            <span className="exr-intro-icon"><Award size={30} /></span>
            <h2>{exam.judul}</h2>
            <p className="exr-intro-sub">
              {exam.deskripsi || 'Baca setiap soal dengan teliti sebelum menjawab.'}
            </p>

            <div className="exr-intro-stats">
              <div>
                <Clock size={16} />
                <strong>{exam.durasi_menit} menit</strong>
                <span>Batas waktu</span>
              </div>
              <div>
                <ListChecks size={16} />
                <strong>{exam.jumlah_soal ?? '—'} soal</strong>
                <span>Pilihan ganda</span>
              </div>
              <div>
                <Trophy size={16} />
                <strong>Guru</strong>
                <span>Penilaian</span>
              </div>
            </div>

            <div className={`exr-session-note is-${session.state}`}>
              <CalendarClock size={15} />
              <span>
                <strong>{session.label}</strong>
                <br />
                {formatExamSession(exam)}
                {exam.acak_soal !== false && (
                  <em className="exr-random-note">Urutan soal diacak untuk setiap siswa.</em>
                )}
              </span>
            </div>

            {needsCode && !unlocked ? (
              <form className="exr-code" onSubmit={handleVerifyCode}>
                <div className="exr-code-head">
                  <span className="exr-code-icon"><Lock size={16} /></span>
                  <div>
                    <strong>Ujian ini memerlukan kode akses</strong>
                    <span>Minta kode kepada guru Anda, lalu masukkan di bawah.</span>
                  </div>
                </div>

                <div className="exr-code-row">
                  <input
                    id="exr-code-input"
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      setCodeError('');
                    }}
                    maxLength={10}
                    placeholder="KODE"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={codeBusy || codeTries >= 5}
                  />
                  <button
                    type="submit"
                    className="gm-btn-primary"
                    disabled={codeBusy || codeTries >= 5 || codeInput.length < 4}
                  >
                    {codeBusy ? <Loader2 size={15} className="gm-spin" /> : <Unlock size={15} />}
                    {codeBusy ? 'Memeriksa...' : 'Buka Ujian'}
                  </button>
                </div>

                {codeError && <p className="exr-error">{codeError}</p>}
                {codeTries >= 5 && (
                  <p className="exr-error">
                    Terlalu banyak percobaan. Tutup jendela ini lalu buka kembali untuk mencoba lagi.
                  </p>
                )}

                <button
                  type="button"
                  className="gm-btn-ghost"
                  onClick={onClose}
                  disabled={codeBusy}
                >
                  Nanti Saja
                </button>
              </form>
            ) : (
              <>
                <ul className="exr-rules">
                  <li>Waktu berjalan otomatis setelah Anda menekan <strong>Mulai Ujian</strong>.</li>
                  <li>Jawaban tersimpan setiap kali Anda memilih opsi.</li>
                  <li>Ujian dikumpulkan otomatis saat waktu atau sesi ujian habis.</li>
                  <li><strong>Ujian hanya bisa dikerjakan satu kali.</strong> Setelah dikumpulkan, hasil langsung tersimpan.</li>
                  <li>
                    <strong>Jangan berpindah tab/aplikasi.</strong> Sistem memberi peringatan
                    kuning lebih dulu. Pada <strong>pelanggaran ke-{MAX_WARNINGS}</strong>, ujian
                    otomatis dihentikan dan hanya guru yang dapat membukanya kembali.
                  </li>
                </ul>

                {!resumeAttempt && !session.canStart && (
                  <p className="exr-error">{session.message}</p>
                )}

                {resumeAttempt && session.ended && (
                  <div className="exr-resume-note">
                    <AlertTriangle size={15} />
                    <span>
                      Sesi ujian sudah berakhir. Jawaban yang tersimpan akan dikumpulkan
                      otomatis saat Anda menekan tombol di bawah.
                    </span>
                  </div>
                )}

                {resumeAttempt && !session.ended && (
                  <div className="exr-resume-note">
                    <Clock size={15} />
                    <span>
                      Anda sudah memulai ujian ini sebelumnya. Waktu tetap berjalan —
                      pilih <strong>Lanjutkan Ujian</strong> untuk meneruskan dari jawaban terakhir.
                    </span>
                  </div>
                )}

                {error && <p className="exr-error">{error}</p>}

                <div className="exr-intro-actions">
                  <button type="button" className="gm-btn-ghost" onClick={onClose} disabled={loading}>
                    Nanti Saja
                  </button>
                  <button
                    type="button"
                    className="gm-btn-primary"
                    onClick={handleStart}
                    disabled={loading || (!resumeAttempt && !session.canStart)}
                  >
                    {loading ? <Loader2 size={15} className="gm-spin" /> : <Flag size={15} />}
                    {loading
                      ? 'Menyiapkan...'
                      : resumeAttempt
                        ? (session.ended ? 'Kumpulkan Jawaban' : 'Lanjutkan Ujian')
                        : 'Mulai Ujian'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      
      {phase === 'running' && (
        <>
          <header className="exr-bar">
            <div className="exr-bar-left">
              <span className="exr-bar-icon"><Award size={17} /></span>
              <div>
                <strong>{exam.judul}</strong>
                <span>{answeredCount} dari {total} soal terjawab</span>
              </div>
            </div>

            <div className="exr-bar-right">
              <span
                className={`exr-focus-warning ${warnings ? 'is-warned' : ''}`}
                title={`Berpindah tab akan dicatat sebagai pelanggaran (maks. ${MAX_WARNINGS}x)`}
              >
                <ShieldAlert size={13} />
                {warnings ? `Peringatan ${warnings}/${MAX_WARNINGS}` : 'Jangan pindah tab'}
              </span>
              {savedFlash && <span className="exr-saved">{savedFlash}</span>}
              <span className={`exr-timer ${urgent ? 'is-urgent' : ''}`}>
                <Clock size={15} /> {mmss(remaining)}
              </span>
              <button
                type="button"
                className="exr-submit-btn"
                onClick={() => setConfirmSubmit(true)}
                disabled={submitting}
              >
                <Send size={14} /> Kumpulkan
              </button>
            </div>
          </header>

          <div className="exr-progress">
            <span style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} />
          </div>

          <div className="exr-body">
            
            <aside className="exr-nav">
              <h4>Navigasi Soal</h4>
              <div className="exr-nav-grid">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`exr-nav-btn ${i === index ? 'is-current' : ''} ${answers[q.id] ? 'is-answered' : ''}`}
                    onClick={() => setIndex(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="exr-nav-legend">
                <span><i className="is-answered" /> Terjawab</span>
                <span><i className="is-current" /> Aktif</span>
                <span><i /> Kosong</span>
              </div>
            </aside>

            
            <main className="exr-main">
              {current && (
                <div className="exr-card" ref={cardRef}>
                  <div className="exr-card-head">
                    <span className="exr-qnum">Soal {index + 1}</span>
                    <span className="exr-qweight">Bobot {current.bobot}</span>
                  </div>
                  <p className="exr-qtext">{current.pertanyaan}</p>

                  {current.gambar_url && (
                    <figure className="exr-qimage">
                      <img src={current.gambar_url} alt={`Gambar soal ${index + 1}`} loading="lazy" />
                    </figure>
                  )}

                  <div className="exr-options">
                    {(current.opsi || []).map((opt, k) => {
                      const letter = HURUF[k] || String(k + 1);
                      const active = answers[current.id] === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          className={`exr-option ${active ? 'is-active' : ''}`}
                          disabled={submitting}
                          onClick={() => pickAnswer(current.id, letter)}
                        >
                          <span className="exr-option-letter">{letter}</span>
                          <span className="exr-option-text">{opt}</span>
                          {active ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                        </button>
                      );
                    })}
                    {(!current.opsi || current.opsi.length === 0) && (
                      <p className="exr-empty-opt">Soal ini belum memiliki pilihan jawaban.</p>
                    )}
                  </div>

                  {error && <p className="exr-error">{error}</p>}

                  <div className="exr-card-foot">
                    <button
                      type="button"
                      className="gm-btn-ghost"
                      onClick={() => setIndex((i) => Math.max(0, i - 1))}
                      disabled={index === 0}
                    >
                      <ChevronLeft size={15} /> Sebelumnya
                    </button>
                    <span className="exr-card-count">{index + 1} / {total}</span>
                    {index < total - 1 ? (
                      <button
                        type="button"
                        className="gm-btn-primary"
                        onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                      >
                        Selanjutnya <ChevronRight size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="gm-btn-primary"
                        onClick={() => setConfirmSubmit(true)}
                      >
                        <Send size={15} /> Kumpulkan
                      </button>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>

          
          {warningModal && (
            <div className="exr-warn-backdrop">
              <div
                className="exr-warn"
                role="alertdialog"
                aria-modal="true"
                aria-label="Peringatan kecurangan"
              >
                <span className="exr-warn-icon"><AlertTriangle size={26} /></span>
                <h3>Jangan Curang!</h3>
                <p>
                  Terdeteksi <strong>{warningModal.reason}</strong> saat ujian berlangsung.
                  Ujian <strong>masih bisa dilanjutkan</strong>, tetapi kejadian ini sudah dicatat
                  dan dilaporkan ke guru.
                </p>

                <div className="exr-warn-meter" aria-hidden="true">
                  {Array.from({ length: MAX_WARNINGS }).map((_, i) => (
                    <span key={i} className={i < warningModal.no ? 'is-on' : ''} />
                  ))}
                </div>
                <span className="exr-warn-count">
                  Peringatan {warningModal.no} dari {MAX_WARNINGS}
                </span>

                {warningModal.no >= MAX_WARNINGS - 1 && (
                  <p className="exr-warn-danger">
                    Ini peringatan terakhir. Pelanggaran berikutnya langsung menghentikan ujian
                    dan hanya guru yang dapat membukanya kembali.
                  </p>
                )}

                <button
                  type="button"
                  className="gm-btn-primary"
                  onClick={() => setWarningModal(null)}
                >
                  Saya Mengerti, Lanjutkan
                </button>
              </div>
            </div>
          )}

          
          {confirmSubmit && (
            <div className="exr-confirm-backdrop">
              <div className="exr-confirm">
                <span className="exr-confirm-icon"><AlertTriangle size={24} /></span>
                <h3>Kumpulkan ujian sekarang?</h3>
                <p>
                  Anda sudah menjawab <strong>{answeredCount}</strong> dari <strong>{total}</strong> soal.
                  {answeredCount < total && ` Masih ada ${total - answeredCount} soal kosong.`}
                </p>
                <div className="exr-confirm-actions">
                  <button
                    type="button"
                    className="gm-btn-ghost"
                    onClick={() => setConfirmSubmit(false)}
                    disabled={submitting}
                  >
                    Periksa Lagi
                  </button>
                  <button
                    type="button"
                    className="gm-btn-primary"
                    onClick={finishAttempt}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 size={15} className="gm-spin" /> : <Send size={15} />}
                    {submitting ? 'Menilai...' : 'Ya, Kumpulkan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      
      {phase === 'submitted' && (
        <div className="exr-result">
          <div className="exr-result-card exr-done-card">
            <span className="exr-done-icon"><CheckCircle2 size={34} /></span>
            <h2>Ujian berhasil dikumpulkan</h2>
            <p className="exr-result-sub">
              Jawaban Anda sudah tersimpan. Nilai akan diumumkan oleh guru
              melalui halaman nilai — tidak ditampilkan di sini.
            </p>

            <div className="exr-result-meta">
              <span>
                <Clock size={13} />
                Dikumpulkan {formatWaktu(submitted?.dikumpulkanAt)}
              </span>
              <span className="exr-lock-pill">
                <Lock size={13} /> Ujian hanya bisa dikerjakan 1 kali
              </span>
            </div>

            <p className="exr-result-note">
              Anda tidak dapat mengerjakan ulang ujian ini. Hubungi guru
              jika ada kendala teknis saat mengerjakan.
            </p>

            <div className="exr-result-actions">
              <button type="button" className="gm-btn-primary" onClick={onClose}>
                <RotateCcw size={15} /> Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      
      {phase === 'terminated' && (
        <div className="exr-result">
          <div className="exr-result-card exr-terminated-card">
            <span className="exr-terminated-icon"><ShieldAlert size={36} /></span>
            <h2>Ujian dihentikan</h2>
            <p className="exr-result-sub">
              Terdeteksi <strong>{terminatedInfo?.alasan || 'Ganti tab'}</strong> saat
              ujian berlangsung. Sistem menghentikan ujian ini secara otomatis.
            </p>

            <div className="exr-terminated-box">
              <strong>Jawaban Anda sudah tersimpan di server.</strong>
              <span>
                Hubungi admin atau guru pengawas untuk membuka kembali. Ujian harus
                <strong> direset dari awal</strong> — jawaban sebelumnya tidak dapat dilanjutkan.
              </span>
            </div>

            {terminatedInfo?.pending && (
              <p className="exr-result-note">Menyimpan status penghentian ke server...</p>
            )}

            {terminatedInfo?.error && (
              <p className="exr-error">{terminatedInfo.error}</p>
            )}

            <div className="exr-result-meta">
              <span>
                <Clock size={13} />
                Dihentikan {formatWaktu(terminatedInfo?.at)}
              </span>
              <span className="exr-lock-pill">
                <Lock size={13} /> Tidak bisa dilanjutkan
              </span>
            </div>

            <div className="exr-result-actions">
              <button type="button" className="gm-btn-primary" onClick={onClose}>
                <RotateCcw size={15} /> Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
