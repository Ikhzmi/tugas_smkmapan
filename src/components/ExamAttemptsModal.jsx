import React, { useMemo } from 'react';
import {
  Users, ShieldAlert, CheckCircle2, Clock, RotateCcw, Loader2,
  Inbox, PlayCircle,
} from 'lucide-react';
import AppModal from './ui/AppModal';
import { formatExamSession } from '../lib/examSession';
import './ExamAttemptsModal.css';

const formatWaktu = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusInfo = (attempt) => {
  if (attempt.status === 'dibatalkan') {
    return { label: 'Dihentikan', tone: 'is-danger', icon: ShieldAlert };
  }
  if (attempt.status === 'berjalan') {
    return { label: 'Sedang mengerjakan', tone: 'is-live', icon: PlayCircle };
  }
  return { label: 'Selesai', tone: 'is-done', icon: CheckCircle2 };
};

export default function ExamAttemptsModal({
  open,
  exam,
  attempts = [],
  onClose,
  onReset,
  busyId = null,
}) {
  const sorted = useMemo(() => {
    return [...attempts].sort((a, b) => {
      const ta = new Date(a.dimulai_at || 0).getTime();
      const tb = new Date(b.dimulai_at || 0).getTime();
      return tb - ta;
    });
  }, [attempts]);

  const terminatedCount = attempts.filter((a) => a.status === 'dibatalkan').length;

  return (
    <AppModal
      open={open}
      size="lg"
      icon={<Users size={19} />}
      title="Pengerjaan Ujian"
      subtitle={exam ? `${exam.judul} • ${formatExamSession(exam)}` : ''}
      onClose={onClose}
      footer={(
        <button type="button" className="gm-btn-ghost" onClick={onClose}>
          Tutup
        </button>
      )}
    >
      <div className="eam-root">
        <div className="eam-note">
          <RotateCcw size={15} />
          <span>
            <strong>Reset</strong> menghapus attempt dan seluruh jawaban siswa, sehingga siswa
            mengerjakan ujian <strong>dari awal</strong>. Gunakan untuk membuka kembali ujian
            yang dihentikan karena pindah tab.
          </span>
        </div>

        {terminatedCount > 0 && (
          <div className="eam-alert">
            <ShieldAlert size={15} />
            <span>{terminatedCount} pengerjaan dihentikan karena pelanggaran (pindah tab/aplikasi).</span>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="eam-empty">
            <Inbox size={28} />
            <strong>Belum ada pengerjaan</strong>
            <span>Daftar ini terisi setelah siswa mulai mengerjakan ujian.</span>
          </div>
        ) : (
          <div className="eam-list">
            {sorted.map((attempt) => {
              const info = statusInfo(attempt);
              const Icon = info.icon;
              const busy = busyId === attempt.id;
              return (
                <div key={attempt.id} className={`eam-row ${info.tone}`}>
                  <span className={`eam-icon ${info.tone}`}>
                    <Icon size={16} />
                  </span>

                  <div className="eam-main">
                    <div className="eam-top">
                      <div className="eam-student">
                        <strong>{attempt.students?.nama || 'Siswa'}</strong>
                        <span>{attempt.students?.nisn || '—'}</span>
                      </div>
                      <span className={`eam-badge ${info.tone}`}>{info.label}</span>
                    </div>

                    <div className="eam-meta">
                      <span><Clock size={12} /> Mulai {formatWaktu(attempt.dimulai_at)}</span>
                      {attempt.dikumpulkan_at && (
                        <span>Dikumpulkan {formatWaktu(attempt.dikumpulkan_at)}</span>
                      )}
                      {attempt.dihentikan_at && (
                        <span>Dihentikan {formatWaktu(attempt.dihentikan_at)}</span>
                      )}
                      {attempt.nilai_akhir != null && (
                        <span>Nilai {attempt.nilai_akhir}</span>
                      )}
                    </div>

                    {attempt.alasan_berhenti && (
                      <p className="eam-reason">Alasan: {attempt.alasan_berhenti}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="eam-reset"
                    onClick={() => onReset(attempt)}
                    disabled={busy}
                    title="Hapus pengerjaan & jawaban, siswa mengulang dari awal"
                  >
                    {busy ? <Loader2 size={14} className="gm-spin" /> : <RotateCcw size={14} />}
                    {busy ? 'Mereset...' : 'Reset'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppModal>
  );
}
