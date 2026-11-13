import React, { useState } from 'react';
import { KeyRound, Copy, RefreshCw, Check, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { apiPost, apiPatch } from '../../lib/api';
import './ExamCodeModal.css';

const friendlyError = (err) => err?.message || 'Terjadi kesalahan.';

export default function ExamCodeModal({ open, exam, codeRow, onClose, onSaved }) {
  const [code, setCode] = useState(codeRow?.code || '');
  const [aktif, setAktif] = useState(codeRow?.is_active ?? true);
  const [wajib, setWajib] = useState(!!exam?.butuh_kode);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setBusy('generate');
    setError('');
    try {
      const data = await apiPost(`/guru/exams/${exam.id}/code`, { length: 6 });
      setCode(String(data?.code || ''));
      setAktif(true);
      setWajib(true);
      if (onSaved) await onSaved();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy('');
    }
  };

  const handleToggleWajib = async () => {
    setBusy('wajib');
    setError('');
    try {
      const next = !wajib;
      await apiPatch(`/guru/exams/${exam.id}`, { butuh_kode: next });
      setWajib(next);
      if (onSaved) await onSaved();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy('');
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Browser menolak akses clipboard. Salin kode secara manual.');
    }
  };

  return (
    <AppModal
      open={open}
      title="Kode Akses Ujian"
      subtitle={exam?.judul}
      icon={<KeyRound size={18} />}
      size="md"
      onClose={onClose}
      footer={(
        <button type="button" className="gm-btn-primary" onClick={onClose}>
          Selesai
        </button>
      )}
    >
      <div className="ecm-root">
        {error && (
          <div className="ecm-alert">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        
        <div className="ecm-code-box">
          <span className="ecm-code-label">Kode saat ini</span>
          {code ? (
            <div className={`ecm-code ${aktif ? '' : 'is-off'}`}>{code}</div>
          ) : (
            <div className="ecm-code is-empty">Belum ada kode</div>
          )}
          <div className="ecm-code-actions">
            <button
              type="button"
              className="ecm-btn"
              onClick={handleCopy}
              disabled={!code}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
            <button
              type="button"
              className="ecm-btn is-primary"
              onClick={handleGenerate}
              disabled={busy === 'generate'}
            >
              {busy === 'generate'
                ? <Loader2 size={14} className="gm-spin" />
                : <RefreshCw size={14} />}
              {code ? 'Ganti Kode' : 'Buat Kode'}
            </button>
          </div>
        </div>

        
        <div className="ecm-rows">
          <div className="ecm-row">
            <div className="ecm-row-text">
              <strong>Wajibkan kode untuk memulai</strong>
              <span>Siswa harus memasukkan kode sebelum bisa mengerjakan ujian.</span>
            </div>
            <button
              type="button"
              className={`ecm-switch ${wajib ? 'is-on' : ''}`}
              onClick={handleToggleWajib}
              disabled={busy === 'wajib'}
              aria-pressed={wajib}
            >
              <span />
            </button>
          </div>
        </div>

        <div className="ecm-note">
          <ShieldCheck size={15} />
          <span>
            Kode disimpan di tabel terpisah yang tidak bisa dibaca siswa — termasuk
            lewat devtools. Mengganti kode tidak mengeluarkan siswa yang sudah membuka ujian.
          </span>
        </div>
      </div>
    </AppModal>
  );
}
