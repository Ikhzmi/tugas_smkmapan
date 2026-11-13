/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiGet, apiPost, apiPatch, apiPut, apiDelete, apiListAll, getToken, getStoredUser, onAuthChange,
} from '../lib/api';

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

// Data contoh (fallback) memakai id seperti "tkj"/"sulastri", bukan UUID.
// Jangan pernah kirim id itu ke kolom uuid Supabase.
const isDbId = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Kolom *_url di API divalidasi sebagai URL absolut; aset bundel lokal
// (path relatif) tidak boleh dikirim ke server.
const httpUrlOrNull = (value) =>
  (typeof value === 'string' && /^https?:\/\//i.test(value)) ? value : null;

const mapMajor = (m) => ({
  id: m.kode.toLowerCase(),
  dbId: m.id,
  code: m.kode,
  name: m.nama,
  tagline: m.tagline,
  color: m.warna,
  colorSoft: m.warna_soft,
  icon: m.ikon,
  registrationFee: m.biaya_pendaftaran,
  monthlySpp: m.spp_bulanan,
  registrationFormatted: rupiah(m.biaya_pendaftaran),
  sppFormatted: rupiah(m.spp_bulanan) + ' / bulan',
  image: m.foto_url || '',
  facilityImage: m.foto_url || '',
  photo: m.foto_url || '',
  description: m.deskripsi,
  curriculum: m.kurikulum || [],
  facilities: m.fasilitas || [],
  careers: m.karir || [],
  certifications: m.sertifikasi || [],
  isActive: m.is_active !== false,
});

const mapTeacher = (t) => ({
  id: t.id,
  name: t.nama,
  role: t.jabatan,
  department: t.department,
  image: t.foto_url || '',
  certifications: t.sertifikasi || [],
  bio: t.bio,
  hours: t.jam_kerja,
  email: t.email,
});

const mapEskul = (e) => ({
  id: e.id,
  name: e.nama,
  category: e.kategori,
  image: e.image_url || '',
  color: e.warna,
  colorSoft: e.warna_soft,
  description: e.deskripsi,
  schedule: e.jadwal,
  coach: e.pembina,
  achievements: e.prestasi,
  members: e.jumlah_anggota,
  maxMembers: e.max_anggota,
});

const mapFacility = (f) => ({
  id: f.id,
  title: f.judul,
  category: f.kategori,
  image: f.image_url || '',
  specs: f.specs,
  description: f.deskripsi,
  tags: f.tags || [],
  badge: f.badge,
});

const mapVideo = (v) => ({
  id: v.id,
  epNumber: v.episode_no ? `Ep. ${String(v.episode_no).padStart(2, '0')}` : '',
  title: v.judul,
  creator: v.kreator,
  duration: v.durasi_text,
  description: v.deskripsi,
  software: v.software || [],
  image: v.thumbnail_url || '',
});

const formatTanggal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const mapGallery = (g) => ({
  id: g.id,
  title: g.judul,
  category: g.kategori,
  date: formatTanggal(g.tanggal),
  description: g.deskripsi,
  image: g.image_url,
  rotate: Number(g.rotate) || 0,
  sort_order: g.sort_order,
  is_active: g.is_active,
});

const mapPpdb = (p) => ({
  id: p.id,
  date: p.created_at,
  fullName: p.nama_lengkap,
  nisn: p.nisn,
  phone: p.no_hp,
  schoolOrigin: p.asal_sekolah,
  major: p.majors?.kode?.toLowerCase(),
  majorName: p.majors?.nama,
  status:
    p.status === 'baru' ? 'Baru Masuk'
    : p.status === 'menunggu_verifikasi' ? 'Menunggu Verifikasi'
    : p.status === 'diterima' ? 'Diterima'
    : 'Ditolak',
  _rawStatus: p.status,
});

const mapMessage = (s) => ({
  id: s.id,
  date: s.created_at,
  name: s.nama,
  email: s.email,
  phone: s.no_hp,
  category: s.kategori,
  message: s.pesan,
});

export const HERO_DEFAULTS = {
  eyebrow: 'SMK Pusat Keunggulan',
  titleLine1: 'Tempat Tumbuhnya',
  titleAccent: 'Generasi Hebat',
  titleLine2: 'Masa Depan',
  desc: 'SMK Muhammadiyah 8 Medan hadir untuk mencetak lulusan yang cerdas, kreatif, religius, siap kerja, santun, mandiri, dan inovatif.',
  ctaLabel: 'Daftar PPDB 2026',
  videoLabel: 'Tonton\nVideo Profil',
  videoUrl: '/profil.mp4',
  stats: [
    { value: '4', label: 'Program Keahlian' },
    { value: 'Terakreditasi', label: 'Pendidikan Berkualitas' },
    { value: 'Siap Kerja', label: 'Masa Depan Lebih Baik' },
  ],
  scriptWords: ['Cerdas,', 'Kreatif,', 'Religius'],
  backgroundImage: '',
};

const ContentContext = createContext(null);

// Bentuk netral identitas sekolah (tanpa data contoh). Nilai asli selalu
// diambil dari site_settings key 'sekolah' di API.
const SCHOOL_INFO_DEFAULTS = {
  name: '',
  shortName: '',
  predicate: '',
  accreditation: '',
  curriculum: '',
  npsn: '',
  nss: '',
  hotline: '',
  hotlineRaw: '',
  phone: '',
  website: '',
  whatsapp: '',
  mapsUrl: '',
  instagram: '',
  logoUrl: '',
  email: '',
  address: '',
  operatingHours: '',
  principal: '',
  quote: { text: '', author: '' },
  stats: [],
};

// Identitas sekolah tersimpan utuh di site_settings key 'sekolah'.
// Key lama ('topbar', 'kontak', 'profil') hanya dibaca sebagai fallback
// supaya nilai yang sudah pernah disimpan sebelum ini tidak hilang.
function mapSchoolInfo(settings) {
  const s = settings.sekolah || {};
  const pick = (value, fallback) => (value == null || value === '' ? fallback : value);

  return {
    ...SCHOOL_INFO_DEFAULTS,
    name: pick(s.nama, SCHOOL_INFO_DEFAULTS.name),
    shortName: pick(s.singkatan, SCHOOL_INFO_DEFAULTS.shortName),
    predicate: pick(s.predikat, SCHOOL_INFO_DEFAULTS.predicate),
    accreditation: pick(s.akreditasi, SCHOOL_INFO_DEFAULTS.accreditation),
    curriculum: pick(s.kurikulum, SCHOOL_INFO_DEFAULTS.curriculum),
    npsn: pick(s.npsn, pick(settings.topbar?.npsn, SCHOOL_INFO_DEFAULTS.npsn)),
    nss: pick(s.nss, SCHOOL_INFO_DEFAULTS.nss),
    hotline: pick(s.hotline, pick(settings.topbar?.hotline, SCHOOL_INFO_DEFAULTS.hotline)),
    hotlineRaw: pick(s.hotline_raw, SCHOOL_INFO_DEFAULTS.hotlineRaw),
    phone: pick(s.telepon, SCHOOL_INFO_DEFAULTS.phone),
    email: pick(s.email, SCHOOL_INFO_DEFAULTS.email),
    website: pick(s.website, SCHOOL_INFO_DEFAULTS.website),
    address: pick(s.alamat, pick(settings.kontak?.alamat, SCHOOL_INFO_DEFAULTS.address)),
    mapsUrl: pick(s.maps_url, SCHOOL_INFO_DEFAULTS.mapsUrl),
    whatsapp: pick(s.whatsapp, SCHOOL_INFO_DEFAULTS.whatsapp),
    instagram: pick(s.instagram, SCHOOL_INFO_DEFAULTS.instagram),
    operatingHours: pick(s.jam_pelayanan, pick(settings.kontak?.jam_pelayanan, SCHOOL_INFO_DEFAULTS.operatingHours)),
    principal: pick(
      s.kepala_sekolah,
      pick(
        settings.profil?.kepala_sekolah === 'Luliadi, M.Pd' ? '' : settings.profil?.kepala_sekolah,
        SCHOOL_INFO_DEFAULTS.principal,
      ),
    ),
    logoUrl: pick(s.logo_url, SCHOOL_INFO_DEFAULTS.logoUrl),
    quote: {
      text: pick(s.kutipan, SCHOOL_INFO_DEFAULTS.quote.text),
      author: pick(s.kutipan_penulis, SCHOOL_INFO_DEFAULTS.quote.author),
    },
    principalPhoto: '',
  };
}

function schoolInfoToSettings(info) {
  const patch = {};
  const set = (key, value) => {
    if (value !== undefined) patch[key] = value ?? '';
  };

  set('nama', info.name);
  set('singkatan', info.shortName);
  set('predikat', info.predicate);
  set('akreditasi', info.accreditation);
  set('kurikulum', info.curriculum);
  set('npsn', info.npsn);
  set('nss', info.nss);
  set('hotline', info.hotline);
  set('hotline_raw', info.hotlineRaw);
  set('telepon', info.phone);
  set('email', info.email);
  set('website', info.website);
  set('alamat', info.address);
  set('maps_url', info.mapsUrl);
  set('whatsapp', info.whatsapp);
  set('instagram', info.instagram);
  set('jam_pelayanan', info.operatingHours);
  set('kepala_sekolah', info.principal);
  set('logo_url', info.logoUrl);
  if (info.quote) {
    if (info.quote.text !== undefined) patch.kutipan = info.quote.text ?? '';
    if (info.quote.author !== undefined) patch.kutipan_penulis = info.quote.author ?? '';
  }

  return patch;
}

const APPEARANCE_DEFAULTS = {
  brand: 'SMKM 8 MEDAN',
  wordmark: 'SMKM 8 MEDAN',
  tagline: 'Tunas Bangsa Berkarakter',
  logoUrl: '',
  menuLabels: {
    beranda: 'Beranda',
    profil: 'Profil',
    program: 'Program',
    sekolah: 'Sekolah',
    kontak: 'Kontak',
  },
  footerNav: [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Profil Sekolah', href: '#profil' },
    { label: 'Program Keahlian', href: '#program' },
    { label: 'Fasilitas', href: '#fasilitas' },
    { label: 'Ekstrakurikuler', href: '#ekstrakurikuler' },
    { label: 'Galeri', href: '#galeri' },
  ],
  privacyUrl: '#',
  termsUrl: '#',
};

function mapAppearance(settings) {
  const t = settings.tampilan || {};
  const d = APPEARANCE_DEFAULTS;
  const pick = (value, fallback) => (value == null || value === '' ? fallback : value);

  return {
    brand: pick(t.brand, d.brand),
    wordmark: pick(t.wordmark, d.wordmark),
    tagline: pick(t.tagline, d.tagline),
    logoUrl: pick(t.logo_url, d.logoUrl),
    menuLabels: { ...d.menuLabels, ...(t.menu_labels || {}) },
    footerNav: Array.isArray(t.footer_nav) && t.footer_nav.length ? t.footer_nav : d.footerNav,
    privacyUrl: pick(t.privacy_url, d.privacyUrl),
    termsUrl: pick(t.terms_url, d.termsUrl),
  };
}

const SECTION_IDS = ['profil', 'program', 'eskul', 'galeri', 'fasilitas', 'tenaga', 'kontak', 'ppdb'];

const SECTION_COPY_DEFAULTS = {
  profil: {
    eyebrow: '',
    titleStart: 'Profil Sekolah',
    titleAccent: '',
    titleEnd: '',
    lead: 'Sejarah, visi, dan identitas sekolah dalam satu tempat. Kenali lebih dekat sebelum melangkah bersama kami.',
  },
  program: {
    eyebrow: 'Program Keahlian',
    titleStart: 'Empat jurusan, satu arah:',
    titleAccent: 'siap kerja',
    titleEnd: '',
    lead: 'Pilih jalur yang paling sesuai dengan minatmu. Setiap program dibekali praktik industri dan guru produktif berpengalaman.',
  },
  eskul: {
    eyebrow: 'Ekstrakurikuler',
    titleStart: 'Ruang untuk',
    titleAccent: 'tumbuh',
    titleEnd: 'dan berprestasi',
    lead: 'Dari panggung musik hingga lapangan futsal, temukan kegiatan yang membuat minat dan bakatmu berkembang bersama teman-teman.',
  },
  galeri: {
    eyebrow: 'Galeri',
    titleStart: 'Jejak kegiatan,',
    titleAccent: 'cerita',
    titleEnd: 'yang hidup',
    lead: 'Kumpulan momen dari kelas, workshop, dan kegiatan sekolah — dari prestasi hingga keseharian.',
  },
  fasilitas: {
    eyebrow: 'Fasilitas Sekolah',
    titleStart: 'Ruang untuk bertumbuh,',
    titleAccent: 'fasilitas',
    titleEnd: 'untuk berkarya',
    lead: 'Dari masjid dan lapangan hingga laboratorium komputer — setiap ruang di SMK Muhammadiyah 8 Medan dirancang untuk mendukung belajar, praktik, dan pembinaan karakter siswa.',
  },
  tenaga: {
    eyebrow: 'Di balik setiap kelas',
    titleStart: 'Tenaga',
    titleAccent: 'Pendidik',
    titleEnd: '',
    lead: 'Semua guru yang ada di SMK Muhammadiyah 8 Medan ini adalah guru-guru yang telah berpengalaman dan profesional di bidangnya masing-masing.',
  },
  kontak: {
    eyebrow: 'Hubungi kami',
    titleStart: 'Ada yang bisa',
    titleAccent: 'kami bantu?',
    titleEnd: '',
    lead: 'Pertanyaan tentang pendaftaran, program keahlian, atau kunjungan sekolah? Sampaikan lewat kanal di bawah. Tim humas kami akan merespons pada hari sekolah.',
    status: 'Humas siap membantu',
  },
  ppdb: {
    eyebrow: 'PPDB T.A. 2026/2027 • SMK PUSAT KEUNGGULAN',
    titleStart: 'PRA',
    titleAccent: 'PENDAFTARAN',
    titleEnd: '',
    lead: 'Pilih jurusan vokasi impianmu dengan rincian biaya transparan dan terjangkau. Klik Daftar Sekarang untuk langsung konsultasi dan registrasi via WhatsApp resmi.',
  },
};

function mapSectionCopy(settings) {
  const stored = settings.copy || {};
  const result = {};
  for (const id of SECTION_IDS) {
    result[id] = { ...SECTION_COPY_DEFAULTS[id], ...(stored[id] || {}) };
  }
  return result;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState({
    schoolInfo: SCHOOL_INFO_DEFAULTS,
    appearance: APPEARANCE_DEFAULTS,
    sectionCopy: SECTION_COPY_DEFAULTS,
    profileExtras: {
      visi: '', misi: [], tujuan: '',
      sejarahJudul: '', sejarahParagraf: [], sejarahMilestones: [],
      kepsekSambutan: '', kepsekPesan: [],
      sejarahFoto: '', kartuDepan: '', kartuBelakang: '',
    },
    hero: HERO_DEFAULTS,
    majors: [],
    allMajors: [],
    teachers: [],
    eskul: [],
    facilities: [],
    galeri: [],
    showcase: [],
  });
  const [ppdbSubmissions, setPpdbSubmissions] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const isAdmin = !!getToken() && getStoredUser()?.role === 'admin';
    const list = (path, query) => apiListAll(path, query).catch(() => []);

    try {
      const [
        settings,
        majorsRows,
        teacherRows,
        eskulRows,
        facilityRows,
        videoRows,
        galleryRows,
      ] = await Promise.all([
        apiGet('/public/site').catch(() => ({})),
        list(isAdmin ? '/admin/majors' : '/public/majors'),
        list(isAdmin ? '/admin/teachers' : '/public/teachers'),
        list(isAdmin ? '/admin/eskul' : '/public/eskul'),
        list(isAdmin ? '/admin/facilities' : '/public/facilities'),
        list(isAdmin ? '/admin/videos' : '/public/videos', { category: 'showreel' }),
        list(isAdmin ? '/admin/gallery' : '/public/gallery'),
      ]);

      const schoolInfo = mapSchoolInfo(settings || {});
      const mappedTeachers = (teacherRows || [])
        .filter((t) => t.is_active !== false)
        .map(mapTeacher);

      // Jurusan non-aktif tetap dibutuhkan CMS supaya bisa ditampilkan lagi,
      // tetapi tidak boleh dipakai komponen landing page.
      const mappedMajors = (majorsRows || []).map(mapMajor);

      const showcaseRows = (videoRows || [])
        .filter((v) => v.kategori === 'showreel' && v.is_published !== false);

      setContent({
        schoolInfo,
        appearance: mapAppearance(settings || {}),
        sectionCopy: mapSectionCopy(settings || {}),
        profileExtras: {
          visi: settings.profil?.visi || '',
          misi: settings.profil?.misi || [],
          tujuan: settings.profil?.tujuan || '',
          sejarahJudul: settings.profil?.sejarah_judul || '',
          sejarahParagraf: settings.profil?.sejarah_paragraf || [],
          sejarahMilestones: settings.profil?.sejarah_milestones || [],
          kepsekSambutan: settings.profil?.kepsek_sambutan || '',
          kepsekPesan: settings.profil?.kepsek_pesan || [],
          sejarahFoto: settings.profil?.sejarah_foto || '',
          kartuDepan: settings.profil?.kartu_depan || '',
          kartuBelakang: settings.profil?.kartu_belakang || '',
        },
        hero: { ...HERO_DEFAULTS, ...(settings.hero || {}) },
        majors: mappedMajors.filter((m) => m.isActive !== false),
        allMajors: mappedMajors,
        teachers: mappedTeachers,
        eskul: (eskulRows || []).filter((e) => e.is_active !== false).map(mapEskul),
        facilities: (facilityRows || []).filter((f) => f.is_active !== false).map(mapFacility),
        galeri: (galleryRows || []).filter((g) => g.is_active !== false).map(mapGallery),
        showcase: showcaseRows.map(mapVideo),
      });

      // PPDB & pesan masuk hanya bisa dibaca admin.
      if (isAdmin) {
        const majorByKode = {};
        (majorsRows || []).forEach((m) => { majorByKode[m.id] = m; });
        const [ppdbRows, msgRows] = await Promise.all([
          list('/admin/ppdb'),
          list('/admin/suggestions'),
        ]);
        setPpdbSubmissions((ppdbRows || []).map((p) => mapPpdb({
          ...p,
          majors: majorByKode[p.major_id] || null,
        })));
        setContactMessages((msgRows || []).map(mapMessage));
      } else {
        setPpdbSubmissions([]);
        setContactMessages([]);
      }
    } catch (err) {
      console.warn('[ContentContext] Gagal memuat konten dari API:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(fetchAll); }, [fetchAll]);

  // PPDB & pesan masuk hanya bisa dibaca admin, jadi saat app dibuka
  // dalam keadaan anonim hasilnya kosong. Muat ulang tiap sesi berubah.
  useEffect(() => onAuthChange(() => { fetchAll(); }), [fetchAll]);

  const updateSiteSetting = async (key, patch) => {
    const settings = (await apiGet('/admin/site-settings').catch(() => ({}))) || {};
    const merged = { ...(settings[key] || {}), ...patch };
    await apiPut(`/admin/site-settings/${encodeURIComponent(key)}`, { value: merged });
    await fetchAll();
  };

  const updateSchoolInfo = async (info) => {
    await updateSiteSetting('sekolah', schoolInfoToSettings(info));
  };

  const updateProfileExtras = async (extras) => {
    const patch = {};
    if (extras.visi !== undefined) patch.visi = extras.visi;
    if (extras.misi !== undefined) patch.misi = extras.misi;
    if (extras.tujuan !== undefined) patch.tujuan = extras.tujuan;
    if (extras.principal) patch.kepala_sekolah = extras.principal;
    if (extras.sejarahJudul !== undefined) patch.sejarah_judul = extras.sejarahJudul;
    if (extras.sejarahParagraf !== undefined) patch.sejarah_paragraf = extras.sejarahParagraf;
    if (extras.sejarahMilestones !== undefined) patch.sejarah_milestones = extras.sejarahMilestones;
    if (extras.kepsekSambutan !== undefined) patch.kepsek_sambutan = extras.kepsekSambutan;
    if (extras.kepsekPesan !== undefined) patch.kepsek_pesan = extras.kepsekPesan;
    if (extras.sejarahFoto !== undefined) patch.sejarah_foto = extras.sejarahFoto;
    if (extras.kartuDepan !== undefined) patch.kartu_depan = extras.kartuDepan;
    if (extras.kartuBelakang !== undefined) patch.kartu_belakang = extras.kartuBelakang;
    await updateSiteSetting('profil', patch);
  };

  const updateHero = async (heroData) => {
    await updateSiteSetting('hero', { ...HERO_DEFAULTS, ...heroData });
  };

  const updateAppearance = async (data) => {
    await updateSiteSetting('tampilan', {
      brand: data.brand ?? '',
      wordmark: data.wordmark ?? '',
      tagline: data.tagline ?? '',
      logo_url: data.logoUrl ?? '',
      menu_labels: data.menuLabels ?? {},
      footer_nav: data.footerNav ?? [],
      privacy_url: data.privacyUrl ?? '#',
      terms_url: data.termsUrl ?? '#',
    });
  };

  const updateSectionCopy = async (copy) => {
    const payload = {};
    for (const id of SECTION_IDS) {
      const row = copy?.[id] || {};
      payload[id] = {
        eyebrow: row.eyebrow ?? '',
        titleStart: row.titleStart ?? '',
        titleAccent: row.titleAccent ?? '',
        titleEnd: row.titleEnd ?? '',
        lead: row.lead ?? '',
        ...(id === 'kontak' ? { status: row.status ?? '' } : {}),
      };
    }
    await updateSiteSetting('copy', payload);
  };

  const updateMajors = async (majors) => {
    for (const m of majors) {
      if (!isDbId(m.dbId)) continue;
      await apiPatch(`/admin/majors/${m.dbId}`, {
        kode: m.code,
        nama: m.name,
        tagline: m.tagline,
        biaya_pendaftaran: m.registrationFee,
        spp_bulanan: m.monthlySpp,
        deskripsi: m.description,
        kurikulum: m.curriculum,
        fasilitas: m.facilities,
        karir: m.careers,
        sertifikasi: m.certifications,
        warna: m.color,
        warna_soft: m.colorSoft,
        ikon: m.icon,
        is_active: m.isActive !== false,
        foto_url: httpUrlOrNull(m.photo) || httpUrlOrNull(m.image),
      });
    }
    await fetchAll();
  };

  const createMajor = async (data = {}) => {
    const row = await apiPost('/admin/majors', {
      kode: String(data.kode || '').toUpperCase(),
      nama: data.nama || 'Program Keahlian Baru',
      tagline: data.tagline || '',
      deskripsi: data.deskripsi || '',
      biaya_pendaftaran: data.biaya_pendaftaran ?? 0,
      spp_bulanan: data.spp_bulanan ?? 0,
      warna: data.warna || '#0284C7',
      warna_soft: data.warna_soft || '#E0F2FE',
      ikon: data.ikon || 'Network',
      foto_url: httpUrlOrNull(data.foto_url) || httpUrlOrNull(data.image_url),
      is_active: data.is_active === true,
    });
    return mapMajor(row);
  };

  const deleteMajor = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data jurusan ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await apiDelete(`/admin/majors/${id}`);
  };

  const updateTeachers = async (teachers) => {
    let saved = 0;
    for (const t of teachers) {
      if (!isDbId(t.id)) continue;
      await apiPatch(`/admin/teachers/${t.id}`, {
        nama: t.name,
        jabatan: t.role,
        department: t.department,
        bio: t.bio,
        sertifikasi: t.certifications,
        jam_kerja: t.hours,
        email: t.email,
        foto_url: httpUrlOrNull(t.image),
      });
      saved++;
    }
    if (saved === 0 && teachers.length > 0) {
      throw new Error('Data guru belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await fetchAll();
  };

  const eskulPayload = (e) => ({
    nama: e.name,
    kategori: e.category,
    image_url: httpUrlOrNull(e.image),
    warna: e.color || '#e55a00',
    warna_soft: e.colorSoft || '#fff7ed',
    deskripsi: e.description,
    jadwal: e.schedule,
    pembina: e.coach,
    prestasi: e.achievements,
    jumlah_anggota: e.members,
    max_anggota: e.maxMembers,
  });

  const updateEskul = async (list) => {
    for (const e of list) {
      if (isDbId(e.id)) {
        await apiPatch(`/admin/eskul/${e.id}`, eskulPayload(e));
      } else {
        await apiPost('/admin/eskul', {
          ...eskulPayload(e),
          nama: e.name || 'Eskul Baru',
          kategori: e.category || 'Olahraga & Seni',
          deskripsi: e.description || '',
          jadwal: e.schedule || '',
          pembina: e.coach || '',
          prestasi: e.achievements || '',
          is_active: true,
        });
      }
    }
    await fetchAll();
  };

  const createEskul = async (data = {}) => {
    let nama = data.nama || 'Eskul Baru';
    let attempts = 0;
    while (attempts < 5) {
      try {
        const row = await apiPost('/admin/eskul', {
          nama,
          kategori: data.kategori || 'Olahraga & Seni',
          image_url: httpUrlOrNull(data.image_url),
          warna: data.warna || '#e55a00',
          warna_soft: data.warna_soft || '#fff7ed',
          deskripsi: data.deskripsi || '',
          jadwal: data.jadwal || '',
          pembina: data.pembina || '',
          prestasi: data.prestasi || '',
          is_active: true,
        });
        return mapEskul(row);
      } catch (error) {
        const isDuplicate =
          error?.status === 422 &&
          (error?.errors?.nama || String(error?.message || '').includes('nama'));

        if (isDuplicate) {
          attempts++;
          const rand = Math.floor(100 + Math.random() * 900);
          nama = `Eskul Baru ${Date.now().toString().slice(-4)}${rand}`;
          continue;
        }

        throw error;
      }
    }
  };

  const deleteEskul = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data eskul ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await apiDelete(`/admin/eskul/${id}`);
  };

  const updateFacilities = async (list) => {
    for (const f of list) {
      if (isDbId(f.id)) {
        await apiPatch(`/admin/facilities/${f.id}`, {
          judul: f.title,
          kategori: f.category,
          image_url: httpUrlOrNull(f.image),
          specs: f.specs,
          deskripsi: f.description,
          tags: f.tags,
          badge: f.badge,
        });
      } else {
        const tags = (Array.isArray(f.tags) && f.tags.length > 0)
          ? f.tags
          : String(f.specs || '').split(',').map((s) => s.trim()).filter(Boolean);
        await apiPost('/admin/facilities', {
          judul: f.title || 'Fasilitas Baru',
          kategori: f.category || 'campus',
          image_url: httpUrlOrNull(f.image),
          specs: f.specs || '',
          deskripsi: f.description || '',
          tags,
          badge: f.badge || 'Fasilitas Baru',
          sort_order: 99,
          is_active: true,
        });
      }
    }
    await fetchAll();
  };

  const createFacility = async (data = {}) => {
    const tags = (Array.isArray(data.tags) && data.tags.length > 0)
      ? data.tags
      : String(data.specs || '').split(',').map((s) => s.trim()).filter(Boolean);
    const row = await apiPost('/admin/facilities', {
      judul: data.judul || 'Fasilitas Baru',
      kategori: data.kategori || 'campus',
      image_url: httpUrlOrNull(data.image_url),
      specs: data.specs || '',
      deskripsi: data.deskripsi || '',
      tags,
      badge: data.badge || 'Fasilitas Baru',
      sort_order: data.sort_order ?? 99,
      is_active: true,
    });
    return mapFacility(row);
  };

  const deleteFacility = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data fasilitas ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await apiDelete(`/admin/facilities/${id}`);
  };

  const createGalleryItem = async (data = {}) => {
    const row = await apiPost('/admin/gallery', {
      judul: data.judul || 'Foto baru',
      kategori: data.kategori || 'Kegiatan',
      tanggal: data.tanggal || null,
      deskripsi: data.deskripsi || '',
      image_url: httpUrlOrNull(data.image_url),
      rotate: data.rotate ?? 0,
      sort_order: data.sort_order ?? 99,
      is_active: true,
    });
    return row;
  };

  const deleteGalleryItem = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Foto galeri ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await apiDelete(`/admin/gallery/${id}`);
  };

  const updateGallery = async (list) => {
    for (const g of list) {
      if (!isDbId(g.id)) continue;
      await apiPatch(`/admin/gallery/${g.id}`, {
        judul: g.title,
        kategori: g.category,
        tanggal: g.date || null,
        deskripsi: g.description,
        image_url: httpUrlOrNull(g.image),
        rotate: Number(g.rotate) || 0,
        is_active: g.is_active !== false,
      });
    }
    await fetchAll();
  };

  const addPpdbSubmission = async (sub) => {
    let majorId = null;
    if (sub.major) {
      const match = content.allMajors.find(
        (m) => String(m.code).toLowerCase() === String(sub.major).toLowerCase(),
      );
      majorId = match?.dbId || null;
    }
    await apiPost('/public/ppdb', {
      nama_lengkap: sub.fullName,
      nisn: sub.nisn || null,
      asal_sekolah: sub.schoolOrigin || null,
      no_hp: sub.phone || null,
      email: sub.email || null,
      major_id: majorId,
    }, { auth: false });
  };

  const deletePpdbSubmission = async (id) => {
    await apiDelete(`/admin/ppdb/${id}`);
    setPpdbSubmissions((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePpdbStatus = async (id, status) => {
    await apiPatch(`/admin/ppdb/${id}`, { status });
    const label =
      status === 'baru' ? 'Baru Masuk'
      : status === 'menunggu_verifikasi' ? 'Menunggu Verifikasi'
      : status === 'diterima' ? 'Diterima'
      : 'Ditolak';
    setPpdbSubmissions((prev) => prev.map((p) => (p.id === id ? { ...p, status: label, _rawStatus: status } : p)));
  };

  const addContactMessage = async (msg) => {
    await apiPost('/public/suggestions', {
      nama: msg.name,
      email: msg.email || null,
      no_hp: msg.phone || null,
      kategori: msg.category || null,
      pesan: msg.message,
    }, { auth: false });
  };

  const deleteContactMessage = async (id) => {
    await apiDelete(`/admin/suggestions/${id}`);
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const createTeacher = async (data = {}) => {
    const nama = String(data.nama || '').trim();
    if (!nama) throw new Error('Nama lengkap guru wajib diisi.');

    const res = await apiPost('/admin/teachers', {
      nama,
      jabatan: data.jabatan || null,
      department: data.department || null,
      email: data.email || null,
      jam_kerja: data.jam_kerja || null,
      bio: data.bio || null,
      sertifikasi: data.sertifikasi || [],
    });

    await fetchAll();
    return res?.teacher ?? res;
  };

  const deleteTeacher = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data guru ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await apiDelete(`/admin/teachers/${id}`);
  };

  const importContentJson = async (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      const c = parsed.content || parsed;
      if (c.schoolInfo) await updateSchoolInfo(c.schoolInfo);
      if (c.profileExtras) await updateProfileExtras(c.profileExtras);
      if (c.majors) await updateMajors(c.majors);
      if (c.teachers) await updateTeachers(c.teachers);
      if (c.eskul) await updateEskul(c.eskul);
      if (c.facilities) await updateFacilities(c.facilities);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetToDefaults = async () => {
    alert('Reset data hanya bisa lewat server API: jalankan ulang seeder database, lalu refresh halaman ini.');
    await fetchAll();
    return true;
  };

  const exportContentJson = () => {
    const blob = new Blob(
      [JSON.stringify({ content, ppdbSubmissions, contactMessages }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konten-smk-mapan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ContentContext.Provider value={{
      content,
      loading,
      schoolInfo: content.schoolInfo,
      appearance: content.appearance,
      sectionCopy: content.sectionCopy,
      profileExtras: content.profileExtras,
      hero: content.hero,
      majors: content.majors,
      allMajors: content.allMajors,
      teachers: content.teachers,
      eskul: content.eskul,
      facilities: content.facilities,
      galeri: content.galeri,
      showcase: content.showcase,
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
      updateTeachers,
      updateEskul,
      createEskul,
      deleteEskul,
      updateFacilities,
      createFacility,
      deleteFacility,
      updateGallery,
      createGalleryItem,
      deleteGalleryItem,
      addPpdbSubmission,
      deletePpdbSubmission,
      updatePpdbStatus,
      addContactMessage,
      deleteContactMessage,
      createTeacher,
      deleteTeacher,
      exportContentJson,
      importContentJson,
      resetToDefaults,
      refresh: fetchAll,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
