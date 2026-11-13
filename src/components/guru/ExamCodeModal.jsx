import React, { useState } from 'react';
import { KeyRound, Copy, RefreshCw, Check, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { supabase } from '../../lib/supabase';
import './ExamCodeModal.css';

const friendlyError = (err) => {
  const msg = String(err?.message || '');
  if (msg.includes('Could not find the function') || (msg.includes('does not exist') && msg.includes('function'))) {
    return 'Fitur kode belum terpasang. Jalankan md/supabase_exam_code.sql di Supabase SQL Editor, lalu coba lagi.';
  }
  if (msg.includes('butuh_kode')) {
    return 'Kolom butuh_kode belum ada. Jalankan md/supabase_exam_code.sql di Supabase SQL Editor.';
  }
  if (msg.includes('exam_codes')) {
    return 'Tabel exam_codes belum ada. Jalankan md/supabase_exam_code.sql di Supabase SQL Editor.';
  }
  return msg || 'Terjadi kesalahan.';
};

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
      const { data, error: rpcErr } = await supabase.rpc('generate_exam_code', {
        p_exam_id: exam.id,
        p_length: 6,
      });
      if (rpcErr) throw rpcErr;
      setCode(String(data || ''));
      setAktif(true);
      setWajib(true);
      if (onSaved) await onSaved();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy('');
    }
  };

  const handleToggleAktif = async () => {
    if (!code) return;
    setBusy('aktif');
    setError('');
    try {
      const next = !aktif;
      const { error: upErr } = await supabase
        .from('exam_codes')
        .update({ is_active: next })
        .eq('exam_id', exam.id);
      if (upErr) throw upErr;
      setAktif(next);
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
      const { error: upErr } = await supabase
        .from('exams')
        .update({ butuh_kode: next })
        .eq('id', exam.id);
      if (upErr) throw upErr;
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

          <div className="ecm-row">
            <div className="ecm-row-text">
              <strong>Kode aktif</strong>
              <span>Matikan untuk menutup akses tanpa menghapus kode.</span>
            </div>
            <button
              type="button"
              className={`ecm-switch ${aktif && code ? 'is-on' : ''}`}
              onClick={handleToggleAktif}
              disabled={!code || busy === 'aktif'}
              aria-pressed={aktif && !!code}
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
