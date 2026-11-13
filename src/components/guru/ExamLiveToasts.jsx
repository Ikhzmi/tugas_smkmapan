import React, { useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import './ExamLiveToasts.css';

const META = {
  warning: {
    icon: AlertTriangle,
    tone: 'warning',
    title: 'Peringatan kecurangan',
    sub: (item) => `Peringatan ke-${item.warning_no || 1} saat ujian`,
  },
  submitted: {
    icon: CheckCircle2,
    tone: 'success',
    title: 'Ujian dikumpulkan',
    sub: () => 'Siswa menyelesaikan ujian',
  },
  terminated: {
    icon: ShieldAlert,
    tone: 'failed',
    title: 'Ujian dihentikan',
    sub: (item) => item.message || 'Ujian dihentikan karena pelanggaran',
  },
};

const formatJam = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

function LiveToast({ item, studentName, examTitle, onDismiss }) {
  const meta = META[item.type] || META.warning;
  const Icon = meta.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 9000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div className={`exl-toast is-${meta.tone}`} role="status">
      <span className="exl-icon"><Icon size={18} /></span>

      <div className="exl-body">
        <div className="exl-head">
          <strong>{meta.title}</strong>
          <span className="exl-time">{formatJam(item.created_at)}</span>
        </div>
        <span className="exl-student">{studentName}</span>
        <span className="exl-sub">{examTitle}</span>
        <span className="exl-note">{meta.sub(item)}</span>
      </div>

      <button
        type="button"
        className="exl-close"
        onClick={() => onDismiss(item.id)}
        aria-label="Tutup notifikasi"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function ExamLiveToasts({ items = [], students = [], exams = [], onDismiss }) {
  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s.nama])),
    [students],
  );
  const examMap = useMemo(
    () => new Map(exams.map((e) => [e.id, e.judul])),
    [exams],
  );

  if (!items.length) return null;

  return (
    <div className="exl-root" aria-live="polite" aria-label="Notifikasi ujian realtime">
      {items.map((item) => (
        <LiveToast
          key={item.id}
          item={item}
          studentName={studentMap.get(item.student_id) || 'Siswa'}
          examTitle={examMap.get(item.exam_id) || 'Ujian'}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
