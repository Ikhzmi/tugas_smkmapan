import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Info,
  Eye, EyeOff, Loader2, RefreshCw,
} from 'lucide-react';
import { apiGet, apiPut } from '../lib/api';
import './AdminExamSettings.css';

export default function AdminExamSettings({ hideHeader = false }) {
  const [fiturAktif, setFiturAktif] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await apiGet('/admin/site-settings');
      setError('');
      setFiturAktif(settings?.ujian?.fitur_aktif !== false);
    } catch (err) {
      setError(err.message || 'Gagal memuat pengaturan ujian.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(loadData);
  }, [loadData]);

  const handleToggleFitur = async () => {
    const next = !fiturAktif;
    setSaving(true);
    setError('');
    try {
      const settings = await apiGet('/admin/site-settings');
      const merged = { ...(settings?.ujian || {}), fitur_aktif: next };
      await apiPut('/admin/site-settings/ujian', { value: merged });
      setFiturAktif(next);
      flash(next ? 'Fitur ujian diaktifkan.' : 'Fitur ujian dimatikan untuk semua siswa.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aes-root">
      {!hideHeader && (
        <div className="aes-header">
          <div className="aes-header-icon"><ShieldCheck size={22} /></div>
          <div className="aes-header-text">
            <h3>Pengaturan Ujian (CBT)</h3>
            <p>
              Kendalikan ketersediaan fitur CBT untuk seluruh sekolah. Pembuatan soal, persetujuan,
              dan pengawasan pengerjaan dilakukan guru melalui dashboard guru.
            </p>
          </div>
          <button type="button" className="aes-refresh" onClick={loadData} disabled={loading} title="Muat ulang">
            <RefreshCw size={15} className={loading ? 'aes-spin' : ''} />
          </button>
        </div>
      )}

      {error && (
        <div className="aes-alert is-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="aes-alert is-ok">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className={`aes-master ${fiturAktif ? 'is-on' : 'is-off'}`}>
        <div className="aes-master-left">
          <div className="aes-master-icon">
            {fiturAktif ? <Eye size={20} /> : <EyeOff size={20} />}
          </div>
          <div>
            <strong>Fitur Ujian untuk Siswa</strong>
            <span>
              {fiturAktif
                ? 'Aktif — menu Ujian tampil di dashboard guru & siswa.'
                : 'Nonaktif — menu Ujian disembunyikan dari guru & siswa.'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hideHeader && (
            <button
              type="button"
              className="aes-refresh"
              onClick={loadData}
              disabled={loading}
              title="Muat ulang data ujian"
            >
              <RefreshCw size={15} className={loading ? 'aes-spin' : ''} />
            </button>
          )}
          <button
            type="button"
            className={`aes-switch ${fiturAktif ? 'on' : 'off'}`}
            onClick={handleToggleFitur}
            disabled={saving || loading}
          >
            {saving ? <Loader2 size={16} className="aes-spin" /> : null}
            <span>{fiturAktif ? 'Aktif' : 'Nonaktif'}</span>
          </button>
        </div>
      </div>

      
      <div className="aes-alert is-info" style={{ alignItems: 'flex-start' }}>
        <Info size={16} />
        <span>
          Daftar ujian, persetujuan tampilan, kode ujian, dan reset/terminasi pengerjaan dikelola
          per ujian oleh <strong>guru pembuat</strong> melalui menu <strong>Ujian</strong> di dashboard
          guru. Sakelar di atas mengontrol apakah fitur CBT tersedia untuk seluruh siswa.
        </span>
      </div>

      <p className="aes-footnote">
        Catatan: saat fitur dimatikan, menu Ujian disembunyikan dari guru &amp; siswa. Pengaturan ini
        tersimpan di server dan berlaku untuk semua pengguna.
      </p>
    </div>
  );
}
