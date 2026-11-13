import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LogOut, GraduationCap, BookOpen, Layers, Calendar,
  FileText, Video, Link2, ClipboardList, Award,
  ChevronRight, Clock, UserCheck, Paperclip, CheckCircle2,
  Search, Inbox, PlayCircle, MessageSquareQuote, AlertTriangle, Lock,
  CalendarClock, ShieldAlert, LayoutDashboard, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiGet, apiListAll, apiPost, apiUpload } from '../lib/api';
import { getExamSession, formatExamSession, consumeReloadResume } from '../lib/examSession';
import { useContent } from '../context/ContentContext';
import SubmissionModal from '../components/siswa/SubmissionModal';
import MaterialViewerModal from '../components/siswa/MaterialViewerModal';
import ExamRunner from '../components/siswa/ExamRunner';
import PresensiSiswa from '../components/siswa/PresensiSiswa';
import './DashboardSiswa.css';
import './DashboardGuru.css';
import './DashboardSiswaModular.css';
import { useTheme } from '../hooks/useTheme';
import { useHeaderScroll } from '../hooks/useHeaderScroll';
import AnimatedThemeToggler from '../components/AnimatedThemeToggler';
import MobileBottomNav from '../components/MobileBottomNav';
import MagicBento from '../components/ui/MagicBento';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import GlassConfirmModal from '../components/ui/GlassConfirmModal';
import '../styles/portal-shell.css';

const HARI_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

const getTodayDayName = () => {
  const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  return days[new Date().getDay()];
};


const friendlySubmitError = (err) => {
  if (err?.code === 'ALREADY_SUBMITTED') {
    return 'Anda sudah mengumpulkan tugas ini. Hubungi guru jika ingin mengumpulkan ulang.';
  }
  const msg = String(err?.message || '');
  if (msg.toLowerCase().includes('too large') || msg.toLowerCase().includes('maximum allowed size') || msg.includes('25600')) {
    return 'Berkas terlalu besar. Maksimal 25 MB.';
  }
  const fieldErrors = err?.errors && typeof err.errors === 'object'
    ? Object.values(err.errors).flat().filter(Boolean)
    : [];
  if (fieldErrors.length) return fieldErrors.join(' ');
  return msg || 'Gagal mengumpulkan tugas.';
};

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

const formatTanggalPendek = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const statusTugas = (sub) => {
  if (!sub) return { key: 'open', label: 'Belum dikumpulkan', tone: 'is-draft' };
  if (sub.status === 'dinilai') return { key: 'graded', label: `Dinilai • ${sub.nilai ?? '-'}`, tone: 'is-live' };
  return { key: 'submitted', label: 'Menunggu dinilai', tone: 'is-draft' };
};

// API memakai nama relasi tunggal (subject/teacher/school_class); komponen web
// memakai bentuk jamak. Pemetaan dilakukan di lapisan pemuatan data ini.
const mapSchedule = (s) => ({ ...s, subjects: s.subject || null, teachers: s.teacher || null });
const mapMaterial = (m) => ({ ...m, subjects: m.subject || null });
const mapAssignment = (a) => ({ ...a, subjects: a.subject || null });
const mapStudent = (raw) => ({
  ...raw,
  classes: raw.school_class
    ? { ...raw.school_class, majors: raw.school_class.major || null }
    : null,
});

export default function DashboardSiswa() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isHeaderHidden = useHeaderScroll();
  const { schoolInfo, appearance } = useContent();

  const [student, setStudent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [questionCounts, setQuestionCounts] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [unlockedExams, setUnlockedExams] = useState(new Set());
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examFeatureOn, setExamFeatureOn] = useState(true);
  
  
  const [clockNow, setClockNow] = useState(() => Date.now());

  
  const [qMapel, setQMapel] = useState('');
  const [qTugas, setQTugas] = useState('');
  const [fTugasStatus, setFTugasStatus] = useState('semua');
  const [fTugasMapel, setFTugasMapel] = useState('semua');
  const [qJadwal, setQJadwal] = useState('');
  const [fJadwalHari, setFJadwalHari] = useState('semua');
  const [qUjian, setQUjian] = useState('');

  
  const [materialView, setMaterialView] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [examTarget, setExamTarget] = useState(null);
  const [subBusy, setSubBusy] = useState(false);
  const [subError, setSubError] = useState('');

  // State untuk Glass Confirmation Modal
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    tone: 'danger',
    extraDetails: null,
    onConfirm: null,
    loading: false,
  });

  
  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'siswa') navigate('/login');
  }, [user, profile, loading, navigate]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const dash = await apiGet('/siswa/dashboard');
      if (!dash?.student) {
        setStudent(null);
        return;
      }
      const st = mapStudent(dash.student);
      setStudent(st);

      const [sch, mats, asg, exm, subs, att, site] = await Promise.all([
        apiListAll('/siswa/schedules').catch(() => []),
        apiListAll('/siswa/materials').catch(() => []),
        apiListAll('/siswa/assignments').catch(() => []),
        apiListAll('/siswa/exams').catch(() => []),
        apiListAll('/siswa/submissions').catch(() => []),
        apiListAll('/siswa/attendance').catch(() => []),
        apiGet('/public/site', { auth: false }).catch(() => ({})),
      ]);

      setSchedules(sch.map(mapSchedule));
      setMaterials(mats.map(mapMaterial));
      setAssignments(asg.map(mapAssignment));

      const examRows = exm.map((x) => ({
        ...x,
        subjects: x.subject || null,
        butuh_kode: x.butuh_kode ?? false,
        admin_override: !!x.admin_override,
        acak_soal: x.acak_soal !== false,
      }));
      setExams(examRows);
      setSubmissions(subs);
      setExamFeatureOn(site?.ujian?.fitur_aktif !== false);

      // Attempt & jumlah soal berasal dari payload ujian (relasi attempts +
      // questions_count), bukan tabel terpisah.
      const attemptRows = [];
      const counts = {};
      examRows.forEach((x) => {
        counts[x.id] = x.questions_count ?? 0;
        (x.attempts || []).forEach((a) => attemptRows.push({ ...a, exam_id: x.id }));
      });
      setAttempts(attemptRows);
      setQuestionCounts(counts);
      setAttendance(att);

      // Status buka-kode per ujian (hanya ujian yang memerlukan kode).
      const unlocked = new Set();
      await Promise.all(examRows.filter((x) => x.butuh_kode).map(async (x) => {
        try {
          const res = await apiGet(`/siswa/exams/${x.id}/unlock`);
          if (res?.unlocked) unlocked.add(x.id);
        } catch { /* abaikan */ }
      }));
      setUnlockedExams(unlocked);

      // Setelah refresh di tengah ujian, ujian yang masih berjalan dibuka kembali
      // (modal "Lanjutkan Ujian"), bukan ditinggal di dashboard.
      const resumeExamId = consumeReloadResume();
      if (resumeExamId) {
        const target = examRows.find((x) => x.id === resumeExamId);
        const berjalan = attemptRows.some((a) => a.exam_id === resumeExamId && a.status === 'berjalan');
        if (target && berjalan) setExamTarget({ ...target, jumlah_soal: counts[target.id] || 0 });
      }
    } catch {
      // Biarkan state sebelumnya bila server tidak terjangkau.
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && profile?.role === 'siswa') queueMicrotask(loadData);
  }, [user, profile, loadData]);

  useEffect(() => {
    const tick = () => setClockNow(Date.now());
    const id = setInterval(tick, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleLogout = () => {
    setConfirmState({
      open: true,
      tone: 'logout',
      title: 'Keluar dari Akun Siswa?',
      message: 'Sesi belajar Anda di LMS akan diakhiri. Pastikan catatan dan tugas Anda telah tersimpan dengan baik.',
      confirmText: 'Keluar Sekarang',
      cancelText: 'Tetap di Sini',
      loading: false,
      extraDetails: null,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        try {
          await signOut();
          navigate('/login');
        } finally {
          setConfirmState((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  
  const subjectMap = useMemo(() => {
    const map = new Map();
    schedules.forEach((s) => {
      if (!s.subject_id) return;
      let e = map.get(s.subject_id);
      if (!e) {
        e = {
          id: s.subject_id,
          nama: s.subjects?.nama || 'Mata Pelajaran',
          kode: s.subjects?.kode || '',
          teachers: [],
          sessions: [],
          materials: [],
          assignments: [],
          exams: [],
        };
        map.set(s.subject_id, e);
      }
      if (s.teachers?.nama && !e.teachers.includes(s.teachers.nama)) e.teachers.push(s.teachers.nama);
      e.sessions.push(s);
    });

    materials.forEach((m) => {
      const e = map.get(m.subject_id);
      if (e) e.materials.push(m);
    });
    assignments.forEach((a) => {
      const e = map.get(a.subject_id);
      if (e) e.assignments.push(a);
    });
    if (examFeatureOn) {
      exams.forEach((x) => {
        const e = map.get(x.subject_id);
        if (e) e.exams.push(x);
      });
    }
    return map;
  }, [schedules, materials, assignments, exams, examFeatureOn]);

  const subjects = useMemo(() => Array.from(subjectMap.values()), [subjectMap]);
  const activeSubject = selectedSubject ? subjectMap.get(selectedSubject) : null;
  const subsByAssignment = useMemo(
    () => new Map(submissions.map((s) => [s.assignment_id, s])),
    [submissions],
  );
  
  
  const attemptByExam = useMemo(() => {
    const m = new Map();
    attempts.forEach((a) => {
      const prev = m.get(a.exam_id);
      if (!prev) { m.set(a.exam_id, a); return; }
      const prevDone = prev.status !== 'berjalan';
      const curDone = a.status !== 'berjalan';
      if (curDone && !prevDone) { m.set(a.exam_id, a); return; }
      if (curDone === prevDone && String(a.dimulai_at) > String(prev.dimulai_at)) m.set(a.exam_id, a);
    });
    return m;
  }, [attempts]);

  const sortedSchedules = useMemo(
    () => [...schedules].sort(
      (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari)
        || String(a.jam_mulai).localeCompare(String(b.jam_mulai)),
    ),
    [schedules],
  );

  
  const filteredSubjects = useMemo(() => {
    const q = qMapel.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => (
      s.nama.toLowerCase().includes(q)
      || s.kode.toLowerCase().includes(q)
      || s.teachers.join(' ').toLowerCase().includes(q)
    ));
  }, [subjects, qMapel]);

  
  const tugasRows = useMemo(
    () => assignments.map((a) => ({
      assignment: a,
      sub: subsByAssignment.get(a.id),
      subject: subjects.find((s) => s.id === a.subject_id),
    })),
    [assignments, subsByAssignment, subjects],
  );

  const filteredTugas = useMemo(() => {
    const q = qTugas.trim().toLowerCase();
    return tugasRows.filter(({ assignment, sub, subject }) => {
      if (fTugasStatus !== 'semua') {
        const st = statusTugas(sub).key;
        if (fTugasStatus !== st) return false;
      }
      if (fTugasMapel !== 'semua' && String(assignment.subject_id) !== String(fTugasMapel)) return false;
      if (!q) return true;
      return assignment.judul.toLowerCase().includes(q)
        || (subject?.nama || '').toLowerCase().includes(q);
    });
  }, [tugasRows, qTugas, fTugasStatus, fTugasMapel]);

  const tugasStats = useMemo(() => {
    let open = 0; let submitted = 0; let graded = 0;
    tugasRows.forEach(({ sub }) => {
      const k = statusTugas(sub).key;
      if (k === 'open') open += 1;
      else if (k === 'submitted') submitted += 1;
      else graded += 1;
    });
    return { open, submitted, graded };
  }, [tugasRows]);

  
  const filteredJadwal = useMemo(() => {
    const q = qJadwal.trim().toLowerCase();
    return sortedSchedules.filter((s) => {
      if (fJadwalHari !== 'semua' && s.hari !== fJadwalHari) return false;
      if (!q) return true;
      return (s.subjects?.nama || '').toLowerCase().includes(q)
        || (s.teachers?.nama || '').toLowerCase().includes(q);
    });
  }, [sortedSchedules, qJadwal, fJadwalHari]);

  const jadwalByDay = useMemo(() => {
    const groups = new Map();
    filteredJadwal.forEach((s) => {
      if (!groups.has(s.hari)) groups.set(s.hari, []);
      groups.get(s.hari).push(s);
    });
    return HARI_ORDER
      .filter((h) => groups.has(h))
      .map((h) => ({ hari: h, items: groups.get(h) }));
  }, [filteredJadwal]);

  
  const examRows = useMemo(() => {
    if (!examFeatureOn) return [];
    const q = qUjian.trim().toLowerCase();
    return exams
      .filter((x) => subjectMap.has(x.subject_id))
      .map((x) => ({
        exam: x,
        subject: subjects.find((s) => s.id === x.subject_id),
        attempt: attemptByExam.get(x.id),
        jumlahSoal: questionCounts[x.id] || 0,
      }))
      .filter(({ exam, subject }) => {
        if (!q) return true;
        return exam.judul.toLowerCase().includes(q)
          || (subject?.nama || '').toLowerCase().includes(q);
      });
  }, [exams, examFeatureOn, subjectMap, subjects, attemptByExam, questionCounts, qUjian]);

  const examOpenCount = useMemo(() => examRows.filter(({ exam, attempt, jumlahSoal }) => {
    if (attempt?.status === 'dibatalkan') return false;
    if (attempt?.status === 'berjalan') return true;
    if (attempt) return false;
    return getExamSession(exam, clockNow).canStart && jumlahSoal > 0;
  }).length, [examRows, clockNow]);

  const todayDayName = useMemo(() => getTodayDayName(), []);

  const todaySchedules = useMemo(() => {
    return sortedSchedules.filter((s) => (s.hari || '').toLowerCase() === todayDayName);
  }, [sortedSchedules, todayDayName]);

  const pendingAssignments = useMemo(() => {
    return tugasRows.filter(({ sub }) => statusTugas(sub).key === 'open');
  }, [tugasRows]);

  
  const handleSubmitAssignment = async ({ file, link, note }) => {
    if (!student || !submitTarget) return;
    setSubError('');
    setSubBusy(true);
    try {
      const assignmentId = submitTarget.assignment.id;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        if (note) form.append('catatan', note);
        await apiUpload(`/siswa/assignments/${assignmentId}/submissions`, form);
      } else {
        await apiPost(`/siswa/assignments/${assignmentId}/submissions`, {
          file_url: link || null,
          catatan: note || null,
        });
      }

      setSubmitTarget(null);
      await loadData();
    } catch (err) {
      setSubError(friendlySubmitError(err));
    } finally {
      setSubBusy(false);
    }
  };

  const studentClassName = student?.classes?.nama || '-';

  const siswaBentoItems = useMemo(() => {
    const items = [
      {
        id: 'mapel',
        icon: BookOpen,
        iconColor: '#e8702a',
        glowColor: '232, 112, 42',
        label: 'Akademik',
        title: 'Mata Pelajaran',
        value: subjects.length,
        note: `Kelas ${studentClassName}`,
        description: 'Daftar mata pelajaran aktif semester ini',
        onClick: () => { setActiveTab('mapel'); setSelectedSubject(null); }
      },
      {
        id: 'tugas',
        icon: ClipboardList,
        iconColor: '#f97316',
        glowColor: '249, 115, 22',
        label: 'Evaluasi',
        title: 'Tugas Terbuka',
        value: assignments.length,
        note: `${tugasStats.open} belum dikumpul`,
        badge: tugasStats.open > 0 ? `${tugasStats.open} Tugas Baru` : 'Tuntas',
        description: 'Tenggat waktu pengumpulan tugas & portofolio',
        onClick: () => { setActiveTab('tugas'); setFTugasStatus('open'); }
      },
    ];

    if (examFeatureOn) {
      items.push({
        id: 'ujian',
        icon: Award,
        iconColor: '#a855f7',
        glowColor: '168, 85, 247',
        label: 'CBT Online',
        title: 'Ujian Aktif',
        value: examOpenCount,
        note: examOpenCount > 0 ? 'Siap dikerjakan' : 'Belum ada sesi',
        badge: examOpenCount > 0 ? 'Sesi Dibuka' : undefined,
        description: 'Asesmen sumatif & ujian berbasis komputer',
        onClick: () => setActiveTab('ujian')
      });
    }

    items.push({
      id: 'materi',
      icon: Layers,
      iconColor: '#10b981',
      glowColor: '16, 185, 129',
      label: 'Bahan Ajar',
      title: 'Materi Tersedia',
      value: materials.length,
      note: 'Dari guru pengampu',
      description: 'E-book, modul PDF, dan rekaman materi',
      onClick: () => { setActiveTab('mapel'); setSelectedSubject(null); }
    });

    return items;
  }, [subjects.length, studentClassName, assignments.length, tugasStats.open, examFeatureOn, examOpenCount, materials.length]);

  // Skeleton penuh saat autentikasi/profil masih dimuat, bukan layar kosong.
  if (loading) {
    return (
      <div className="dashboard-siswa-root dashboard-shell" style={{ minHeight: '100vh', padding: '32px' }}>
        <DashboardSkeleton cards={4} showHero />
      </div>
    );
  }

  if (!user || profile?.role !== 'siswa') return null;

  const displayName = student?.nama || profile?.nama || 'Siswa';
  const className = student?.classes?.nama || '-';
  const majorName = student?.classes?.majors?.nama || '-';

  
  const renderTugasCard = (a, sub, subjectName) => {
    const st = statusTugas(sub);
    return (
      <article key={a.id} className="guru-wide-card">
        <div className="guru-wide-head">
          <div className="guru-wide-title">
            <span className="guru-item-icon"><ClipboardList size={18} /></span>
            <div>
              <strong>{a.judul}</strong>
              <span className="guru-item-sub">
                {subjectName || 'Mata pelajaran'} &bull; Deadline {formatTanggal(a.deadline)}
              </span>
            </div>
          </div>
          <div className="guru-wide-side">
            <span className={`guru-status ${st.tone}`}>{st.label}</span>
          </div>
        </div>

        {a.deskripsi && <p className="guru-item-desc">{a.deskripsi}</p>}

        {sub?.feedback && (
          <div className="siswa-feedback-box">
            <MessageSquareQuote size={15} />
            <div>
              <strong>Umpan balik guru</strong>
              <p>{sub.feedback}</p>
            </div>
          </div>
        )}

        <div className="guru-item-foot">
          <span className="siswa-task-foot-meta">
            {sub ? `Dikumpulkan ${formatTanggal(sub.dikumpulkan_at)}` : 'Belum ada berkas terkirim'}
          </span>
          {sub ? (
            <span className={`siswa-task-score ${sub.status === 'dinilai' ? 'is-graded' : ''}`}>
              {sub.status === 'dinilai' ? `Nilai ${sub.nilai ?? '-'}` : 'Menunggu nilai'}
            </span>
          ) : (
            <button
              type="button"
              className="guru-primary-btn"
              onClick={() => {
                setSubError('');
                setSubmitTarget({ assignment: a, subjectName });
              }}
            >
              <Paperclip size={15} /> Kumpulkan Tugas
            </button>
          )}
        </div>
      </article>
    );
  };

  
  const renderExamCard = (x, subjectName) => {
    const attempt = attemptByExam.get(x.id);
    const session = getExamSession(x, clockNow);
    const dibatalkan = attempt?.status === 'dibatalkan';
    const selesai = attempt && attempt.status !== 'berjalan' && !dibatalkan;
    const berjalan = attempt?.status === 'berjalan';
    const jumlahSoal = questionCounts[x.id] || 0;
    const terkunci = !!x.butuh_kode && !unlockedExams.has(x.id);
    const bisaDibuka = dibatalkan || selesai || berjalan || session.canStart;
    const disabled = !bisaDibuka || (!dibatalkan && !selesai && !berjalan && jumlahSoal === 0);
    const statusLabel = dibatalkan
      ? 'Dihentikan'
      : selesai ? 'Sudah dikerjakan'
        : berjalan ? 'Sedang dikerjakan' : 'Belum dikerjakan';
    const statusTone = dibatalkan
      ? 'is-danger'
      : selesai ? 'is-live'
        : berjalan ? 'is-warn' : 'is-draft';

    return (
      <article key={x.id} className="guru-wide-card">
        <div className="guru-wide-head">
          <div className="guru-wide-title">
            <span className="guru-item-icon is-purple"><Award size={18} /></span>
            <div>
              <strong>{x.judul}</strong>
              <span className="guru-item-sub">{subjectName || 'Mata pelajaran'}</span>
            </div>
          </div>
          <div className="guru-wide-side">
            <span className={`guru-status ${statusTone}`}>{statusLabel}</span>
          </div>
        </div>

        <div className="guru-item-tags">
          <span className="guru-tag is-soft"><Clock size={12} /> {x.durasi_menit} menit</span>
          <span className="guru-tag is-soft"><ClipboardList size={12} /> {jumlahSoal} soal</span>
          {(x.waktu_mulai || x.waktu_selesai) && (
            <span className="guru-tag is-soft">
              <CalendarClock size={12} /> {formatExamSession(x)}
            </span>
          )}
          {x.admin_override && (
            <span className="guru-tag">
              <ShieldAlert size={12} /> Dibuka admin
            </span>
          )}
          {x.butuh_kode && (
            <span className="guru-tag">
              <Lock size={12} /> Butuh kode
            </span>
          )}
        </div>

        {x.deskripsi && <p className="guru-item-desc">{x.deskripsi}</p>}

        {dibatalkan && (
          <div className="siswa-exam-terminated-note">
            <ShieldAlert size={14} />
            <span>
              Ujian dihentikan karena <strong>{attempt.alasan_berhenti || 'ganti tab'}</strong>.
              Hubungi admin/guru pengawas untuk mereset ujian.
            </span>
          </div>
        )}

        {!dibatalkan && !selesai && !berjalan && !session.canStart && (
          <div className={`siswa-exam-session-note is-${session.state}`}>
            <CalendarClock size={14} />
            <span>{session.label}</span>
          </div>
        )}

        <div className="guru-item-foot">
          <span className="siswa-task-foot-meta">
            {dibatalkan
              ? `Dihentikan ${formatTanggalPendek(attempt.dihentikan_at)}`
              : selesai
                ? `Dikumpulkan ${formatTanggalPendek(attempt.dikumpulkan_at)}`
                : berjalan ? (session.ended ? 'Sesi berakhir — kumpulkan jawaban' : 'Waktu masih berjalan')
                  : terkunci ? 'Kode dari guru diperlukan'
                    : session.canStart ? 'Siap dikerjakan' : session.shortLabel}
          </span>
          <button
            type="button"
            className="guru-primary-btn"
            onClick={() => {
              // Jika ujian sudah berjalan/selesai/terhenti/terkunci, langsung buka
              if (dibatalkan || selesai || berjalan || terkunci) {
                setExamTarget({ ...x, jumlah_soal: jumlahSoal });
                return;
              }
              // Konfirmasi mulai ujian baru
              setConfirmState({
                open: true,
                tone: 'warning',
                title: `Mulai Ujian: ${x.judul}?`,
                message: `Durasi pengerjaan ${x.durasi_menit} menit akan langsung berjalan otomatis setelah Anda masuk. Sistem akan mendeteksi jika Anda berpindah tab atau meminimalkan browser.`,
                extraDetails: 'Pastikan koneksi internet stabil dan daya perangkat cukup sebelum memulai ujian.',
                confirmText: 'Mulai Ujian Sekarang',
                cancelText: 'Nanti Dulu',
                loading: false,
                onConfirm: () => {
                  setConfirmState((prev) => ({ ...prev, open: false }));
                  setExamTarget({ ...x, jumlah_soal: jumlahSoal });
                },
              });
            }}
            disabled={disabled}
            title={
              disabled
                ? (jumlahSoal === 0 ? 'Guru belum menambahkan soal' : session.message)
                : undefined
            }
          >
            {dibatalkan
              ? 'Ujian Dihentikan'
              : selesai ? 'Lihat Status'
                : berjalan ? (session.ended ? 'Kumpulkan Jawaban' : 'Lanjutkan Ujian')
                  : !session.canStart ? session.shortLabel
                    : terkunci ? 'Masukkan Kode' : 'Kerjakan Ujian'}
          </button>
        </div>
      </article>
    );
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: activeTab === 'dashboard', onClick: () => { setActiveTab('dashboard'); setSelectedSubject(null); } },
    { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen, active: activeTab === 'mapel', onClick: () => { setActiveTab('mapel'); setSelectedSubject(null); } },
    { id: 'jadwal', label: 'Jadwal', icon: Calendar, active: activeTab === 'jadwal', onClick: () => setActiveTab('jadwal') },
    { id: 'presensi', label: 'Presensi', icon: UserCheck, active: activeTab === 'presensi', onClick: () => setActiveTab('presensi') },
    { id: 'tugas', label: 'Tugas Saya', icon: ClipboardList, active: activeTab === 'tugas', onClick: () => setActiveTab('tugas') },
    ...(examFeatureOn
      ? [{ id: 'ujian', label: 'Ujian / CBT', icon: Award, active: activeTab === 'ujian', onClick: () => setActiveTab('ujian') }]
      : []),
  ];

  return (
    <div className={`dashboard-siswa-root dashboard-shell ${isHeaderHidden ? 'ps-header-hidden' : ''}`}>
      <header className="siswa-top-navbar">
        <div className="siswa-navbar-container">
          <div className="siswa-brand-group">
            <div className="ps-traffic-lights">
              <span className="ps-tl ps-tl-red" />
              <span className="ps-tl ps-tl-yellow" />
              <span className="ps-tl ps-tl-green" />
            </div>
            <div className="siswa-brand-divider" />
            <div className="siswa-brand-meta">
              <img src={appearance?.logoUrl || schoolInfo?.logoUrl || ''} alt="Logo SMK Mapan" className="siswa-logo-img" />
              <div>
                <span className="siswa-system-name">LMS MAPAN</span>
                <span className="siswa-school-name">{schoolInfo?.shortName || 'SMK Muhammadiyah 8 Medan'}</span>
              </div>
            </div>
          </div>

          <div className="siswa-nav-user-actions">
            <div className="siswa-user-pill">
              <div className="siswa-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
              <div className="siswa-meta-texts">
                <span className="siswa-meta-name">{displayName}</span>
                <span className="siswa-meta-class">{className}</span>
              </div>
            </div>
            <AnimatedThemeToggler
              theme={theme}
              onThemeChange={setTheme}
              className="ps-theme-toggle"
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            />
            <button onClick={handleLogout} className="btn-siswa-logout" title="Keluar dari akun LMS">
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar/bottom-nav ala KerenTal */}
      <div className="siswa-nav-tabs ps-sidebar">
        <button
          className={`siswa-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setSelectedSubject(null); }}
        >
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </button>
        <button
          className={`siswa-tab-btn ${activeTab === 'mapel' ? 'active' : ''}`}
          onClick={() => { setActiveTab('mapel'); setSelectedSubject(null); }}
        >
          <BookOpen size={17} />
          <span>Mata Pelajaran</span>
        </button>
        <button
          className={`siswa-tab-btn ${activeTab === 'jadwal' ? 'active' : ''}`}
          onClick={() => setActiveTab('jadwal')}
        >
          <Calendar size={17} />
          <span>Jadwal Kelas</span>
        </button>
        <button
          className={`siswa-tab-btn ${activeTab === 'presensi' ? 'active' : ''}`}
          onClick={() => setActiveTab('presensi')}
        >
          <UserCheck size={17} />
          <span>Presensi</span>
        </button>
        <button
          className={`siswa-tab-btn ${activeTab === 'tugas' ? 'active' : ''}`}
          onClick={() => setActiveTab('tugas')}
        >
          <ClipboardList size={17} />
          <span>Tugas Saya</span>
        </button>
        {examFeatureOn && (
          <button
            className={`siswa-tab-btn ${activeTab === 'ujian' ? 'active' : ''}`}
            onClick={() => setActiveTab('ujian')}
          >
            <Award size={17} />
            <span>Ujian / CBT</span>
          </button>
        )}
        <div className="ps-sidebar-footer">
          <button className="ps-sidebar-logout" onClick={handleLogout} title="Keluar">
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      <MobileBottomNav items={mobileNavItems} maxPerSlide={3} label="Navigasi portal siswa" />

      <main className="siswa-main-container">
        {dataLoading || loading ? (
          <DashboardSkeleton cards={4} showHero={activeTab === 'dashboard'} />
        ) : (
          <>
            {/* Banner dan KPI Grid HANYA muncul di menu Dashboard sesuai permintaan user agar tidak tercampur */}
            {activeTab === 'dashboard' && (
              <>
                <section className="siswa-hero-banner">
                  <div className="siswa-hero-text">
                    <div className="siswa-live-tag">
                      <span className="pulse-dot" />
                      <span>PORTAL SISWA AKTIF &bull; SEMESTER GENAP 2026</span>
                    </div>
                    <h1 className="siswa-hero-title">
                      Assalamu'alaikum, <span className="text-orange">{displayName}</span>
                    </h1>
                    <p className="siswa-hero-desc">
                      Semua materi, tugas, dan ujian dari guru-guru Anda di kelas {className}
                      tersedia di sini.
                    </p>
                  </div>
                  <div className="siswa-hero-badge">
                    <GraduationCap size={28} className="text-orange" />
                    <div>
                      <span className="badge-title">{majorName}</span>
                      <span className="badge-nisn">NISN: {student?.nisn || '-'}</span>
                    </div>
                  </div>
                </section>

                <MagicBento
                  items={siswaBentoItems}
                  columns={4}
                  gap={16}
                  glowColor="232, 112, 42"
                  theme={theme === 'dark' ? 'dark' : 'light'}
                />
              </>
            )}

        {/* Header Bersih dan Rapi untuk Menu Selain Dashboard */}
        {activeTab !== 'dashboard' && (
          <div className="siswa-tab-header-banner">
            <div>
              <h1 className="siswa-tab-header-title">
                {activeTab === 'mapel' && (activeSubject ? activeSubject.nama : 'Mata Pelajaran')}
                {activeTab === 'jadwal' && 'Jadwal Kelas'}
                {activeTab === 'presensi' && 'Presensi Kehadiran Siswa'}
                {activeTab === 'tugas' && 'Tugas & Evaluasi Siswa'}
                {activeTab === 'ujian' && 'Ujian & CBT Online'}
              </h1>
              <p className="siswa-tab-header-desc">
                {activeTab === 'mapel' && (activeSubject ? `Pengampu: ${activeSubject.teachers.join(', ') || 'Guru Pengampu'}` : `Daftar seluruh mata pelajaran dan materi belajar di kelas ${className}`)}
                {activeTab === 'jadwal' && `Jadwal tatap muka dan kegiatan belajar mengajar mingguan kelas ${className}`}
                {activeTab === 'presensi' && `Rekap dan riwayat absensi kehadiran kelas ${className}`}
                {activeTab === 'tugas' && `Kumpulkan tugas dan pantau hasil penilaian guru Anda`}
                {activeTab === 'ujian' && `Pelaksanaan ujian dan evaluasi berbasis komputer terintegrasi`}
              </p>
            </div>
            <button
              type="button"
              className="guru-primary-btn"
              style={{ padding: '8px 14px', fontSize: '0.75rem', borderRadius: '10px' }}
              onClick={() => { setActiveTab('dashboard'); setSelectedSubject(null); }}
            >
              <LayoutDashboard size={14} /> Ke Dashboard
            </button>
          </div>
        )}

        <div className="siswa-content-card">
          {/* MENU 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="siswa-tab-pane">
              {/* Alert jika ada Ujian Aktif */}
              {examOpenCount > 0 && (
                <div className="dash-exam-alert-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={22} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9375rem', display: 'block', color: 'var(--ps-strong)' }}>
                        Ada {examOpenCount} Sesi Ujian CBT Sedang Dibuka!
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ps-soft)' }}>
                        Segera buka sesi ujian Anda sebelum batas waktu berakhir.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="guru-primary-btn"
                    onClick={() => setActiveTab('ujian')}
                  >
                    Kerjakan Ujian <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Grid 2 Kolom: Jadwal Hari Ini & Tugas Perlu Diselesaikan */}
              <div className="dash-widget-grid">
                {/* Widget Jadwal Hari Ini */}
                <div className="dash-widget-box">
                  <div className="dash-widget-head">
                    <h3 className="dash-widget-title">
                      <Calendar size={18} className="text-orange" />
                      <span>Jadwal Hari Ini ({todayDayName ? todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1) : 'Hari Ini'})</span>
                    </h3>
                    <button
                      type="button"
                      className="dash-widget-cta"
                      onClick={() => setActiveTab('jadwal')}
                    >
                      Lihat Semua <ArrowRight size={13} />
                    </button>
                  </div>

                  {todaySchedules.length === 0 ? (
                    <div className="guru-empty-box" style={{ padding: '24px 16px', borderRadius: 14 }}>
                      <Inbox size={24} />
                      <strong style={{ fontSize: '0.85rem' }}>Tidak ada jadwal kelas hari ini</strong>
                      <span style={{ fontSize: '0.75rem' }}>Waktu yang pas untuk mempelajari materi mandiri atau mengerjakan tugas.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {todaySchedules.map((s) => (
                        <div
                          key={s.id}
                          className="siswa-day-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => { setActiveTab('mapel'); setSelectedSubject(s.subject_id); }}
                        >
                          <span className="siswa-day-time">{s.jam_mulai} - {s.jam_selesai}</span>
                          <div className="siswa-day-body">
                            <strong>{s.subjects?.nama || 'Mata Pelajaran'}</strong>
                            <span><UserCheck size={12} /> {s.teachers?.nama || 'Guru Pengampu'}</span>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--ps-faint)', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Widget Tugas Menunggu Diselesaikan */}
                <div className="dash-widget-box">
                  <div className="dash-widget-head">
                    <h3 className="dash-widget-title">
                      <ClipboardList size={18} className="text-orange" />
                      <span>Tugas Perlu Dikerjakan ({pendingAssignments.length})</span>
                    </h3>
                    <button
                      type="button"
                      className="dash-widget-cta"
                      onClick={() => { setActiveTab('tugas'); setFTugasStatus('open'); }}
                    >
                      Buka Tugas <ArrowRight size={13} />
                    </button>
                  </div>

                  {pendingAssignments.length === 0 ? (
                    <div className="guru-empty-box" style={{ padding: '24px 16px', borderRadius: 14 }}>
                      <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                      <strong style={{ fontSize: '0.85rem' }}>Semua tugas sudah dikumpulkan!</strong>
                      <span style={{ fontSize: '0.75rem' }}>Pertahankan prestasimu. Belum ada tanggungan tugas baru.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pendingAssignments.slice(0, 3).map(({ assignment: a, subject }) => (
                        <div
                          key={a.id}
                          className="task-row-card dash-task-item"
                        >
                          <div className="dash-task-content">
                            <div className="dash-task-meta">
                              <span className="task-subject-tag">{subject?.nama || 'Tugas'}</span>
                              <span className="dash-task-deadline">&bull; Batas: {formatTanggalPendek(a.deadline)}</span>
                            </div>
                            <strong className="task-title-text dash-task-title">
                              {a.judul}
                            </strong>
                          </div>
                          <button
                            type="button"
                            className="guru-primary-btn dash-task-btn"
                            onClick={() => {
                              setSubError('');
                              setSubmitTarget({ assignment: a, subjectName: subject?.nama });
                            }}
                          >
                            <Paperclip size={13} /> Kumpulkan
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Widget Akses Cepat Mata Pelajaran */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={18} className="text-orange" />
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--ps-strong)' }}>Mata Pelajaran Kelas {className}</strong>
                  </div>
                  <button
                    type="button"
                    className="dash-widget-cta"
                    onClick={() => { setActiveTab('mapel'); setSelectedSubject(null); }}
                  >
                    Lihat Semua ({subjects.length}) <ArrowRight size={13} />
                  </button>
                </div>

                {subjects.length === 0 ? (
                  <div className="guru-empty-box">
                    <Inbox size={26} />
                    <strong>Belum ada mata pelajaran</strong>
                    <span>Hubungi administrator sekolah untuk penugasan kelas Anda.</span>
                  </div>
                ) : (
                  <div className="siswa-mapel-grid">
                    {subjects.slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        className="siswa-mapel-card"
                        onClick={() => { setActiveTab('mapel'); setSelectedSubject(s.id); }}
                      >
                        <div className="siswa-mapel-head">
                          <span className="siswa-mapel-code">{s.kode || 'MAPEL'}</span>
                          <ChevronRight size={18} />
                        </div>
                        <strong className="siswa-mapel-name">{s.nama}</strong>
                        <span className="siswa-mapel-teacher">
                          <UserCheck size={14} />
                          {s.teachers.length ? s.teachers.join(', ') : 'Guru pengampu'}
                        </span>
                        <div className="siswa-mapel-stats">
                          <span>{s.materials.length} materi</span>
                          <span>{s.assignments.length} tugas</span>
                          {examFeatureOn && <span>{s.exams.length} ujian</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mapel' && !activeSubject && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <label className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari mata pelajaran atau guru..."
                      value={qMapel}
                      onChange={(e) => setQMapel(e.target.value)}
                    />
                  </label>
                  <span className="guru-count">{filteredSubjects.length} mapel</span>
                </div>
              </div>

              {dataLoading ? (
                <p className="guru-empty-box">Memuat mata pelajaran...</p>
              ) : subjects.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Belum ada jadwal</strong>
                  <span>Hubungi administrator sekolah untuk jadwal kelas Anda.</span>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="guru-empty-box">
                  <Search size={26} />
                  <strong>Tidak ada hasil</strong>
                  <span>Coba kata kunci lain.</span>
                </div>
              ) : (
                <div className="siswa-mapel-grid">
                  {filteredSubjects.map((s) => (
                    <button key={s.id} className="siswa-mapel-card" onClick={() => setSelectedSubject(s.id)}>
                      <div className="siswa-mapel-head">
                        <span className="siswa-mapel-code">{s.kode || 'MAPEL'}</span>
                        <ChevronRight size={18} />
                      </div>
                      <strong className="siswa-mapel-name">{s.nama}</strong>
                      <span className="siswa-mapel-teacher">
                        <UserCheck size={14} />
                        {s.teachers.length ? s.teachers.join(', ') : 'Guru pengampu'}
                      </span>
                      <div className="siswa-mapel-stats">
                        <span>{s.materials.length} materi</span>
                        <span>{s.assignments.length} tugas</span>
                        {examFeatureOn && <span>{s.exams.length} ujian</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'mapel' && activeSubject && (
            <div className="siswa-tab-pane">
              <div className="siswa-detail-head">
                <button className="siswa-back-mapel" onClick={() => setSelectedSubject(null)}>
                  <ArrowLeft size={15} /> Semua Mapel
                </button>
                <div>
                  <h3 className="siswa-detail-title">{activeSubject.nama}</h3>
                  <span className="siswa-detail-sub">
                    Pengampu: {activeSubject.teachers.length ? activeSubject.teachers.join(', ') : '-'}
                  </span>
                </div>
              </div>

              
              <div className="siswa-section-head">
                <h4 className="siswa-section-title"><Layers size={15} /> Materi</h4>
                <span className="siswa-section-count">{activeSubject.materials.length} materi</span>
              </div>
              {activeSubject.materials.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={22} />
                  <span>Belum ada materi untuk mapel ini.</span>
                </div>
              ) : (
                <div className="guru-card-grid">
                  {activeSubject.materials.map((m) => (
                    <article key={m.id} className="guru-item-card">
                      <div className="guru-item-head">
                        <span className="guru-item-icon">
                          {m.tipe === 'video' ? <Video size={18} /> : m.tipe === 'link' ? <Link2 size={18} /> : <FileText size={18} />}
                        </span>
                        <div className="guru-item-heading">
                          <strong>{m.judul}</strong>
                          <span className="guru-item-sub">{formatTanggalPendek(m.created_at)}</span>
                        </div>
                      </div>
                      <div className="guru-item-tags">
                        <span className="guru-tag is-soft">
                          {m.tipe === 'video' ? 'Video' : m.tipe === 'link' ? 'Tautan' : m.tipe === 'teks' ? 'Teks' : 'Dokumen'}
                        </span>
                      </div>
                      {m.deskripsi && <p className="guru-item-desc">{m.deskripsi}</p>}
                      <div className="guru-item-foot">
                        <span className="siswa-task-foot-meta">{activeSubject.nama}</span>
                        <button
                          type="button"
                          className="guru-link"
                          onClick={() => setMaterialView({ material: m, subjectName: activeSubject.nama, teacherName: activeSubject.teachers.join(', ') })}
                        >
                          <PlayCircle size={13} /> Buka materi
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              
              <div className="siswa-section-head">
                <h4 className="siswa-section-title"><ClipboardList size={15} /> Tugas</h4>
                <span className="siswa-section-count">{activeSubject.assignments.length} tugas</span>
              </div>
              {activeSubject.assignments.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={22} />
                  <span>Belum ada tugas untuk mapel ini.</span>
                </div>
              ) : (
                <div className="guru-stack">
                  {activeSubject.assignments.map((a) => renderTugasCard(a, subsByAssignment.get(a.id), activeSubject.nama))}
                </div>
              )}

              
              {examFeatureOn && (
                <>
                  <div className="siswa-section-head">
                    <h4 className="siswa-section-title"><Award size={15} /> Ujian</h4>
                    <span className="siswa-section-count">{activeSubject.exams.length} ujian</span>
                  </div>
                  {activeSubject.exams.length === 0 ? (
                    <div className="guru-empty-box">
                      <Inbox size={22} />
                      <span>Belum ada ujian untuk mapel ini.</span>
                    </div>
                  ) : (
                    <div className="guru-stack">
                      {activeSubject.exams.map((x) => renderExamCard(x, activeSubject.nama))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          
          {activeTab === 'jadwal' && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <label className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari mapel atau guru..."
                      value={qJadwal}
                      onChange={(e) => setQJadwal(e.target.value)}
                    />
                  </label>
                  <div className="guru-chips">
                    <button
                      className={`guru-chip-btn ${fJadwalHari === 'semua' ? 'is-active' : ''}`}
                      onClick={() => setFJadwalHari('semua')}
                    >
                      Semua
                    </button>
                    {HARI_ORDER.map((h) => (
                      <button
                        key={h}
                        className={`guru-chip-btn ${fJadwalHari === h ? 'is-active' : ''}`}
                        onClick={() => setFJadwalHari(h)}
                      >
                        {h.charAt(0).toUpperCase() + h.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="guru-count">{filteredJadwal.length} sesi</span>
              </div>

              {dataLoading ? (
                <p className="guru-empty-box">Memuat jadwal...</p>
              ) : jadwalByDay.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Tidak ada jadwal</strong>
                  <span>Coba ubah filter hari atau kata kunci.</span>
                </div>
              ) : (
                <div className="siswa-day-grid">
                  {jadwalByDay.map(({ hari, items }) => (
                    <section key={hari} className="siswa-day-card">
                      <header className="siswa-day-head">
                        <span className="siswa-day-name">{hari}</span>
                        <span className="siswa-day-count">{items.length} sesi</span>
                      </header>
                      <div className="siswa-day-list">
                        {items.map((s) => (
                          <div key={s.id} className="siswa-day-item">
                            <span className="siswa-day-time">
                              {String(s.jam_mulai).slice(0, 5)}–{String(s.jam_selesai).slice(0, 5)}
                            </span>
                            <div className="siswa-day-body">
                              <strong>{s.subjects?.nama || '-'}</strong>
                              <span>
                                <UserCheck size={12} /> {s.teachers?.nama || '-'} &bull; {className}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'presensi' && (
            <PresensiSiswa
              student={student}
              schedules={schedules}
              attendance={attendance}
              onChanged={loadData}
            />
          )}

          {activeTab === 'tugas' && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <label className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari tugas..."
                      value={qTugas}
                      onChange={(e) => setQTugas(e.target.value)}
                    />
                  </label>
                  <div className="guru-chips">
                    {[
                      { k: 'semua', l: 'Semua' },
                      { k: 'open', l: `Belum (${tugasStats.open})` },
                      { k: 'submitted', l: `Menunggu (${tugasStats.submitted})` },
                      { k: 'graded', l: `Dinilai (${tugasStats.graded})` },
                    ].map((c) => (
                      <button
                        key={c.k}
                        className={`guru-chip-btn ${fTugasStatus === c.k ? 'is-active' : ''}`}
                        onClick={() => setFTugasStatus(c.k)}
                      >
                        {c.l}
                      </button>
                    ))}
                  </div>
                  <select
                    className="guru-select"
                    value={fTugasMapel}
                    onChange={(e) => setFTugasMapel(e.target.value)}
                  >
                    <option value="semua">Semua mapel</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                </div>
                <span className="guru-count">{filteredTugas.length} tugas</span>
              </div>

              {dataLoading ? (
                <p className="guru-empty-box">Memuat tugas...</p>
              ) : assignments.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Belum ada tugas</strong>
                  <span>Guru Anda belum mempublikasikan tugas untuk kelas ini.</span>
                </div>
              ) : filteredTugas.length === 0 ? (
                <div className="guru-empty-box">
                  <CheckCircle2 size={26} />
                  <strong>Tidak ada tugas di filter ini</strong>
                  <span>Coba pilih status atau mapel lain.</span>
                </div>
              ) : (
                <div className="guru-stack">
                  {filteredTugas.map(({ assignment, sub, subject }) => renderTugasCard(assignment, sub, subject?.nama))}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'ujian' && examFeatureOn && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <label className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari ujian..."
                      value={qUjian}
                      onChange={(e) => setQUjian(e.target.value)}
                    />
                  </label>
                </div>
                <span className="guru-count">{examRows.length} ujian</span>
              </div>

              {dataLoading ? (
                <p className="guru-empty-box">Memuat ujian...</p>
              ) : examRows.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Belum ada ujian</strong>
                  <span>Ujian akan muncul setelah guru dan admin membukanya.</span>
                </div>
              ) : (
                <div className="guru-stack">
                  {examRows.map(({ exam, subject }) => renderExamCard(exam, subject?.nama))}
                </div>
              )}

              <div className="siswa-exam-note">
                <AlertTriangle size={15} />
                <span>
                  Ujian hanya bisa dikerjakan <strong>satu kali</strong>. Nilai diumumkan oleh
                  guru, tidak ditampilkan di halaman ini. Pastikan koneksi internet stabil
                  sebelum menekan <strong>Mulai Ujian</strong>.
                </span>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      
      <SubmissionModal
        key={submitTarget?.assignment?.id || 'empty'}
        open={!!submitTarget}
        assignment={submitTarget?.assignment}
        subjectName={submitTarget?.subjectName}
        teacherName={activeSubject?.teachers?.join(', ') || subjects.find((s) => s.id === submitTarget?.assignment?.subject_id)?.teachers?.join(', ')}
        onClose={() => { setSubmitTarget(null); setSubError(''); }}
        onSubmit={handleSubmitAssignment}
        busy={subBusy}
        error={subError}
      />

      <MaterialViewerModal
        open={!!materialView}
        material={materialView?.material}
        subjectName={materialView?.subjectName}
        teacherName={materialView?.teacherName}
        onClose={() => setMaterialView(null)}
      />

      <ExamRunner
        key={examTarget?.id || 'empty'}
        open={!!examTarget}
        exam={examTarget}
        student={student}
        needsCode={!!examTarget?.butuh_kode}
        alreadyUnlocked={examTarget ? unlockedExams.has(examTarget.id) : false}
        onUnlocked={loadData}
        resumeAttempt={
          examTarget && attemptByExam.get(examTarget.id)?.status === 'berjalan'
            ? attemptByExam.get(examTarget.id)
            : null
        }
        completedAttempt={
          examTarget
            && attemptByExam.get(examTarget.id)
            && attemptByExam.get(examTarget.id).status !== 'berjalan'
            ? attemptByExam.get(examTarget.id)
            : null
        }
        onClose={() => { setExamTarget(null); loadData(); }}
        onFinished={loadData}
      />

      {/* Glass Confirmation Modal */}
      <GlassConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        tone={confirmState.tone}
        extraDetails={confirmState.extraDetails}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
