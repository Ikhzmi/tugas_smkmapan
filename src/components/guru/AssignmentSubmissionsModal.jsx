import React from 'react';
import { ClipboardList, Inbox, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import AppModal from '../ui/AppModal';
import './AssignmentSubmissionsModal.css';

const formatTanggal = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const inisial = (nama) => (nama || '?')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((w) => w[0])
  .join('')
  .toUpperCase();

export default function AssignmentSubmissionsModal({
  open, assignment, submissions = [], onClose, onPick,
}) {
  const graded = submissions.filter((s) => s.status === 'dinilai').length;
  const waiting = submissions.filter((s) => s.status === 'dikumpulkan').length;

  return (
    <AppModal
      open={open}
      title="Hasil Pengumpulan"
      subtitle={assignment?.judul}
      icon={<ClipboardList size={18} />}
      size="md"
      onClose={onClose}
      footer={(
        <button type="button" className="gm-btn-primary" onClick={onClose}>
          Tutup
        </button>
      )}
    >
      <div className="asm-root">
        <div className="asm-summary">
          <span><strong>{submissions.length}</strong> pengumpulan</span>
          <span className="is-ok"><CheckCircle2 size={12} /> {graded} dinilai</span>
          <span className={waiting ? 'is-warn' : ''}><Clock size={12} /> {waiting} menunggu</span>
        </div>

        {submissions.length === 0 ? (
          <div className="asm-empty">
            <Inbox size={24} />
            <strong>Belum ada yang mengumpulkan</strong>
            <span>Jawaban siswa akan muncul di sini setelah mereka mengirim tugas.</span>
          </div>
        ) : (
          <div className="asm-list">
            {submissions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`asm-row ${s.status === 'dikumpulkan' ? 'is-pending' : ''}`}
                onClick={() => onPick(s)}
              >
                <span className="asm-avatar">{inisial(s.students?.nama)}</span>
                <span className="asm-who">
                  <strong>{s.students?.nama || 'Siswa'}</strong>
                  <span>
                    {s.students?.nisn || '-'} • {formatTanggal(s.dikumpulkan_at)}
                  </span>
                </span>
                <span className={`asm-badge ${s.status === 'dinilai' ? 'is-graded' : 'is-wait'}`}>
                  {s.status === 'dinilai' ? `Nilai ${s.nilai ?? '-'}` : 'Menunggu'}
                </span>
                <ChevronRight size={16} className="asm-chevron" />
              </button>
            ))}
          </div>
        )}
      </div>
    </AppModal>
  );
}
