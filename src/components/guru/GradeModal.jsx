import React, { useState } from 'react';
import {
  ClipboardCheck, User, Hash, Clock, ExternalLink, Paperclip,
  MessageSquare, Star, Loader2
} from 'lucide-react';
import GuruModal from './GuruModal';
import { apiGet } from '../../lib/api';
import './GradeModal.css';

const QUICK_SCORES = [60, 70, 75, 80, 85, 90, 95, 100];

const formatTanggal = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function GradeModal({ open, submission, assignment, onClose, onSave, saving }) {
  const [nilai, setNilai] = useState(submission?.nilai ?? '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [openBusy, setOpenBusy] = useState(false);
  const [fileError, setFileError] = useState('');

  if (!submission) return null;

  const hasFile = !!(submission.file_url || submission.file_path);
  const isLink = /^https?:\/\//i.test(String(submission.file_url || ''));

  const openFile = async () => {
    if (!hasFile) return;
    setOpenBusy(true);
    setFileError('');
    try {
      const data = await apiGet(`/guru/submissions/${submission.id}/download`);
      if (!data?.url) throw new Error('Gagal membuka berkas.');
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      setFileError(err.message || 'Gagal membuka berkas.');
    } finally {
      setOpenBusy(false);
    }
  };

  const submit = () => {
    if (nilai !== '' && (Number(nilai) < 0 || Number(nilai) > 100)) {
      setFileError('Nilai harus antara 0 sampai 100.');
      return;
    }
    onSave(submission.id, nilai, feedback);
  };

  return (
    <GuruModal
      open={open}
      size="lg"
      icon={<ClipboardCheck size={19} />}
      title="Penilaian Tugas"
      subtitle={assignment?.judul || 'Tugas'}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="gm-btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="gm-btn-primary" onClick={submit} disabled={!!saving}>
            {saving ? <Loader2 size={15} className="gm-spin" /> : <Star size={15} />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Nilai'}</span>
          </button>
        </>
      )}
    >
      <div className="grm-grid">
        
        <section className="grm-pane">
          <h4 className="grm-pane-title">
            <User size={15} /> Jawaban Siswa
          </h4>

          <div className="grm-student">
            <div className="grm-avatar">
              {(submission.students?.nama || 'S').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong>{submission.students?.nama || 'Siswa'}</strong>
              <span className="grm-muted">
                <Hash size={12} /> NISN {submission.students?.nisn || '-'}
              </span>
            </div>
          </div>

          <div className="grm-meta-grid">
            <div className="grm-meta-item">
              <span className="grm-meta-label">Status</span>
              <span className={`grm-badge ${submission.status === 'dinilai' ? 'is-done' : 'is-pending'}`}>
                {submission.status === 'dinilai' ? 'Sudah dinilai' : 'Menunggu nilai'}
              </span>
            </div>
            <div className="grm-meta-item">
              <span className="grm-meta-label"><Clock size={12} /> Dikumpulkan</span>
              <span className="grm-meta-value">{formatTanggal(submission.dikumpulkan_at)}</span>
            </div>
          </div>

          <div className="grm-block">
            <span className="grm-meta-label"><MessageSquare size={12} /> Catatan siswa</span>
            {submission.catatan ? (
              <p className="grm-answer">{submission.catatan}</p>
            ) : (
              <p className="grm-answer is-empty">Siswa tidak menulis catatan.</p>
            )}
          </div>

          <div className="grm-block">
            <span className="grm-meta-label"><Paperclip size={12} /> Berkas / tautan</span>
            {hasFile ? (
              <>
                <button
                  type="button"
                  className="grm-file-btn"
                  onClick={openFile}
                  disabled={openBusy}
                >
                  {openBusy ? <Loader2 size={14} className="gm-spin" /> : <ExternalLink size={14} />}
                  <span>
                    {submission.file_name || (isLink ? 'Buka tautan tugas' : 'Buka berkas')}
                  </span>
                </button>
                {isLink && (
                  <p className="grm-file-url">{submission.file_url}</p>
                )}
              </>
            ) : (
              <p className="grm-answer is-empty">Tidak ada berkas atau tautan.</p>
            )}
            {fileError && <p className="grm-error">{fileError}</p>}
          </div>
        </section>

        
        <section className="grm-pane is-form">
          <h4 className="grm-pane-title">
            <Star size={15} /> Beri Penilaian
          </h4>

          <label className="grm-label" htmlFor="grm-nilai">Nilai (0–100)</label>
          <input
            id="grm-nilai"
            type="number"
            min="0"
            max="100"
            className="grm-score-input"
            placeholder="Contoh: 85"
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
          />

          <div className="grm-quick">
            {QUICK_SCORES.map((v) => (
              <button
                key={v}
                type="button"
                className={`grm-quick-btn ${String(nilai) === String(v) ? 'is-active' : ''}`}
                onClick={() => setNilai(String(v))}
              >
                {v}
              </button>
            ))}
          </div>

          <label className="grm-label" htmlFor="grm-feedback">Umpan balik untuk siswa</label>
          <textarea
            id="grm-feedback"
            rows={7}
            className="grm-feedback"
            placeholder="Tuliskan catatan perbaikan, apresiasi, atau instruksi revisi..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <p className="grm-hint">
            Nilai dan umpan balik langsung terlihat oleh siswa di dashboard mereka.
          </p>
        </section>
      </div>
    </GuruModal>
  );
}
