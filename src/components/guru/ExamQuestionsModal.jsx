import React, { useState } from 'react';
import {
  ListChecks, PlusCircle, Trash2, Loader2, CheckCircle2, AlertTriangle,
  Pencil, ImagePlus, FileSpreadsheet, FileText, Upload, Info,
} from 'lucide-react';
import GuruModal from './GuruModal';
import { TEMPLATE_CSV_NAME, TEMPLATE_XLSX_NAME } from '../../lib/questionTemplateData';
import { normalizeOpsi } from '../../lib/examOptions';
import './ExamQuestionsModal.css';

const TEMPLATE_BASE = `${import.meta.env.BASE_URL}templates/`;

const emptyQuestion = {
  pertanyaan: '', a: '', b: '', c: '', d: '', kunci: 'A', bobot: 1, gambar_url: '',
};

const isImageUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

export default function ExamQuestionsModal({
  open,
  exam,
  questions,
  loading,
  saving,
  importing,
  error,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  onImport,
}) {
  const [pane, setPane] = useState('manual');
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [localError, setLocalError] = useState('');

  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importParsing, setImportParsing] = useState(false);
  const [importError, setImportError] = useState('');
  const [importDone, setImportDone] = useState(0);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const resetForm = () => {
    setForm(emptyQuestion);
    setEditingId(null);
    setLocalError('');
  };

  const handleClose = () => {
    resetForm();
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setImportParsing(false);
    setImportDone(0);
    setPane('manual');
    onClose();
  };

  const startEdit = (q) => {
    setPane('manual');
    setEditingId(q.id);
    const opsi = normalizeOpsi(q.opsi);
    setForm({
      pertanyaan: q.pertanyaan || '',
      a: opsi[0] || '',
      b: opsi[1] || '',
      c: opsi[2] || '',
      d: opsi[3] || '',
      kunci: q.kunci_jawaban || 'A',
      bobot: q.bobot ?? 1,
      gambar_url: q.gambar_url || '',
    });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!form.pertanyaan.trim()) return setLocalError('Pertanyaan wajib diisi.');
    const opsi = [form.a, form.b, form.c, form.d].map((o) => o.trim());
    if (opsi.some((o) => !o)) return setLocalError('Semua opsi A–D wajib diisi.');

    const gambarUrl = (form.gambar_url || '').trim();
    if (gambarUrl && !isImageUrl(gambarUrl)) {
      return setLocalError('URL gambar harus diawali http:// atau https://.');
    }

    const payload = {
      pertanyaan: form.pertanyaan.trim(),
      opsi,
      kunci: form.kunci,
      bobot: Number(form.bobot) || 1,
      gambar_url: gambarUrl || null,
    };

    const ok = editingId ? await onUpdate(editingId, payload) : await onAdd(payload);
    if (ok) resetForm();
    return undefined;
  };

  const handlePickImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportFile(file);
    setImportResult(null);
    setImportError('');
    setImportDone(0);
    setImportParsing(true);

    try {
      // xlsx (~400 KB) dimuat hanya saat guru benar-benar mengimpor.
      const { parseQuestionFile } = await import('../../lib/questionImport');
      const result = await parseQuestionFile(file);
      setImportResult(result);
      if (!result.rows.length) {
        setImportError(
          result.errors.length
            ? 'Semua baris gagal validasi. Periksa daftar kesalahan di bawah.'
            : 'Tidak ada baris soal yang terbaca. Pastikan template diisi pada sheet "Soal".',
        );
      }
    } catch (err) {
      setImportError(err?.message || 'Gagal membaca berkas.');
    } finally {
      setImportParsing(false);
    }
  };

  const handleRunImport = async () => {
    if (!importResult?.rows.length) return;
    setImportError('');
    const inserted = await onImport(importResult.rows);
    if (inserted) {
      setImportDone(inserted);
      setImportResult(null);
      setImportFile(null);
    }
  };

  const busy = saving === 'soal';

  return (
    <GuruModal
      open={open}
      size="xl"
      icon={<ListChecks size={19} />}
      title="Kelola Soal Ujian"
      subtitle={exam ? `${exam.judul} • ${questions.length} soal` : ''}
      onClose={handleClose}
    >
      <div className="eqm-tabs">
        <button
          type="button"
          className={`eqm-tab ${pane === 'manual' ? 'is-active' : ''}`}
          onClick={() => setPane('manual')}
        >
          <PlusCircle size={14} />
          Input Manual
        </button>
        <button
          type="button"
          className={`eqm-tab ${pane === 'import' ? 'is-active' : ''}`}
          onClick={() => setPane('import')}
        >
          <FileSpreadsheet size={14} />
          Import Excel / CSV
        </button>
      </div>

      <div className="eqm-grid">
        <section className="eqm-pane">
          <div className="eqm-pane-head">
            <h4>Daftar Soal</h4>
            <span>{questions.length} soal</span>
          </div>

          {loading ? (
            <p className="eqm-empty"><Loader2 size={15} className="gm-spin" /> Memuat soal...</p>
          ) : questions.length === 0 ? (
            <p className="eqm-empty">Belum ada soal. Tambahkan lewat formulir di samping.</p>
          ) : (
            <div className="eqm-list">
              {questions.map((q, i) => (
                <article key={q.id} className={`eqm-item ${editingId === q.id ? 'is-editing' : ''}`}>
                  <header className="eqm-item-head">
                    <span className="eqm-num">{i + 1}</span>
                    <p className="eqm-question">{q.pertanyaan}</p>
                    <button
                      type="button"
                      className="eqm-edit"
                      title="Edit soal / tambah gambar"
                      onClick={() => startEdit(q)}
                      disabled={saving === q.id}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="eqm-del"
                      title="Hapus soal"
                      onClick={() => onDelete(q)}
                      disabled={saving === q.id}
                    >
                      {saving === q.id ? <Loader2 size={13} className="gm-spin" /> : <Trash2 size={13} />}
                    </button>
                  </header>

                  {q.gambar_url && (
                    <a
                      className="eqm-thumb"
                      href={q.gambar_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Buka gambar di tab baru"
                    >
                      <img src={q.gambar_url} alt={`Gambar soal ${i + 1}`} loading="lazy" />
                      <span><ImagePlus size={11} /> Gambar soal</span>
                    </a>
                  )}

                  <div className="eqm-options">
                    {normalizeOpsi(q.opsi).map((o, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isKey = letter === q.kunci_jawaban;
                      return (
                        <span key={idx} className={`eqm-option ${isKey ? 'is-key' : ''}`}>
                          <b>{letter}</b>
                          {o}
                          {isKey && <CheckCircle2 size={12} />}
                        </span>
                      );
                    })}
                  </div>

                  <footer className="eqm-item-foot">
                    <span>Kunci: <b>{q.kunci_jawaban}</b></span>
                    <span>Bobot: <b>{q.bobot}</b></span>
                    <span className="eqm-type">{q.tipe === 'essay' ? 'Esai' : 'Pilihan Ganda'}</span>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        {pane === 'manual' ? (
          <section className="eqm-pane is-form">
            <div className="eqm-pane-head">
              <h4>{editingId ? 'Edit Soal' : 'Tambah Soal'}</h4>
              <span>{editingId ? 'Mode edit' : 'PG 4 opsi'}</span>
            </div>

            <form className="eqm-form" onSubmit={handleSubmit}>
              <label className="eqm-label" htmlFor="eqm-pertanyaan">Pertanyaan</label>
              <textarea
                id="eqm-pertanyaan"
                rows={3}
                className="eqm-input"
                placeholder="Tulis pertanyaan..."
                value={form.pertanyaan}
                onChange={(e) => set({ pertanyaan: e.target.value })}
              />

              <div className="eqm-image-field">
                <div className="eqm-image-head">
                  <span className="eqm-label">Gambar Soal (opsional)</span>
                  {form.gambar_url && (
                    <button type="button" className="eqm-image-del" onClick={() => set({ gambar_url: '' })}>
                      Hapus gambar
                    </button>
                  )}
                </div>

                <input
                  type="url"
                  className="eqm-input"
                  placeholder="Tempel URL gambar (https://...)"
                  value={form.gambar_url}
                  onChange={(e) => set({ gambar_url: e.target.value })}
                />

                {isImageUrl(form.gambar_url) && (
                  <div className="eqm-image-preview">
                    <img src={form.gambar_url.trim()} alt="Pratinjau gambar soal" />
                  </div>
                )}

                <p className="eqm-note">
                  <Info size={12} />
                  <span>
                    Gunakan URL gambar publik (JPG/PNG/WEBP). Unggah gambar ke hosting/CDN, lalu
                    tempel tautannya di sini.
                  </span>
                </p>
              </div>

              {['a', 'b', 'c', 'd'].map((key) => (
                <div key={key} className="eqm-option-row">
                  <span className={`eqm-option-letter ${form.kunci === key.toUpperCase() ? 'is-key' : ''}`}>
                    {key.toUpperCase()}
                  </span>
                  <input
                    className="eqm-input"
                    placeholder={`Opsi ${key.toUpperCase()}`}
                    value={form[key]}
                    onChange={(e) => set({ [key]: e.target.value })}
                  />
                </div>
              ))}

              <div className="eqm-form-row">
                <div className="eqm-field">
                  <label className="eqm-label" htmlFor="eqm-kunci">Kunci Jawaban</label>
                  <select
                    id="eqm-kunci"
                    className="eqm-input"
                    value={form.kunci}
                    onChange={(e) => set({ kunci: e.target.value })}
                  >
                    {['A', 'B', 'C', 'D'].map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="eqm-field">
                  <label className="eqm-label" htmlFor="eqm-bobot">Bobot</label>
                  <input
                    id="eqm-bobot"
                    type="number"
                    min="1"
                    className="eqm-input"
                    value={form.bobot}
                    onChange={(e) => set({ bobot: e.target.value })}
                  />
                </div>
              </div>

              {(localError || error) && (
                <p className="eqm-error">
                  <AlertTriangle size={13} /> {localError || error}
                </p>
              )}

              <div className="eqm-form-actions">
                <button type="submit" className="gm-btn-primary eqm-submit" disabled={busy}>
                  {busy ? <Loader2 size={15} className="gm-spin" /> : <PlusCircle size={15} />}
                  <span>
                    {busy ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Soal'}
                  </span>
                </button>
                {editingId && (
                  <button type="button" className="eqm-cancel" onClick={resetForm} disabled={busy}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : (
          <section className="eqm-pane is-import">
            <div className="eqm-pane-head">
              <h4>Import Soal</h4>
              <span>Excel / CSV</span>
            </div>

            <div className="eqm-step">
              <span className="eqm-step-no">1</span>
              <div className="eqm-step-body">
                <p className="eqm-step-title">Unduh template resmi</p>
                <p className="eqm-step-desc">Isi soal pada template ini agar kolomnya sesuai sistem.</p>
                <div className="eqm-step-actions">
                  <a className="eqm-btn is-excel" href={`${TEMPLATE_BASE}${TEMPLATE_XLSX_NAME}`} download>
                    <FileSpreadsheet size={14} /> Template Excel
                  </a>
                  <a className="eqm-btn is-csv" href={`${TEMPLATE_BASE}${TEMPLATE_CSV_NAME}`} download>
                    <FileText size={14} /> Template CSV
                  </a>
                </div>
              </div>
            </div>

            <div className="eqm-step">
              <span className="eqm-step-no">2</span>
              <div className="eqm-step-body">
                <p className="eqm-step-title">Unggah berkas yang sudah diisi</p>
                <p className="eqm-step-desc">Format .xlsx, .xls, atau .csv — maksimal 5 MB.</p>
                <label className="eqm-file-drop">
                  <input type="file" accept=".xlsx,.xls,.xlsm,.csv" onChange={handlePickImport} hidden />
                  {importParsing ? <Loader2 size={16} className="gm-spin" /> : <Upload size={16} />}
                  <span>{importParsing ? 'Membaca berkas...' : importFile?.name || 'Pilih berkas soal...'}</span>
                </label>
              </div>
            </div>

            <p className="eqm-note">
              <Info size={13} />
              <span>
                Gambar di dalam file Excel/CSV <b>diabaikan</b> — sistem hanya membaca teks.
                Setelah soal masuk, tambahkan URL gambar lewat tombol <b>pensil</b> pada daftar soal.
              </span>
            </p>

            {importError && (
              <p className="eqm-error"><AlertTriangle size={13} /> {importError}</p>
            )}

            {importDone > 0 && (
              <p className="eqm-ok">
                <CheckCircle2 size={13} /> {importDone} soal berhasil diimpor.
              </p>
            )}

            {importResult && (
              <div className="eqm-import-result">
                <div className="eqm-import-summary">
                  <span className="is-ok">
                    <CheckCircle2 size={13} /> {importResult.rows.length} soal siap diimpor
                  </span>
                  {importResult.errors.length > 0 && (
                    <span className="is-bad">
                      <AlertTriangle size={13} /> {importResult.errors.length} baris gagal
                    </span>
                  )}
                </div>

                {importResult.hasImages && (
                  <p className="eqm-import-hint">
                    <Info size={12} /> File berisi gambar — gambar tidak ikut diimpor.
                  </p>
                )}

                {importResult.rows.length > 0 && (
                  <div className="eqm-import-preview">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Pertanyaan</th>
                          <th>Kunci</th>
                          <th>Bobot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.rows.slice(0, 8).map((row, idx) => (
                          <tr key={row.baris}>
                            <td>{idx + 1}</td>
                            <td title={row.pertanyaan}>{row.pertanyaan}</td>
                            <td className="is-key">{row.kunci}</td>
                            <td>{row.bobot}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importResult.rows.length > 8 && (
                      <p className="eqm-import-more">+{importResult.rows.length - 8} soal lainnya</p>
                    )}
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <ul className="eqm-import-errors">
                    {importResult.errors.slice(0, 6).map((err) => (
                      <li key={`${err.baris}-${err.message}`}>Baris {err.baris}: {err.message}</li>
                    ))}
                    {importResult.errors.length > 6 && (
                      <li>+{importResult.errors.length - 6} baris gagal lainnya</li>
                    )}
                  </ul>
                )}

                <button
                  type="button"
                  className="gm-btn-primary eqm-submit"
                  onClick={handleRunImport}
                  disabled={!importResult.rows.length || importing}
                >
                  {importing ? <Loader2 size={15} className="gm-spin" /> : <Upload size={15} />}
                  <span>{importing ? 'Mengimpor...' : `Impor ${importResult.rows.length} Soal`}</span>
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </GuruModal>
  );
}
