/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ASSETS } from '../data/assets';
import { SCHOOL_INFO, MAJORS_DATA, TEACHERS_DATA, SHOWCASE_EPISODES } from '../data/schoolData';
import { teacherPhoto } from '../lib/teacherPhoto';

const majorImages = {
  TKJ: ASSETS.majors.tkj,
  DKV: ASSETS.majors.dkv,
  AKL: ASSETS.majors.akl,
  TBSM: ASSETS.majors.tsm,
};

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

// Data contoh (fallback) memakai id seperti "tkj"/"sulastri", bukan UUID.
// Jangan pernah kirim id itu ke kolom uuid Supabase.
const isDbId = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

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
  image: m.foto_url || majorImages[m.kode] || ASSETS.facilities.gedungUtama,
  facilityImage: m.foto_url || majorImages[m.kode] || ASSETS.facilities.gedungUtama,
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
  image: t.foto_url || teacherPhoto([t.nama, t.gelar].filter(Boolean).join(' ')),
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

const fallbackFacilityImage = (f) => {
  const badge = String(f.badge || f.judul || '').toLowerCase();
  const kat = String(f.kategori || '').toLowerCase();
  if (badge.includes('dkv') || kat === 'lab') return ASSETS.facilities.labDkv;
  if (badge.includes('ibadah') || badge.includes('masjid') || kat === 'worship') return ASSETS.facilities.mesjid;
  if (badge.includes('olahraga') || badge.includes('basket') || kat === 'sports') return ASSETS.facilities.lapBasket;
  if (badge.includes('kelas')) return ASSETS.facilities.gedungKelas;
  if (badge.includes('diskusi') || badge.includes('kolaborasi') || badge.includes('praktik')) return ASSETS.facilities.belajar;
  if (badge.includes('aula') || badge.includes('mpls')) return ASSETS.facilities.mpls;
  if (badge.includes('lingkungan') || badge.includes('eco')) return ASSETS.facilities.fotoSekolah;
  return ASSETS.facilities.gedungUtama;
};

const mapFacility = (f) => ({
  id: f.id,
  title: f.judul,
  category: f.kategori,
  image: f.image_url || fallbackFacilityImage(f),
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
  image: v.thumbnail_url,
});

const mapGallery = (g) => ({
  id: g.id,
  title: g.judul,
  category: g.kategori,
  date: g.tanggal,
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

// Identitas sekolah tersimpan utuh di site_settings key 'sekolah'.
// Key lama ('topbar', 'kontak', 'profil') hanya dibaca sebagai fallback
// supaya nilai yang sudah pernah disimpan sebelum ini tidak hilang.
function mapSchoolInfo(settings) {
  const s = settings.sekolah || {};
  const pick = (value, fallback) => (value == null || value === '' ? fallback : value);

  return {
    ...SCHOOL_INFO,
    name: pick(s.nama, SCHOOL_INFO.name),
    shortName: pick(s.singkatan, SCHOOL_INFO.shortName),
    predicate: pick(s.predikat, SCHOOL_INFO.predicate),
    accreditation: pick(s.akreditasi, SCHOOL_INFO.akreditasi),
    curriculum: pick(s.kurikulum, SCHOOL_INFO.curriculum),
    npsn: pick(s.npsn, pick(settings.topbar?.npsn, SCHOOL_INFO.npsn)),
    nss: pick(s.nss, SCHOOL_INFO.nss),
    hotline: pick(s.hotline, pick(settings.topbar?.hotline, SCHOOL_INFO.hotline)),
    hotlineRaw: pick(s.hotline_raw, SCHOOL_INFO.hotlineRaw),
    phone: pick(s.telepon, SCHOOL_INFO.phone),
    email: pick(s.email, SCHOOL_INFO.email),
    website: pick(s.website, SCHOOL_INFO.website),
    address: pick(s.alamat, pick(settings.kontak?.alamat, SCHOOL_INFO.address)),
    mapsUrl: pick(s.maps_url, SCHOOL_INFO.mapsUrl),
    whatsapp: pick(s.whatsapp, SCHOOL_INFO.whatsapp),
    instagram: pick(s.instagram, SCHOOL_INFO.instagram),
    operatingHours: pick(s.jam_pelayanan, pick(settings.kontak?.jam_pelayanan, SCHOOL_INFO.operatingHours)),
    principal: pick(
      s.kepala_sekolah,
      pick(
        settings.profil?.kepala_sekolah === 'Luliadi, M.Pd' ? '' : settings.profil?.kepala_sekolah,
        SCHOOL_INFO.principal,
      ),
    ),
    logoUrl: pick(s.logo_url, SCHOOL_INFO.logoUrl),
    quote: {
      text: pick(s.kutipan, SCHOOL_INFO.quote.text),
      author: pick(s.kutipan_penulis, SCHOOL_INFO.quote.author),
    },
    principalPhoto: SCHOOL_INFO.principalPhoto,
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
    schoolInfo: SCHOOL_INFO,
    appearance: APPEARANCE_DEFAULTS,
    sectionCopy: SECTION_COPY_DEFAULTS,
    profileExtras: {
      visi: '', misi: [], tujuan: '',
      sejarahJudul: '', sejarahParagraf: [], sejarahMilestones: [],
      kepsekSambutan: '', kepsekPesan: [],
      sejarahFoto: '', kartuDepan: '', kartuBelakang: '',
    },
    hero: HERO_DEFAULTS,
    majors: MAJORS_DATA,
    allMajors: MAJORS_DATA,
    teachers: TEACHERS_DATA,
    eskul: [],
    facilities: [],
    galeri: [],
    showcase: SHOWCASE_EPISODES,
  });
  const [ppdbSubmissions, setPpdbSubmissions] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [
      settingsRes,
      majorsRes,
      teachersRes,
      eskulRes,
      facilitiesRes,
      videosRes,
      galleryRes,
    ] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      supabase.from('majors').select('*').order('kode'),
      supabase.from('teachers').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('eskul').select('*').eq('is_active', true).order('nama'),
      supabase.from('facilities').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('videos').select('*').eq('is_published', true).eq('kategori', 'showreel').order('sort_order'),
      supabase.from('gallery').select('*').eq('is_active', true).order('sort_order'),
    ]);

    const settings = {};
    (settingsRes.data || []).forEach((r) => { settings[r.key] = r.value; });

    const schoolInfo = mapSchoolInfo(settings);

    const rawTeachers = (teachersRes.data || []).map(mapTeacher);
    const mappedTeachers = rawTeachers.map((t) => {
      if (t.name.includes('Sulastri')) {
        return { ...t, role: 'Kepala Sekolah', image: t.image || ASSETS.teachers.umiSulastri };
      }
      if (t.name.includes('Luliadi') && t.role === 'Kepala Sekolah') {
        return { ...t, role: 'Wakil Kepala Sekolah & Pengajar Senior' };
      }
      return t;
    });
    if (mappedTeachers.length > 0) {
      mappedTeachers.sort((a, b) => (a.role === 'Kepala Sekolah' ? -1 : b.role === 'Kepala Sekolah' ? 1 : 0));
    }

    // Jurusan non-aktif tetap dibutuhkan CMS supaya bisa ditampilkan lagi,
    // tetapi tidak boleh dipakai komponen landing page.
    const mappedMajors = (majorsRes.data && majorsRes.data.length > 0)
      ? majorsRes.data.map(mapMajor)
      : MAJORS_DATA;

    setContent({
      schoolInfo,
      appearance: mapAppearance(settings),
      sectionCopy: mapSectionCopy(settings),
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
      teachers: (mappedTeachers && mappedTeachers.length > 0) ? mappedTeachers : TEACHERS_DATA,
      eskul: (eskulRes.data || []).map(mapEskul),
      facilities: (facilitiesRes.data || []).map(mapFacility),
      galeri: (galleryRes.data || []).map(mapGallery),
      showcase: (videosRes.data && videosRes.data.length > 0) ? videosRes.data.map(mapVideo) : SHOWCASE_EPISODES,
    });

    const ppdbRes = await supabase
      .from('ppdb_registrations')
      .select('*, majors(kode, nama)')
      .order('created_at', { ascending: false });
    if (!ppdbRes.error) setPpdbSubmissions((ppdbRes.data || []).map(mapPpdb));

    const msgRes = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!msgRes.error) setContactMessages((msgRes.data || []).map(mapMessage));

    setLoading(false);
  }, []);

  useEffect(() => { queueMicrotask(fetchAll); }, [fetchAll]);

  // PPDB & pesan masuk hanya bisa dibaca admin (RLS), jadi saat app dibuka
  // dalam keadaan anonim hasilnya kosong. Muat ulang tiap sesi berubah.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') fetchAll();
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchAll]);

  const updateSiteSetting = async (key, patch) => {
    const { data: cur } = await supabase.from('site_settings').select('value').eq('key', key).single();
    const merged = { ...(cur?.value || {}), ...patch };
    const { error } = await supabase.from('site_settings').upsert({ key, value: merged });
    if (error) throw error;
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
      const useDbId = isDbId(m.dbId);
      const matchValue = useDbId ? m.dbId : m.code;
      if (!matchValue) continue;
      const { error } = await supabase.from('majors').update({
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
        foto_url: typeof m.photo === 'string' ? (m.photo || null) : (typeof m.image === 'string' && m.image ? m.image : null),
      }).eq(useDbId ? 'id' : 'kode', matchValue);
      if (error) throw error;
    }
    await fetchAll();
  };

  const createMajor = async (data = {}) => {
    const { data: row, error } = await supabase
      .from('majors')
      .insert({
        kode: String(data.kode || '').toUpperCase(),
        nama: data.nama || 'Program Keahlian Baru',
        tagline: data.tagline || '',
        deskripsi: data.deskripsi || '',
        biaya_pendaftaran: data.biaya_pendaftaran ?? 0,
        spp_bulanan: data.spp_bulanan ?? 0,
        warna: data.warna || '#0284C7',
        warna_soft: data.warna_soft || '#E0F2FE',
        ikon: data.ikon || 'Network',
        foto_url: data.foto_url || data.image_url || '',
        is_active: data.is_active === true,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMajor(row);
  };

  const deleteMajor = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data jurusan ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    const { data: deleted, error } = await supabase
      .from('majors').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      throw new Error('Ditolak database (RLS): akun Anda tidak punya hak hapus jurusan.');
    }
  };

  const updateTeachers = async (teachers) => {
    let saved = 0;
    for (const t of teachers) {
      if (!isDbId(t.id)) continue;
      const { error } = await supabase.from('teachers').update({
        nama: t.name,
        jabatan: t.role,
        department: t.department,
        bio: t.bio,
        sertifikasi: t.certifications,
        jam_kerja: t.hours,
        email: t.email,
        foto_url: typeof t.image === 'string' && t.image.startsWith('http') ? t.image : undefined,
      }).eq('id', t.id);
      if (error) throw error;
      saved++;
    }
    if (saved === 0 && teachers.length > 0) {
      throw new Error('Data guru belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    await fetchAll();
  };

  const updateEskul = async (list) => {
    for (const e of list) {
      if (isDbId(e.id)) {
        const { error } = await supabase.from('eskul').update({
          nama: e.name,
          kategori: e.category,
          image_url: e.image || null,
          warna: e.color || '#e55a00',
          warna_soft: e.colorSoft || '#fff7ed',
          deskripsi: e.description,
          jadwal: e.schedule,
          pembina: e.coach,
          prestasi: e.achievements,
          jumlah_anggota: e.members,
          max_anggota: e.maxMembers,
        }).eq('id', e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('eskul').insert({
          nama: e.name || 'Eskul Baru',
          kategori: e.category || 'Olahraga & Seni',
          image_url: e.image || null,
          warna: e.color || '#e55a00',
          warna_soft: e.colorSoft || '#fff7ed',
          deskripsi: e.description || '',
          jadwal: e.schedule || '',
          pembina: e.coach || '',
          prestasi: e.achievements || '',
          is_active: true,
        });
        if (error) throw error;
      }
    }
    await fetchAll();
  };

  const createEskul = async (data = {}) => {
    let nama = data.nama || 'Eskul Baru';
    let attempts = 0;
    while (attempts < 5) {
      const { data: row, error } = await supabase
        .from('eskul')
        .insert({
          nama,
          kategori: data.kategori || 'Olahraga & Seni',
          image_url: data.image_url || null,
          warna: data.warna || '#e55a00',
          warna_soft: data.warna_soft || '#fff7ed',
          deskripsi: data.deskripsi || '',
          jadwal: data.jadwal || '',
          pembina: data.pembina || '',
          prestasi: data.prestasi || '',
          is_active: true,
        })
        .select()
        .single();

      if (!error) return mapEskul(row);

      const isDuplicate =
        error.code === '23505' ||
        String(error.message || '').includes('nama') ||
        String(error.details || '').includes('Key (nama)');

      if (isDuplicate) {
        attempts++;
        const rand = Math.floor(100 + Math.random() * 900);
        nama = `Eskul Baru ${Date.now().toString().slice(-4)}${rand}`;
        continue;
      }

      throw error;
    }
  };

  const deleteEskul = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data eskul ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    const { data: deleted, error } = await supabase
      .from('eskul').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      throw new Error('Ditolak database (RLS): akun Anda tidak punya hak hapus eskul.');
    }
  };

  const updateFacilities = async (list) => {
    for (const f of list) {
      if (isDbId(f.id)) {
        const { error } = await supabase.from('facilities').update({
          judul: f.title,
          kategori: f.category,
          image_url: f.image || null,
          specs: f.specs,
          deskripsi: f.description,
          tags: f.tags,
          badge: f.badge,
        }).eq('id', f.id);
        if (error) throw error;
      } else {
        const tags = (Array.isArray(f.tags) && f.tags.length > 0)
          ? f.tags
          : String(f.specs || '').split(',').map((s) => s.trim()).filter(Boolean);
        const { error } = await supabase.from('facilities').insert({
          judul: f.title || 'Fasilitas Baru',
          kategori: f.category || 'campus',
          image_url: f.image || null,
          specs: f.specs || '',
          deskripsi: f.description || '',
          tags,
          badge: f.badge || 'Fasilitas Baru',
          sort_order: 99,
          is_active: true,
        });
        if (error) console.warn('[updateFacilities] Insert fallback item error:', error);
      }
    }
    await fetchAll();
  };

  const createFacility = async (data = {}) => {
    const tags = (Array.isArray(data.tags) && data.tags.length > 0)
      ? data.tags
      : String(data.specs || '').split(',').map((s) => s.trim()).filter(Boolean);
    const { data: row, error } = await supabase
      .from('facilities')
      .insert({
        judul: data.judul || 'Fasilitas Baru',
        kategori: data.kategori || 'campus',
        image_url: data.image_url || null,
        specs: data.specs || '',
        deskripsi: data.deskripsi || '',
        tags,
        badge: data.badge || 'Fasilitas Baru',
        sort_order: data.sort_order ?? 99,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return mapFacility(row);
  };

  const deleteFacility = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data fasilitas ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    const { data: deleted, error } = await supabase
      .from('facilities').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      throw new Error('Ditolak database (RLS): akun Anda tidak punya hak hapus fasilitas.');
    }
  };

  const createGalleryItem = async (data = {}) => {
    const { data: row, error } = await supabase
      .from('gallery')
      .insert({
        judul: data.judul || 'Foto baru',
        kategori: data.kategori || 'Kegiatan',
        tanggal: data.tanggal || '',
        deskripsi: data.deskripsi || '',
        image_url: data.image_url || '',
        rotate: data.rotate ?? 0,
        sort_order: data.sort_order ?? 99,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  };

  const deleteGalleryItem = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Foto galeri ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    const { data: deleted, error } = await supabase
      .from('gallery').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      throw new Error('Ditolak database (RLS): akun Anda tidak punya hak hapus galeri.');
    }
  };

  const updateGallery = async (list) => {
    for (const g of list) {
      if (!isDbId(g.id)) continue;
      const { error } = await supabase.from('gallery').update({
        judul: g.title,
        kategori: g.category,
        tanggal: g.date,
        deskripsi: g.description,
        image_url: g.image,
        rotate: Number(g.rotate) || 0,
        is_active: g.is_active !== false,
      }).eq('id', g.id);
      if (error) throw error;
    }
    await fetchAll();
  };

  const addPpdbSubmission = async (sub) => {
    let majorId = null;
    if (sub.major) {
      const { data } = await supabase.from('majors').select('id')
        .eq('kode', String(sub.major).toUpperCase()).single();
      majorId = data?.id || null;
    }
    const { error } = await supabase.from('ppdb_registrations').insert({
      nama_lengkap: sub.fullName,
      nisn: sub.nisn,
      asal_sekolah: sub.schoolOrigin,
      no_hp: sub.phone,
      email: sub.email || null,
      major_id: majorId,
      status: 'baru',
    });
    if (error) throw error;
  };

  const deletePpdbSubmission = async (id) => {
    // .select() memaksa PostgREST mengembalikan baris yang benar-benar
    // terhapus; kalau kosong berarti ditolak RLS (bukan sukses diam-diam).
    const { data: deleted, error } = await supabase
      .from('ppdb_registrations').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      throw new Error('Ditolak database (RLS): akun Anda tidak punya hak hapus data PPDB.');
    }
    setPpdbSubmissions((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePpdbStatus = async (id, status) => {
    const { error } = await supabase.from('ppdb_registrations').update({ status }).eq('id', id);
    if (error) throw error;
    const label =
      status === 'baru' ? 'Baru Masuk'
      : status === 'menunggu_verifikasi' ? 'Menunggu Verifikasi'
      : status === 'diterima' ? 'Diterima'
      : 'Ditolak';
    setPpdbSubmissions((prev) => prev.map((p) => (p.id === id ? { ...p, status: label, _rawStatus: status } : p)));
  };

  const addContactMessage = async (msg) => {
    const { error } = await supabase.from('suggestions').insert({
      nama: msg.name,
      email: msg.email || null,
      no_hp: msg.phone || null,
      kategori: msg.category || null,
      pesan: msg.message,
      status: 'baru',
    });
    if (error) throw error;
  };

  const deleteContactMessage = async (id) => {
    const { data: deleted, error } = await supabase
      .from('suggestions').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      throw new Error('Ditolak database (RLS): akun Anda tidak punya hak hapus pesan.');
    }
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const createTeacher = async (data = {}) => {
    const nama = String(data.nama || '').trim();
    if (!nama) throw new Error('Nama lengkap guru wajib diisi.');

    const { data: row, error } = await supabase
      .from('teachers')
      .insert({
        nama,
        jabatan: data.jabatan || null,
        department: data.department || null,
        email: data.email || null,
        jam_kerja: data.jam_kerja || null,
        bio: data.bio || null,
        sertifikasi: data.sertifikasi || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      const isDuplicate =
        error.code === '23505' ||
        String(error.message || '').includes('teachers_nama_key') ||
        String(error.details || '').includes('Key (nama)');
      if (isDuplicate) {
        throw new Error('Nama guru tersebut sudah terdaftar. Tambahkan gelar atau pembeda pada namanya.');
      }
      throw error;
    }

    await fetchAll();
    return row;
  };

  const deleteTeacher = async (id) => {
    if (!isDbId(id)) {
      throw new Error('Data guru ini belum tersinkron dari database. Muat ulang halaman lalu coba lagi.');
    }
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
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
    alert('Reset data hanya bisa lewat Supabase: jalankan ulang file supabase_all_in_one.sql di SQL Editor, lalu refresh halaman ini.');
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
