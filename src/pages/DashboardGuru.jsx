import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, GraduationCap, BookOpen, Layers,
  Calendar, UploadCloud, CheckCircle2, FileText, Video, Link2,
  Users, ClipboardList, Award, PlusCircle, Save, Clock,
  Search, Pencil, Trash2, Eye, EyeOff,
  ListChecks, ClipboardCheck, AlertTriangle, Inbox, Loader2, UserCheck, KeyRound,
  CalendarClock, ShieldAlert, BarChart3,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiGet, apiListAll, apiPost, apiPatch, apiDelete, apiUpload, ApiError } from '../lib/api';
import { useContent } from '../context/ContentContext';
import { getExamSession, formatExamSession, splitExamSchedule, joinExamSchedule } from '../lib/examSession';
import GuruModal from '../components/guru/GuruModal';
import GradeModal from '../components/guru/GradeModal';
import PresensiGuru from '../components/guru/PresensiGuru';
import ExamCodeModal from '../components/guru/ExamCodeModal';
import AssignmentSubmissionsModal from '../components/guru/AssignmentSubmissionsModal';
import ExamAttemptsModal from '../components/ExamAttemptsModal';
import ExamRecapCard from '../components/ExamRecapCard';
import ExamClassRecap from '../components/guru/ExamClassRecap';
import Pagination from '../components/ui/Pagination';
import ExamQuestionsModal from '../components/guru/ExamQuestionsModal';
import ExamLiveToasts from '../components/guru/ExamLiveToasts';
import { useExamLiveEvents } from '../hooks/useExamLiveEvents';
import { playNotificationSound, NOTIFICATION_KIND_BY_EVENT } from '../lib/sounds';
import './DashboardSiswa.css';
import './DashboardGuru.css';
import { useTheme } from '../hooks/useTheme';
import { useHeaderScroll } from '../hooks/useHeaderScroll';
import AnimatedThemeToggler from '../components/AnimatedThemeToggler';
import MobileBottomNav from '../components/MobileBottomNav';
import MagicBento from '../components/ui/MagicBento';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import GlassConfirmModal from '../components/ui/GlassConfirmModal';
import '../styles/portal-shell.css';

const HARI_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];


const PAGE_SIZE = 9;


const toYouTubeEmbed = (url) => {
  if (!url) return '';
  const t = String(url).trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return t;
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

const formatTanggalSingkat = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};


const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TIPE_META = {
  video: { label: 'Video', icon: Video },
  link: { label: 'Tautan', icon: Link2 },
  file: { label: 'Berkas PDF', icon: FileText },
  teks: { label: 'Teks', icon: FileText },
};

const formErrorMessage = (err, fallback) => {
  const details = err?.errors && typeof err.errors === 'object'
    ? Object.values(err.errors).flat().filter(Boolean)
    : [];
  if (details.length) return details.join(' ');
  return err?.message || fallback;
};

const emptyMaterial = { judul: '', subject_id: '', class_id: '', tipe: 'video', file_url: '', deskripsi: '', is_published: false };
const emptyAssignment = { judul: '', deskripsi: '', subject_id: '', class_id: '', deadline: '', is_published: false };
const emptyExam = {
  judul: '',
  deskripsi: '',
  subject_id: '',
  durasi_menit: 60,
  is_active: false,
  tanggal_mulai: '',
  jam_mulai: '',
  tanggal_selesai: '',
  jam_selesai: '',
  acak_soal: true,
};

export default function DashboardGuru() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isHeaderHidden = useHeaderScroll();
  const { schoolInfo, appearance } = useContent();

  const [teacher, setTeacher] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [questionCounts, setQuestionCounts] = useState({});
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [examCodes, setExamCodes] = useState(new Map());
  const [codeModal, setCodeModal] = useState(null);
  const [subsModal, setSubsModal] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsModal, setAttemptsModal] = useState(null);
  const [resettingAttempt, setResettingAttempt] = useState(null);

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

  
  const [pageMateri, setPageMateri] = useState(1);
  const [pageTugas, setPageTugas] = useState(1);
  const [liveEvents, setLiveEvents] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kelas');
  const [notice, setNotice] = useState('');

  
  const [formModal, setFormModal] = useState(null); 
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [busyMaterial, setBusyMaterial] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [busyAssignment, setBusyAssignment] = useState(null);
  const [examForm, setExamForm] = useState(emptyExam);
  const [editingExam, setEditingExam] = useState(null);
  const [busyExam, setBusyExam] = useState(null);

  
  const [grading, setGrading] = useState(null); 

  
  const [questionsExam, setQuestionsExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsCache, setQuestionsCache] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [busyQuestion, setBusyQuestion] = useState(null);

  
  const [qMateri, setQMateri] = useState('');
  const [fMateriStatus, setFMateriStatus] = useState('semua');
  const [fMateriMapel, setFMateriMapel] = useState('');
  const [qTugas, setQTugas] = useState('');
  const [fTugasStatus, setFTugasStatus] = useState('semua');
  const [qUjian, setQUjian] = useState('');
  const [qKelas, setQKelas] = useState('');

  const [examFeatureOn, setExamFeatureOn] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState('');
  const [formError, setFormError] = useState('');

  
  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'guru') navigate('/login');
  }, [user, profile, loading, navigate]);

  const triggerNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const loadData = useCallback(async () => {
    if (!user) return;

    let dash = null;
    try {
      dash = await apiGet('/guru/dashboard');
    } catch (err) {
      if (!(err instanceof ApiError) || (err.status !== 403 && err.code !== 'GURU_PROFILE_NOT_FOUND')) {
        setNotice(err?.message || 'Gagal memuat data guru.');
      }
    }

    const t = dash?.teacher || null;
    if (!t) {
      setTeacher(null);
      setDataLoading(false);
      return;
    }
    setTeacher(t);

    try {
      const [schRaw, matRaw, asgRaw, exmRaw, attRaw, site] = await Promise.all([
        apiListAll('/guru/schedules'),
        apiListAll('/guru/materials'),
        apiListAll('/guru/assignments'),
        apiListAll('/guru/exams'),
        apiListAll('/guru/attendance'),
        apiGet('/public/site', { auth: false }).catch(() => ({})),
      ]);

      const scheduleRows = schRaw.map((s) => ({ ...s, classes: s.school_class || null, subjects: s.subject || null }));
      const materialRows = matRaw.map((m) => ({ ...m, subjects: m.subject || null, classes: m.school_class || null }));
      const assignmentRows = asgRaw.map((a) => ({ ...a, subjects: a.subject || null, classes: a.school_class || null }));
      const examRows = exmRaw.map((x) => ({
        ...x,
        subjects: x.subject || null,
        is_approved: x.is_approved ?? true,
        butuh_kode: x.butuh_kode ?? false,
        admin_override: !!x.admin_override,
        acak_soal: x.acak_soal !== false,
      }));

      const counts = {};
      const codes = new Map();
      examRows.forEach((x) => {
        counts[x.id] = Number(x.questions_count || 0);
        if (x.code) codes.set(x.id, { exam_id: x.id, code: x.code.code, is_active: x.code.is_active });
      });

      // API hanya menyediakan pengumpulan per tugas dan pengerjaan per ujian.
      const [subsNested, atpNested] = await Promise.all([
        Promise.all(assignmentRows.map((a) => apiListAll(`/guru/assignments/${a.id}/submissions`).catch(() => []))),
        Promise.all(examRows.map((x) => apiListAll(`/guru/exams/${x.id}/attempts`).catch(() => []))),
      ]);

      const classNameById = new Map(
        scheduleRows.filter((s) => s.classes?.nama).map((s) => [s.class_id, s.classes.nama]),
      );
      const attachStudent = (row) => {
        const stu = row.student || null;
        const namaKelas = stu ? classNameById.get(stu.class_id) : null;
        return { ...row, students: stu ? { ...stu, classes: namaKelas ? { nama: namaKelas } : null } : null };
      };

      const submissionRows = subsNested.flat().map(attachStudent);
      const attemptRows = atpNested.flat().map(attachStudent)
        .sort((a, b) => new Date(b.dimulai_at || 0) - new Date(a.dimulai_at || 0));
      const attendanceRows = attRaw.map((a) => ({ ...a, students: a.student || null }));

      // Roster siswa dihimpun dari presensi/pengumpulan/pengerjaan: API guru
      // belum punya endpoint daftar siswa per kelas (hanya admin yang punya).
      const roster = new Map();
      const addStudent = (stu) => {
        if (stu?.id && !roster.has(stu.id)) {
          roster.set(stu.id, { id: stu.id, nama: stu.nama, nisn: stu.nisn, class_id: stu.class_id });
        }
      };
      attRaw.forEach((a) => addStudent(a.student));
      subsNested.flat().forEach((s) => addStudent(s.student));
      atpNested.flat().forEach((a) => addStudent(a.student));
      const studentRows = Array.from(roster.values())
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));

      setSchedules(scheduleRows);
      setMaterials(materialRows);
      setAssignments(assignmentRows);
      setSubmissions(submissionRows);
      setExams(examRows);
      setQuestionCounts(counts);
      setExamCodes(codes);
      setAttempts(attemptRows);
      setStudents(studentRows);
      setAttendance(attendanceRows);
      setExamFeatureOn(site?.ujian?.fitur_aktif !== false);
    } catch (err) {
      setNotice(err?.message || 'Gagal memuat data guru.');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && profile?.role === 'guru') queueMicrotask(loadData);
  }, [user, profile, loadData]);

  
  const dismissLiveEvent = useCallback((id) => {
    setLiveEvents((prev) => prev.filter((evt) => evt.id !== id));
  }, []);

  const handleLiveEvent = useCallback((event) => {
    if (!event) return;
    const kind = NOTIFICATION_KIND_BY_EVENT[event.type] || 'warning';
    playNotificationSound(kind);
    setLiveEvents((prev) => [event, ...prev].slice(0, 4));
    loadData();
  }, [loadData]);

  useExamLiveEvents({
    teacherId: teacher?.id,
    onEvent: handleLiveEvent,
    enabled: !!teacher?.id,
  });

  // API guru belum punya endpoint daftar soal. Soal yang ditampilkan adalah
  // hasil tambah/ubah/hapus pada sesi ini, di-cache per ujian agar tetap ada
  // saat modal dibuka ulang. Jumlah soal tetap akurat dari questions_count.
  const openQuestions = (exam) => {
    setFormError('');
    setQuestionsExam(exam);
    setQuestions(questionsCache[exam.id] || []);
    setQuestionsLoading(false);
  };

  const handleLogout = () => {
    setConfirmState({
      open: true,
      tone: 'logout',
      title: 'Keluar dari Portal Guru?',
      message: 'Sesi mengajar Anda akan diakhiri. Pastikan materi, tugas, atau nilai yang sedang Anda periksa telah tersimpan.',
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

  
  const { taughtClasses, taughtSubjects, classGroups } = useMemo(() => {
    const classes = [];
    const subjects = [];
    const groups = [];

    schedules.forEach((s) => {
      if (s.class_id && s.classes && !classes.some((c) => c.id === s.class_id)) {
        classes.push({ id: s.class_id, nama: s.classes.nama, tingkat: s.classes.tingkat || null });
      }
      if (s.subject_id && s.subjects && !subjects.some((m) => m.id === s.subject_id)) {
        subjects.push({ id: s.subject_id, nama: s.subjects.nama });
      }
      if (s.class_id) {
        let g = groups.find((c) => c.class_id === s.class_id);
        if (!g) {
          g = { class_id: s.class_id, nama: s.classes?.nama || 'Kelas', items: [] };
          groups.push(g);
        }
        g.items.push(s);
      }
    });
    groups.forEach((g) =>
      g.items.sort((a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || String(a.jam_mulai).localeCompare(String(b.jam_mulai)))
    );

    return { taughtClasses: classes, taughtSubjects: subjects, classGroups: groups };
  }, [schedules]);

  const submissionsFor = (assignmentId) => submissions.filter((s) => s.assignment_id === assignmentId);
  const attemptsFor = (examId) => attempts.filter((a) => a.exam_id === examId);
  const pendingGrading = submissions.filter((s) => s.status === 'dikumpulkan').length;
  const publishedMaterials = materials.filter((m) => m.is_published).length;

  
  const filteredMaterials = useMemo(() => {
    const q = qMateri.trim().toLowerCase();
    return materials.filter((m) => {
      if (q && !String(m.judul || '').toLowerCase().includes(q)) return false;
      if (fMateriStatus === 'publish' && !m.is_published) return false;
      if (fMateriStatus === 'draft' && m.is_published) return false;
      if (fMateriMapel && m.subject_id !== fMateriMapel) return false;
      return true;
    });
  }, [materials, qMateri, fMateriStatus, fMateriMapel]);

  const filteredAssignments = useMemo(() => {
    const q = qTugas.trim().toLowerCase();
    return assignments.filter((a) => {
      if (q && !String(a.judul || '').toLowerCase().includes(q)) return false;
      if (fTugasStatus === 'publish' && !a.is_published) return false;
      if (fTugasStatus === 'draft' && a.is_published) return false;
      if (fTugasStatus === 'perlu' && !submissions.some((s) => s.assignment_id === a.id && s.status === 'dikumpulkan')) return false;
      return true;
    });
  }, [assignments, qTugas, fTugasStatus, submissions]);

  const filteredExams = useMemo(() => {
    const q = qUjian.trim().toLowerCase();
    return exams.filter((x) => !q || String(x.judul || '').toLowerCase().includes(q));
  }, [exams, qUjian]);

  
  const materiPageCount = Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE));
  const materiPageSafe = Math.min(pageMateri, materiPageCount);
  const materiSlice = useMemo(
    () => filteredMaterials.slice((materiPageSafe - 1) * PAGE_SIZE, materiPageSafe * PAGE_SIZE),
    [filteredMaterials, materiPageSafe],
  );

  const tugasPageCount = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE));
  const tugasPageSafe = Math.min(pageTugas, tugasPageCount);
  const tugasSlice = useMemo(
    () => filteredAssignments.slice((tugasPageSafe - 1) * PAGE_SIZE, tugasPageSafe * PAGE_SIZE),
    [filteredAssignments, tugasPageSafe],
  );

  
  const filteredClasses = useMemo(() => {
    const q = qKelas.trim().toLowerCase();
    return classGroups.filter((g) => !q || String(g.nama || '').toLowerCase().includes(q));
  }, [classGroups, qKelas]);

  
  const resetMaterialForm = () => {
    setMaterialForm(emptyMaterial);
    setPdfFile(null);
    setEditingMaterial(null);
    setFormError('');
  };

  const openMaterialModal = (m = null) => {
    setFormError('');
    setPdfFile(null);
    if (m) {
      setEditingMaterial(m);
      setMaterialForm({
        judul: m.judul || '',
        subject_id: m.subject_id || '',
        class_id: m.class_id || '',
        tipe: m.tipe || 'teks',
        file_url: m.tipe === 'file' ? '' : (m.file_url || ''),
        deskripsi: m.deskripsi || '',
        is_published: !!m.is_published,
      });
    } else {
      setEditingMaterial(null);
      setMaterialForm(emptyMaterial);
    }
    setFormModal('materi');
  };

  const closeMaterialModal = () => {
    setFormModal(null);
    resetMaterialForm();
  };

  const handleTogglePublish = async (m) => {
    if (!m.is_published && (!m.subject_id || !m.class_id)) {
      triggerNotice('Lengkapi mapel dan kelas materi sebelum dipublikasikan.');
      return;
    }
    setBusyMaterial(m.id);
    try {
      await apiPost(`/guru/materials/${m.id}/publish`);
      triggerNotice(!m.is_published ? 'Materi dipublikasikan ke siswa.' : 'Materi dikembalikan ke draft.');
      await loadData();
    } catch (err) {
      triggerNotice(err.message || 'Gagal mengubah status materi.');
    } finally {
      setBusyMaterial(null);
    }
  };

  const handleDeleteMaterial = (m) => {
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Materi Pembelajaran?',
      message: `Apakah Anda yakin ingin menghapus materi "${m.judul}"?`,
      extraDetails: 'Tindakan ini permanen. Siswa di kelas terkait tidak akan dapat mengunduh atau membaca materi ini lagi.',
      confirmText: 'Hapus Materi',
      cancelText: 'Batal',
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        setBusyMaterial(m.id);
        try {
          await apiDelete(`/guru/materials/${m.id}`);
          triggerNotice('Materi berhasil dihapus.');
          await loadData();
        } catch (err) {
          triggerNotice(err.message || 'Gagal menghapus materi.');
        } finally {
          setBusyMaterial(null);
          setConfirmState((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  const handleSubmitMaterial = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!teacher) return setFormError('Akun ini belum terhubung ke data guru.');
    if (!materialForm.judul.trim()) return setFormError('Judul materi wajib diisi.');
    if (materialForm.is_published && (!materialForm.subject_id || !materialForm.class_id)) {
      return setFormError('Lengkapi Mata Pelajaran dan Kelas sebelum mempublikasikan materi ke siswa.');
    }
    if (materialForm.tipe === 'file' && !pdfFile && !editingMaterial) {
      return setFormError('Pilih berkas PDF terlebih dahulu.');
    }
    if ((materialForm.tipe === 'video' || materialForm.tipe === 'link') && !materialForm.file_url.trim()) {
      return setFormError('URL materi wajib diisi.');
    }

    setSaving('materi');
    try {
      const tipe = materialForm.tipe;
      const payload = {
        subject_id: materialForm.subject_id || null,
        class_id: materialForm.class_id || null,
        judul: materialForm.judul.trim(),
        deskripsi: materialForm.deskripsi.trim() || null,
        tipe,
        is_published: materialForm.is_published,
      };
      if (tipe === 'video') payload.file_url = toYouTubeEmbed(materialForm.file_url);
      else if (tipe === 'link') payload.file_url = materialForm.file_url.trim();
      else if (tipe === 'teks') payload.file_url = null;

      if (editingMaterial) {
        await apiPatch(`/guru/materials/${editingMaterial.id}`, payload);
        if (tipe === 'file' && pdfFile) {
          const form = new FormData();
          form.append('file', pdfFile);
          await apiUpload(`/guru/materials/${editingMaterial.id}/file`, form);
        }
      } else if (tipe === 'file' && pdfFile) {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
        });
        form.append('file', pdfFile);
        await apiUpload('/guru/materials', form);
      } else {
        await apiPost('/guru/materials', payload);
      }

      const wasEditing = !!editingMaterial;
      triggerNotice(wasEditing ? 'Perubahan materi disimpan.' : 'Materi berhasil disimpan.');
      closeMaterialModal();
      await loadData();
    } catch (err) {
      setFormError(formErrorMessage(err, 'Gagal menyimpan materi.'));
    } finally {
      setSaving('');
    }
  };

  
  const resetAssignmentForm = () => {
    setAssignmentForm(emptyAssignment);
    setEditingAssignment(null);
    setFormError('');
  };

  const openAssignmentModal = (a = null) => {
    setFormError('');
    if (a) {
      setEditingAssignment(a);
      setAssignmentForm({
        judul: a.judul || '',
        subject_id: a.subject_id || '',
        class_id: a.class_id || '',
        deadline: toLocalInput(a.deadline),
        deskripsi: a.deskripsi || '',
        is_published: !!a.is_published,
      });
    } else {
      setEditingAssignment(null);
      setAssignmentForm(emptyAssignment);
    }
    setFormModal('tugas');
  };

  const closeAssignmentModal = () => {
    setFormModal(null);
    resetAssignmentForm();
  };

  const handleTogglePublishAssignment = async (a) => {
    if (!a.is_published && (!a.subject_id || !a.class_id)) {
      triggerNotice('Lengkapi mapel dan kelas tugas sebelum dipublikasikan.');
      return;
    }
    setBusyAssignment(a.id);
    try {
      await apiPost(`/guru/assignments/${a.id}/publish`);
      triggerNotice(!a.is_published ? 'Tugas dipublikasikan ke siswa.' : 'Tugas dikembalikan ke draft.');
      await loadData();
    } catch (err) {
      triggerNotice(err.message || 'Gagal mengubah status tugas.');
    } finally {
      setBusyAssignment(null);
    }
  };

  const handleDeleteAssignment = (a) => {
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Tugas / Portofolio?',
      message: `Apakah Anda yakin ingin menghapus tugas "${a.judul}"?`,
      extraDetails: 'Perhatian: Seluruh berkas pengumpulan, riwayat jawaban, dan nilai siswa untuk tugas ini juga akan ikut terhapus.',
      confirmText: 'Hapus Tugas',
      cancelText: 'Batal',
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        setBusyAssignment(a.id);
        try {
          await apiDelete(`/guru/assignments/${a.id}`);
          triggerNotice('Tugas berhasil dihapus.');
          await loadData();
        } catch (err) {
          triggerNotice(err.message || 'Gagal menghapus tugas.');
        } finally {
          setBusyAssignment(null);
          setConfirmState((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!teacher) return setFormError('Akun ini belum terhubung ke data guru.');
    if (!assignmentForm.judul.trim()) return setFormError('Judul tugas wajib diisi.');
    if (assignmentForm.is_published && (!assignmentForm.subject_id || !assignmentForm.class_id)) {
      return setFormError('Lengkapi Mata Pelajaran dan Kelas sebelum mempublikasikan tugas ke siswa.');
    }

    setSaving('tugas');
    try {
      const payload = {
        subject_id: assignmentForm.subject_id || null,
        class_id: assignmentForm.class_id || null,
        judul: assignmentForm.judul.trim(),
        deskripsi: assignmentForm.deskripsi.trim() || null,
        deadline: assignmentForm.deadline ? new Date(assignmentForm.deadline).toISOString() : null,
        is_published: assignmentForm.is_published,
      };

      if (editingAssignment) await apiPatch(`/guru/assignments/${editingAssignment.id}`, payload);
      else await apiPost('/guru/assignments', payload);

      const wasEditing = !!editingAssignment;
      triggerNotice(wasEditing ? 'Perubahan tugas disimpan.' : 'Tugas berhasil dibuat.');
      closeAssignmentModal();
      await loadData();
    } catch (err) {
      setFormError(formErrorMessage(err, 'Gagal membuat tugas.'));
    } finally {
      setSaving('');
    }
  };

  const handleGrade = async (submissionId, nilai, feedback) => {
    setSaving('nilai-' + submissionId);
    try {
      await apiPatch(`/guru/submissions/${submissionId}/grade`, {
        nilai: nilai === '' ? null : Number(nilai),
        feedback: feedback || null,
      });
      triggerNotice('Nilai berhasil disimpan.');
      setGrading(null);
      await loadData();
    } catch (err) {
      triggerNotice(formErrorMessage(err, 'Gagal menyimpan nilai.'));
    } finally {
      setSaving('');
    }
  };

  
  const resetExamForm = () => {
    setExamForm(emptyExam);
    setEditingExam(null);
    setFormError('');
  };

  const openExamModal = (x = null) => {
    setFormError('');
    if (x) {
      const mulai = splitExamSchedule(x.waktu_mulai);
      const selesai = splitExamSchedule(x.waktu_selesai);
      setEditingExam(x);
      setExamForm({
        judul: x.judul || '',
        subject_id: x.subject_id || '',
        durasi_menit: x.durasi_menit ?? 60,
        deskripsi: x.deskripsi || '',
        is_active: !!x.is_active,
        tanggal_mulai: mulai.tanggal,
        jam_mulai: mulai.jam,
        tanggal_selesai: selesai.tanggal,
        jam_selesai: selesai.jam,
        acak_soal: x.acak_soal !== false,
      });
    } else {
      setEditingExam(null);
      setExamForm(emptyExam);
    }
    setFormModal('ujian');
  };

  const closeExamModal = () => {
    setFormModal(null);
    resetExamForm();
  };

  const handleToggleActiveExam = async (x) => {
    setBusyExam(x.id);
    try {
      await apiPatch(`/guru/exams/${x.id}`, { is_active: !x.is_active });
      triggerNotice(!x.is_active ? 'Ujian diaktifkan untuk siswa.' : 'Ujian dinonaktifkan (draft).');
      await loadData();
    } catch (err) {
      triggerNotice(err.message || 'Gagal mengubah status ujian.');
    } finally {
      setBusyExam(null);
    }
  };

  const handleDeleteExam = (x) => {
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Ujian CBT?',
      message: `Apakah Anda yakin ingin menghapus ujian "${x.judul}"?`,
      extraDetails: 'Seluruh bank soal, riwayat pengerjaan, dan perolehan skor siswa untuk ujian ini akan dihapus secara permanen.',
      confirmText: 'Hapus Ujian',
      cancelText: 'Batal',
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        setBusyExam(x.id);
        try {
          await apiDelete(`/guru/exams/${x.id}`);
          if (questionsExam && questionsExam.id === x.id) setQuestionsExam(null);
          triggerNotice('Ujian berhasil dihapus.');
          await loadData();
        } catch (err) {
          triggerNotice(err.message || 'Gagal menghapus ujian.');
        } finally {
          setBusyExam(null);
          setConfirmState((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  const handleResetAttempt = (attempt) => {
    const nama = attempt?.students?.nama || 'siswa ini';
    setConfirmState({
      open: true,
      tone: 'warning',
      title: 'Reset Pengerjaan Siswa?',
      message: `Reset pengerjaan ujian untuk ${nama}?`,
      extraDetails: 'Seluruh lembar jawaban tersimpan akan dihapus dan siswa dapat login untuk mengerjakan kembali dari awal.',
      confirmText: 'Reset Ujian Siswa',
      cancelText: 'Batal',
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        setResettingAttempt(attempt.id);
        try {
          await apiPost(`/guru/attempts/${attempt.id}/reset`);
          triggerNotice(`Pengerjaan ${nama} direset. Siswa dapat mengerjakan ulang dari awal.`);
          await loadData();
        } catch (err) {
          triggerNotice(err?.message || 'Gagal mereset pengerjaan ujian.');
        } finally {
          setResettingAttempt(null);
          setConfirmState((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!teacher) return setFormError('Akun ini belum terhubung ke data guru.');
    if (!examForm.judul.trim()) return setFormError('Judul ujian wajib diisi.');

    if (!examForm.tanggal_mulai || !examForm.jam_mulai) {
      return setFormError('Tanggal dan jam mulai sesi ujian wajib diisi.');
    }
    if (!examForm.tanggal_selesai || !examForm.jam_selesai) {
      return setFormError('Tanggal dan jam selesai sesi ujian wajib diisi.');
    }

    const mulaiIso = joinExamSchedule(examForm.tanggal_mulai, examForm.jam_mulai);
    const selesaiIso = joinExamSchedule(examForm.tanggal_selesai, examForm.jam_selesai);
    if (!mulaiIso || !selesaiIso) {
      return setFormError('Tanggal/jam sesi tidak valid. Periksa kembali.');
    }
    if (new Date(selesaiIso).getTime() <= new Date(mulaiIso).getTime()) {
      return setFormError('Jam selesai sesi harus setelah jam mulai.');
    }

    setSaving('ujian');
    try {
      const payload = {
        subject_id: examForm.subject_id || null,
        judul: examForm.judul.trim(),
        deskripsi: examForm.deskripsi.trim() || null,
        durasi_menit: Number(examForm.durasi_menit) || 60,
        is_active: examForm.is_active,
        waktu_mulai: mulaiIso,
        waktu_selesai: selesaiIso,
        acak_soal: !!examForm.acak_soal,
      };

      if (editingExam) await apiPatch(`/guru/exams/${editingExam.id}`, payload);
      else await apiPost('/guru/exams', payload);

      const wasEditing = !!editingExam;
      triggerNotice(wasEditing ? 'Perubahan ujian disimpan.' : 'Ujian berhasil dibuat.');
      closeExamModal();
      await loadData();
    } catch (err) {
      setFormError(formErrorMessage(err, 'Gagal membuat ujian.'));
    } finally {
      setSaving('');
    }
  };

  const handleAddQuestion = async ({ pertanyaan, opsi, kunci, bobot, gambar_url }) => {
    if (!questionsExam) return false;
    const examId = questionsExam.id;
    setFormError('');
    setSaving('soal');
    try {
      const payload = { tipe: 'pg', pertanyaan, opsi, kunci_jawaban: kunci, bobot };
      if (gambar_url) payload.gambar_url = gambar_url;
      const created = await apiPost(`/guru/exams/${examId}/questions`, payload);
      setQuestions((prev) => [...prev, created]);
      setQuestionsCache((prev) => ({ ...prev, [examId]: [...(prev[examId] || []), created] }));
      setQuestionCounts((prev) => ({ ...prev, [examId]: (prev[examId] || 0) + 1 }));
      triggerNotice('Soal ditambahkan.');
      return true;
    } catch (err) {
      setFormError(formErrorMessage(err, 'Gagal menambah soal.'));
      return false;
    } finally {
      setSaving('');
    }
  };

  const handleUpdateQuestion = async (id, { pertanyaan, opsi, kunci, bobot, gambar_url }) => {
    if (!questionsExam || !id) return false;
    const examId = questionsExam.id;
    setFormError('');
    setBusyQuestion(id);
    try {
      const patch = { pertanyaan, opsi, kunci_jawaban: kunci, bobot, gambar_url: gambar_url || null };
      const updated = await apiPatch(`/guru/questions/${id}`, patch);
      setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setQuestionsCache((prev) => ({ ...prev, [examId]: (prev[examId] || []).map((q) => (q.id === id ? updated : q)) }));
      triggerNotice('Soal diperbarui.');
      return true;
    } catch (err) {
      setFormError(formErrorMessage(err, 'Gagal memperbarui soal.'));
      return false;
    } finally {
      setBusyQuestion(null);
    }
  };

  const handleImportQuestions = async (rows) => {
    if (!questionsExam || !rows?.length) return 0;
    const examId = questionsExam.id;
    setFormError('');
    setSaving('import');
    const created = [];
    try {
      for (const row of rows) {
        created.push(await apiPost(`/guru/exams/${examId}/questions`, {
          tipe: 'pg',
          pertanyaan: row.pertanyaan,
          opsi: row.opsi,
          kunci_jawaban: row.kunci,
          bobot: row.bobot,
        }));
      }
      triggerNotice(`${created.length} soal berhasil diimpor.`);
      return created.length;
    } catch (err) {
      setFormError(formErrorMessage(err, 'Gagal mengimpor soal.'));
      return created.length;
    } finally {
      if (created.length) {
        setQuestions((prev) => [...prev, ...created]);
        setQuestionsCache((prev) => ({ ...prev, [examId]: [...(prev[examId] || []), ...created] }));
        setQuestionCounts((prev) => ({ ...prev, [examId]: (prev[examId] || 0) + created.length }));
      }
      setSaving('');
    }
  };

  const handleDeleteQuestion = (q) => {
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Butir Soal?',
      message: 'Apakah Anda yakin ingin menghapus butir soal ini dari bank soal?',
      confirmText: 'Hapus Soal',
      cancelText: 'Batal',
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        setBusyQuestion(q.id);
        const examId = questionsExam?.id;
        try {
          await apiDelete(`/guru/questions/${q.id}`);
          setQuestions((prev) => prev.filter((x) => x.id !== q.id));
          if (examId) {
            setQuestionsCache((prev) => ({ ...prev, [examId]: (prev[examId] || []).filter((x) => x.id !== q.id) }));
            setQuestionCounts((prev) => ({ ...prev, [examId]: Math.max(0, (prev[examId] || 0) - 1) }));
          }
          triggerNotice('Soal dihapus.');
        } catch (err) {
          triggerNotice(err.message || 'Gagal menghapus soal.');
        } finally {
          setBusyQuestion(null);
          setConfirmState((prev) => ({ ...prev, loading: false, open: false }));
        }
      },
    });
  };


  const guruBentoItems = useMemo(() => [
    {
      id: 'kelas',
      icon: Users,
      iconColor: '#10b981',
      glowColor: '16, 185, 129',
      label: 'Pengajaran',
      title: 'Kelas Diampu',
      value: taughtClasses.length,
      note: 'Sesuai jadwal mengajar',
      description: 'Daftar rombel dan siswa yang Anda ajar',
      onClick: () => setActiveTab('kelas')
    },
    {
      id: 'mapel',
      icon: BookOpen,
      iconColor: '#3b82f6',
      glowColor: '59, 130, 246',
      label: 'Kurikulum',
      title: 'Mata Pelajaran',
      value: taughtSubjects.length,
      note: 'Mapel yang diampu',
      description: 'Capaian pembelajaran & modul ajar',
      onClick: () => setActiveTab('kelas')
    },
    {
      id: 'materi',
      icon: Layers,
      iconColor: '#f97316',
      glowColor: '249, 115, 22',
      label: 'Bahan Ajar',
      title: 'Materi Aktif',
      value: materials.length,
      note: `${publishedMaterials} terpublikasi`,
      description: 'Video pembelajaran, modul PDF, dan tugas baca',
      onClick: () => setActiveTab('materi')
    },
    {
      id: 'tugas',
      icon: ClipboardCheck,
      iconColor: '#a855f7',
      glowColor: '168, 85, 247',
      label: 'Evaluasi',
      title: 'Menunggu Dinilai',
      value: pendingGrading,
      note: 'Klik untuk menilai',
      badge: pendingGrading > 0 ? `${pendingGrading} Pengumpulan` : 'Semua Dinilai',
      description: 'Koreksi jawaban dan berikan umpan balik tugas',
      onClick: () => { setActiveTab('tugas'); setFTugasStatus('perlu'); }
    }
  ], [taughtClasses.length, taughtSubjects.length, materials.length, publishedMaterials, pendingGrading]);

  // Skeleton penuh saat autentikasi/profil masih dimuat, supaya tidak ada layar kosong (B5).
  if (loading) {
    return (
      <div className="dashboard-siswa-root dashboard-shell" style={{ minHeight: '100vh', padding: '32px' }}>
        <DashboardSkeleton cards={4} showHero />
      </div>
    );
  }

  if (!user || profile?.role !== 'guru') return null;

  const displayName = teacher?.nama || profile?.nama || 'Guru';

  const statForClass = (classId) => ({
    materi: materials.filter((m) => m.class_id === classId).length,
    tugas: assignments.filter((a) => a.class_id === classId).length,
  });

  const mobileNavItems = [
    { id: 'kelas', label: 'Kelas', icon: Calendar, active: activeTab === 'kelas', onClick: () => setActiveTab('kelas') },
    { id: 'presensi', label: 'Presensi', icon: UserCheck, active: activeTab === 'presensi', onClick: () => setActiveTab('presensi') },
    { id: 'materi', label: 'Materi', icon: BookOpen, active: activeTab === 'materi', onClick: () => setActiveTab('materi') },
    { id: 'tugas', label: 'Tugas', icon: ClipboardList, active: activeTab === 'tugas', onClick: () => setActiveTab('tugas') },
    ...(examFeatureOn
      ? [
        { id: 'ujian', label: 'Ujian', icon: Award, active: activeTab === 'ujian', onClick: () => setActiveTab('ujian') },
        { id: 'rekap', label: 'Rekap', icon: BarChart3, active: activeTab === 'rekap', onClick: () => setActiveTab('rekap') },
      ]
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
                <span className="siswa-system-name">PORTAL GURU</span>
                <span className="siswa-school-name">{schoolInfo?.shortName || 'SMK Muhammadiyah 8 Medan'}</span>
              </div>
            </div>
          </div>

          <div className="siswa-nav-user-actions">
            <div className="siswa-user-pill">
              <div className="siswa-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
              <div className="siswa-meta-texts">
                <span className="siswa-meta-name">{displayName}</span>
                <span className="siswa-meta-class">{teacher?.jabatan || 'Guru'}</span>
              </div>
            </div>
            <AnimatedThemeToggler
              theme={theme}
              onThemeChange={setTheme}
              className="ps-theme-toggle"
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            />
            <button onClick={handleLogout} className="btn-siswa-logout" title="Keluar dari akun">
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar navigation */}
      <div className="siswa-nav-tabs ps-sidebar">
        <button 
          className={`siswa-tab-btn ${activeTab === 'kelas' ? 'active' : ''}`}
          onClick={() => setActiveTab('kelas')}
        >
          <Calendar size={17} />
          <span>Kelas &amp; Jadwal</span>
        </button>
        <button 
          className={`siswa-tab-btn ${activeTab === 'presensi' ? 'active' : ''}`}
          onClick={() => setActiveTab('presensi')}
        >
          <UserCheck size={17} />
          <span>Presensi</span>
        </button>
        <button 
          className={`siswa-tab-btn ${activeTab === 'materi' ? 'active' : ''}`}
          onClick={() => setActiveTab('materi')}
        >
          <BookOpen size={17} />
          <span>Materi</span>
        </button>
        <button 
          className={`siswa-tab-btn ${activeTab === 'tugas' ? 'active' : ''}`}
          onClick={() => setActiveTab('tugas')}
        >
          <ClipboardList size={17} />
          <span>Tugas &amp; Penilaian</span>
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
        {examFeatureOn && (
          <button
            className={`siswa-tab-btn ${activeTab === 'rekap' ? 'active' : ''}`}
            onClick={() => setActiveTab('rekap')}
          >
            <BarChart3 size={17} />
            <span>Rekap Nilai</span>
          </button>
        )}
        <div className="ps-sidebar-footer">
          <button className="ps-sidebar-logout" onClick={handleLogout} title="Keluar">
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      <MobileBottomNav items={mobileNavItems} maxPerSlide={3} label="Navigasi portal guru" />

      <main className="siswa-main-container">
        {dataLoading || loading ? (
          <DashboardSkeleton cards={4} showHero={true} />
        ) : (
          <>
            {notice && (
              <div className="siswa-toast-notice">
                <CheckCircle2 size={18} />
                <span>{notice}</span>
              </div>
            )}

            <section className="siswa-hero-banner">
              <div className="siswa-hero-text">
                <div className="siswa-live-tag">
                  <span className="pulse-dot" />
                  <span>PORTAL GURU AKTIF &bull; SEMESTER GENAP 2026</span>
                </div>
                <h1 className="siswa-hero-title">
                  Assalamu'alaikum, <span className="text-orange">{displayName}</span>
                </h1>
                <p className="siswa-hero-desc">
                  Kelola materi, tugas, dan ujian untuk kelas yang Anda ampu. Semua data
                  hanya mencakup kelas &amp; mapel Anda sendiri.
                </p>
              </div>
              <div className="siswa-hero-badge">
                <GraduationCap size={28} className="text-orange" />
                <div>
                  <span className="badge-title">{teacher?.gelar || 'Guru Vokasi'}</span>
                  <span className="badge-nisn">{schedules.length} sesi mengajar</span>
                </div>
              </div>
            </section>

            <MagicBento
              items={guruBentoItems}
              columns={4}
              gap={16}
              glowColor="232, 112, 42"
              theme={theme === 'dark' ? 'dark' : 'light'}
            />

        <div className="siswa-content-card">
          {activeTab === 'kelas' && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <div className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari kelas..."
                      value={qKelas}
                      onChange={(e) => setQKelas(e.target.value)}
                    />
                  </div>
                  <span className="guru-count">{filteredClasses.length} kelas</span>
                </div>
              </div>

              {dataLoading ? (
                <p className="guru-empty"><Loader2 size={15} className="gm-spin" /> Memuat kelas...</p>
              ) : filteredClasses.length === 0 ? (
                <p className="guru-empty">Belum ada jadwal mengajar untuk akun ini.</p>
              ) : (
                <div className="guru-class-grid">
                  {filteredClasses.map((g) => {
                    const st = statForClass(g.class_id);
                    return (
                      <article key={g.class_id} className="guru-class-card">
                        <header className="guru-class-head">
                          <Users size={17} />
                          <strong>{g.nama}</strong>
                          <span className="guru-chip">{g.items.length} sesi</span>
                        </header>

                        <div className="guru-class-stats">
                          <span><BookOpen size={13} /> {st.materi} materi</span>
                          <span><ClipboardList size={13} /> {st.tugas} tugas</span>
                        </div>

                        <ul className="guru-class-list">
                          {g.items.map((s) => (
                            <li key={s.id}>
                              <span className="guru-class-day">{s.hari}</span>
                              <span className="guru-class-subject">{s.subjects?.nama || '-'}</span>
                              <span className="guru-class-time">
                                {String(s.jam_mulai).slice(0, 5)}–{String(s.jam_selesai).slice(0, 5)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'presensi' && (
            <PresensiGuru
              schedules={schedules}
              students={students}
              attendance={attendance}
              onChanged={loadData}
            />
          )}

          
          {activeTab === 'materi' && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <div className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari judul materi..."
                      value={qMateri}
                      onChange={(e) => setQMateri(e.target.value)}
                    />
                  </div>

                  <div className="guru-chips">
                    {[
                      { key: 'semua', label: 'Semua' },
                      { key: 'publish', label: 'Terpublikasi' },
                      { key: 'draft', label: 'Draft' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className={`guru-chip-btn ${fMateriStatus === c.key ? 'is-active' : ''}`}
                        onClick={() => setFMateriStatus(c.key)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <select
                    className="guru-select"
                    value={fMateriMapel}
                    onChange={(e) => setFMateriMapel(e.target.value)}
                  >
                    <option value="">Semua mapel</option>
                    {taughtSubjects.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                  </select>

                  <span className="guru-count">{filteredMaterials.length} materi</span>
                </div>

                <button type="button" className="guru-primary-btn" onClick={() => openMaterialModal()}>
                  <PlusCircle size={16} />
                  <span>Tambah Materi</span>
                </button>
              </div>

              {dataLoading ? (
                <p className="guru-empty"><Loader2 size={15} className="gm-spin" /> Memuat materi...</p>
              ) : filteredMaterials.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Belum ada materi</strong>
                  <span>Klik "Tambah Materi" untuk mengunggah materi pertama.</span>
                </div>
              ) : (
                <div className="guru-card-grid is-three">
                  {materiSlice.map((m) => {
                    const meta = TIPE_META[m.tipe] || TIPE_META.teks;
                    const Icon = meta.icon;
                    return (
                      <article key={m.id} className="guru-item-card">
                        <header className="guru-item-head">
                          <span className="guru-item-icon"><Icon size={17} /></span>
                          <div className="guru-item-heading">
                            <strong>{m.judul}</strong>
                            <span className="guru-item-sub">{meta.label} &bull; {formatTanggalSingkat(m.created_at)}</span>
                          </div>
                          <span className={`guru-status ${m.is_published ? 'is-live' : 'is-draft'}`}>
                            {m.is_published ? 'Publik' : 'Draft'}
                          </span>
                        </header>

                        <div className="guru-item-tags">
                          {m.subjects?.nama && <span className="guru-tag">{m.subjects.nama}</span>}
                          {m.classes?.nama && <span className="guru-tag is-soft">{m.classes.nama}</span>}
                        </div>

                        {m.deskripsi && <p className="guru-item-desc">{m.deskripsi}</p>}

                        <footer className="guru-item-foot">
                          {m.file_url ? (
                            <a href={m.file_url} target="_blank" rel="noreferrer" className="guru-link">
                              Buka materi
                            </a>
                          ) : <span />}
                          <div className="guru-item-actions">
                            <button
                              type="button"
                              className="guru-icon-btn"
                              title={m.is_published ? 'Jadikan draft' : 'Publikasikan'}
                              onClick={() => handleTogglePublish(m)}
                              disabled={busyMaterial === m.id}
                            >
                              {m.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              type="button"
                              className="guru-icon-btn"
                              title="Edit materi"
                              onClick={() => openMaterialModal(m)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="guru-icon-btn is-danger"
                              title="Hapus materi"
                              onClick={() => handleDeleteMaterial(m)}
                              disabled={busyMaterial === m.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              )}

              <Pagination
                page={materiPageSafe}
                pageCount={materiPageCount}
                onChange={setPageMateri}
                total={filteredMaterials.length}
                pageSize={PAGE_SIZE}
                label="materi"
              />
            </div>
          )}

          
          {activeTab === 'tugas' && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <div className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari judul tugas..."
                      value={qTugas}
                      onChange={(e) => setQTugas(e.target.value)}
                    />
                  </div>

                  <div className="guru-chips">
                    {[
                      { key: 'semua', label: 'Semua' },
                      { key: 'perlu', label: `Perlu dinilai (${pendingGrading})` },
                      { key: 'publish', label: 'Terpublikasi' },
                      { key: 'draft', label: 'Draft' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className={`guru-chip-btn ${fTugasStatus === c.key ? 'is-active' : ''}`}
                        onClick={() => setFTugasStatus(c.key)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <span className="guru-count">{filteredAssignments.length} tugas</span>
                </div>

                <button type="button" className="guru-primary-btn" onClick={() => openAssignmentModal()}>
                  <PlusCircle size={16} />
                  <span>Buat Tugas</span>
                </button>
              </div>

              {dataLoading ? (
                <p className="guru-empty"><Loader2 size={15} className="gm-spin" /> Memuat tugas...</p>
              ) : filteredAssignments.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Belum ada tugas</strong>
                  <span>Klik "Buat Tugas" untuk membuat tugas pertama.</span>
                </div>
              ) : (
                <>
                  <div className="guru-card-grid is-three">
                    {tugasSlice.map((a) => {
                      const subs = submissionsFor(a.id);
                      const graded = subs.filter((s) => s.status === 'dinilai').length;
                      const waiting = subs.filter((s) => s.status === 'dikumpulkan').length;
                      const pct = subs.length ? Math.round((graded / subs.length) * 100) : 0;

                      return (
                        <article key={a.id} className="guru-task-card">
                          <div className="guru-task-top">
                            <span className="guru-item-icon"><ClipboardList size={17} /></span>
                            <div className="guru-task-heading">
                              <strong>{a.judul}</strong>
                              <span>{a.subjects?.nama || 'Tanpa mapel'} &bull; {a.classes?.nama || '-'}</span>
                            </div>
                            <span className={`guru-status ${a.is_published ? 'is-live' : 'is-draft'}`}>
                              {a.is_published ? 'Publik' : 'Draft'}
                            </span>
                          </div>

                          <div className="guru-item-tags">
                            <span className="guru-tag is-soft">
                              <Clock size={11} /> {a.deadline ? formatTanggal(a.deadline) : 'Tanpa deadline'}
                            </span>
                          </div>

                          {a.deskripsi && <p className="guru-item-desc">{a.deskripsi}</p>}

                          <div className="guru-progress-row">
                            <div className="guru-progress-meta">
                              <span><strong>{subs.length}</strong> kumpul</span>
                              <span className="is-ok">{graded} dinilai</span>
                              <span className={waiting ? 'is-warn' : ''}>{waiting} menunggu</span>
                            </div>
                            <div className="guru-progress-bar">
                              <span style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          <div className="guru-task-foot">
                            <button
                              type="button"
                              className="guru-primary-btn"
                              onClick={() => setSubsModal(a)}
                            >
                              <ClipboardCheck size={14} />
                              {subs.length ? `Nilai (${subs.length})` : 'Belum ada jawaban'}
                            </button>
                            <div className="guru-item-actions">
                              <button
                                type="button"
                                className="guru-icon-btn"
                                title={a.is_published ? 'Jadikan draft' : 'Publikasikan'}
                                onClick={() => handleTogglePublishAssignment(a)}
                                disabled={busyAssignment === a.id}
                              >
                                {a.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button type="button" className="guru-icon-btn" title="Edit tugas" onClick={() => openAssignmentModal(a)}>
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="guru-icon-btn is-danger"
                                title="Hapus tugas"
                                onClick={() => handleDeleteAssignment(a)}
                                disabled={busyAssignment === a.id}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <Pagination
                    page={tugasPageSafe}
                    pageCount={tugasPageCount}
                    onChange={setPageTugas}
                    total={filteredAssignments.length}
                    pageSize={PAGE_SIZE}
                    label="tugas"
                  />
                </>
              )}
            </div>
          )}

          
          {activeTab === 'ujian' && examFeatureOn && (
            <div className="siswa-tab-pane">
              <div className="guru-toolbar">
                <div className="guru-toolbar-left">
                  <div className="guru-search">
                    <Search size={15} />
                    <input
                      placeholder="Cari judul ujian..."
                      value={qUjian}
                      onChange={(e) => setQUjian(e.target.value)}
                    />
                  </div>
                  <span className="guru-count">{filteredExams.length} ujian</span>
                </div>

                <button type="button" className="guru-primary-btn" onClick={() => openExamModal()}>
                  <PlusCircle size={16} />
                  <span>Buat Ujian</span>
                </button>
              </div>

              {dataLoading ? (
                <p className="guru-empty"><Loader2 size={15} className="gm-spin" /> Memuat ujian...</p>
              ) : filteredExams.length === 0 ? (
                <div className="guru-empty-box">
                  <Inbox size={26} />
                  <strong>Belum ada ujian</strong>
                  <span>Klik "Buat Ujian" untuk membuat ujian pertama.</span>
                </div>
              ) : (
                <div className="guru-card-grid">
                  {filteredExams.map((x) => {
                    const soal = questionCounts[x.id] || 0;
                    const tampil = x.is_approved && x.is_active;
                    const session = getExamSession(x);
                    const examAttempts = attemptsFor(x.id);
                    const terminatedCount = examAttempts.filter((a) => a.status === 'dibatalkan').length;
                    const statusLabel = !x.is_approved
                      ? 'Menunggu admin'
                      : !x.is_active
                        ? 'Draft'
                        : session.state === 'open'
                          ? 'Sesi berlangsung'
                          : session.state === 'override'
                            ? 'Dibuka admin'
                            : session.state === 'ended'
                              ? 'Sesi berakhir'
                              : session.state === 'upcoming'
                                ? 'Belum dibuka'
                                : 'Jadwal belum ada';
                    const statusTone = !tampil
                      ? 'is-draft'
                      : session.state === 'open' || session.state === 'override'
                        ? 'is-live'
                        : session.state === 'ended'
                          ? 'is-danger'
                          : 'is-warn';
                    return (
                      <article key={x.id} className="guru-item-card">
                        <header className="guru-item-head">
                          <span className="guru-item-icon"><Award size={17} /></span>
                          <div className="guru-item-heading">
                            <strong>{x.judul}</strong>
                            <span className="guru-item-sub">{x.subjects?.nama || 'Tanpa mapel'}</span>
                          </div>
                          <span className={`guru-status ${statusTone}`}>{statusLabel}</span>
                        </header>

                        <div className="guru-item-tags">
                          <span className="guru-tag is-soft"><Clock size={11} /> {x.durasi_menit} menit</span>
                          <span className="guru-tag is-soft"><ListChecks size={11} /> {soal} soal</span>
                          <span className="guru-tag is-soft">
                            <CalendarClock size={11} /> {formatExamSession(x)}
                          </span>
                          {x.acak_soal !== false && (
                            <span className="guru-tag is-soft"><ShieldAlert size={11} /> Soal diacak</span>
                          )}
                          {x.butuh_kode && (
                            <span className="guru-tag">
                              <KeyRound size={11} /> {examCodes.get(x.id)?.code || 'Butuh kode'}
                            </span>
                          )}
                        </div>

                        {x.deskripsi && <p className="guru-item-desc">{x.deskripsi}</p>}

                        {!x.is_approved && (
                          <div className="guru-approval-note is-inline">
                            <AlertTriangle size={13} />
                            <span>Belum disetujui admin — belum tampil ke siswa.</span>
                          </div>
                        )}

                        {x.is_approved && x.is_active && session.state === 'unscheduled' && (
                          <div className="guru-approval-note is-inline">
                            <AlertTriangle size={13} />
                            <span>Atur tanggal & jam sesi agar siswa bisa mulai mengerjakan.</span>
                          </div>
                        )}

                        {x.is_approved && x.is_active && session.state === 'ended' && (
                          <div className="guru-approval-note is-inline">
                            <AlertTriangle size={13} />
                            <span>Sesi sudah berakhir. Minta admin membuka di luar jadwal bila perlu.</span>
                          </div>
                        )}

                        {terminatedCount > 0 && (
                          <div className="guru-terminated-note">
                            <ShieldAlert size={13} />
                            <span>
                              {terminatedCount} pengerjaan dihentikan karena pelanggaran. Reset agar siswa bisa mengulang.
                            </span>
                          </div>
                        )}

                        <footer className="guru-item-foot">
                          <div className="guru-item-links">
                            <button type="button" className="guru-link" onClick={() => openQuestions(x)}>
                              Kelola soal
                            </button>
                            <button type="button" className="guru-link" onClick={() => setCodeModal(x)}>
                              <KeyRound size={12} /> Kode akses
                            </button>
                            <button type="button" className="guru-link" onClick={() => setAttemptsModal(x)}>
                              <ClipboardCheck size={12} /> Pengerjaan ({examAttempts.length})
                            </button>
                          </div>
                          <div className="guru-item-actions">
                            <button
                              type="button"
                              className="guru-icon-btn"
                              title={x.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              onClick={() => handleToggleActiveExam(x)}
                              disabled={busyExam === x.id}
                            >
                              {x.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button type="button" className="guru-icon-btn" title="Edit ujian" onClick={() => openExamModal(x)}>
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="guru-icon-btn is-danger"
                              title="Hapus ujian"
                              onClick={() => handleDeleteExam(x)}
                              disabled={busyExam === x.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              )}

              <ExamRecapCard attempts={attempts} exams={exams} />
            </div>
          )}

          {activeTab === 'rekap' && examFeatureOn && (
            <div className="siswa-tab-pane">
              <ExamClassRecap
                students={students}
                attempts={attempts}
                exams={exams}
                schedules={schedules}
                taughtClasses={taughtClasses}
                loading={dataLoading}
              />
            </div>
          )}
        </div>
          </>
        )}
      </main>

      
      <GuruModal
        open={formModal === 'materi'}
        size="md"
        icon={<BookOpen size={19} />}
        title={editingMaterial ? 'Ubah Materi' : 'Tambah Materi'}
        subtitle={editingMaterial ? editingMaterial.judul : 'Unggah video, tautan, PDF, atau teks materi'}
        onClose={closeMaterialModal}
        footer={(
          <>
            <button type="button" className="gm-btn-ghost" onClick={closeMaterialModal}>Batal</button>
            <button
              type="submit"
              form="form-materi"
              className="gm-btn-primary"
              disabled={saving === 'materi'}
            >
              {saving === 'materi' ? <Loader2 size={15} className="gm-spin" /> : <Save size={15} />}
              <span>{saving === 'materi' ? 'Menyimpan...' : 'Simpan Materi'}</span>
            </button>
          </>
        )}
      >
        <form id="form-materi" className="guru-form" onSubmit={handleSubmitMaterial}>
          <div className="guru-field">
            <label>Judul Materi *</label>
            <input
              type="text"
              className="guru-input"
              placeholder="Contoh: Konfigurasi VLAN Dasar"
              value={materialForm.judul}
              onChange={(e) => setMaterialForm({ ...materialForm, judul: e.target.value })}
            />
          </div>

          <div className="guru-field-row">
            <div className="guru-field">
              <label>Mata Pelajaran</label>
              <select
                className="guru-input"
                value={materialForm.subject_id}
                onChange={(e) => setMaterialForm({ ...materialForm, subject_id: e.target.value })}
              >
                <option value="">— Pilih mapel —</option>
                {taughtSubjects.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="guru-field">
              <label>Kelas</label>
              <select
                className="guru-input"
                value={materialForm.class_id}
                onChange={(e) => setMaterialForm({ ...materialForm, class_id: e.target.value })}
              >
                <option value="">— Pilih kelas —</option>
                {taughtClasses.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>
          </div>

          <div className="guru-field">
            <label>Tipe Materi</label>
            <div className="guru-segment">
              {[
                { key: 'video', label: 'Video' },
                { key: 'file', label: 'PDF' },
                { key: 'link', label: 'Tautan' },
                { key: 'teks', label: 'Teks' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`guru-segment-btn ${materialForm.tipe === t.key ? 'is-active' : ''}`}
                  onClick={() => setMaterialForm({ ...materialForm, tipe: t.key })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {materialForm.tipe === 'video' && (
            <div className="guru-field">
              <label>URL Video (YouTube) *</label>
              <input
                type="url"
                className="guru-input"
                placeholder="https://youtube.com/watch?v=..."
                value={materialForm.file_url}
                onChange={(e) => setMaterialForm({ ...materialForm, file_url: e.target.value })}
              />
              <small className="guru-hint">Link otomatis diubah ke format embed.</small>
            </div>
          )}

          {materialForm.tipe === 'link' && (
            <div className="guru-field">
              <label>URL Tautan *</label>
              <input
                type="url"
                className="guru-input"
                placeholder="https://..."
                value={materialForm.file_url}
                onChange={(e) => setMaterialForm({ ...materialForm, file_url: e.target.value })}
              />
            </div>
          )}

          {materialForm.tipe === 'file' && (
            <div className="guru-field">
              <label>Berkas PDF {editingMaterial ? '(kosongkan bila tidak diganti)' : '*'}</label>
              <label className="guru-file-drop">
                <UploadCloud size={22} />
                <span>{pdfFile ? pdfFile.name : 'Pilih berkas PDF (maks. 25 MB)'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          <div className="guru-field">
            <label>{materialForm.tipe === 'teks' ? 'Isi Materi Teks' : 'Deskripsi'}</label>
            <textarea
              className="guru-input"
              rows={materialForm.tipe === 'teks' ? 6 : 3}
              placeholder={materialForm.tipe === 'teks' ? 'Tulis isi materi yang akan dibaca siswa...' : 'Ringkasan materi...'}
              value={materialForm.deskripsi}
              onChange={(e) => setMaterialForm({ ...materialForm, deskripsi: e.target.value })}
            />
          </div>

          <label className="guru-check">
            <input
              type="checkbox"
              checked={materialForm.is_published}
              onChange={(e) => setMaterialForm({ ...materialForm, is_published: e.target.checked })}
            />
            <span>Publikasikan ke siswa</span>
          </label>

          {formError && <div className="guru-form-error">{formError}</div>}
        </form>
      </GuruModal>

      
      <GuruModal
        open={formModal === 'tugas'}
        size="md"
        icon={<ClipboardList size={19} />}
        title={editingAssignment ? 'Ubah Tugas' : 'Buat Tugas'}
        subtitle={editingAssignment ? editingAssignment.judul : 'Tentukan instruksi dan tenggat pengumpulan'}
        onClose={closeAssignmentModal}
        footer={(
          <>
            <button type="button" className="gm-btn-ghost" onClick={closeAssignmentModal}>Batal</button>
            <button
              type="submit"
              form="form-tugas"
              className="gm-btn-primary"
              disabled={saving === 'tugas'}
            >
              {saving === 'tugas' ? <Loader2 size={15} className="gm-spin" /> : <Save size={15} />}
              <span>{saving === 'tugas' ? 'Menyimpan...' : 'Simpan Tugas'}</span>
            </button>
          </>
        )}
      >
        <form id="form-tugas" className="guru-form" onSubmit={handleSubmitAssignment}>
          <div className="guru-field">
            <label>Judul Tugas *</label>
            <input
              type="text"
              className="guru-input"
              placeholder="Contoh: Laporan Praktikum VLAN"
              value={assignmentForm.judul}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, judul: e.target.value })}
            />
          </div>

          <div className="guru-field-row">
            <div className="guru-field">
              <label>Mata Pelajaran</label>
              <select
                className="guru-input"
                value={assignmentForm.subject_id}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, subject_id: e.target.value })}
              >
                <option value="">— Pilih mapel —</option>
                {taughtSubjects.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="guru-field">
              <label>Kelas</label>
              <select
                className="guru-input"
                value={assignmentForm.class_id}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
              >
                <option value="">— Pilih kelas —</option>
                {taughtClasses.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>
          </div>

          <div className="guru-field">
            <label>Deadline</label>
            <input
              type="datetime-local"
              className="guru-input"
              value={assignmentForm.deadline}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
            />
          </div>

          <div className="guru-field">
            <label>Deskripsi / Instruksi</label>
            <textarea
              className="guru-input"
              rows={4}
              placeholder="Instruksi pengerjaan..."
              value={assignmentForm.deskripsi}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, deskripsi: e.target.value })}
            />
          </div>

          <label className="guru-check">
            <input
              type="checkbox"
              checked={assignmentForm.is_published}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, is_published: e.target.checked })}
            />
            <span>Publikasikan ke siswa</span>
          </label>

          {formError && <div className="guru-form-error">{formError}</div>}
        </form>
      </GuruModal>

      
      <GuruModal
        open={formModal === 'ujian'}
        size="md"
        icon={<Award size={19} />}
        title={editingExam ? 'Ubah Ujian' : 'Buat Ujian'}
        subtitle={editingExam ? editingExam.judul : 'Ujian perlu disetujui admin sebelum tampil ke siswa'}
        onClose={closeExamModal}
        footer={(
          <>
            <button type="button" className="gm-btn-ghost" onClick={closeExamModal}>Batal</button>
            <button
              type="submit"
              form="form-ujian"
              className="gm-btn-primary"
              disabled={saving === 'ujian'}
            >
              {saving === 'ujian' ? <Loader2 size={15} className="gm-spin" /> : <Save size={15} />}
              <span>{saving === 'ujian' ? 'Menyimpan...' : 'Simpan Ujian'}</span>
            </button>
          </>
        )}
      >
        <form id="form-ujian" className="guru-form" onSubmit={handleSubmitExam}>
          <div className="guru-field">
            <label>Judul Ujian *</label>
            <input
              type="text"
              className="guru-input"
              placeholder="Contoh: UTS Administrasi Jaringan"
              value={examForm.judul}
              onChange={(e) => setExamForm({ ...examForm, judul: e.target.value })}
            />
          </div>

          <div className="guru-field-row">
            <div className="guru-field">
              <label>Mata Pelajaran</label>
              <select
                className="guru-input"
                value={examForm.subject_id}
                onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}
              >
                <option value="">— Pilih mapel —</option>
                {taughtSubjects.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="guru-field">
              <label>Durasi (menit)</label>
              <input
                type="number"
                min="5"
                className="guru-input"
                value={examForm.durasi_menit}
                onChange={(e) => setExamForm({ ...examForm, durasi_menit: e.target.value })}
              />
            </div>
          </div>

          <div className="guru-field-row">
            <div className="guru-field">
              <label>Tanggal Mulai Sesi *</label>
              <input
                type="date"
                className="guru-input"
                value={examForm.tanggal_mulai}
                onChange={(e) => setExamForm({ ...examForm, tanggal_mulai: e.target.value })}
              />
              <small className="guru-field-hint">Tanggal sesi dibuka (WIB).</small>
            </div>
            <div className="guru-field">
              <label>Jam Mulai Sesi *</label>
              <input
                type="time"
                className="guru-input"
                value={examForm.jam_mulai}
                onChange={(e) => setExamForm({ ...examForm, jam_mulai: e.target.value })}
              />
              <small className="guru-field-hint">Siswa tidak bisa mulai sebelum jam ini.</small>
            </div>
          </div>

          <div className="guru-field-row">
            <div className="guru-field">
              <label>Tanggal Selesai Sesi *</label>
              <input
                type="date"
                className="guru-input"
                value={examForm.tanggal_selesai}
                onChange={(e) => setExamForm({ ...examForm, tanggal_selesai: e.target.value })}
              />
              <small className="guru-field-hint">Tanggal sesi berakhir (WIB).</small>
            </div>
            <div className="guru-field">
              <label>Jam Selesai Sesi *</label>
              <input
                type="time"
                className="guru-input"
                value={examForm.jam_selesai}
                onChange={(e) => setExamForm({ ...examForm, jam_selesai: e.target.value })}
              />
              <small className="guru-field-hint">Setelah jam ini ujian tidak bisa dimulai.</small>
            </div>
          </div>

          <div className="guru-field">
            <label>Deskripsi</label>
            <textarea
              className="guru-input"
              rows={3}
              placeholder="Petunjuk ujian..."
              value={examForm.deskripsi}
              onChange={(e) => setExamForm({ ...examForm, deskripsi: e.target.value })}
            />
          </div>

          <label className="guru-check">
            <input
              type="checkbox"
              checked={examForm.is_active}
              onChange={(e) => setExamForm({ ...examForm, is_active: e.target.checked })}
            />
            <span>Aktifkan ujian untuk siswa</span>
          </label>

          <label className="guru-check">
            <input
              type="checkbox"
              checked={examForm.acak_soal}
              onChange={(e) => setExamForm({ ...examForm, acak_soal: e.target.checked })}
            />
            <span>Acak urutan soal untuk setiap siswa</span>
          </label>

          {formError && <div className="guru-form-error">{formError}</div>}
        </form>
      </GuruModal>

      
      <GradeModal
        key={grading?.submission?.id || 'empty'}
        open={!!grading}
        submission={grading?.submission || null}
        assignment={grading?.assignment || null}
        saving={saving === `nilai-${grading?.submission?.id}`}
        onClose={() => setGrading(null)}
        onSave={handleGrade}
      />

      
      <AssignmentSubmissionsModal
        open={!!subsModal}
        assignment={subsModal}
        submissions={subsModal ? submissionsFor(subsModal.id) : []}
        onClose={() => setSubsModal(null)}
        onPick={(sub) => {
          const assignment = subsModal;
          setSubsModal(null);
          setGrading({ submission: sub, assignment });
        }}
      />

      <ExamCodeModal
        key={codeModal?.id || 'empty'}
        open={!!codeModal}
        exam={codeModal}
        codeRow={codeModal ? examCodes.get(codeModal.id) : null}
        onClose={() => setCodeModal(null)}
        onSaved={loadData}
      />

      <ExamAttemptsModal
        open={!!attemptsModal}
        exam={attemptsModal}
        attempts={attemptsModal ? attemptsFor(attemptsModal.id) : []}
        onClose={() => setAttemptsModal(null)}
        onReset={handleResetAttempt}
        busyId={resettingAttempt}
      />

      <ExamQuestionsModal
        open={!!questionsExam}
        exam={questionsExam}
        questions={questions}
        loading={questionsLoading}
        saving={saving === 'soal' ? 'soal' : busyQuestion}
        importing={saving === 'import'}
        error={formError}
        onClose={() => { setQuestionsExam(null); setQuestions([]); }}
        onAdd={handleAddQuestion}
        onUpdate={handleUpdateQuestion}
        onDelete={handleDeleteQuestion}
        onImport={handleImportQuestions}
      />

      <ExamLiveToasts
        items={liveEvents}
        students={students}
        exams={exams}
        onDismiss={dismissLiveEvent}
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
