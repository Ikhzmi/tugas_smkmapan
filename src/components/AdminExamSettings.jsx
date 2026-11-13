import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, CheckCircle2, Clock, Award, AlertTriangle,
  Eye, EyeOff, Loader2, RefreshCw, UserCheck, CalendarClock,
  ShieldAlert, Users, Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExamAttemptsModal from './ExamAttemptsModal';
import ExamRecapCard from './ExamRecapCard';
import { getExamSession, formatExamSession } from '../lib/examSession';
import { TableSkeleton } from './ui/Skeleton';
import Pagination from './ui/Pagination';
import './AdminExamSettings.css';

const PAGE_SIZE = 8;

const formatTanggal = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export default function AdminExamSettings({ hideHeader = false }) {
  const [fiturAktif, setFiturAktif] = useState(true);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsSessionSetup, setNeedsSessionSetup] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsModal, setAttemptsModal] = useState(null);
  const [resettingAttempt, setResettingAttempt] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [page, setPage] = useState(1);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [setRes, exRes, atRes] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'ujian').maybeSingle(),
        supabase
          .from('exams')
          
          .select('*, subjects(nama), teachers(nama)')
          .order('created_at', { ascending: false }),
        supabase
          .from('attempts')
          .select('id, exam_id, student_id, status, dimulai_at, dikumpulkan_at, nilai_akhir, alasan_berhenti, dihentikan_at, students(nama, nisn, classes(nama))')
          .order('dimulai_at', { ascending: false }),
      ]);

      setError('');
      if (setRes.error) throw setRes.error;
      if (exRes.error) throw exRes.error;

      const rows = exRes.data || [];
      const sample = rows[0];
      setNeedsSetup(!!sample && !('is_approved' in sample));
      setNeedsSessionSetup(!!sample && (!('acak_soal' in sample) || !('admin_override' in sample)));
      setFiturAktif(setRes.data?.value?.fitur_aktif !== false);
      setExams(rows.map((x) => ({
        ...x,
        is_active: !!x.is_active,
        is_approved: !!x.is_approved,
        admin_override: !!x.admin_override,
        acak_soal: x.acak_soal !== false,
      })));
      setAttempts(atRes.error ? [] : (atRes.data || []));
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
    setSaving('fitur');
    setError('');
    try {
      const { data: cur } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ujian')
        .maybeSingle();

      const merged = { ...(cur?.value || {}), fitur_aktif: next };
      const { error: upErr } = await supabase
        .from('site_settings')
        .upsert({ key: 'ujian', value: merged });
      if (upErr) throw upErr;

      setFiturAktif(next);
      flash(next ? 'Fitur ujian diaktifkan.' : 'Fitur ujian dimatikan untuk semua siswa.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving('');
    }
  };

  const handleToggleApproved = async (exam) => {
    const next = !exam.is_approved;
    setSaving(exam.id);
    setError('');
    try {
      const { error: upErr } = await supabase
        .from('exams')
        .update({ is_approved: next })
        .eq('id', exam.id);
      if (upErr) throw upErr;

      setExams((prev) => prev.map((x) => (x.id === exam.id ? { ...x, is_approved: next } : x)));
      flash(next
        ? (exam.is_active
          ? `"${exam.judul}" disetujui — tampil ke siswa.`
          : `"${exam.judul}" disetujui, tetapi masih draft. Guru perlu mengaktifkannya agar tampil ke siswa.`)
        : `"${exam.judul}" disembunyikan dari siswa.`);
    } catch (err) {
      setError(err.message || 'Gagal mengubah persetujuan ujian.');
    } finally {
      setSaving('');
    }
  };

  const handleToggleOverride = async (exam) => {
    const next = !exam.admin_override;
    setSaving(`override-${exam.id}`);
    setError('');
    try {
      const { error: upErr } = await supabase
        .from('exams')
        .update({ admin_override: next })
        .eq('id', exam.id);
      if (upErr) throw upErr;

      setExams((prev) => prev.map((x) => (x.id === exam.id ? { ...x, admin_override: next } : x)));
      const siapTampil = exam.is_active && exam.is_approved;
      flash(next
        ? (siapTampil
          ? `"${exam.judul}" dibuka di luar jadwal. Siswa dapat mulai sekarang.`
          : `"${exam.judul}" di-set buka di luar jadwal, tetapi belum tampil ke siswa karena masih ${!exam.is_active ? 'draft' : 'menunggu persetujuan'}.`)
        : `"${exam.judul}" kembali mengikuti jadwal sesi.`);
    } catch (err) {
      const msg = String(err?.message || '');
      setError(
        /admin_override|schema cache/i.test(msg)
          ? 'Fitur buka di luar jadwal belum terpasang. Jalankan md/supabase_cbt_session_guard.sql di Supabase.'
          : (msg || 'Gagal mengubah akses di luar jadwal. Jalankan md/supabase_cbt_session_guard.sql.'),
      );
    } finally {
      setSaving('');
    }
  };

  const handleResetAttempt = async (attempt) => {
    const nama = attempt?.students?.nama || 'siswa ini';
    const ok = window.confirm(
      `Reset pengerjaan ujian ${nama}?\nSeluruh jawaban yang tersimpan akan dihapus dan siswa mengerjakan dari awal.`
    );
    if (!ok) return;

    setResettingAttempt(attempt.id);
    setError('');
    try {
      const { error: rpcErr } = await supabase.rpc('reset_exam_attempt', { p_attempt_id: attempt.id });
      if (rpcErr) throw rpcErr;
      flash(`Pengerjaan ${nama} direset.`);
      await loadData();
    } catch (err) {
      const msg = String(err?.message || '');
      setError(
        /reset_exam_attempt|schema cache/i.test(msg)
          ? 'Fitur reset CBT belum terpasang. Jalankan md/supabase_cbt_session_guard.sql di Supabase.'
          : (msg || 'Gagal mereset pengerjaan ujian.'),
      );
    } finally {
      setResettingAttempt(null);
    }
  };

  const totalTampil = exams.filter((x) => x.is_approved && x.is_active).length;
  const menunggu = exams.filter((x) => !x.is_approved).length;
  const totalDihentikan = attempts.filter((a) => a.status === 'dibatalkan').length;

  // Pencarian + filter status, lalu dipotong per halaman (audit A15).
  const examQuery = search.trim().toLowerCase();
  const examFiltered = exams.filter((x) => {
    if (statusFilter === 'tampil' && !(x.is_approved && x.is_active)) return false;
    if (statusFilter === 'menunggu' && x.is_approved) return false;
    if (statusFilter === 'draft' && x.is_active) return false;
    if (!examQuery) return true;
    return [x.judul, x.subjects?.nama, x.teachers?.nama]
      .some((v) => (v || '').toLowerCase().includes(examQuery));
  });
  const examPageCount = Math.max(1, Math.ceil(examFiltered.length / PAGE_SIZE));
  const examCurrentPage = Math.min(page, examPageCount);
  const examPaged = examFiltered.slice(
    (examCurrentPage - 1) * PAGE_SIZE,
    examCurrentPage * PAGE_SIZE,
  );

  return (
    <div className="aes-root">
      {!hideHeader && (
        <div className="aes-header">
          <div className="aes-header-icon"><ShieldCheck size={22} /></div>
          <div className="aes-header-text">
            <h3>Pengaturan Ujian (CBT)</h3>
            <p>
              Kendalikan fitur CBT, persetujuan ujian, dan akses di luar jadwal. Ujian buatan guru
              hanya tampil setelah Anda setujui; siswa hanya bisa mulai saat sesi ujian dibuka.
            </p>
          </div>
          <button type="button" className="aes-refresh" onClick={loadData} disabled={loading} title="Muat ulang">
            <RefreshCw size={15} className={loading ? 'aes-spin' : ''} />
          </button>
        </div>
      )}

      {needsSetup && (
        <div className="aes-alert is-error" style={{ alignItems: 'flex-start' }}>
          <AlertTriangle size={16} />
          <span>
            Database CBT belum siap. Jalankan <strong>md/supabase_admin_exam_control.sql</strong> dan
            <strong> md/supabase_cbt_session_guard.sql</strong> di Supabase → SQL Editor, lalu klik
            tombol muat ulang di kanan atas.
          </span>
        </div>
      )}

      {needsSessionSetup && (
        <div className="aes-alert is-error" style={{ alignItems: 'flex-start' }}>
          <AlertTriangle size={16} />
          <span>
            Fitur <strong>sesi ujian, acak soal, dan pengawasan tab</strong> belum aktif. Jalankan
            <strong> md/supabase_cbt_session_guard.sql</strong> di Supabase → SQL Editor, lalu klik
            tombol muat ulang di kanan atas.
          </span>
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
            disabled={saving === 'fitur' || loading}
          >
            {saving === 'fitur' ? <Loader2 size={16} className="aes-spin" /> : null}
            <span>{fiturAktif ? 'Aktif' : 'Nonaktif'}</span>
          </button>
        </div>
      </div>

      
      <div className="aes-stats">
        <div className="aes-stat">
          <Award size={18} />
          <div>
            <span>Total Ujian</span>
            <strong>{exams.length}</strong>
          </div>
        </div>
        <div className="aes-stat">
          <Clock size={18} />
          <div>
            <span>Menunggu Persetujuan</span>
            <strong>{menunggu}</strong>
          </div>
        </div>
        <div className="aes-stat">
          <CheckCircle2 size={18} />
          <div>
            <span>Tampil ke Siswa</span>
            <strong>{totalTampil}</strong>
          </div>
        </div>
        <div className="aes-stat">
          <ShieldAlert size={18} />
          <div>
            <span>Pengerjaan Dihentikan</span>
            <strong>{totalDihentikan}</strong>
          </div>
        </div>
      </div>

      
      <div className="aes-toolbar">
        <div className="aes-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Cari judul / mapel / guru…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Cari ujian"
          />
        </div>
        <select
          className="aes-filter"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label="Filter status ujian"
        >
          <option value="semua">Semua status</option>
          <option value="tampil">Tampil ke siswa</option>
          <option value="menunggu">Menunggu persetujuan</option>
          <option value="draft">Draft (guru)</option>
        </select>
        <span className="aes-toolbar-count">
          {examFiltered.length === exams.length
            ? `${exams.length} ujian`
            : `${examFiltered.length} dari ${exams.length} ujian`}
        </span>
      </div>

      <div className="aes-list-head">
        <h4>Daftar Ujian dari Guru</h4>
        <span>Halaman {examCurrentPage} / {examPageCount}</span>
      </div>

      {loading ? (
        <TableSkeleton rows={4} template="1.5fr 1fr 130px 130px 150px" withToolbar={false} />
      ) : exams.length === 0 ? (
        <div className="aes-empty">Belum ada ujian yang dibuat guru.</div>
      ) : examFiltered.length === 0 ? (
        <div className="aes-empty">Tidak ada ujian yang cocok dengan pencarian atau filter.</div>
      ) : (
        <>
        <div className="aes-list">
          {examPaged.map((x) => {
            const tampil = x.is_approved && x.is_active;
            const session = getExamSession(x);
            const examAttempts = attempts.filter((a) => a.exam_id === x.id);
            const terminated = examAttempts.filter((a) => a.status === 'dibatalkan').length;
            const sessionTone = session.state === 'open'
              ? 'is-live'
              : session.state === 'ended'
                ? 'is-off'
                : 'is-wait';
            return (
              <div key={x.id} className="aes-row">
                <div className="aes-row-main">
                  <div className="aes-row-title">
                    <strong>{x.judul}</strong>
                    <div className="aes-pills">
                      <span className={`aes-pill ${x.is_active ? 'is-live' : 'is-draft'}`}>
                        {x.is_active ? 'Aktif (guru)' : 'Draft (guru)'}
                      </span>
                      <span className={`aes-pill ${x.is_approved ? 'is-ok' : 'is-wait'}`}>
                        {x.is_approved ? 'Disetujui' : 'Menunggu'}
                      </span>
                      <span className={`aes-pill ${tampil ? 'is-ok' : 'is-off'}`}>
                        {tampil ? 'Tampil ke siswa' : 'Tersembunyi'}
                      </span>
                      <span className={`aes-pill ${sessionTone}`}>
                        {session.shortLabel}
                      </span>
                      {x.admin_override && (
                        <span className="aes-pill is-wait">Di luar jadwal</span>
                      )}
                      {terminated > 0 && (
                        <span className="aes-pill is-off">{terminated} dihentikan</span>
                      )}
                    </div>
                  </div>
                  <div className="aes-row-meta">
                    <span><Award size={13} /> {x.subjects?.nama || 'Tanpa mapel'}</span>
                    <span><UserCheck size={13} /> {x.teachers?.nama || 'Tanpa guru'}</span>
                    <span><Clock size={13} /> {x.durasi_menit} menit</span>
                    <span><CalendarClock size={13} /> {formatExamSession(x)}</span>
                    <span><ShieldAlert size={13} /> {x.acak_soal !== false ? 'Soal diacak' : 'Soal urut'}</span>
                    <span><Users size={13} /> {examAttempts.length} pengerjaan</span>
                    <span>Dibuat {formatTanggal(x.created_at)}</span>
                  </div>
                </div>

                <div className="aes-row-actions">
                  <button
                    type="button"
                    className={`aes-btn ${x.is_approved ? 'is-off' : 'is-on'}`}
                    onClick={() => handleToggleApproved(x)}
                    disabled={saving === x.id}
                  >
                    {saving === x.id ? <Loader2 size={14} className="aes-spin" /> : null}
                    <span>{x.is_approved ? 'Batalkan Persetujuan' : 'Setujui & Tampilkan'}</span>
                  </button>

                  <button
                    type="button"
                    className={`aes-btn ${x.admin_override ? 'is-off' : 'is-override'}`}
                    onClick={() => handleToggleOverride(x)}
                    disabled={saving === `override-${x.id}`}
                    title="Buka ujian tanpa menunggu jadwal sesi"
                  >
                    {saving === `override-${x.id}`
                      ? <Loader2 size={14} className="aes-spin" />
                      : <ShieldAlert size={14} />}
                    <span>{x.admin_override ? 'Kembalikan ke Jadwal' : 'Buka di Luar Jadwal'}</span>
                  </button>

                  <button
                    type="button"
                    className="aes-btn is-ghost"
                    onClick={() => setAttemptsModal(x)}
                  >
                    <Users size={14} />
                    <span>Pengerjaan ({examAttempts.length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <Pagination
          page={examCurrentPage}
          pageCount={examPageCount}
          onChange={setPage}
          total={examFiltered.length}
          pageSize={PAGE_SIZE}
          label="ujian"
        />
        </>
      )}

      <ExamRecapCard attempts={attempts} exams={exams} showTeacher />

      <p className="aes-footnote">
        Catatan: ujian tampil ke siswa hanya jika <strong>Aktif + Disetujui</strong>. Siswa hanya bisa
        mulai saat <strong>sesi ujian dibuka</strong> sesuai tanggal/jam dari guru. Gunakan
        <strong> Buka di Luar Jadwal</strong> bila ujian perlu diakses sebelum/sesudah sesi. Jika siswa
        pindah tab, ujian dihentikan dan harus <strong>direset dari awal</strong> lewat daftar pengerjaan.
      </p>

      <ExamAttemptsModal
        open={!!attemptsModal}
        exam={attemptsModal}
        attempts={attemptsModal ? attempts.filter((a) => a.exam_id === attemptsModal.id) : []}
        onClose={() => setAttemptsModal(null)}
        onReset={handleResetAttempt}
        busyId={resettingAttempt}
      />
    </div>
  );
}
