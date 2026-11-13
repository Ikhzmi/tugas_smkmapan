import React, { useRef, useState } from 'react';
import {
  ClipboardList, Upload, Send, Link2, FileText, Calendar,
  UserCheck, CheckCircle2, AlertTriangle, X, Loader2,
} from 'lucide-react';
import AppModal from '../ui/AppModal';
import './SubmissionModal.css';

const formatTanggal = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};


const deadlineInfo = (iso) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - Date.now();
  const hari = Math.round(diff / 86400000);
  if (diff < 0) return { tone: 'is-late', label: 'Sudah lewat deadline' };
  if (diff < 86400000) return { tone: 'is-soon', label: 'Kurang dari 24 jam' };
  if (hari <= 3) return { tone: 'is-soon', label: `Sisa ${hari} hari` };
  return { tone: 'is-ok', label: `Sisa ${hari} hari` };
};

export default function SubmissionModal({
  open,
  assignment,
  subjectName,
  teacherName,
  onClose,
  onSubmit,
  busy,
  error,
}) {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');
  const fileRef = useRef(null);

  if (!assignment) return null;

  const dl = deadlineInfo(assignment.deadline);
  const shownError = localError || error;

  const handleSend = () => {
    setLocalError('');
    if (!file && !link.trim()) {
      setLocalError('Lampirkan berkas atau isi tautan tugas terlebih dahulu.');
      return;
    }
    if (link.trim() && !/^https?:\/\//i.test(link.trim())) {
      setLocalError('Tautan harus diawali http:// atau https://');
      return;
    }
    onSubmit({ file, link: link.trim(), note: note.trim() });
  };

  return (
    <AppModal
      open={open}
      size="lg"
      title="Kumpulkan Tugas"
      subtitle={assignment.judul}
      icon={<ClipboardList size={20} />}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="gm-btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="button" className="gm-btn-primary" onClick={handleSend} disabled={busy}>
            {busy ? <Loader2 size={15} className="gm-spin" /> : <Send size={15} />}
            {busy ? 'Mengirim...' : 'Kirim Tugas'}
          </button>
        </>
      }
    >
      <div className="sbm-grid">
        
        <section className="sbm-pane">
          <h4 className="sbm-pane-title">Detail Tugas</h4>

          <div className="sbm-info">
            <div className="sbm-info-row">
              <span className="sbm-info-label"><ClipboardList size={13} /> Judul</span>
              <strong>{assignment.judul}</strong>
            </div>
            <div className="sbm-info-row">
              <span className="sbm-info-label"><FileText size={13} /> Mata Pelajaran</span>
              <strong>{subjectName || '-'}</strong>
            </div>
            <div className="sbm-info-row">
              <span className="sbm-info-label"><UserCheck size={13} /> Guru Pengampu</span>
              <strong>{teacherName || '-'}</strong>
            </div>
            <div className="sbm-info-row">
              <span className="sbm-info-label"><Calendar size={13} /> Deadline</span>
              <strong>{formatTanggal(assignment.deadline)}</strong>
            </div>
          </div>

          {dl && (
            <div className={`sbm-deadline ${dl.tone}`}>
              {dl.tone === 'is-late' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              <span>{dl.label}</span>
            </div>
          )}

          {assignment.deskripsi && (
            <div className="sbm-desc">
              <span className="sbm-info-label">Instruksi dari guru</span>
              <p>{assignment.deskripsi}</p>
            </div>
          )}
        </section>

        
        <section className="sbm-pane is-form">
          <h4 className="sbm-pane-title">Berkas Jawaban</h4>

          <label className={`sbm-drop ${file ? 'has-file' : ''}`}>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            />
            {file ? (
              <>
                <span className="sbm-drop-icon is-ok"><CheckCircle2 size={20} /></span>
                <span className="sbm-drop-body">
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB &bull; klik untuk mengganti</span>
                </span>
                <button
                  type="button"
                  className="sbm-drop-clear"
                  onClick={(e) => { e.preventDefault(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  aria-label="Hapus berkas"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="sbm-drop-icon"><Upload size={20} /></span>
                <span className="sbm-drop-body">
                  <strong>Pilih berkas tugas</strong>
                  <span>PDF, DOCX, ZIP, atau gambar &bull; maks. 25 MB</span>
                </span>
              </>
            )}
          </label>

          <div className="sbm-or"><span>atau</span></div>

          <label className="sbm-field">
            <span className="sbm-label"><Link2 size={13} /> Tautan tugas</span>
            <input
              className="guru-input"
              placeholder="https://drive.google.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <span className="sbm-hint">Tempel tautan Google Drive / YouTube / repositori jika jawaban Anda online.</span>
          </label>

          <label className="sbm-field">
            <span className="sbm-label">Catatan untuk guru <em>(opsional)</em></span>
            <textarea
              className="guru-input"
              rows={3}
              placeholder="Tulis catatan singkat, mis. kendala yang ditemui saat mengerjakan."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {shownError && <p className="guru-form-error">{shownError}</p>}
        </section>
      </div>
    </AppModal>
  );
}
