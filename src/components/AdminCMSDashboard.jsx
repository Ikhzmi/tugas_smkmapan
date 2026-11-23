import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  LogOut, 
  Save, 
  Download, 
  Upload, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  Users, 
  Trophy, 
  Layers, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Edit3, 
  ExternalLink, 
  Phone, 
  Search, 
  Sparkles,
  CalendarCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  KeyRound,
  Camera,
  Loader2,
  LayoutGrid,
  BookOpen,
  CalendarDays,
  School
} from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { apiList } from '../lib/api';
import { uploadImage } from '../lib/uploadImage';
import AdminExamSettings from './AdminExamSettings';
import AdminAttendance from './AdminAttendance';
import AdminAnalytics from './AdminAnalytics';
import '../styles/portal-shell.css';
import AdminGuruManager from './AdminGuruManager';
import { useAnimeEntrance } from '../hooks/useAnimeEntrance';
import AdminSiswaManager from './AdminSiswaManager';
import AdminMapelManager from './AdminMapelManager';
import AdminJadwalManager from './AdminJadwalManager';
import AdminKelasManager from './AdminKelasManager';
import AdminAccountManager from './AdminAccountManager';
import './AdminCMSDashboard.css';
import { useTheme } from '../hooks/useTheme';
import { DashboardSkeleton } from './ui/Skeleton';
import Pagination from './ui/Pagination';
import { useHeaderScroll } from '../hooks/useHeaderScroll';
import AnimatedThemeToggler from './AnimatedThemeToggler';
import GlassConfirmModal from './ui/GlassConfirmModal';
import AppModal from './ui/AppModal';
import MobileBottomNav from './MobileBottomNav';

// Klasifikasi menu sidebar berdasarkan fungsi tanpa label teks
const CMS_TAB_GROUPS = [
  // 1. Dashboard / Monitoring
  [
    { key: 'overview', label: 'Ringkasan', icon: Layers },
  ],
  // 2. Konten Website / Publikasi
  [
    { key: 'school', label: 'Profil', icon: Building2 },
    { key: 'hero', label: 'Hero', icon: Sparkles },
    { key: 'tampilan', label: 'Tampilan', icon: LayoutGrid },
    { key: 'copy', label: 'Teks Section', icon: Edit3 },
    { key: 'majors', label: 'Jurusan', icon: GraduationCap },
    { key: 'facilities', label: 'Fasilitas', icon: Building2 },
    { key: 'eskul', label: 'Eskul', icon: Trophy },
    { key: 'teachers', label: 'Guru', icon: Users },
    { key: 'galeri', label: 'Galeri', icon: Camera },
  ],
  // 3. Data Master Sekolah
  [
    { key: 'data-siswa', label: 'Data Siswa', icon: GraduationCap },
    { key: 'data-guru', label: 'Data Guru', icon: Users },
    { key: 'data-kelas', label: 'Kelas', icon: School },
  ],
  // 4. Akademik & CBT
  [
    { key: 'jadwal', label: 'Jadwal', icon: CalendarDays },
    { key: 'mapel', label: 'Mapel', icon: BookOpen },
    { key: 'presensi', label: 'Presensi', icon: CalendarCheck },
    { key: 'ujian', label: 'Ujian', icon: ShieldCheck },
  ],
  // 5. Komunikasi & Pengaturan
  [
    { key: 'messages', label: 'Pesan', icon: Mail },
    { key: 'akun', label: 'Kelola Akun', icon: KeyRound },
  ],
];

const CMS_TABS = CMS_TAB_GROUPS.flat();

// Bagian beranda yang judul & paragraf pembukanya bisa diubah.
const COPY_SECTIONS = [
  { key: 'profil', label: 'Profil Sekolah', accentHint: 'Kosongkan untuk memakai nama sekolah' },
  { key: 'program', label: 'Program Keahlian' },
  { key: 'eskul', label: 'Ekstrakurikuler' },
  { key: 'galeri', label: 'Galeri' },
  { key: 'fasilitas', label: 'Fasilitas' },
  { key: 'tenaga', label: 'Tenaga Pendidik' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'ppdb', label: 'Judul Modal PPDB' },
];

// Daftar array di database <-> teks satu baris per item di form.
const toLines = (list) => (Array.isArray(list) ? list : []).join('\n');
const fromLines = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);

const MAJOR_TEXT_LIMITS = { name: 70, code: 8, tagline: 140, description: 300 };
const MAJOR_LIST_ITEM_LIMIT = 72;

const MAJOR_LIST_FIELDS = [
  { key: 'curriculum', label: 'Mata Pelajaran / Kurikulum Keahlian', placeholder: 'Administrasi Infrastruktur Jaringan', maxItems: 4 },
  { key: 'facilities', label: 'Fasilitas Praktik Jurusan', placeholder: 'Laboratorium Cisco Networking Academy', maxItems: 6 },
  { key: 'careers', label: 'Prospek Karier', placeholder: 'Network Administrator', maxItems: 6 },
  { key: 'certifications', label: 'Sertifikasi & Kompetensi', placeholder: 'MikroTik MTCNA', maxItems: 6 }
];

const MAJOR_ICON_OPTIONS = ['Network', 'Palette', 'Calculator', 'Wrench'];

// <input type="color"> hanya menerima hex 6 digit.
const safeHex = (value, fallback) => (
  /^#[0-9a-fA-F]{6}$/.test(String(value || '').trim()) ? String(value).trim() : fallback
);

// Ubah array dari database jadi teks multi-baris untuk form.
const profileToEdit = (p) => ({
  ...p,
  sejarahParagrafText: (p?.sejarahParagraf || []).join('\n'),
  sejarahMilestonesText: (p?.sejarahMilestones || []).map((m) => `${m.year}|${m.label}`).join('\n'),
  kepsekPesanText: (p?.kepsekPesan || []).join('\n'),
});

// Parse kembali teks multi-baris dari form jadi array untuk disimpan.
const parseProfileTexts = (p) => ({
  ...p,
  sejarahParagraf: (p.sejarahParagrafText || '').split('\n').map((s) => s.trim()).filter(Boolean),
  sejarahMilestones: (p.sejarahMilestonesText || '')
    .split('\n')
    .map((line) => {
      const [year, ...rest] = line.split('|');
      return { year: (year || '').trim(), label: rest.join('|').trim() };
    })
    .filter((m) => m.year && m.label),
  kepsekPesan: (p.kepsekPesanText || '').split('\n').map((s) => s.trim()).filter(Boolean),
});

// Gambar statis di bagian Profil beranda (foto sejarah + kartu kepala sekolah).
function ProfileImageField({ label, value, hint, emptyText, busy, onChange, onPick }) {
  return (
    <div className="form-group full-width">
      <label><Camera size={14} /> {label}</label>
      <div className="cms-photo-field">
        <div className="cms-photo-preview">
          {value ? (
            <img src={value} alt={label} />
          ) : (
            <span className="cms-photo-empty"><Camera size={22} /> {emptyText}</span>
          )}
        </div>
        <div className="cms-photo-actions">
          <label className={`btn btn-outline btn-sm cms-upload-btn ${busy ? 'is-disabled' : ''}`}>
            {busy ? <Loader2 size={14} className="cms-spin" /> : <Upload size={14} />}
            <span>{value ? 'Ganti Gambar' : 'Unggah Gambar'}</span>
            <input
              type="file"
              accept="image/*"
              className="cms-file-input"
              disabled={busy}
              onChange={onPick}
            />
          </label>
          {value && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange('')}>
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>
      <p className="cms-photo-hint">{hint}</p>
    </div>
  );
}

const DEPT_FILTER_ALIASES = {
  TKJ: ['TKJ', 'KOMPUTER'],
  TSM: ['TSM', 'TBSM', 'SEPEDA MOTOR'],
  DKV: ['DKV', 'DESAIN KOMUNIKASI'],
  AKUNTANSI: ['AKUNTANSI', 'AKL'],
  UMUM: [
    'UMUM', 'AKADEMIK', 'BAHASA', 'SAINS', 'MATEMATIKA', 'AGAMA', 'ISLAM',
    'SOSIAL', 'HUMANIORA', 'KEBUGARAN', 'LAYANAN', 'TATA USAHA', 'PIMPINAN', 'KESISWAAN',
  ],
};

const matchDeptFilter = (department, filter) => {
  if (filter === 'ALL') return true;
  const dept = String(department || '').toUpperCase();
  return (DEPT_FILTER_ALIASES[filter] || [filter]).some((alias) => dept.includes(alias));
};

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const CREATE_DEFAULTS = {
  major: {
    kode: '', nama: '', tagline: '', deskripsi: '',
    biaya_pendaftaran: 825000, spp_bulanan: 275000, is_active: true,
    image_url: '',
  },
  eskul: {
    nama: '', kategori: 'Olahraga & Seni', jadwal: '', pembina: '',
    prestasi: '', deskripsi: '', image_url: '',
  },
  facility: {
    judul: '', badge: 'Fasilitas Baru', kategori: 'campus',
    specs: '', deskripsi: '', image_url: '',
  },
  galeri: {
    judul: '', kategori: 'Kegiatan', tanggal: '', deskripsi: '', image_url: '',
  },
};

const CREATE_MODAL_META = {
  major: {
    title: 'Tambah Program Keahlian',
    subtitle: 'Lengkapi data jurusan. Data baru langsung tersimpan ke database saat Anda menekan Simpan Data.',
    Icon: GraduationCap,
  },
  eskul: {
    title: 'Tambah Ekstrakurikuler',
    subtitle: 'Isi informasi kegiatan baru, lalu simpan agar langsung tampil di website.',
    Icon: Trophy,
  },
  facility: {
    title: 'Tambah Fasilitas Sekolah',
    subtitle: 'Daftarkan sarana atau ruang baru beserta spesifikasi singkatnya.',
    Icon: Building2,
  },
  galeri: {
    title: 'Tambah Foto Galeri',
    subtitle: 'Unggah foto kegiatan baru. Anda juga bisa menambahkan fotonya nanti lewat editor galeri.',
    Icon: Camera,
  },
};

const CREATE_PHOTO_BUCKET = { major: 'jurusan', eskul: 'eskul', facility: 'fasilitas', galeri: 'galeri' };

export default function AdminCMSDashboard({ isOpen, onClose, isFullPage = false, onLogout }) {
  const {
    loading: contentLoading,
    schoolInfo,
    appearance,
    sectionCopy,
    profileExtras,
    hero,
    allMajors,
    teachers, 
    eskul, 
    facilities, 
    galeri,
    ppdbSubmissions, 
    contactMessages,
    updateSchoolInfo,
    updateProfileExtras,
    updateHero,
    updateAppearance,
    updateSectionCopy,
    updateMajors,
    createMajor,
    deleteMajor,
    updateEskul,
    createEskul,
    deleteEskul,
    updateFacilities,
    createFacility,
    deleteFacility,
    updateGallery,
    createGalleryItem,
    deleteGalleryItem,
    refresh,
    deletePpdbSubmission,
    updatePpdbStatus,
    deleteContactMessage
  } = useContent();
  const { theme, setTheme } = useTheme();
  const isHeaderHidden = useHeaderScroll();

  
  const [activeTab, setActiveTab] = useState('overview');
  // Konten admin baru dirender setelah data CMS siap; animasi menunggu itu.
  const contentRevealRef = useAnimeEntrance({
    deps: [activeTab],
    ready: !contentLoading,
    selector: ':scope > *',
  });
  const [statusNotification, setStatusNotification] = useState('');

  // ---- Affordance sidebar: beri tahu masih ada menu di bawah lipatan ----
  const sidebarRef = useRef(null);
  const [sidebarMore, setSidebarMore] = useState({ visible: false, count: 0 });

  // Pencarian & pagination PPDB / Pesan masuk
  const [ppdbSearch, setPpdbSearch] = useState('');
  const [ppdbStatus, setPpdbStatus] = useState('');
  const [ppdbPage, setPpdbPage] = useState(1);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgPage, setMsgPage] = useState(1);

  // Jumlah siswa aktif untuk overview
  const [studentCount, setStudentCount] = useState(0);
  useEffect(() => {
    let alive = true;
    apiList('/admin/students', { per_page: 1 })
      .then(({ meta }) => { if (alive) setStudentCount(Number(meta?.total) || 0); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return undefined;

    const measure = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      const visible = remaining > 12;
      let count = 0;
      if (visible) {
        const bottomEdge = el.getBoundingClientRect().bottom;
        el.querySelectorAll('.cms-nav-item').forEach((item) => {
          if (item.getBoundingClientRect().top > bottomEdge - 8) count += 1;
        });
      }
      setSidebarMore((prev) => (
        prev.visible === visible && prev.count === count ? prev : { visible, count }
      ));
    };

    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [activeTab]);

  const scrollSidebarToNext = () => {
    const el = sidebarRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.max(140, el.clientHeight * 0.6), behavior: 'smooth' });
  };

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

  
  const [editSchool, setEditSchool] = useState({ ...schoolInfo });
  const [editProfile, setEditProfile] = useState(() => profileToEdit(profileExtras));
  const [editHero, setEditHero] = useState({ ...hero });

  // Sinkronkan form hero saat data terbaru datang dari database.
  useEffect(() => { queueMicrotask(() => setEditHero({ ...hero })); }, [hero]);
  useEffect(() => { queueMicrotask(() => setEditSchool({ ...schoolInfo })); }, [schoolInfo]);
  useEffect(() => { queueMicrotask(() => setEditProfile(profileToEdit(profileExtras))); }, [profileExtras]);
  const [editGaleri, setEditGaleri] = useState([...galeri]);
  useEffect(() => { queueMicrotask(() => setEditGaleri([...galeri])); }, [galeri]);

  const [editAppearance, setEditAppearance] = useState({ ...appearance });
  useEffect(() => { queueMicrotask(() => setEditAppearance({ ...appearance })); }, [appearance]);

  const [editCopy, setEditCopy] = useState({ ...sectionCopy });
  useEffect(() => { queueMicrotask(() => setEditCopy({ ...sectionCopy })); }, [sectionCopy]);

  const [editMajors, setEditMajors] = useState([...allMajors]);
  const [editEskul, setEditEskul] = useState([...eskul]);
  const [editFacilities, setEditFacilities] = useState([...facilities]);
  const hydratedRef = useRef(false);

  // CMS bisa mount sebelum fetch database selesai, sehingga daftar di atas
  // berisi data fallback dengan id non-UUID. Sinkronkan sekali saat data asli tiba.
  useEffect(() => {
    if (contentLoading || hydratedRef.current) return;
    hydratedRef.current = true;
    queueMicrotask(() => {
      setEditMajors([...allMajors]);
      setEditEskul([...eskul]);
      setEditFacilities([...facilities]);
      setEditGaleri([...galeri]);
    });
  }, [contentLoading, allMajors, eskul, facilities, galeri]);

  
  const [selectedMajorIndex, setSelectedMajorIndex] = useState(0);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('ALL');
  const [teacherPage, setTeacherPage] = useState(1);
  const TEACHERS_PER_PAGE = 10;
  const [selectedEskulIndex, setSelectedEskulIndex] = useState(0);
  const [selectedFacIndex, setSelectedFacIndex] = useState(0);
  const [uploading, setUploading] = useState('');
  const [createModal, setCreateModal] = useState(null);

  const openCreate = (type) => {
    setCreateModal({ type, form: { ...CREATE_DEFAULTS[type] }, saving: false, uploading: false });
  };

  const closeCreate = () => {
    setCreateModal((prev) => (prev?.saving || prev?.uploading ? prev : null));
  };

  const setCreateField = (field, value) => {
    setCreateModal((prev) => (prev ? { ...prev, form: { ...prev.form, [field]: value } } : prev));
  };


  const adminBentoItems = useMemo(() => [
    {
      id: 'majors',
      icon: GraduationCap,
      iconColor: '#3b82f6',
      glowColor: '59, 130, 246',
      label: 'Kompetensi',
      title: 'Program Keahlian',
      value: editMajors.length,
      note: 'Jurusan Aktif',
      description: 'Manajemen jurusan, kurikulum, dan biaya SPP',
      onClick: () => setActiveTab('majors')
    },
    {
      id: 'teachers',
      icon: Users,
      iconColor: '#a855f7',
      glowColor: '168, 85, 247',
      label: 'SDM Sekolah',
      title: 'Guru & Tenaga Kependidikan',
      value: teachers.length,
      note: 'Terdaftar Aktif',
      badge: `${teachers.length} Pengajar`,
      description: 'Direktori pendidik, mata pelajaran, dan jadwal',
      onClick: () => setActiveTab('teachers')
    },
    {
      id: 'siswa-aktif',
      icon: Users,
      iconColor: '#f97316',
      glowColor: '249, 115, 22',
      label: 'Siswa Aktif',
      title: 'Total Siswa Aktif',
      value: studentCount,
      note: 'Terdaftar di Sekolah',
      badge: studentCount > 0 ? `${studentCount} Siswa` : undefined,
      description: 'Data siswa yang aktif terdaftar di sekolah',
      onClick: () => setActiveTab('data-siswa')
    },
    {
      id: 'facilities',
      icon: Building2,
      iconColor: '#10b981',
      glowColor: '16, 185, 129',
      label: 'Sarpras',
      title: 'Fasilitas Sekolah',
      value: editFacilities.length,
      note: 'Sarana & Prasarana',
      description: 'Laboratorium, bengkel praktek, dan sarana ibadah',
      onClick: () => setActiveTab('facilities')
    }
  ], [editMajors.length, teachers.length, studentCount, editFacilities.length]);

  if (!isOpen) return null;

  if (contentLoading) {
    return (
      <div className="admin-cms-overlay cms-fullpage-wrapper dashboard-shell">
        <div className="cms-content-loading">
          <DashboardSkeleton cards={4} showHero={true} />
        </div>
      </div>
    );
  }

  const showNotification = (msg) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(''), 3500);
  };

  const PPDB_PAGE_SIZE = 10;
  const MSG_PAGE_SIZE = 6;

  // Catatan: blok ini berada setelah early-return, jadi TIDAK boleh memakai hook
  // (rules-of-hooks). Filternya murah, cukup dihitung langsung tiap render.
  const ppdbQuery = ppdbSearch.trim().toLowerCase();
  const ppdbFiltered = ppdbSubmissions.filter((sub) => {
    if (ppdbStatus && (sub.status || 'Baru').toLowerCase() !== ppdbStatus) return false;
    if (!ppdbQuery) return true;
    return [sub.fullName, sub.nisn, sub.majorName, sub.major, sub.schoolOrigin, sub.phone]
      .some((v) => (v || '').toLowerCase().includes(ppdbQuery));
  });

  const ppdbPageCount = Math.max(1, Math.ceil(ppdbFiltered.length / PPDB_PAGE_SIZE));
  const ppdbCurrentPage = Math.min(ppdbPage, ppdbPageCount);
  const ppdbPaged = ppdbFiltered.slice((ppdbCurrentPage - 1) * PPDB_PAGE_SIZE, ppdbCurrentPage * PPDB_PAGE_SIZE);

  const msgQuery = msgSearch.trim().toLowerCase();
  const msgFiltered = msgQuery
    ? contactMessages.filter((msg) => [msg.name, msg.category, msg.message, msg.email, msg.phone]
      .some((v) => (v || '').toLowerCase().includes(msgQuery)))
    : contactMessages;

  const msgPageCount = Math.max(1, Math.ceil(msgFiltered.length / MSG_PAGE_SIZE));
  const msgCurrentPage = Math.min(msgPage, msgPageCount);
  const msgPaged = msgFiltered.slice((msgCurrentPage - 1) * MSG_PAGE_SIZE, msgCurrentPage * MSG_PAGE_SIZE);

  
  const handleLogout = () => {
    setConfirmState({
      open: true,
      tone: 'logout',
      title: 'Keluar dari Panel Admin?',
      message: 'Sesi admin Anda akan diakhiri dan token akses dicabut. Anda perlu login kembali untuk mengelola konten.',
      confirmText: 'Keluar Sekarang',
      cancelText: 'Tetap di Sini',
      loading: false,
      extraDetails: null,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        if (onLogout) {
          onLogout();
        }
      },
    });
  };

  
  const handleSaveSchoolInfo = async () => {
    try {
      await updateSchoolInfo(editSchool);
      await updateProfileExtras(parseProfileTexts(editProfile));
      showNotification('Identitas & Profil Sekolah berhasil disimpan!');
    } catch (err) {
      showNotification('Gagal menyimpan identitas sekolah: ' + err.message);
    }
  };

  const handleSaveHero = async () => {
    try {
      await updateHero(editHero);
      showNotification('Hero beranda berhasil disimpan!');
    } catch (err) {
      showNotification('Gagal menyimpan hero: ' + err.message);
    }
  };

  const handleSaveAppearance = async () => {
    try {
      await updateAppearance(editAppearance);
      showNotification('Tampilan Navbar & Footer berhasil disimpan!');
    } catch (err) {
      showNotification('Gagal menyimpan tampilan: ' + err.message);
    }
  };

  const handleSaveCopy = async () => {
    try {
      await updateSectionCopy(editCopy);
      showNotification('Teks section beranda berhasil disimpan!');
    } catch (err) {
      showNotification('Gagal menyimpan teks section: ' + err.message);
    }
  };

  const updateCopyField = (section, field, value) => {
    setEditCopy((current) => ({
      ...current,
      [section]: { ...(current[section] || {}), [field]: value },
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEditAppearance({ ...editAppearance, logoUrl: '' });
    setUploading('branding');
    try {
      const url = await uploadImage('branding', file);
      setEditAppearance((current) => ({ ...current, logoUrl: url }));
      showNotification('Logo terunggah. Jangan lupa klik Simpan Perubahan.');
    } catch (err) {
      showNotification('Gagal mengunggah logo: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const handleProfileImage = (field) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(`profil:${field}`);
    try {
      const url = await uploadImage('branding', file);
      setEditProfile((current) => ({ ...current, [field]: url }));
      showNotification('Gambar terunggah. Klik Simpan Perubahan untuk menerapkan.');
    } catch (err) {
      showNotification('Gagal mengunggah gambar: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const handleHeroImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading('hero:background');
    try {
      const url = await uploadImage('hero', file);
      setEditHero((current) => ({ ...current, backgroundImage: url }));
      showNotification('Foto latar terunggah. Klik Simpan Perubahan untuk menerapkan.');
    } catch (err) {
      showNotification('Gagal mengunggah foto latar: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const updateFooterNavRow = (index, field, value) => {
    setEditAppearance((current) => {
      const rows = [...(current.footerNav || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...current, footerNav: rows };
    });
  };

  const addFooterNavRow = () => {
    setEditAppearance((current) => ({
      ...current,
      footerNav: [...(current.footerNav || []), { label: '', href: '#' }],
    }));
  };

  const removeFooterNavRow = (index) => {
    setEditAppearance((current) => ({
      ...current,
      footerNav: (current.footerNav || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveGaleri = async () => {
    try {
      await updateGallery(editGaleri);
      showNotification('Galeri kegiatan berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan galeri: ' + err.message);
    }
  };

  const handleAddGaleri = () => openCreate('galeri');

  const handleDeleteGaleri = async (idx) => {
    const target = editGaleri[idx];
    if (!target) return;
    if (!confirm(`Hapus "${target.title}" dari galeri? Barisnya dihapus permanen dari database.`)) return;
    try {
      await deleteGalleryItem(target.id);
      setEditGaleri((prev) => prev.filter((_, i) => i !== idx));
      showNotification('Foto galeri berhasil dihapus.');
    } catch (err) {
      alert('Gagal menghapus foto: ' + err.message);
    }
  };

  const handleGalleryPhoto = async (id, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(`galeri:${id}`);
    try {
      const url = await uploadImage('galeri', file);
      setEditGaleri((prev) => prev.map((x) => (x.id === id ? { ...x, image: url } : x)));
      showNotification('Foto galeri terunggah. Tekan Simpan Perubahan untuk menerapkan.');
    } catch (err) {
      showNotification('Gagal mengunggah foto galeri: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const updateMajorField = (field, value) => {
    setEditMajors((prev) => prev.map((m, i) => (i === selectedMajorIndex ? { ...m, [field]: value } : m)));
  };

  const handleSaveMajors = async () => {
    try {
      await updateMajors(editMajors);
      showNotification('Data Program Keahlian & Biaya SPP berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan jurusan: ' + err.message);
    }
  };

  const handleAddMajor = () => openCreate('major');

  const handleDeleteMajor = (idx) => {
    const target = editMajors[idx];
    if (!target?.dbId) {
      showNotification('Jurusan ini bukan data database, jadi tidak bisa dihapus.');
      return;
    }
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Program Keahlian?',
      message: `Hapus "${target?.name || target?.code || 'jurusan ini'}" dari database?`,
      confirmText: 'Hapus Jurusan',
      cancelText: 'Batal',
      loading: false,
      extraDetails: 'Pendaftar PPDB yang memilih jurusan ini akan kehilangan tautan jurusannya.',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        try {
          await deleteMajor(target.dbId);
          setEditMajors((prev) => prev.filter((m) => m.dbId !== target.dbId));
          setSelectedMajorIndex(0);
          setConfirmState((prev) => ({ ...prev, open: false, loading: false }));
          showNotification('Jurusan berhasil dihapus.');
        } catch (err) {
          setConfirmState((prev) => ({ ...prev, loading: false }));
          alert('Gagal menghapus jurusan: ' + err.message);
        }
      },
    });
  };

  const handleSaveEskul = async () => {
    try {
      await updateEskul(editEskul);
      showNotification('Data Ekstrakurikuler berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan eskul: ' + err.message);
    }
  };

  const handleSaveFacilities = async () => {
    try {
      await updateFacilities(editFacilities);
      showNotification('Data Fasilitas Sekolah berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan fasilitas: ' + err.message);
    }
  };

  const handleCreatePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !createModal) return;
    const bucket = CREATE_PHOTO_BUCKET[createModal.type];
    if (!bucket) return;
    setCreateModal((prev) => (prev ? { ...prev, uploading: true } : prev));
    try {
      const url = await uploadImage(bucket, file);
      setCreateModal((prev) => (
        prev ? { ...prev, uploading: false, form: { ...prev.form, image_url: url } } : prev
      ));
      showNotification('Foto terunggah. Tekan Simpan Data untuk menyimpan.');
    } catch (err) {
      setCreateModal((prev) => (prev ? { ...prev, uploading: false } : prev));
      alert('Gagal mengunggah foto: ' + err.message);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!createModal || createModal.saving || createModal.uploading) return;
    const { type, form } = createModal;
    const text = (value) => String(value ?? '').trim();

    if (type === 'major') {
      if (!text(form.kode) || !text(form.nama)) {
        alert('Kode dan nama program keahlian wajib diisi.');
        return;
      }
      const kode = text(form.kode).toUpperCase();
      if (editMajors.some((m) => String(m.code || '').toUpperCase() === kode)) {
        alert(`Kode jurusan "${kode}" sudah dipakai.`);
        return;
      }
    }
    if (type === 'eskul') {
      if (!text(form.nama)) {
        alert('Nama ekstrakurikuler wajib diisi.');
        return;
      }
      if (editEskul.some((item) => String(item.name || '').toLowerCase() === text(form.nama).toLowerCase())) {
        alert('Nama ekstrakurikuler itu sudah ada.');
        return;
      }
    }
    if (type === 'facility' && !text(form.judul)) {
      alert('Nama fasilitas wajib diisi.');
      return;
    }
    if (type === 'galeri' && !text(form.judul)) {
      alert('Judul foto wajib diisi.');
      return;
    }

    setCreateModal((prev) => (prev ? { ...prev, saving: true } : prev));

    try {
      if (type === 'major') {
        const row = await createMajor({
          kode: text(form.kode),
          nama: text(form.nama),
          tagline: text(form.tagline),
          deskripsi: text(form.deskripsi),
          biaya_pendaftaran: Number(form.biaya_pendaftaran) || 0,
          spp_bulanan: Number(form.spp_bulanan) || 0,
          foto_url: form.image_url || '',
          is_active: form.is_active !== false,
        });
        setSelectedMajorIndex(editMajors.length);
        setEditMajors((prev) => [...prev, row]);
        showNotification('Program keahlian baru berhasil ditambahkan!');
      } else if (type === 'eskul') {
        const row = await createEskul({
          nama: text(form.nama),
          kategori: text(form.kategori),
          image_url: form.image_url || '',
          deskripsi: text(form.deskripsi),
          jadwal: text(form.jadwal),
          pembina: text(form.pembina),
          prestasi: text(form.prestasi),
        });
        setSelectedEskulIndex(editEskul.length);
        setEditEskul((prev) => [...prev, row]);
        showNotification('Ekstrakurikuler baru berhasil ditambahkan!');
      } else if (type === 'facility') {
        const row = await createFacility({
          judul: text(form.judul),
          badge: text(form.badge),
          kategori: form.kategori || 'campus',
          image_url: form.image_url || '',
          specs: text(form.specs),
          deskripsi: text(form.deskripsi),
          sort_order: editFacilities.length + 1,
        });
        setSelectedFacIndex(editFacilities.length);
        setEditFacilities((prev) => [...prev, row]);
        showNotification('Fasilitas baru berhasil ditambahkan!');
      } else {
        const row = await createGalleryItem({
          judul: text(form.judul),
          kategori: text(form.kategori),
          tanggal: text(form.tanggal),
          deskripsi: text(form.deskripsi),
          image_url: form.image_url || '',
          sort_order: editGaleri.length + 1,
        });
        setEditGaleri((prev) => [...prev, {
          id: row.id,
          title: row.judul,
          category: row.kategori,
          date: row.tanggal,
          description: row.deskripsi,
          image: row.image_url || '',
          rotate: row.rotate ?? 0,
          is_active: row.is_active !== false,
        }]);
        showNotification('Foto galeri baru berhasil ditambahkan!');
      }

      setCreateModal(null);
      refresh().catch(() => {});
    } catch (err) {
      setCreateModal((prev) => (prev ? { ...prev, saving: false } : prev));
      alert('Gagal menambahkan data: ' + err.message);
    }
  };

  const handleEskulPhoto = async (targetIndex, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const eskulItem = editEskul[targetIndex];
    const uploadKey = `eskul:${eskulItem?.id || targetIndex}`;
    setUploading(uploadKey);
    try {
      const url = await uploadImage('eskul', file);
      setEditEskul((prev) =>
        prev.map((x, i) => (i === targetIndex || (eskulItem?.id && x.id === eskulItem.id) ? { ...x, image: url } : x))
      );
      showNotification('Foto eskul berhasil diunggah. Tekan Simpan Perubahan untuk menerapkan.');
    } catch (err) {
      alert('Gagal mengunggah foto eskul: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const handleFacilityPhoto = async (targetIndex, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fac = editFacilities[targetIndex];
    const uploadKey = `facility:${fac?.id || targetIndex}`;
    setUploading(uploadKey);
    try {
      const url = await uploadImage('fasilitas', file);
      setEditFacilities((prev) =>
        prev.map((x, i) => (i === targetIndex || (fac?.id && x.id === fac.id) ? { ...x, image: url } : x))
      );
      showNotification('Foto fasilitas berhasil diunggah. Tekan Simpan Perubahan untuk menerapkan.');
    } catch (err) {
      alert('Gagal mengunggah foto fasilitas: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const handleMajorPhoto = async (idx, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(`major:${idx}`);
    try {
      const url = await uploadImage('jurusan', file);
      setEditMajors((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, photo: url, image: url, facilityImage: url } : m))
      );
      showNotification('Foto jurusan berhasil diunggah. Tekan Simpan Perubahan untuk menerapkan.');
    } catch (err) {
      alert('Gagal mengunggah foto jurusan: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  
  const handleExportPpdbCsv = () => {
    if (ppdbSubmissions.length === 0) {
      alert('Belum ada data pendaftar.');
      return;
    }
    const headers = ['ID', 'Tanggal', 'Nama Lengkap', 'NISN', 'No WhatsApp', 'Asal Sekolah', 'Jurusan', 'Status'];
    const rows = ppdbSubmissions.map(s => [
      s.id,
      `"${s.date}"`,
      `"${s.fullName}"`,
      `"${s.nisn}"`,
      `"${s.phone}"`,
      `"${s.schoolOrigin}"`,
      `"${s.majorName || s.major}"`,
      `"${s.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data-pendaftar-ppdb-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const handlePpdbStatus = async (id, status) => {
    try {
      await updatePpdbStatus(id, status);
      showNotification('Status pendaftar PPDB diperbarui.');
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  const handleDeletePpdb = async (id, nama) => {
    if (!confirm(`Hapus pendaftaran PPDB atas nama ${nama}? Tindakan ini permanen.`)) return;
    try {
      await deletePpdbSubmission(id);
      showNotification('Pendaftar PPDB berhasil dihapus.');
    } catch (err) {
      alert('Gagal menghapus pendaftar: ' + err.message);
    }
  };

  const handleDeleteMessage = async (id, nama) => {
    if (!confirm(`Hapus pesan masuk dari ${nama}?`)) return;
    try {
      await deleteContactMessage(id);
      showNotification('Pesan masuk berhasil dihapus.');
    } catch (err) {
      alert('Gagal menghapus pesan: ' + err.message);
    }
  };

  
  const handleAddEskul = () => openCreate('eskul');

  const handleDeleteEskul = (idx) => {
    const target = editEskul[idx];
    if (!target) return;
    if (editEskul.length <= 1) {
      showNotification('Minimal harus ada 1 kegiatan ekstrakurikuler.');
      return;
    }
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Ekstrakurikuler?',
      message: `Hapus kegiatan ekstrakurikuler "${target?.name || 'ini'}"?`,
      confirmText: 'Hapus Eskul',
      cancelText: 'Batal',
      loading: false,
      extraDetails: null,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        try {
          await deleteEskul(target.id);
          setEditEskul((prev) => prev.filter((x) => x.id !== target.id));
          setSelectedEskulIndex(0);
          setConfirmState((prev) => ({ ...prev, open: false, loading: false }));
          showNotification('Ekstrakurikuler berhasil dihapus.');
        } catch (err) {
          setConfirmState((prev) => ({ ...prev, loading: false }));
          alert('Gagal menghapus eskul: ' + err.message);
        }
      },
    });
  };

  const handleAddFacility = () => openCreate('facility');

  const handleDeleteFacility = (idx) => {
    const target = editFacilities[idx];
    if (!target) return;
    if (editFacilities.length <= 1) {
      showNotification('Minimal harus ada 1 data fasilitas sekolah.');
      return;
    }
    setConfirmState({
      open: true,
      tone: 'danger',
      title: 'Hapus Fasilitas Sekolah?',
      message: `Hapus data fasilitas "${target?.title || target?.badge || 'ini'}"?`,
      confirmText: 'Hapus Fasilitas',
      cancelText: 'Batal',
      loading: false,
      extraDetails: null,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        try {
          await deleteFacility(target.id);
          setEditFacilities((prev) => prev.filter((x) => x.id !== target.id));
          setSelectedFacIndex(0);
          setConfirmState((prev) => ({ ...prev, open: false, loading: false }));
          showNotification('Fasilitas berhasil dihapus.');
        } catch (err) {
          setConfirmState((prev) => ({ ...prev, loading: false }));
          alert('Gagal menghapus fasilitas: ' + err.message);
        }
      },
    });
  };

  
  const filteredTeachers = teachers.filter(t => {
    const s = teacherSearch.toLowerCase();
    const matchSearch = (t.name || '').toLowerCase().includes(s) || 
      (t.role || '').toLowerCase().includes(s) ||
      (t.department || '').toLowerCase().includes(s);
    
    if (!matchSearch) return false;
    if (teacherDeptFilter === 'ALL') return true;
    return matchDeptFilter(t.department, teacherDeptFilter);
  });

  const totalTeacherPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE) || 1;
  const currentTeacherPage = Math.min(Math.max(1, teacherPage), totalTeacherPages);
  const startTeacherIdx = (currentTeacherPage - 1) * TEACHERS_PER_PAGE;
  const endTeacherIdx = Math.min(startTeacherIdx + TEACHERS_PER_PAGE, filteredTeachers.length);
  const paginatedTeachers = filteredTeachers.slice(startTeacherIdx, endTeacherIdx);



  const mobileTabBar = (
    <MobileBottomNav
      items={CMS_TABS.map((t) => ({
        id: t.key,
        label: t.label,
        icon: t.icon,
        active: activeTab === t.key,
        onClick: () => setActiveTab(t.key),
      }))}
      maxPerSlide={4}
      label="Navigasi panel admin"
    />
  );

  const createMeta = createModal ? CREATE_MODAL_META[createModal.type] : null;
  const CreateIcon = createMeta?.Icon;

  const createPhotoField = (label) => (
    <div className="form-group full-width">
      <label><Camera size={14} /> {label}</label>
      <div className="cms-photo-field">
        <div className="cms-photo-preview">
          {createModal.form.image_url ? (
            <img src={createModal.form.image_url} alt={label} />
          ) : (
            <span className="cms-photo-empty"><Camera size={22} /> Belum ada foto</span>
          )}
        </div>
        <div className="cms-photo-actions">
          <label className={`btn btn-outline btn-sm cms-upload-btn ${createModal.uploading ? 'is-disabled' : ''}`}>
            {createModal.uploading
              ? <Loader2 size={14} className="cms-spin" />
              : <Upload size={14} />}
            <span>{createModal.form.image_url ? 'Ganti Foto' : 'Unggah Foto'}</span>
            <input
              type="file"
              accept="image/*"
              className="cms-file-input"
              disabled={createModal.uploading}
              onChange={handleCreatePhoto}
            />
          </label>
          {createModal.form.image_url && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setCreateField('image_url', '')}
            >
              <Trash2 size={14} />
              <span>Hapus Foto</span>
            </button>
          )}
          <span className="cms-photo-hint">JPG/PNG/WEBP, maks. 5 MB.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`dashboard-shell admin-cms-overlay ${isFullPage ? 'cms-fullpage-wrapper' : ''} ${isHeaderHidden ? 'ps-header-hidden' : ''}`} onClick={onClose}>
      <div className={`admin-cms-modal ${isFullPage ? 'cms-fullpage-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        
        <div className="admin-cms-header">
          <div className="cms-traffic-lights" aria-hidden>
            <span className="tl tl-red" />
            <span className="tl tl-yellow" />
            <span className="tl tl-green" />
          </div>
          <div className="admin-cms-brand">
            <img src={appearance?.logoUrl || ''} alt="Logo SMK" className="cms-brand-logo" />
            <div>
              <h2 className="cms-title">ADMIN STUDIO CMS</h2>
              <span className="cms-sub">{schoolInfo.shortName || 'SMK Muhammadiyah 8 Medan'} &bull; Control Panel</span>
            </div>
          </div>

          <div className="admin-cms-top-actions">
            <button
              onClick={handleLogout}
              className="btn-cms-action btn-cms-danger"
              title="Keluar dari panel admin"
            >
              <LogOut size={15} />
              <span>Keluar</span>
            </button>

            <AnimatedThemeToggler
              theme={theme}
              onThemeChange={setTheme}
              className="cms-theme-toggle"
              aria-label="Ganti tema"
              title="Ganti tema terang/gelap"
            />

            <button onClick={onClose} className="cms-close-btn" aria-label="Tutup Panel">
              <X size={20} />
            </button>
          </div>
        </div>

        
        {statusNotification && (
          <div className="cms-toast-notification">
            <CheckCircle2 size={18} />
            <span>{statusNotification}</span>
          </div>
        )}

        
          <div className="admin-cms-layout">
            
            
            {/* SIDEBAR CMS */}
            <aside className="cms-sidebar ps-sidebar" ref={sidebarRef}>
              <nav className="cms-nav-list">
                {CMS_TAB_GROUPS.map((group, groupIdx) => (
                  <React.Fragment key={groupIdx}>
                    {groupIdx > 0 && <div className="cms-nav-divider" aria-hidden="true" />}
                    <div className="cms-nav-group">
                      {group.map((t) => {
                        const Icon = t.icon;
                        let badgeCount = null;
                        if (t.key === 'teachers') badgeCount = teachers.length;
                        if (t.key === 'eskul') badgeCount = editEskul.length;
                        if (t.key === 'facilities') badgeCount = editFacilities.length;
                        if (t.key === 'messages' && contactMessages.length > 0) badgeCount = contactMessages.length;

                        return (
                          <button
                            key={t.key}
                            className={`cms-nav-item ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                          >
                            <Icon size={21} />
                            <span>{t.label} {badgeCount !== null ? `(${badgeCount})` : ''}</span>
                            {badgeCount !== null && t.key === 'messages' && (
                              <span className="cms-count-badge">{badgeCount}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </nav>
              {sidebarMore.visible && (
                <button
                  type="button"
                  className="cms-sidebar-more"
                  onClick={scrollSidebarToNext}
                  title="Masih ada menu lagi di bawah — klik untuk menggulir"
                  aria-label="Gulir sidebar ke menu berikutnya"
                >
                  <ChevronDown size={16} />
                  <span>{sidebarMore.count > 0 ? `${sidebarMore.count} menu lagi` : 'Menu lainnya'}</span>
                </button>
              )}
            </aside>

            {/* Area Konten Utama */}
            <main className="cms-main-content" ref={contentRevealRef}>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="cms-panel animate-fade-in">
                  
                  {/* Title Strip standar persis semua menu lain */}
                  <div className="panel-title-strip">
                    <div>
                      <h3>Ringkasan &amp; Statistik</h3>
                      <p>Pantau seluruh data sekolah, akun terdaftar, trafik pengunjung, serta aktivitas sistem dalam satu tampilan.</p>
                    </div>
                  </div>
                  
                  {/* Hero banner ringkasan */}
                  <section className="siswa-hero-banner">
                    <div className="siswa-hero-text">
                      <div className="siswa-live-tag">
                        <span className="pulse-dot" />
                        <span>PANEL KONTROL CMS &bull; ADMIN STUDIO</span>
                      </div>
                      <h1 className="siswa-hero-title">
                        Assalamu'alaikum, <span className="text-orange">Administrator</span>
                      </h1>
                      <p className="siswa-hero-desc">
                        Pantau seluruh data sekolah, direktori guru, jurusan, fasilitas sekolah,
                        pendaftaran PPDB, dan status ujian dalam satu sistem kontrol terpadu.
                      </p>
                    </div>
                    <div className="siswa-hero-badge">
                      <ShieldCheck size={28} className="text-orange" />
                      <div>
                        <span className="badge-title">Super Administrator</span>
                        <span className="badge-nisn">{schoolInfo.shortName || 'SMK Muhammadiyah 8 Medan'}</span>
                      </div>
                    </div>
                  </section>

                  <div className="admin-kpi-grid">
                    {adminBentoItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="admin-kpi-card"
                          onClick={item.onClick}
                        >
                          <span className="admin-kpi-card__top">
                            <span className="admin-kpi-card__icon">
                              <Icon size={22} />
                            </span>
                            <span className="admin-kpi-card__label">{item.label}</span>
                            {item.badge && (
                              <span className="admin-kpi-card__badge">{item.badge}</span>
                            )}
                          </span>
                          <span className="admin-kpi-card__value">{item.value}</span>
                          <span className="admin-kpi-card__note">{item.note}</span>
                          <span className="admin-kpi-card__title">{item.title}</span>
                          <span className="admin-kpi-card__desc">{item.description}</span>
                          <span className="admin-kpi-card__cta">
                            Kelola
                            <ChevronRight size={14} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ROW 3 — Identitas Sekolah & Pesan Masuk Terbaru berdampingan */}
                  <div className="cms-overview-grid mt-4">
                    <div className="cms-info-card">
                      <div className="card-header-with-badge">
                        <h4>Identitas Sekolah</h4>
                        <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('school')}><Edit3 size={14} /><span>Ubah</span></button>
                      </div>
                      <div className="cms-info-list">
                        <div className="cms-info-row"><span>Nama</span><strong>{editSchool.name || '-'}</strong></div>
                        <div className="cms-info-row"><span>Singkatan</span><strong>{editSchool.shortName || '-'}</strong></div>
                        <div className="cms-info-row"><span>NPSN</span><strong>{editSchool.npsn || '-'}</strong></div>
                        <div className="cms-info-row"><span>Akreditasi</span><strong>{editSchool.accreditation || '-'}</strong></div>
                        <div className="cms-info-row"><span>Hotline</span><strong>{editSchool.hotline || '-'}</strong></div>
                        <div className="cms-info-row"><span>Email</span><strong>{editSchool.email || '-'}</strong></div>
                      </div>
                    </div>

                    <div className="cms-info-card">
                      <div className="card-header-with-badge">
                        <h4>Pesan Masuk Terbaru</h4>
                        <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('messages')}><ExternalLink size={14} /><span>Lihat Semua</span></button>
                      </div>
                      {contactMessages.length === 0 ? (
                        <div className="cms-empty-mini">Belum ada pesan masuk.</div>
                      ) : (
                        <ul className="cms-mini-list">
                          {contactMessages.slice(-5).reverse().map((msg) => (
                            <li key={msg.id} className="cms-mini-item">
                              <div className="cms-mini-avatar is-mail"><Mail size={16} /></div>
                              <div className="cms-mini-body">
                                <strong>{msg.name}</strong>
                                <span>{msg.message}</span>
                              </div>
                              <span className="cms-mini-tag">{msg.category || 'Umum'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <AdminAnalytics embedded />
                </div>
              )}

              {activeTab === 'hero' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Hero Beranda Website</h3>
                      <p>Atur teks utama, tombol CTA, kartu statistik, tagline, dan foto latar hero di halaman beranda.</p>
                    </div>
                    <button onClick={handleSaveHero} className="btn btn-primary btn-save">
                      <Save size={16} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>

                  <div className="cms-sub-cards-stack mt-4">
                    {/* Sub-Card 1: Teks Utama & CTA */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Sparkles size={18} />
                          <span>Teks Utama & Tombol CTA</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Judul besar terdiri dari 3 baris; baris tengah ditampilkan dengan aksen warna.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group full-width">
                          <label>Label Kecil (Eyebrow)</label>
                          <input
                            type="text"
                            value={editHero.eyebrow || ''}
                            onChange={(e) => setEditHero({ ...editHero, eyebrow: e.target.value })}
                            placeholder="Contoh: SMK Pusat Keunggulan"
                          />
                        </div>

                        <div className="form-group">
                          <label>Judul Baris 1</label>
                          <input
                            type="text"
                            value={editHero.titleLine1 || ''}
                            onChange={(e) => setEditHero({ ...editHero, titleLine1: e.target.value })}
                            placeholder="Contoh: Tempat Tumbuhnya"
                          />
                        </div>

                        <div className="form-group">
                          <label>Judul Baris 2 (Aksen Warna)</label>
                          <input
                            type="text"
                            value={editHero.titleAccent || ''}
                            onChange={(e) => setEditHero({ ...editHero, titleAccent: e.target.value })}
                            placeholder="Contoh: Generasi Hebat"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Judul Baris 3</label>
                          <input
                            type="text"
                            value={editHero.titleLine2 || ''}
                            onChange={(e) => setEditHero({ ...editHero, titleLine2: e.target.value })}
                            placeholder="Contoh: Masa Depan"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Deskripsi Hero</label>
                          <textarea
                            rows="3"
                            value={editHero.desc || ''}
                            onChange={(e) => setEditHero({ ...editHero, desc: e.target.value })}
                            placeholder="Deskripsi singkat sekolah di bawah judul..."
                          />
                        </div>

                        <div className="form-group">
                          <label>Teks Tombol CTA (PPDB)</label>
                          <input
                            type="text"
                            value={editHero.ctaLabel || ''}
                            onChange={(e) => setEditHero({ ...editHero, ctaLabel: e.target.value })}
                            placeholder="Contoh: Daftar PPDB 2026"
                          />
                        </div>

                        <div className="form-group">
                          <label>Teks Tombol Video (pisahkan baris dengan Enter)</label>
                          <textarea
                            rows="2"
                            value={editHero.videoLabel || ''}
                            onChange={(e) => setEditHero({ ...editHero, videoLabel: e.target.value })}
                            placeholder={'Contoh:\nTonton\nVideo Profil'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 2: Statistik & Tagline */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Layers size={18} />
                          <span>Kartu Statistik & Tagline Tulisan Tangan</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Tiga kartu statistik di bawah CTA, plus kata-kata tagline dekoratif di sisi kanan hero.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        {(editHero.stats || []).map((stat, i) => (
                          <React.Fragment key={i}>
                            <div className="form-group">
                              <label>Statistik {i + 1} — Nilai</label>
                              <input
                                type="text"
                                value={stat.value || ''}
                                onChange={(e) => {
                                  const stats = [...editHero.stats];
                                  stats[i] = { ...stats[i], value: e.target.value };
                                  setEditHero({ ...editHero, stats });
                                }}
                                placeholder="Contoh: 4"
                              />
                            </div>
                            <div className="form-group">
                              <label>Statistik {i + 1} — Label</label>
                              <input
                                type="text"
                                value={stat.label || ''}
                                onChange={(e) => {
                                  const stats = [...editHero.stats];
                                  stats[i] = { ...stats[i], label: e.target.value };
                                  setEditHero({ ...editHero, stats });
                                }}
                                placeholder="Contoh: Program Keahlian"
                              />
                            </div>
                          </React.Fragment>
                        ))}

                        {(editHero.scriptWords || []).map((word, i) => (
                          <div className="form-group" key={i}>
                            <label>Tagline Kata {i + 1}{i === 1 ? ' (bergaris bawah)' : ''}</label>
                            <input
                              type="text"
                              value={word}
                              onChange={(e) => {
                                const scriptWords = [...editHero.scriptWords];
                                scriptWords[i] = e.target.value;
                                setEditHero({ ...editHero, scriptWords });
                              }}
                              placeholder="Contoh: Cerdas,"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sub-Card 3: Foto Latar */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <ExternalLink size={18} />
                          <span>Foto Latar Hero</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Unggah foto latar hero. Kosongkan untuk memakai foto bawaan (/images/hero-bg.jpg).
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <ProfileImageField
                          label="Foto Latar Hero"
                          value={editHero.backgroundImage}
                          emptyText="Pakai foto bawaan"
                          busy={uploading === 'hero:background'}
                          onChange={(url) => setEditHero({ ...editHero, backgroundImage: url })}
                          onPick={handleHeroImage}
                          hint="Disarankan rasio landscape lebar (mis. 1920x1080). JPG/PNG/WEBP, maks. 5 MB. Hapus untuk memakai foto bawaan situs."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'school' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Identitas, Profil & Kontak Resmi Sekolah</h3>
                      <p>Pembaruan data otomatis terhubung ke Navbar, Hero Banner, Bagian Profil, Kontak, dan Footer portal.</p>
                    </div>
                    <button onClick={handleSaveSchoolInfo} className="btn btn-primary btn-save">
                      <Save size={16} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>

                  <div className="cms-sub-cards-stack mt-4">
                    {/* Sub-Card 1: Legalitas & Identitas */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Building2 size={18} />
                          <span>Identitas Pokok & Akreditasi</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Informasi legalitas institusi, nama resmi sekolah, dan predikat akreditasi nasional.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group">
                          <label>Nama Lengkap Sekolah</label>
                          <input 
                            type="text" 
                            value={editSchool.name || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, name: e.target.value })}
                            placeholder="Contoh: SMK Muhammadiyah 8 Medan"
                          />
                        </div>

                        <div className="form-group">
                          <label>Nama Singkatan</label>
                          <input 
                            type="text" 
                            value={editSchool.shortName || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, shortName: e.target.value })}
                            placeholder="Contoh: SMK MAPAN"
                          />
                        </div>

                        <div className="form-group">
                          <label>Predikat Sekolah</label>
                          <input 
                            type="text" 
                            value={editSchool.predicate || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, predicate: e.target.value })}
                            placeholder="Contoh: Pusat Keunggulan Vokasi"
                          />
                        </div>

                        <div className="form-group">
                          <label>Jenjang Akreditasi</label>
                          <input 
                            type="text" 
                            value={editSchool.accreditation || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, accreditation: e.target.value })}
                            placeholder="Contoh: Terakreditasi A (Unggul)"
                          />
                        </div>

                        <div className="form-group">
                          <label>Kurikulum yang Digunakan</label>
                          <input 
                            type="text" 
                            value={editSchool.curriculum || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, curriculum: e.target.value })}
                            placeholder="Contoh: Kurikulum Merdeka"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Nomor Pokok Sekolah Nasional (NPSN)</label>
                          <input 
                            type="text" 
                            value={editSchool.npsn || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, npsn: e.target.value })}
                            placeholder="Contoh: 10210877"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 2: Kontak Resmi & Operasional */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Phone size={18} />
                          <span>Kontak Resmi, Lokasi & Operasional</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Kanal komunikasi calon pendaftar, alamat fisik sekolah, dan jadwal pelayanan tata usaha.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group">
                          <label>Nomor WhatsApp Hotline</label>
                          <input 
                            type="text" 
                            value={editSchool.hotline || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, hotline: e.target.value })}
                            placeholder="Contoh: 0812-3456-7890"
                          />
                        </div>

                        <div className="form-group">
                          <label>WhatsApp Hotline (format angka)</label>
                          <input 
                            type="text" 
                            value={editSchool.hotlineRaw || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, hotlineRaw: e.target.value })}
                            placeholder="Contoh: 6281234567890"
                          />
                        </div>

                        <div className="form-group">
                          <label>WhatsApp Humas (untuk form kontak)</label>
                          <input 
                            type="text" 
                            value={editSchool.whatsapp || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, whatsapp: e.target.value })}
                            placeholder="Contoh: 6282165415890"
                          />
                        </div>

                        <div className="form-group">
                          <label>Telepon Kantor</label>
                          <input 
                            type="text" 
                            value={editSchool.phone || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, phone: e.target.value })}
                            placeholder="Contoh: (061) 8229601"
                          />
                        </div>

                        <div className="form-group">
                          <label>Email Resmi Institusi</label>
                          <input 
                            type="email" 
                            value={editSchool.email || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, email: e.target.value })}
                            placeholder="Contoh: info@smkmuh8medan.sch.id"
                          />
                        </div>

                        <div className="form-group">
                          <label>Instagram</label>
                          <input 
                            type="text" 
                            value={editSchool.instagram || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, instagram: e.target.value })}
                            placeholder="Contoh: officialsmkmapan"
                          />
                        </div>

                        <div className="form-group">
                          <label>NSS / Nomor Statistik Sekolah</label>
                          <input 
                            type="text" 
                            value={editSchool.nss || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, nss: e.target.value })}
                            placeholder="Contoh: 3344076007096"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Link Google Maps</label>
                          <input 
                            type="text" 
                            value={editSchool.mapsUrl || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, mapsUrl: e.target.value })}
                            placeholder="Contoh: https://maps.app.goo.gl/..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Jam Pelayanan & Operasional Sekolah</label>
                          <input 
                            type="text" 
                            value={editSchool.operatingHours || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, operatingHours: e.target.value })}
                            placeholder="Contoh: Senin – Jumat 07.15 – 16.00 WIB | Sabtu 07.15 – 13.00 WIB"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Alamat Lengkap Sekolah</label>
                          <textarea 
                            rows="2"
                            value={editSchool.address || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, address: e.target.value })}
                            placeholder="Contoh: Jl. Utama No. 8, Medan Kota, Sumatera Utara"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 3: Kepemimpinan, Visi & Slogan */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <ShieldCheck size={18} />
                          <span>Kepemimpinan, Slogan & Visi</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Profil kepala sekolah, arah visi institusional, dan slogan utama sekolah.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group">
                          <label>Nama Kepala Sekolah</label>
                          <input 
                            type="text" 
                            value={editSchool.principal || ''} 
                            onChange={(e) => setEditSchool({ ...editSchool, principal: e.target.value })}
                            placeholder="Nama Lengkap & Gelar Kepala Sekolah"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Kutipan Motivasi / Slogan Utama</label>
                          <textarea 
                            rows="2"
                            value={editSchool.quote?.text || ''} 
                            onChange={(e) => setEditSchool({ 
                              ...editSchool, 
                              quote: { ...(editSchool.quote || {}), text: e.target.value } 
                            })}
                            placeholder="Kutipan inspiratif sekolah..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Teks Sambutan Kepala Sekolah Lengkap</label>
                          <textarea 
                            rows="4"
                            value={editProfile.kepsekPesanText || ''} 
                            onChange={(e) => setEditProfile({ ...editProfile, kepsekPesanText: e.target.value })}
                            placeholder="Sambutan resmi kepala sekolah pada profil..."
                          />
                        </div>

                        <div className="form-group">
                          <label>Visi Sekolah</label>
                          <textarea 
                            rows="3"
                            value={editProfile.visi || ''} 
                            onChange={(e) => setEditProfile({ ...editProfile, visi: e.target.value })}
                            placeholder="Visi utama institusi..."
                          />
                        </div>

                        <div className="form-group">
                          <label>Tujuan Institusional</label>
                          <textarea 
                            rows="3"
                            value={editProfile.tujuan || ''} 
                            onChange={(e) => setEditProfile({ ...editProfile, tujuan: e.target.value })}
                            placeholder="Tujuan pokok pendidikan dan vokasi..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card 4: Sejarah Landing (Profil Sekolah) */}
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Sparkles size={18} />
                          <span>Sejarah & Sambutan di Bagian Profil Beranda</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Isi tab Sejarah dan tab Kepala Sekolah pada bagian Profil di beranda. Paragraf: satu per baris; milestone: format `tahun|label`.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group full-width">
                          <label>Judul Sejarah</label>
                          <input
                            type="text"
                            value={editProfile.sejarahJudul || ''}
                            onChange={(e) => setEditProfile({ ...editProfile, sejarahJudul: e.target.value })}
                            placeholder="Contoh: Berdiri sejak 1990"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Paragraf Sejarah (satu paragraf per baris)</label>
                          <textarea
                            rows="4"
                            value={editProfile.sejarahParagrafText || ''}
                            onChange={(e) => setEditProfile({ ...editProfile, sejarahParagrafText: e.target.value })}
                            placeholder={'Paragraf pertama...\nParagraf kedua...'}
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Milestone Sejarah (satu per baris: tahun|label)</label>
                          <textarea
                            rows="3"
                            value={editProfile.sejarahMilestonesText || ''}
                            onChange={(e) => setEditProfile({ ...editProfile, sejarahMilestonesText: e.target.value })}
                            placeholder={'1990|Berdiri sebagai SMEA\n1995|Resmi mandiri'}
                          />
                        </div>

                        <ProfileImageField
                          label="Foto Gedung / Ilustrasi Sejarah"
                          value={editProfile.sejarahFoto}
                          emptyText="Pakai foto bawaan"
                          busy={uploading === 'profil:sejarahFoto'}
                          onChange={(url) => setEditProfile({ ...editProfile, sejarahFoto: url })}
                          onPick={handleProfileImage('sejarahFoto')}
                          hint="Disarankan rasio landscape (mis. 1200x800). JPG/PNG/WEBP, maks. 5 MB. Hapus untuk memakai foto bawaan situs."
                        />

                        <div className="form-group full-width">
                          <label>Kalimat Sambutan Singkat Kepala Sekolah</label>
                          <input
                            type="text"
                            value={editProfile.kepsekSambutan || ''}
                            onChange={(e) => setEditProfile({ ...editProfile, kepsekSambutan: e.target.value })}
                            placeholder="Contoh: Selamat datang di SMK Muhammadiyah 8 Medan, SMK Pusat Keunggulan."
                          />
                        </div>

                        <ProfileImageField
                          label="Kartu Kepala Sekolah — Sisi Depan"
                          value={editProfile.kartuDepan}
                          emptyText="Pakai kartu bawaan"
                          busy={uploading === 'profil:kartuDepan'}
                          onChange={(url) => setEditProfile({ ...editProfile, kartuDepan: url })}
                          onPick={handleProfileImage('kartuDepan')}
                          hint="Gambar potret (rasio sekitar 3:4, mis. 1024x1440) supaya pas di kartu 3D. Hapus untuk memakai kartu bawaan situs."
                        />

                        <ProfileImageField
                          label="Kartu Kepala Sekolah — Sisi Belakang"
                          value={editProfile.kartuBelakang}
                          emptyText="Pakai sisi belakang bawaan"
                          busy={uploading === 'profil:kartuBelakang'}
                          onChange={(url) => setEditProfile({ ...editProfile, kartuBelakang: url })}
                          onPick={handleProfileImage('kartuBelakang')}
                          hint="Muncul saat kartu dibalik. Gunakan rasio yang sama dengan sisi depan."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
              {activeTab === 'tampilan' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Tampilan Navbar &amp; Footer</h3>
                      <p>Merek, logo, label menu, dan tautan footer dapat diubah tanpa menyentuh kode.</p>
                    </div>
                    <button onClick={handleSaveAppearance} className="btn btn-primary btn-save">
                      <Save size={16} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>

                  <div className="cms-sub-cards-stack mt-4">
                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <LayoutGrid size={18} />
                          <span>Merek &amp; Logo</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Teks pada kiri navbar, tagline kecil di bawahnya, dan huruf besar di footer.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group">
                          <label>Nama Merek (navbar)</label>
                          <input
                            type="text"
                            value={editAppearance.brand || ''}
                            onChange={(e) => setEditAppearance({ ...editAppearance, brand: e.target.value })}
                            placeholder="Contoh: SMKM 8 MEDAN"
                          />
                        </div>

                        <div className="form-group">
                          <label>Teks Wordmark (footer)</label>
                          <input
                            type="text"
                            value={editAppearance.wordmark || ''}
                            onChange={(e) => setEditAppearance({ ...editAppearance, wordmark: e.target.value })}
                            placeholder="Contoh: SMKM 8 MEDAN"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Tagline Merek</label>
                          <input
                            type="text"
                            value={editAppearance.tagline || ''}
                            onChange={(e) => setEditAppearance({ ...editAppearance, tagline: e.target.value })}
                            placeholder="Contoh: Tunas Bangsa Berkarakter"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label><Camera size={14} /> Logo Sekolah</label>
                          <div className="cms-photo-field">
                            <div className="cms-photo-preview cms-photo-preview--logo">
                              {editAppearance.logoUrl ? (
                                <img src={editAppearance.logoUrl} alt="Logo sekolah" />
                              ) : (
                                <span className="cms-photo-empty"><Camera size={22} /> Pakai logo bawaan</span>
                              )}
                            </div>
                            <div className="cms-photo-actions">
                              <label className={`btn btn-outline btn-sm cms-upload-btn ${uploading === 'branding' ? 'is-disabled' : ''}`}>
                                {uploading === 'branding'
                                  ? <Loader2 size={14} className="cms-spin" />
                                  : <Upload size={14} />}
                                <span>{editAppearance.logoUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="cms-file-input"
                                  disabled={uploading === 'branding'}
                                  onChange={handleLogoUpload}
                                />
                              </label>
                              {editAppearance.logoUrl && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setEditAppearance({ ...editAppearance, logoUrl: '' })}
                                >
                                  <Trash2 size={14} />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="cms-photo-hint">
                            PNG/SVG transparan dengan latar kotak paling rapi. Maksimum 5 MB.
                            Hapus logo untuk kembali memakai logo bawaan situs.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Edit3 size={18} />
                          <span>Label Menu Navbar</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Hanya teks menu yang berubah. Tujuannya tetap ke bagian website yang sama.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        {Object.keys(editAppearance.menuLabels || {}).map((key) => (
                          <div className="form-group" key={key}>
                            <label>Menu: {key}</label>
                            <input
                              type="text"
                              value={editAppearance.menuLabels[key] || ''}
                              onChange={(e) => setEditAppearance({
                                ...editAppearance,
                                menuLabels: { ...editAppearance.menuLabels, [key]: e.target.value },
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="cms-sub-card">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <ExternalLink size={18} />
                          <span>Tautan Footer</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Daftar navigasi footer. Daftar Program Keahlian otomatis mengikuti data jurusan.
                        </div>
                      </div>

                      <div className="cms-footerlink-list mt-4">
                        {(editAppearance.footerNav || []).map((row, idx) => (
                          <div className="cms-footerlink-row" key={idx}>
                            <input
                              type="text"
                              className="inline-table-input"
                              value={row.label || ''}
                              placeholder="Teks tautan"
                              onChange={(e) => updateFooterNavRow(idx, 'label', e.target.value)}
                            />
                            <input
                              type="text"
                              className="inline-table-input"
                              value={row.href || ''}
                              placeholder="#profil"
                              onChange={(e) => updateFooterNavRow(idx, 'href', e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-icon-delete"
                              title="Hapus tautan"
                              onClick={() => removeFooterNavRow(idx)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={addFooterNavRow} className="btn btn-outline btn-sm mt-3">
                        <Plus size={14} />
                        <span>Tambah Tautan Footer</span>
                      </button>

                      <div className="cms-form-grid mt-4">
                        <div className="form-group">
                          <label>Link Kebijakan Privasi</label>
                          <input
                            type="text"
                            value={editAppearance.privacyUrl || ''}
                            onChange={(e) => setEditAppearance({ ...editAppearance, privacyUrl: e.target.value })}
                            placeholder="#"
                          />
                        </div>
                        <div className="form-group">
                          <label>Link Syarat &amp; Ketentuan</label>
                          <input
                            type="text"
                            value={editAppearance.termsUrl || ''}
                            onChange={(e) => setEditAppearance({ ...editAppearance, termsUrl: e.target.value })}
                            placeholder="#"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'copy' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Teks Judul &amp; Pembuka Section</h3>
                      <p>Seluruh teks dibaca beranda. Biarkan kosong untuk memakai teks bawaan situs.</p>
                    </div>
                    <button onClick={handleSaveCopy} className="btn btn-primary btn-save">
                      <Save size={16} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>

                  <div className="cms-sub-cards-stack mt-4">
                    {COPY_SECTIONS.map((section) => {
                      const row = editCopy[section.key] || {};
                      return (
                        <div className="cms-sub-card" key={section.key}>
                          <div className="cms-sub-card-header">
                            <div className="cms-sub-card-title">
                              <Edit3 size={18} />
                              <span>{section.label}</span>
                            </div>
                            <div className="cms-sub-card-desc">
                              Judul dirangkai dari tiga kolom: teks biasa, kata berwarna, teks biasa.
                              {section.accentHint ? ` ${section.accentHint}.` : ''}
                            </div>
                          </div>

                          <div className="cms-form-grid">
                            {section.key !== 'profil' && (
                              <div className="form-group full-width">
                                <label>Label Kecil (eyebrow)</label>
                                <input
                                  type="text"
                                  value={row.eyebrow || ''}
                                  onChange={(e) => updateCopyField(section.key, 'eyebrow', e.target.value)}
                                />
                              </div>
                            )}

                            <div className="form-group">
                              <label>Judul — awal</label>
                              <input
                                type="text"
                                value={row.titleStart || ''}
                                onChange={(e) => updateCopyField(section.key, 'titleStart', e.target.value)}
                              />
                            </div>

                            <div className="form-group">
                              <label>Judul — kata berwarna</label>
                              <input
                                type="text"
                                value={row.titleAccent || ''}
                                onChange={(e) => updateCopyField(section.key, 'titleAccent', e.target.value)}
                              />
                            </div>

                            <div className="form-group">
                              <label>Judul — akhir</label>
                              <input
                                type="text"
                                value={row.titleEnd || ''}
                                onChange={(e) => updateCopyField(section.key, 'titleEnd', e.target.value)}
                              />
                            </div>

                            {section.key === 'kontak' && (
                              <div className="form-group">
                                <label>Status kecil di samping paragraf</label>
                                <input
                                  type="text"
                                  value={row.status || ''}
                                  onChange={(e) => updateCopyField(section.key, 'status', e.target.value)}
                                />
                              </div>
                            )}

                            <div className="form-group full-width">
                              <label>Paragraf pembuka</label>
                              <textarea
                                rows="3"
                                value={row.lead || ''}
                                onChange={(e) => updateCopyField(section.key, 'lead', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'majors' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Kelola {editMajors.length} Program Keahlian & Biaya Pendidikan</h3>
                      <p>Atur deskripsi, kurikulum, rincian biaya SPP bulanan, dan uang pendaftaran.</p>
                    </div>
                    <div className="header-action-btns">
                      <button onClick={handleAddMajor} className="btn btn-outline">
                        <Plus size={16} />
                        <span>Tambah Jurusan</span>
                      </button>
                      <button onClick={handleSaveMajors} className="btn btn-primary btn-save">
                        <Save size={16} />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>

                  
                  <div className="majors-edit-selector">
                    {editMajors.map((m, idx) => (
                      <button 
                        key={m.id || idx}
                        className={`major-select-pill ${selectedMajorIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedMajorIndex(idx)}
                        title={m.isActive === false ? 'Belum tampil di website' : 'Tampil di website'}
                      >
                        <strong>{m.code || m.name}</strong>
                        {m.isActive === false && <span className="major-pill-flag">nonaktif</span>}
                      </button>
                    ))}
                  </div>

                  {editMajors[selectedMajorIndex] && (
                    <div className="major-editor-form mt-4">
                      <div className="cms-form-grid">
                        <div className="form-group">
                          <label>Nama Program Keahlian</label>
                          <input 
                            type="text" 
                            maxLength={MAJOR_TEXT_LIMITS.name}
                            value={editMajors[selectedMajorIndex].name || ''} 
                            onChange={(e) => {
                              const updated = [...editMajors];
                              updated[selectedMajorIndex].name = e.target.value;
                              setEditMajors(updated);
                            }}
                          />
                          <span className="form-helper">Maks. {MAJOR_TEXT_LIMITS.name} karakter agar judul kartu tetap rapi.</span>
                        </div>

                        <div className="form-group">
                          <label>Kode Singkat</label>
                          <input 
                            type="text" 
                            maxLength={MAJOR_TEXT_LIMITS.code}
                            value={editMajors[selectedMajorIndex].code || ''} 
                            onChange={(e) => {
                              const updated = [...editMajors];
                              updated[selectedMajorIndex].code = e.target.value;
                              setEditMajors(updated);
                            }}
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Tagline / Fokus Keahlian</label>
                          <input 
                            type="text" 
                            maxLength={MAJOR_TEXT_LIMITS.tagline}
                            value={editMajors[selectedMajorIndex].tagline || ''} 
                            onChange={(e) => {
                              const updated = [...editMajors];
                              updated[selectedMajorIndex].tagline = e.target.value;
                              setEditMajors(updated);
                            }}
                          />
                          <span className="form-helper">Maks. {MAJOR_TEXT_LIMITS.tagline} karakter. Teks lebih panjang dipotong di kartu beranda.</span>
                        </div>

                        <div className="form-group">
                          <label>Warna Kartu Jurusan</label>
                          <div className="cms-color-field">
                            <input
                              type="color"
                              value={safeHex(editMajors[selectedMajorIndex].color, '#0284C7')}
                              onChange={(e) => updateMajorField('color', e.target.value)}
                            />
                            <input
                              type="text"
                              value={editMajors[selectedMajorIndex].color || ''}
                              onChange={(e) => updateMajorField('color', e.target.value)}
                              placeholder="#0284C7"
                            />
                          </div>
                          <span className="form-helper">Dipakai kartu jurusan di beranda dan modal PPDB.</span>
                        </div>

                        <div className="form-group">
                          <label>Warna Latar Lembut</label>
                          <div className="cms-color-field">
                            <input
                              type="color"
                              value={safeHex(editMajors[selectedMajorIndex].colorSoft, '#E0F2FE')}
                              onChange={(e) => updateMajorField('colorSoft', e.target.value)}
                            />
                            <input
                              type="text"
                              value={editMajors[selectedMajorIndex].colorSoft || ''}
                              onChange={(e) => updateMajorField('colorSoft', e.target.value)}
                              placeholder="#E0F2FE"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Ikon Jurusan</label>
                          <select
                            value={MAJOR_ICON_OPTIONS.includes(editMajors[selectedMajorIndex].icon)
                              ? editMajors[selectedMajorIndex].icon
                              : 'Network'}
                            onChange={(e) => updateMajorField('icon', e.target.value)}
                          >
                            {MAJOR_ICON_OPTIONS.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label><Camera size={14} /> Foto Program Keahlian</label>
                          <div className="cms-photo-field">
                            <div className="cms-photo-preview">
                              {editMajors[selectedMajorIndex].photo ? (
                                <img
                                  src={editMajors[selectedMajorIndex].photo}
                                  alt={editMajors[selectedMajorIndex].name || 'Pratinjau jurusan'}
                                />
                              ) : editMajors[selectedMajorIndex].facilityImage ? (
                                <img
                                  src={editMajors[selectedMajorIndex].facilityImage}
                                  alt="Ilustrasi bawaan jurusan"
                                />
                              ) : (
                                <span className="cms-photo-empty"><Camera size={22} /> Belum ada foto</span>
                              )}
                            </div>
                            <div className="cms-photo-actions">
                              <label className={`btn btn-outline btn-sm cms-upload-btn ${uploading.startsWith('major:') ? 'is-disabled' : ''}`}>
                                {uploading.startsWith('major:')
                                  ? <Loader2 size={14} className="cms-spin" />
                                  : <Upload size={14} />}
                                <span>{editMajors[selectedMajorIndex]?.photo ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="cms-file-input"
                                  disabled={uploading.startsWith('major:')}
                                  onChange={(e) => handleMajorPhoto(selectedMajorIndex, e)}
                                />
                              </label>
                              {editMajors[selectedMajorIndex]?.photo && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setEditMajors((prev) =>
                                      prev.map((m, i) =>
                                        i === selectedMajorIndex ? { ...m, photo: '', image: '', facilityImage: '' } : m
                                      )
                                    );
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Hapus Foto</span>
                                </button>
                              )}
                              <span className="cms-photo-hint">
                                JPG/PNG/WEBP, maks. 5 MB. Foto disimpan di folder <code>public/uploads/jurusan</code>.
                                {!editMajors[selectedMajorIndex].photo && ' Saat ini kartu memakai ilustrasi bawaan jurusan.'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Biaya SPP Bulanan (Rp)</label>
                          <input 
                            type="number"
                            min="0"
                            value={editMajors[selectedMajorIndex].monthlySpp ?? 0} 
                            onChange={(e) => {
                              const value = Number(e.target.value) || 0;
                              const updated = [...editMajors];
                              updated[selectedMajorIndex].monthlySpp = value;
                              updated[selectedMajorIndex].sppFormatted = rupiah(value) + ' / bulan';
                              setEditMajors(updated);
                            }}
                          />
                          <span className="form-helper">{editMajors[selectedMajorIndex].sppFormatted}</span>
                        </div>

                        <div className="form-group">
                          <label>Biaya Uang Pendaftaran Awal (Rp)</label>
                          <input 
                            type="number"
                            min="0"
                            value={editMajors[selectedMajorIndex].registrationFee ?? 0} 
                            onChange={(e) => {
                              const value = Number(e.target.value) || 0;
                              const updated = [...editMajors];
                              updated[selectedMajorIndex].registrationFee = value;
                              updated[selectedMajorIndex].registrationFormatted = rupiah(value);
                              setEditMajors(updated);
                            }}
                          />
                          <span className="form-helper">{editMajors[selectedMajorIndex].registrationFormatted}</span>
                        </div>

                        <div className="form-group full-width">
                          <label>Deskripsi Lengkap Keahlian</label>
                          <textarea 
                            rows="3"
                            maxLength={MAJOR_TEXT_LIMITS.description}
                            value={editMajors[selectedMajorIndex].description || ''} 
                            onChange={(e) => {
                              const updated = [...editMajors];
                              updated[selectedMajorIndex].description = e.target.value;
                              setEditMajors(updated);
                            }}
                          />
                          <span className="form-helper">
                            Maks. {MAJOR_TEXT_LIMITS.description} karakter ({String(editMajors[selectedMajorIndex].description || '').length}/{MAJOR_TEXT_LIMITS.description}). Kartu beranda hanya menampilkan ±3 baris.
                          </span>
                        </div>

                        {MAJOR_LIST_FIELDS.map((field) => (
                          <div className="form-group full-width" key={field.key}>
                            <label>{field.label} — satu baris untuk satu item</label>
                            <textarea
                              rows="5"
                              value={toLines(editMajors[selectedMajorIndex][field.key])}
                              onChange={(e) => {
                                const updated = [...editMajors];
                                updated[selectedMajorIndex][field.key] = fromLines(e.target.value)
                                  .slice(0, field.maxItems)
                                  .map((line) => line.slice(0, MAJOR_LIST_ITEM_LIMIT));
                                setEditMajors(updated);
                              }}
                              placeholder={field.placeholder}
                            />
                            <span className="form-helper">
                              Maks. {field.maxItems} baris, masing-masing {MAJOR_LIST_ITEM_LIMIT} karakter. Baris selebihnya tidak ditampilkan di kartu.
                            </span>
                          </div>
                        ))}

                        <div className="form-group full-width">
                          <label className="cms-check-field">
                            <input
                              type="checkbox"
                              checked={editMajors[selectedMajorIndex].isActive !== false}
                              onChange={(e) => updateMajorField('isActive', e.target.checked)}
                            />
                            <span>Tampilkan di website (beranda, modal PPDB, navbar, footer)</span>
                          </label>
                          <span className="form-helper">
                            Matikan sementara saat data jurusan masih dirapikan agar kartu kosong tidak muncul di situs.
                          </span>
                        </div>

                        <div className="form-group full-width cms-major-danger">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDeleteMajor(selectedMajorIndex)}
                          >
                            <Trash2 size={14} />
                            <span>Hapus Jurusan Ini</span>
                          </button>
                          <span className="form-helper">
                            Menghapus permanen dari database. Pendaftar PPDB lama tetap tersimpan tanpa tautan jurusan.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              
              {activeTab === 'teachers' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Direktori Pendidik & Tenaga Kependidikan</h3>
                      <p>
                        Tampilan baca-saja. Tambah, ubah, atau hapus data guru lewat tab Data Guru —
                        perubahannya langsung tampil di bagian Tenaga Pendidik pada website.
                      </p>
                    </div>
                    <div className="header-action-btns">
                      <button onClick={() => setActiveTab('data-guru')} className="btn btn-primary">
                        <Users size={16} />
                        <span>Kelola di Data Guru</span>
                      </button>
                    </div>
                  </div>

                  {/* Teacher Filter & Toolbar */}
                  <div className="teacher-table-top mt-4">
                    <div className="cms-search-box">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari nama guru, mata pelajaran, atau departemen..."
                        value={teacherSearch}
                        onChange={(e) => {
                          setTeacherSearch(e.target.value);
                          setTeacherPage(1);
                        }}
                      />
                      {teacherSearch && (
                        <button 
                          type="button"
                          className="cms-search-clear-btn"
                          onClick={() => { setTeacherSearch(''); setTeacherPage(1); }}
                          title="Hapus pencarian"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="teacher-filter-pills">
                      {['ALL', 'TKJ', 'TSM', 'DKV', 'AKUNTANSI', 'UMUM'].map((dept) => {
                        const count = dept === 'ALL' 
                          ? teachers.length 
                          : teachers.filter(t => matchDeptFilter(t.department, dept)).length;
                        return (
                          <button
                            key={dept}
                            type="button"
                            className={`teacher-filter-pill ${teacherDeptFilter === dept ? 'active' : ''}`}
                            onClick={() => {
                              setTeacherDeptFilter(dept);
                              setTeacherPage(1);
                            }}
                          >
                            <span>{dept === 'ALL' ? 'Semua Dept' : dept}</span>
                            <span className="cms-pill-badge">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="table-status-bar">
                    <div className="table-status-left">
                      <Users size={16} className="table-status-icon" />
                      <span className="table-count-badge">
                        Menampilkan <strong>{filteredTeachers.length > 0 ? startTeacherIdx + 1 : 0} – {endTeacherIdx}</strong> dari <strong>{filteredTeachers.length}</strong> Tenaga Pendidik
                      </span>
                    </div>
                    {totalTeacherPages > 1 && (
                      <div className="table-status-right">
                        <span className="table-page-badge">
                          <Layers size={13} />
                          <span>Halaman <strong>{currentTeacherPage}</strong> dari <strong>{totalTeacherPages}</strong></span>
                        </span>
                        <span className="table-limit-badge">10 data per halaman</span>
                      </div>
                    )}
                  </div>

                  <div className="cms-table-wrapper">
                    <table className="cms-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '45px' }}>No</th>
                          <th>Nama Lengkap & Gelar</th>
                          <th>Jabatan / Mata Pelajaran</th>
                          <th>Departemen</th>
                          <th>Jam Kerja / Piket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-5">
                              <div className="empty-search-state">
                                <Users size={32} className="text-muted" />
                                <p style={{ marginTop: '8px', color: 'var(--text-soft)' }}>
                                  Tidak ada guru yang sesuai dengan pencarian atau filter "{teacherDeptFilter}".
                                </p>
                                <button 
                                  className="btn btn-outline btn-sm mt-3" 
                                  onClick={() => { setTeacherSearch(''); setTeacherDeptFilter('ALL'); setTeacherPage(1); }}
                                >
                                  Reset Pencarian
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedTeachers.map((t, idx) => {
                            const initial = (t.name || 'G').trim()[0].toUpperCase();
                            const rowNumber = startTeacherIdx + idx + 1;
                            return (
                              <tr key={t.id || idx}>
                                <td className="text-muted text-sm font-semibold">{rowNumber}</td>
                                <td>
                                  <div className="teacher-name-cell">
                                    <span className="teacher-avatar-static" aria-hidden="true">
                                      {t.image ? (
                                        <img src={t.image} alt="" />
                                      ) : (
                                        <span className="teacher-avatar-badge">{initial}</span>
                                      )}
                                    </span>
                                    <span className="font-medium">{t.name || '—'}</span>
                                  </div>
                                </td>
                                <td>{t.role || '—'}</td>
                                <td>{t.department || '—'}</td>
                                <td className="text-sm">{t.hours || '—'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Navigation for Teachers (10 per page) */}
                  {totalTeacherPages > 1 && (
                    <div className="cms-pagination-bar">
                      <button
                        type="button"
                        className="cms-pagination-btn"
                        onClick={() => setTeacherPage(p => Math.max(1, p - 1))}
                        disabled={currentTeacherPage === 1}
                        aria-label="Halaman Sebelumnya"
                      >
                        <ChevronLeft size={16} />
                        <span>Sebelumnya</span>
                      </button>

                      <div className="cms-pagination-pills">
                        {Array.from({ length: totalTeacherPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`cms-page-pill ${p === currentTeacherPage ? 'active' : ''}`}
                            onClick={() => setTeacherPage(p)}
                            aria-current={p === currentTeacherPage ? 'page' : undefined}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="cms-pagination-btn"
                        onClick={() => setTeacherPage(p => Math.min(totalTeacherPages, p + 1))}
                        disabled={currentTeacherPage === totalTeacherPages}
                        aria-label="Halaman Selanjutnya"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EKSTRAKURIKULER TAB */}
              {activeTab === 'eskul' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Kelola Ekstrakurikuler & Prestasi</h3>
                      <p>Atur jadwal latihan, nama pelatih/pembina, rincian prestasi, dan deskripsi kegiatan pembinaan bakat siswa.</p>
                    </div>
                    <div className="header-action-btns">
                      <button onClick={handleAddEskul} className="btn btn-outline">
                        <Plus size={16} />
                        <span>Tambah Eskul</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteEskul(selectedEskulIndex)} 
                        className="btn btn-outline"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                        <span>Hapus Eskul Ini</span>
                      </button>
                      <button onClick={handleSaveEskul} className="btn btn-primary btn-save">
                        <Save size={16} />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>

                  <div className="majors-edit-selector mt-4">
                    {editEskul.map((esk, idx) => (
                      <button 
                        key={esk.id || idx}
                        className={`major-select-pill ${selectedEskulIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedEskulIndex(idx)}
                      >
                        <Trophy size={14} />
                        <strong>{esk.name}</strong>
                      </button>
                    ))}
                  </div>

                  {editEskul[selectedEskulIndex] && (
                    <div className="cms-sub-card mt-4">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Trophy size={18} />
                          <span>Informasi & Pengaturan: {editEskul[selectedEskulIndex].name}</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Edit parameter jadwal latihan, pelatih, rekam jejak juara, dan gambaran umum kegiatan.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group">
                          <label>Nama Ekstrakurikuler</label>
                          <input 
                            type="text" 
                            value={editEskul[selectedEskulIndex].name || ''} 
                            onChange={(e) => {
                              const updated = [...editEskul];
                              updated[selectedEskulIndex].name = e.target.value;
                              setEditEskul(updated);
                            }}
                            placeholder="Contoh: Tapak Suci Putra Muhammadiyah"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label><Camera size={14} /> Foto Ekstrakurikuler</label>
                          <div className="cms-photo-field">
                            <div className="cms-photo-preview">
                              {editEskul[selectedEskulIndex].image ? (
                                <img
                                  src={editEskul[selectedEskulIndex].image}
                                  alt={editEskul[selectedEskulIndex].name || 'Foto eskul'}
                                />
                              ) : (
                                <span className="cms-photo-empty"><Camera size={22} /> Belum ada foto</span>
                              )}
                            </div>
                            <div className="cms-photo-actions">
                              <label className={`btn btn-outline btn-sm cms-upload-btn ${uploading.startsWith('eskul:') ? 'is-disabled' : ''}`}>
                                {uploading.startsWith('eskul:')
                                  ? <Loader2 size={14} className="cms-spin" />
                                  : <Upload size={14} />}
                                <span>{editEskul[selectedEskulIndex]?.image ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="cms-file-input"
                                  disabled={uploading.startsWith('eskul:')}
                                  onChange={(e) => handleEskulPhoto(selectedEskulIndex, e)}
                                />
                              </label>
                              {editEskul[selectedEskulIndex]?.image && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setEditEskul((prev) =>
                                      prev.map((x, i) => (i === selectedEskulIndex ? { ...x, image: '' } : x))
                                    );
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Hapus Foto</span>
                                </button>
                              )}
                              <span className="cms-photo-hint">JPG/PNG/WEBP, maks. 5 MB.</span>
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Kategori Kegiatan</label>
                          <input 
                            type="text" 
                            value={editEskul[selectedEskulIndex].category || ''} 
                            onChange={(e) => {
                              const updated = [...editEskul];
                              updated[selectedEskulIndex].category = e.target.value;
                              setEditEskul(updated);
                            }}
                            placeholder="Contoh: Bela Diri / Olahraga / Seni"
                          />
                        </div>

                        <div className="form-group">
                          <label>Jadwal Latihan Rutin</label>
                          <input 
                            type="text" 
                            value={editEskul[selectedEskulIndex].schedule || ''} 
                            onChange={(e) => {
                              const updated = [...editEskul];
                              updated[selectedEskulIndex].schedule = e.target.value;
                              setEditEskul(updated);
                            }}
                            placeholder="Contoh: Rabu & Sabtu 15.30 – 17.30 WIB"
                          />
                        </div>

                        <div className="form-group">
                          <label>Pembina / Pelatih Resmi</label>
                          <input 
                            type="text" 
                            value={editEskul[selectedEskulIndex].coach || ''} 
                            onChange={(e) => {
                              const updated = [...editEskul];
                              updated[selectedEskulIndex].coach = e.target.value;
                              setEditEskul(updated);
                            }}
                            placeholder="Nama Lengkap & Gelar Pembina"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Prestasi Unggulan (Pisahkan dengan koma)</label>
                          <input 
                            type="text" 
                            value={typeof editEskul[selectedEskulIndex].achievements === 'string' 
                              ? editEskul[selectedEskulIndex].achievements 
                              : (editEskul[selectedEskulIndex].achievements || []).join(', ')
                            } 
                            onChange={(e) => {
                              const updated = [...editEskul];
                              updated[selectedEskulIndex].achievements = e.target.value;
                              setEditEskul(updated);
                            }}
                            placeholder="Contoh: Juara 1 Kejurda Sumut 2024, Medali Emas O2SN Kota Medan"
                          />
                          <div className="form-helper mt-2">
                            {(typeof editEskul[selectedEskulIndex].achievements === 'string'
                              ? editEskul[selectedEskulIndex].achievements.split(',')
                              : (editEskul[selectedEskulIndex].achievements || [])
                            ).filter(Boolean).map((ach, i) => (
                              <span key={i} className="chip-tag">
                                <Award size={12} /> {ach.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label>Deskripsi Kegiatan</label>
                          <textarea 
                            rows="3"
                            value={editEskul[selectedEskulIndex].description || ''} 
                            onChange={(e) => {
                              const updated = [...editEskul];
                              updated[selectedEskulIndex].description = e.target.value;
                              setEditEskul(updated);
                            }}
                            placeholder="Penjelasan tujuan dan manfaat eskul..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FASILITAS SEKOLAH TAB */}
              {activeTab === 'facilities' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Kelola Fasilitas Sekolah & Laboratorium</h3>
                      <p>Perbarui inventaris ruang belajar, bengkel kerja kejuruan, masjid, laboratorium, dan sarana penunjang.</p>
                    </div>
                    <div className="header-action-btns">
                      <button onClick={handleAddFacility} className="btn btn-outline">
                        <Plus size={16} />
                        <span>Tambah Fasilitas</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteFacility(selectedFacIndex)} 
                        className="btn btn-outline"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                        <span>Hapus Fasilitas Ini</span>
                      </button>
                      <button onClick={handleSaveFacilities} className="btn btn-primary btn-save">
                        <Save size={16} />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>

                  <div className="majors-edit-selector mt-4">
                    {editFacilities.map((fac, idx) => (
                      <button 
                        key={fac.id || idx}
                        className={`major-select-pill ${selectedFacIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedFacIndex(idx)}
                      >
                        <Building2 size={14} />
                        <strong>{fac.badge || fac.title?.slice(0, 20)}</strong>
                      </button>
                    ))}
                  </div>

                  {editFacilities[selectedFacIndex] && (
                    <div className="cms-sub-card mt-4">
                      <div className="cms-sub-card-header">
                        <div className="cms-sub-card-title">
                          <Building2 size={18} />
                          <span>Detail Fasilitas: {editFacilities[selectedFacIndex].title}</span>
                        </div>
                        <div className="cms-sub-card-desc">
                          Edit nama ruangan, label badge, kategori fungsional, dan spesifikasi sarana penunjang.
                        </div>
                      </div>

                      <div className="cms-form-grid">
                        <div className="form-group full-width">
                          <label>Nama Lengkap Fasilitas</label>
                          <input 
                            type="text" 
                            value={editFacilities[selectedFacIndex].title || ''} 
                            onChange={(e) => {
                              const updated = [...editFacilities];
                              updated[selectedFacIndex].title = e.target.value;
                              setEditFacilities(updated);
                            }}
                            placeholder="Contoh: Lab Komputer Jaringan & Cloud Computing"
                          />
                        </div>

                        <div className="form-group">
                          <label>Badge Singkat</label>
                          <input 
                            type="text" 
                            value={editFacilities[selectedFacIndex].badge || ''} 
                            onChange={(e) => {
                              const updated = [...editFacilities];
                              updated[selectedFacIndex].badge = e.target.value;
                              setEditFacilities(updated);
                            }}
                            placeholder="Contoh: Lab Jaringan"
                          />
                        </div>

                        <div className="form-group full-width">
                          <label><Camera size={14} /> Foto Fasilitas</label>
                          <div className="cms-photo-field">
                            <div className="cms-photo-preview">
                              {editFacilities[selectedFacIndex].image ? (
                                <img
                                  src={editFacilities[selectedFacIndex].image}
                                  alt={editFacilities[selectedFacIndex].title || 'Foto fasilitas'}
                                />
                              ) : (
                                <span className="cms-photo-empty"><Camera size={22} /> Belum ada foto</span>
                              )}
                            </div>
                            <div className="cms-photo-actions">
                              <label className={`btn btn-outline btn-sm cms-upload-btn ${uploading.startsWith('facility:') ? 'is-disabled' : ''}`}>
                                {uploading.startsWith('facility:')
                                  ? <Loader2 size={14} className="cms-spin" />
                                  : <Upload size={14} />}
                                <span>{editFacilities[selectedFacIndex].image ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="cms-file-input"
                                  disabled={uploading.startsWith('facility:')}
                                  onChange={(e) => handleFacilityPhoto(selectedFacIndex, e)}
                                />
                              </label>
                              {editFacilities[selectedFacIndex].image && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    const updated = [...editFacilities];
                                    updated[selectedFacIndex].image = '';
                                    setEditFacilities(updated);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Hapus Foto</span>
                                </button>
                              )}
                              <span className="cms-photo-hint">JPG/PNG/WEBP, maks. 5 MB.</span>
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Kategori Fasilitas</label>
                          <select 
                            value={editFacilities[selectedFacIndex].category || 'campus'}
                            onChange={(e) => {
                              const updated = [...editFacilities];
                              updated[selectedFacIndex].category = e.target.value;
                              setEditFacilities(updated);
                            }}
                          >
                            <option value="lab">Laboratorium & Bengkel Vokasi</option>
                            <option value="campus">Gedung Sekolah & Ruang Kelas</option>
                            <option value="sports">Sarana Olahraga & Ekstrakurikuler</option>
                            <option value="worship">Masjid Sekolah & Pembinaan Karakter</option>
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label>Spesifikasi Teknis & Sarana (Pisahkan dengan koma)</label>
                          <input 
                            type="text" 
                            value={editFacilities[selectedFacIndex].specs || ''} 
                            onChange={(e) => {
                              const updated = [...editFacilities];
                              updated[selectedFacIndex].specs = e.target.value;
                              setEditFacilities(updated);
                            }}
                            placeholder="Contoh: 36 PC Core i7, Switch Cisco Managed, Fiber Optic 100 Mbps, AC 2 PK"
                          />
                          <div className="form-helper mt-2">
                            {(editFacilities[selectedFacIndex].specs || '').split(',').filter(Boolean).map((sp, i) => (
                              <span key={i} className="chip-tag">
                                <Sparkles size={12} /> {sp.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label>Tag / Fakta yang tampil di beranda — satu baris untuk satu chip</label>
                          <textarea
                            rows="3"
                            value={toLines(editFacilities[selectedFacIndex].tags)}
                            onChange={(e) => {
                              const updated = [...editFacilities];
                              updated[selectedFacIndex].tags = fromLines(e.target.value);
                              setEditFacilities(updated);
                            }}
                            placeholder="Luas 216 m2&#10;Kapasitas 36 siswa&#10;Terbangun 2019"
                          />
                          <div className="form-helper mt-2">
                            {(editFacilities[selectedFacIndex].tags || []).map((tag, i) => (
                              <span key={i} className="chip-tag"><Sparkles size={12} /> {tag}</span>
                            ))}
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label>Deskripsi Ruangan & Manfaat</label>
                          <textarea 
                            rows="3"
                            value={editFacilities[selectedFacIndex].description || ''} 
                            onChange={(e) => {
                              const updated = [...editFacilities];
                              updated[selectedFacIndex].description = e.target.value;
                              setEditFacilities(updated);
                            }}
                            placeholder="Uraian fungsi ruangan bagi kegiatan belajar siswa..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              
              {activeTab === 'galeri' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Galeri Kegiatan Beranda</h3>
                      <p>Kelola foto-foto pada bagian Galeri di beranda. Perubahan tersimpan otomatis ke server.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleAddGaleri} className="btn btn-secondary">
                        <Plus size={16} />
                        <span>Tambah Foto</span>
                      </button>
                      <button onClick={handleSaveGaleri} className="btn btn-primary btn-save">
                        <Save size={16} />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>

                  <div className="cms-sub-cards-stack mt-4">
                    {editGaleri.length === 0 && (
                      <div className="cms-sub-card">
                        <div className="cms-sub-card-desc">
                          Belum ada data galeri dari database (tabel masih kosong atau belum dibuat).
                          Landing page untuk saat ini menampilkan galeri bawaan.
                        </div>
                      </div>
                    )}

                    {editGaleri.map((item, idx) => (
                      <div className="cms-sub-card" key={item.id || idx}>
                        <div className="cms-sub-card-header">
                          <div className="cms-sub-card-title">
                            <Camera size={18} />
                            <span>{String(idx + 1).padStart(2, '0')} — {item.title || '(tanpa judul)'}</span>
                          </div>
                          <button onClick={() => handleDeleteGaleri(idx)} className="btn btn-outline btn-sm" title="Hapus foto">
                            <Trash2 size={14} />
                            <span>Hapus</span>
                          </button>
                        </div>

                        <div className="cms-form-grid">
                          <div className="form-group">
                            <label>Judul</label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const next = [...editGaleri];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setEditGaleri(next);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label>Kategori</label>
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => {
                                const next = [...editGaleri];
                                next[idx] = { ...next[idx], category: e.target.value };
                                setEditGaleri(next);
                              }}
                              placeholder="Kegiatan / Prestasi / Fasilitas"
                            />
                          </div>
                          <div className="form-group">
                            <label>Tanggal / Keterangan</label>
                            <input
                              type="text"
                              value={item.date || ''}
                              onChange={(e) => {
                                const next = [...editGaleri];
                                next[idx] = { ...next[idx], date: e.target.value };
                                setEditGaleri(next);
                              }}
                              placeholder="Contoh: 14 September 2023"
                            />
                          </div>
                          <div className="form-group">
                            <label>Miring (derajat, mis. -5)</label>
                            <input
                              type="number"
                              value={item.rotate ?? 0}
                              onChange={(e) => {
                                const next = [...editGaleri];
                                next[idx] = { ...next[idx], rotate: Number(e.target.value) || 0 };
                                setEditGaleri(next);
                              }}
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Deskripsi</label>
                            <textarea
                              rows="2"
                              value={item.description || ''}
                              onChange={(e) => {
                                const next = [...editGaleri];
                                next[idx] = { ...next[idx], description: e.target.value };
                                setEditGaleri(next);
                              }}
                            />
                          </div>
                          <div className="form-group full-width">
                            <label><Camera size={14} /> Foto Galeri</label>
                            <div className="cms-photo-field">
                              <div className="cms-photo-preview">
                                {item.image ? (
                                  <img src={item.image} alt={item.title || 'Pratinjau galeri'} />
                                ) : (
                                  <span className="cms-photo-empty"><Camera size={22} /> Belum ada foto</span>
                                )}
                              </div>
                              <div className="cms-photo-actions">
                                <label className={`btn btn-outline btn-sm cms-upload-btn ${uploading === `galeri:${item.id}` ? 'is-disabled' : ''}`}>
                                  {uploading === `galeri:${item.id}`
                                    ? <Loader2 size={14} className="cms-spin" />
                                    : <Upload size={14} />}
                                  <span>{item.image ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="cms-file-input"
                                    disabled={uploading === `galeri:${item.id}`}
                                    onChange={(e) => handleGalleryPhoto(item.id, e)}
                                  />
                                </label>
                                {item.image && (
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => {
                                      const next = [...editGaleri];
                                      next[idx] = { ...next[idx], image: '' };
                                      setEditGaleri(next);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Hapus Foto</span>
                                  </button>
                                )}
                                <span className="cms-photo-hint">JPG/PNG/WEBP, maks. 5 MB. Foto disimpan di folder <code>public/uploads/galeri</code>.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'data-guru' && (
                <AdminGuruManager onNotify={showNotification} onDataChange={refresh} />
              )}

              {activeTab === 'data-siswa' && (
                <AdminSiswaManager onNotify={showNotification} />
              )}

              {activeTab === 'mapel' && (
                <AdminMapelManager onNotify={showNotification} />
              )}

              {activeTab === 'data-kelas' && (
                <AdminKelasManager onNotify={showNotification} />
              )}

              {activeTab === 'jadwal' && (
                <AdminJadwalManager onNotify={showNotification} />
              )}

              {activeTab === 'akun' && (
                <AdminAccountManager onNotify={showNotification} />
              )}

              {activeTab === 'ppdb' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Daftar Calon Peserta Didik Baru (PPDB Online)</h3>
                      <p>Data calon siswa yang mendaftar melalui formulir website resmi.</p>
                    </div>
                    <button onClick={handleExportPpdbCsv} className="btn btn-outline">
                      <Download size={16} />
                      <span>Ekspor ke CSV / Excel</span>
                    </button>
                  </div>

                  <div className="mt-4" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="cms-search-box" style={{ flex: '1 1 320px', maxWidth: 420 }}>
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Cari nama / NISN / jurusan / asal sekolah / WA…"
                        value={ppdbSearch}
                        onChange={(e) => { setPpdbSearch(e.target.value); setPpdbPage(1); }}
                        aria-label="Cari pendaftar PPDB"
                      />
                    </div>
                    <select
                      className="apm-select"
                      style={{ maxWidth: 190 }}
                      value={ppdbStatus}
                      onChange={(e) => { setPpdbStatus(e.target.value); setPpdbPage(1); }}
                      title="Filter status pendaftar"
                    >
                      <option value="">Semua status</option>
                      <option value="baru">Baru</option>
                      <option value="diterima">Diterima</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                    <span className="apm-muted">{ppdbFiltered.length} dari {ppdbSubmissions.length} pendaftar</span>
                  </div>

                  <div className="cms-table-wrapper mt-4">
                    <table className="cms-data-table">
                      <thead>
                        <tr>
                          <th>Waktu</th>
                          <th>Nama Lengkap</th>
                          <th>NISN</th>
                          <th>Pilihan Jurusan</th>
                          <th>Asal Sekolah</th>
                          <th>WhatsApp</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ppdbFiltered.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              {ppdbSearch || ppdbStatus ? 'Tidak ada pendaftar yang cocok dengan filter.' : 'Belum ada data pendaftar baru.'}
                            </td>
                          </tr>
                        ) : (
                          ppdbPaged.map((sub) => (
                            <tr key={sub.id}>
                              <td className="text-muted text-xs">{sub.date}</td>
                              <td><strong>{sub.fullName}</strong></td>
                              <td>{sub.nisn || '-'}</td>
                              <td><span className="badge-major">{sub.majorName || sub.major}</span></td>
                              <td>{sub.schoolOrigin}</td>
                              <td>
                                <a 
                                  href={`https://wa.me/${sub.phone?.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="link-wa"
                                >
                                  <Phone size={13} />
                                  <span>{sub.phone}</span>
                                </a>
                              </td>
                              <td><span className="badge-status">{sub.status || 'Baru'}</span></td>
                              <td>
                                <div className="apm-row-actions">
                                  {sub._rawStatus !== 'diterima' && (
                                    <button
                                      onClick={() => handlePpdbStatus(sub.id, 'diterima')}
                                      className="apm-btn-small apm-btn-accept"
                                      title="Tandai diterima"
                                    >
                                      Terima
                                    </button>
                                  )}
                                  {sub._rawStatus !== 'ditolak' && (
                                    <button
                                      onClick={() => handlePpdbStatus(sub.id, 'ditolak')}
                                      className="apm-btn-small apm-btn-reject"
                                      title="Tandai ditolak"
                                    >
                                      Tolak
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeletePpdb(sub.id, sub.fullName)}
                                    className="btn-icon-delete"
                                    title="Hapus data pendaftar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    page={ppdbCurrentPage}
                    pageCount={ppdbPageCount}
                    onChange={setPpdbPage}
                    total={ppdbFiltered.length}
                    pageSize={PPDB_PAGE_SIZE}
                    label="pendaftar"
                  />
                </div>
              )}

              
              {activeTab === 'messages' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Kotak Pesan Masuk Pertanyaan & Konsultasi</h3>
                      <p>Pesan yang dikirim oleh calon wali murid atau pengunjung melalui section Kontak.</p>
                    </div>
                  </div>

                  <div className="cms-search-box mt-4" style={{ maxWidth: 420 }}>
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Cari nama / kategori / isi pesan / kontak…"
                      value={msgSearch}
                      onChange={(e) => { setMsgSearch(e.target.value); setMsgPage(1); }}
                      aria-label="Cari pesan masuk"
                    />
                  </div>

                  <div className="messages-stream mt-4">
                    {msgFiltered.length === 0 ? (
                      <div className="empty-stream-box">
                        <Mail size={32} className="text-muted" />
                        <p>{msgSearch ? 'Tidak ada pesan yang cocok dengan pencarian.' : 'Belum ada pesan masuk.'}</p>
                      </div>
                    ) : (
                      msgPaged.map((msg) => (
                        <div key={msg.id} className="message-card-item">
                          <div className="message-card-top">
                            <div>
                              <strong className="msg-sender">{msg.name}</strong>
                              <span className="msg-cat-badge">{msg.category}</span>
                            </div>
                            <span className="msg-date">{msg.date}</span>
                          </div>

                          <p className="msg-body">{msg.message}</p>

                          <div className="message-card-bottom">
                            <div className="msg-contacts">
                              {msg.email && <span>Email: {msg.email}</span>}
                              {msg.phone && <span>WA: {msg.phone}</span>}
                            </div>
                            <div className="msg-actions">
                              {msg.phone && (
                                <a 
                                  href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline btn-sm"
                                >
                                  <Phone size={13} />
                                  <span>Balas WhatsApp</span>
                                </a>
                              )}
                              <button 
                                onClick={() => handleDeleteMessage(msg.id, msg.name)}
                                className="btn-icon-delete"
                                title="Hapus pesan"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Pagination
                    page={msgCurrentPage}
                    pageCount={msgPageCount}
                    onChange={setMsgPage}
                    total={msgFiltered.length}
                    pageSize={MSG_PAGE_SIZE}
                    label="pesan"
                  />
                </div>
              )}

              {activeTab === 'presensi' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Rekap Presensi Siswa</h3>
                      <p>Pantau kehadiran seluruh kelas pada rentang tanggal tertentu.</p>
                    </div>
                  </div>
                  <AdminAttendance />
                </div>
              )}

              {activeTab === 'ujian' && (
                <div className="cms-panel animate-fade-in">
                  <div className="panel-title-strip">
                    <div>
                      <h3>Pengaturan Ujian (CBT)</h3>
                      <p>Kendalikan fitur CBT, persetujuan ujian dari guru, dan pengawasan sesi pengerjaan siswa.</p>
                    </div>
                  </div>
                  <AdminExamSettings hideHeader />
                </div>
              )}


            </main>
          </div>

        {mobileTabBar}
      </div>

      {/* Modal layer: klik di dalam modal tidak boleh ikut menutup dashboard */}
      <div onClick={(e) => e.stopPropagation()}>
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

        {/* Modal Tambah Data CMS */}
        {createModal && (
          <AppModal
            open
            size="md"
            title={createMeta.title}
            subtitle={createMeta.subtitle}
            icon={<CreateIcon size={18} />}
            onClose={closeCreate}
            footer={
              <>
                <button
                  type="button"
                  className="gm-btn-ghost"
                  onClick={closeCreate}
                  disabled={createModal.saving || createModal.uploading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="cms-create-form"
                  className="gm-btn-primary"
                  disabled={createModal.saving || createModal.uploading}
                >
                  {createModal.saving ? (
                    <>
                      <Loader2 size={16} className="gm-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Simpan Data</span>
                    </>
                  )}
                </button>
              </>
            }
          >
            <form id="cms-create-form" className="cms-form-grid" onSubmit={submitCreate}>
              {createModal.type === 'major' && (
                <>
                  <div className="form-group">
                    <label>Kode Singkat *</label>
                    <input
                      type="text"
                      maxLength={MAJOR_TEXT_LIMITS.code}
                      value={createModal.form.kode}
                      onChange={(e) => setCreateField('kode', e.target.value)}
                      placeholder="Contoh: TKJ"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Program Keahlian *</label>
                    <input
                      type="text"
                      maxLength={MAJOR_TEXT_LIMITS.name}
                      value={createModal.form.nama}
                      onChange={(e) => setCreateField('nama', e.target.value)}
                      placeholder="Contoh: Teknik Komputer & Jaringan"
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Tagline / Fokus Keahlian</label>
                    <input
                      type="text"
                      maxLength={MAJOR_TEXT_LIMITS.tagline}
                      value={createModal.form.tagline}
                      onChange={(e) => setCreateField('tagline', e.target.value)}
                      placeholder="Contoh: Jaringan, Cloud & Infrastruktur Digital"
                    />
                  </div>
                  <div className="form-group">
                    <label>Uang Pendaftaran Awal (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={createModal.form.biaya_pendaftaran}
                      onChange={(e) => setCreateField('biaya_pendaftaran', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>SPP Bulanan (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={createModal.form.spp_bulanan}
                      onChange={(e) => setCreateField('spp_bulanan', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Deskripsi Lengkap</label>
                    <textarea
                      rows="3"
                      maxLength={MAJOR_TEXT_LIMITS.description}
                      value={createModal.form.deskripsi}
                      onChange={(e) => setCreateField('deskripsi', e.target.value)}
                      placeholder="Uraian singkat kompetensi yang dipelajari siswa..."
                    />
                    <span className="form-helper">
                      Maks. {MAJOR_TEXT_LIMITS.description} karakter ({String(createModal.form.deskripsi || '').length}/{MAJOR_TEXT_LIMITS.description}).
                    </span>
                  </div>
                  <div className="form-group full-width">
                    <label className="cms-check-field">
                      <input
                        type="checkbox"
                        checked={createModal.form.is_active !== false}
                        onChange={(e) => setCreateField('is_active', e.target.checked)}
                      />
                      <span>Tampilkan di website (beranda, modal PPDB, navbar, footer)</span>
                    </label>
                  </div>
                  {createPhotoField('Foto Program Keahlian')}
                </>
              )}

              {createModal.type === 'eskul' && (
                <>
                  <div className="form-group">
                    <label>Nama Ekstrakurikuler *</label>
                    <input
                      type="text"
                      value={createModal.form.nama}
                      onChange={(e) => setCreateField('nama', e.target.value)}
                      placeholder="Contoh: Tapak Suci Putra Muhammadiyah"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori Kegiatan</label>
                    <input
                      type="text"
                      value={createModal.form.kategori}
                      onChange={(e) => setCreateField('kategori', e.target.value)}
                      placeholder="Contoh: Bela Diri / Olahraga / Seni"
                    />
                  </div>
                  <div className="form-group">
                    <label>Jadwal Latihan Rutin</label>
                    <input
                      type="text"
                      value={createModal.form.jadwal}
                      onChange={(e) => setCreateField('jadwal', e.target.value)}
                      placeholder="Contoh: Rabu & Sabtu 15.30 – 17.30 WIB"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pembina / Pelatih Resmi</label>
                    <input
                      type="text"
                      value={createModal.form.pembina}
                      onChange={(e) => setCreateField('pembina', e.target.value)}
                      placeholder="Nama Lengkap & Gelar Pembina"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Prestasi Unggulan (pisahkan dengan koma)</label>
                    <input
                      type="text"
                      value={createModal.form.prestasi}
                      onChange={(e) => setCreateField('prestasi', e.target.value)}
                      placeholder="Contoh: Juara 1 Kejurda Sumut 2024, Medali Emas O2SN Kota Medan"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Deskripsi Kegiatan</label>
                    <textarea
                      rows="3"
                      value={createModal.form.deskripsi}
                      onChange={(e) => setCreateField('deskripsi', e.target.value)}
                      placeholder="Penjelasan tujuan dan manfaat eskul..."
                    />
                  </div>
                  {createPhotoField('Foto Ekstrakurikuler')}
                </>
              )}

              {createModal.type === 'facility' && (
                <>
                  <div className="form-group full-width">
                    <label>Nama Lengkap Fasilitas *</label>
                    <input
                      type="text"
                      value={createModal.form.judul}
                      onChange={(e) => setCreateField('judul', e.target.value)}
                      placeholder="Contoh: Lab Komputer Jaringan & Cloud Computing"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Badge Singkat</label>
                    <input
                      type="text"
                      value={createModal.form.badge}
                      onChange={(e) => setCreateField('badge', e.target.value)}
                      placeholder="Contoh: Lab Jaringan"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori Fasilitas</label>
                    <select
                      value={createModal.form.kategori || 'campus'}
                      onChange={(e) => setCreateField('kategori', e.target.value)}
                    >
                      <option value="lab">Laboratorium & Bengkel Vokasi</option>
                      <option value="campus">Gedung Sekolah & Ruang Kelas</option>
                      <option value="sports">Sarana Olahraga & Ekstrakurikuler</option>
                      <option value="worship">Masjid Sekolah & Pembinaan Karakter</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Spesifikasi Teknis & Sarana (pisahkan dengan koma)</label>
                    <input
                      type="text"
                      value={createModal.form.specs}
                      onChange={(e) => setCreateField('specs', e.target.value)}
                      placeholder="Contoh: 36 PC Core i7, Switch Cisco Managed, Fiber Optic 100 Mbps"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Deskripsi Ruangan & Manfaat</label>
                    <textarea
                      rows="3"
                      value={createModal.form.deskripsi}
                      onChange={(e) => setCreateField('deskripsi', e.target.value)}
                      placeholder="Uraian fungsi ruangan bagi kegiatan belajar siswa..."
                    />
                  </div>
                  {createPhotoField('Foto Fasilitas')}
                </>
              )}

              {createModal.type === 'galeri' && (
                <>
                  <div className="form-group">
                    <label>Judul Foto *</label>
                    <input
                      type="text"
                      value={createModal.form.judul}
                      onChange={(e) => setCreateField('judul', e.target.value)}
                      placeholder="Contoh: Upacara Peringatan HUT RI"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <input
                      type="text"
                      value={createModal.form.kategori}
                      onChange={(e) => setCreateField('kategori', e.target.value)}
                      placeholder="Kegiatan / Prestasi / Fasilitas"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tanggal / Keterangan</label>
                    <input
                      type="text"
                      value={createModal.form.tanggal}
                      onChange={(e) => setCreateField('tanggal', e.target.value)}
                      placeholder="Contoh: 17 Agustus 2025"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Deskripsi</label>
                    <textarea
                      rows="2"
                      value={createModal.form.deskripsi}
                      onChange={(e) => setCreateField('deskripsi', e.target.value)}
                      placeholder="Keterangan singkat foto..."
                    />
                  </div>
                  {createPhotoField('Foto Galeri')}
                </>
              )}
            </form>
          </AppModal>
        )}
      </div>
    </div>
  );
}
