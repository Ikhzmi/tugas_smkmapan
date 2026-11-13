/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { 
  SCHOOL_INFO, 
  MAJORS_DATA, 
  TEACHERS_DATA, 
  SHOWCASE_EPISODES 
} from '../data/schoolData';
import { ASSETS } from '../data/assets';

// Default initial Extracurricular data
const DEFAULT_ESKUL = [
  {
    id: 'tapak-suci',
    name: 'Tapak Suci Putera Muhammadiyah',
    category: 'Olahraga & Bela Diri',
    color: '#e55a00',
    colorSoft: '#fff7ed',
    description: 'Seni bela diri resmi Muhammadiyah yang memadukan teknik fisik tangguh dan penanaman mental spiritual Islami. Rutin menyumbang medali emas di kejuaraan daerah dan nasional.',
    schedule: 'Selasa & Kamis, 15.30 – 17.00 WIB',
    coach: 'Bpk. Suparman, S.Pd (Pendekar Muda)',
    achievements: 'Juara 1 Kejurda Pelajar Medan 2024, Juara Umum Porsemuh 2023, 14 Medali Emas Antar Perguruan',
    members: 48,
    maxMembers: 60,
  },
  {
    id: 'paskibra',
    name: 'PASKIBRA Satuan Mapan',
    category: 'Kedisiplinan & Kepemimpinan',
    color: '#0284c7',
    colorSoft: '#f0f9ff',
    description: 'Pasukan Pengibar Bendera yang melatih kedisiplinan tingkat tinggi, ketahanan mental, baris-berbaris presisi, dan jiwa nasionalisme yang kokoh.',
    schedule: 'Sabtu, 07.30 – 11.00 WIB',
    coach: 'Bpk. Rizky Ananda, S.Pd',
    achievements: 'Juara 1 LKBB Tingkat Kota Medan 2024, Tim Inti Pengibar Bendera HUT RI Medan Selayang',
    members: 35,
    maxMembers: 40,
  },
  {
    id: 'multimedia',
    name: 'Klub Multimedia & Sinematografi',
    category: 'Teknologi & Industri Kreatif',
    color: '#7c3aed',
    colorSoft: '#f5f3ff',
    description: 'Wadah eksplorasi siswa DKV dan TKJ dalam produksi sinematografi, liputan podcast, pembuatan film pendek, desain grafis, dan animasi 3D komersial.',
    schedule: 'Rabu, 14.30 – 16.30 WIB',
    coach: 'Ibu Nuri Andayani, S.Sn',
    achievements: 'Juara 2 Festival Film Pendek Vokasi Sumut 2024, Best Cinematography Pelajar Medan',
    members: 32,
    maxMembers: 35,
  },
  {
    id: 'rohis',
    name: 'Ikatan Pelajar Muhammadiyah & ROHIS',
    category: 'Keagamaan & Sosial',
    color: '#059669',
    colorSoft: '#ecfdf5',
    description: 'Penguatan karakter dakwah Islam berkemajuan, kajian fiqih kontemporer, tahsin Al-Qur\'an, mentoring kepribadian, serta bakti sosial kemasyarakatan.',
    schedule: 'Jumat, 13.30 – 15.00 WIB',
    coach: 'Ust. M. Fauzul Azhim, S.Pd.I',
    achievements: 'Pelopor Gerakan Shalat Berjamaah Disiplin, Juara 1 Syahril Quran Pelajar Medan 2023',
    members: 55,
    maxMembers: 70,
  },
  {
    id: 'band',
    name: 'Seni Musik & Akustik Mapan',
    category: 'Seni & Budaya',
    color: '#db2777',
    colorSoft: '#fdf2f8',
    description: 'Mengembangkan bakat musikalitas siswa melalui aransemen lagu daerah, nasyid modern, musik akustik, hingga ensemble perkusi untuk berbagai event sekolah.',
    schedule: 'Senin & Kamis, 15.30 – 17.00 WIB',
    coach: 'Bpk. Fajar Ramadhan, S.Sn',
    achievements: 'Pemenang Festival Akustik Pelajar Medan 2023, Pengisi Acara Wisuda Vokasi',
    members: 20,
    maxMembers: 25,
  },
  {
    id: 'olimpiade',
    name: 'Klub Sains & Olimpiade IT',
    category: 'Akademik & Teknologi',
    color: '#d97706',
    colorSoft: '#fffbeb',
    description: 'Persiapan intensif siswa berprestasi menuju kompetisi LKS (Lomba Kompetensi Siswa) Nasional bidang IT Network Systems Administration dan Graphic Design Technology.',
    schedule: 'Selasa & Sabtu, 14.00 – 16.00 WIB',
    coach: 'Bpk. Antoni Siregar, S.Kom, M.Kom',
    achievements: 'Finalis LKS Nasional Bidang IT Network Cabang Sumut, Medali Perak Olimpiade Sains Terapan',
    members: 18,
    maxMembers: 20,
  }
];

// Default initial Facilities data
const DEFAULT_FACILITIES = [
  {
    id: 'f1',
    title: 'Laboratorium Desain Komunikasi Visual (DKV)',
    category: 'lab',
    image: ASSETS.facilities.labDkv,
    specs: 'Lab Komputer Grafis Core-i7, Drawing Tablet Wacom, Green Screen, Soundproof Studio, AC',
    description: 'Ruang praktikum terintegrasi dengan jaringan workstation berkecepatan tinggi dan software industri untuk render 3D animasi, desain vektor, dan audio video editing.',
    tags: ['Adobe Creative Cloud', 'Blender 3D', 'Core-i7 Workstation', 'Green Screen'],
    badge: 'Lab DKV'
  },
  {
    id: 'f2',
    title: 'Gedung Utama Kampus SMK Muhammadiyah 8 Medan',
    category: 'campus',
    image: ASSETS.facilities.gedungUtama,
    specs: 'Gedung Permanen 3 Lantai, Smart Classroom, Ruang Administrasi Terpadu, WiFi Fiber Optic',
    description: 'Lingkungan kampus vokasi yang asri dan modern dengan ruang kelas representatif dan aman untuk menunjang aktivitas belajar mengajar harian.',
    tags: ['Smart Classroom', 'WiFi Fiber 500Mbps', 'CCTV 24 Jam', 'Ruang Kelas Ber-AC'],
    badge: 'Kampus Utama'
  },
  {
    id: 'f3',
    title: 'Gedung Ruang Teori & Pembelajaran Digital',
    category: 'campus',
    image: ASSETS.facilities.gedungKelas,
    specs: 'Proyektor Interaktif di Setiap Kelas, Kursi Ergonomis, Sirkulasi Udara Alami & Asri',
    description: 'Ruang kelas teori yang nyaman dan kondusif berstandar nasional, dilengkapi multimedia projector untuk pemaparan materi pembelajaran kurikulum merdeka.',
    tags: ['Proyektor Digital', 'Sound System Kelas', 'Papan Smart Board'],
    badge: 'Ruang Kelas'
  },
  {
    id: 'f4',
    title: 'Masjid & Pusat Pendidikan Karakter Islami',
    category: 'worship',
    image: ASSETS.facilities.mesjid,
    specs: 'Kapasitas 500 Jamaah, Karpet Lembut, Sound Akustik Jernih, Tempat Wudhu Terpisah',
    description: 'Pusat pembinaan spiritual dan akhlak mulia seluruh warga sekolah. Digunakan untuk shalat zhuhur berjamaah, tahfiz, dan kajian Al-Islam Kemuhammadiyahan.',
    tags: ['Shalat Berjamaah', 'Tempat Wudhu Luas', 'Kajian Rutin', 'Kapasitas 500 Siswa'],
    badge: 'Pusat Ibadah'
  },
  {
    id: 'f5',
    title: 'Lapangan Olahraga Multifungsi (Basket, Futsal & Voli)',
    category: 'sports',
    image: ASSETS.facilities.lapBasket,
    specs: 'Lapangan Standar Perbasi, Ring Basket Hidrolik, Garis Lapangan Presisi, Lampu Sorot LED',
    description: 'Fasilitas olahraga outdoor multifungsi untuk kegiatan Penjaskes, latihan ekstrakurikuler Tapak Suci, basket, futsal, serta upacara bendera mingguan.',
    tags: ['Standar Perbasi', 'Ring Hidrolik', 'Futsal & Basket', 'Upacara Bendera'],
    badge: 'Olahraga'
  },
  {
    id: 'f6',
    title: 'Ruang Praktikum Interaktif & Diskusi Kelompok',
    category: 'campus',
    image: ASSETS.facilities.belajar,
    specs: 'Meja Modular Fleksibel, Display Monitor Diskusi, Koneksi LAN High-Speed',
    description: 'Ruang kolaboratif untuk pengerjaan project-based learning (PjBL), simulasi bisnis mini bank, diskusi kelompok, dan presentasi karya inovasi siswa.',
    tags: ['Kolaborasi Tim', 'Project-Based Learning', 'Presentasi Karya'],
    badge: 'Ruang Diskusi'
  },
  {
    id: 'f7',
    title: 'Area Kampus Hijau & Ruang Sosialisasi Siswa',
    category: 'campus',
    image: ASSETS.facilities.fotoSekolah,
    specs: 'Taman Asri Rindang, Gazebo Literasi, Area Parkir Siswa dan Guru yang Aman',
    description: 'Konsep Green School yang menghadirkan pepohonan rindang dan area santai terbuka untuk interaksi sosial positif siswa di sela jam istirahat.',
    tags: ['Green Campus', 'Gazebo Literasi', 'Parkir Aman', 'Kantin Sehat'],
    badge: 'Eco Campus'
  },
  {
    id: 'f8',
    title: 'Aula Serbaguna Kegiatan Siswa & MPLS',
    category: 'campus',
    image: ASSETS.facilities.mpls,
    specs: 'Kapasitas 400 Kursi, Stage Pertunjukan, Audio Mixer 24-Channel, Layar Lebar',
    description: 'Ruang pertemuan akbar untuk Masa Pengenalan Lingkungan Sekolah (MPLS), seminar industri, wisuda kelulusan, dan pameran karya gelar vokasi tahunan.',
    tags: ['Kapasitas 400+', 'Panggung Seni', 'Seminar Industri', 'Gelar Vokasi'],
    badge: 'Aula Utama'
  }
];

// Initial Profile and Visi Misi details
const DEFAULT_PROFILE_EXTRAS = {
  visi: "Mewujudkan Pendidikan Vokasi yang Bermutu, Menghasilkan Sumber Daya Manusia yang Berakhlak Mulia, Memiliki Karakter Wirausaha, Sesuai dengan IMTAQ & IPTEK Menuju Daya Saing Global.",
  misi: [
    "Memberikan pembelajaran secara optimal dalam penanaman akidah, ibadah, dan akhlak karimah berlandaskan nilai Al-Qur'an dan As-Sunnah.",
    "Menyelenggarakan ekosistem belajar digital, lab modern, simulasi jaringan, dan integrasi kecerdasan digital menuju era Industri 4.0.",
    "Meningkatkan kompetensi guru dan siswa melalui sertifikasi industri berstandar BNSP, sinkronisasi kurikulum, dan teaching factory nyata.",
    "Mencetak lulusan yang sigap, tanggap, berjiwa entrepreneurship, mandiri, dan berdaya saing tinggi di pasar kerja global.",
    "Mewujudkan lingkungan kampus vokasi yang hijau, nyaman, ramah anak, dan kondusif untuk eksplorasi kreativitas."
  ],
  tujuan: "Menjembatani kesenjangan antara teori akademis dan kebutuhan riil industri modern, membentuk lulusan yang tidak hanya pencari kerja (job seeker), melainkan juga pencipta lapangan kerja (job creator) yang tangguh dan berintegritas.",
  principalSpeech: `Sebagai Kepala Sekolah, saya dengan penuh rasa bangga menyambut seluruh calon peserta didik, orang tua, dan mitra industri ke ekosistem pendidikan SMK Muhammadiyah 8 Medan (MAPAN). Sekolah kami memiliki tekad dan komitmen kuat untuk menghadirkan pendidikan vokasi berkualitas tinggi yang tidak hanya mengasah kompetensi teknis (hard skills), namun juga membentuk integritas moral dan karakter akhlakul karimah (soft skills).\n\nDi SMK Muhammadiyah 8 Medan, siswa adalah pusat dari segala inovasi pembelajaran. Melalui kurikulum berbasis industri, fasilitas laboratorium komputer mutakhir, bengkel sepeda motor resmi, studio multimedia DKV, serta pembelajaran nilai-nilai Al-Islam dan Kemuhammadiyahan, kami memastikan setiap lulusan siap bersaing dan langsung terserap di dunia usaha dunia industri (DUDI) atau melanjutkan kuliah.\n\nMari bersama-sama kita wujudkan masa depan yang gemilang. Jadilah bagian dari keluarga besar SMK Muhammadiyah 8 Medan — Siap Kerja, Santun, Mandiri, dan Kreatif!`,
  pin: 'admin123'
};

const STORAGE_KEY = 'smk_mapan_cms_content_v1';
const PPDB_STORAGE_KEY = 'smk_mapan_ppdb_submissions_v1';
const CONTACT_STORAGE_KEY = 'smk_mapan_contact_messages_v1';

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  // Load saved content or fallback to defaults
  const [content, setContent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          schoolInfo: { ...SCHOOL_INFO, ...(parsed.schoolInfo || {}) },
          profileExtras: { ...DEFAULT_PROFILE_EXTRAS, ...(parsed.profileExtras || {}) },
          majors: parsed.majors || MAJORS_DATA,
          teachers: parsed.teachers || TEACHERS_DATA,
          eskul: parsed.eskul || DEFAULT_ESKUL,
          facilities: parsed.facilities || DEFAULT_FACILITIES,
          showcase: parsed.showcase || SHOWCASE_EPISODES
        };
      }
    } catch (e) {
      console.warn('Gagal memuat konten tersimpan dari localStorage, menggunakan data default.', e);
    }

    return {
      schoolInfo: SCHOOL_INFO,
      profileExtras: DEFAULT_PROFILE_EXTRAS,
      majors: MAJORS_DATA,
      teachers: TEACHERS_DATA,
      eskul: DEFAULT_ESKUL,
      facilities: DEFAULT_FACILITIES,
      showcase: SHOWCASE_EPISODES
    };
  });

  // PPDB Submissions state
  const [ppdbSubmissions, setPpdbSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem(PPDB_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: 'ppdb-1',
          date: '2026-10-14 09:20',
          fullName: 'Ahmad Fadhil Lubis',
          nisn: '0081234567',
          phone: '081260449911',
          schoolOrigin: 'SMP Negeri 1 Medan',
          major: 'tkj',
          majorName: 'Teknik Komputer dan Jaringan',
          status: 'Diterima'
        },
        {
          id: 'ppdb-2',
          date: '2026-10-15 11:45',
          fullName: 'Sarah Anindya Putri',
          nisn: '0089876543',
          phone: '085270112233',
          schoolOrigin: 'MTs Muhammadiyah 1 Medan',
          major: 'dkv',
          majorName: 'Desain Komunikasi Visual',
          status: 'Menunggu Verifikasi'
        }
      ];
    } catch {
      return [];
    }
  });

  // Contact Messages state
  const [contactMessages, setContactMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTACT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: 'msg-1',
          date: '2026-10-15 14:10',
          name: 'Ibu Ratna Dewi',
          email: 'ratna.dewi@gmail.com',
          phone: '081399887766',
          category: 'Informasi Biaya & Beasiswa',
          message: 'Selamat siang, apakah masih ada kuota beasiswa prestasi untuk pendaftaran jurusan DKV gelombang 1?'
        }
      ];
    } catch {
      return [];
    }
  });

  // Save content to localStorage on changes
  const saveContent = (newContent) => {
    setContent(newContent);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent));
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e);
    }
  };

  // Specific content update functions
  const updateSchoolInfo = (info) => {
    saveContent({ ...content, schoolInfo: { ...content.schoolInfo, ...info } });
  };

  const updateProfileExtras = (extras) => {
    saveContent({ ...content, profileExtras: { ...content.profileExtras, ...extras } });
  };

  const updateMajors = (majors) => {
    saveContent({ ...content, majors });
  };

  const updateTeachers = (teachers) => {
    saveContent({ ...content, teachers });
  };

  const updateEskul = (eskul) => {
    saveContent({ ...content, eskul });
  };

  const updateFacilities = (facilities) => {
    saveContent({ ...content, facilities });
  };

  // Submissions handlers
  const addPpdbSubmission = (sub) => {
    const newSub = {
      id: 'ppdb-' + Date.now(),
      date: new Date().toLocaleString('id-ID'),
      status: 'Baru Masuk',
      ...sub
    };
    const updated = [newSub, ...ppdbSubmissions];
    setPpdbSubmissions(updated);
    try {
      localStorage.setItem(PPDB_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const deletePpdbSubmission = (id) => {
    const updated = ppdbSubmissions.filter(s => s.id !== id);
    setPpdbSubmissions(updated);
    localStorage.setItem(PPDB_STORAGE_KEY, JSON.stringify(updated));
  };

  const addContactMessage = (msg) => {
    const newMsg = {
      id: 'msg-' + Date.now(),
      date: new Date().toLocaleString('id-ID'),
      ...msg
    };
    const updated = [newMsg, ...contactMessages];
    setContactMessages(updated);
    try {
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteContactMessage = (id) => {
    const updated = contactMessages.filter(m => m.id !== id);
    setContactMessages(updated);
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated));
  };

  // Export content to JSON file
  const exportContentJson = () => {
    const dataToExport = {
      meta: {
        exportedAt: new Date().toISOString(),
        appName: 'SMK Muhammadiyah 8 Medan CMS',
        version: '2.0.0'
      },
      content,
      ppdbSubmissions,
      contactMessages
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konten-smk-muhammadiyah-8-medan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import content from JSON string
  const importContentJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.content) {
        saveContent(parsed.content);
        if (parsed.ppdbSubmissions) {
          setPpdbSubmissions(parsed.ppdbSubmissions);
          localStorage.setItem(PPDB_STORAGE_KEY, JSON.stringify(parsed.ppdbSubmissions));
        }
        if (parsed.contactMessages) {
          setContactMessages(parsed.contactMessages);
          localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(parsed.contactMessages));
        }
        return { success: true };
      } else {
        // Direct content structure
        saveContent(parsed);
        return { success: true };
      }
    } catch (err) {
      console.error('Import error:', err);
      return { success: false, error: err.message };
    }
  };

  // Reset to original codebase defaults
  const resetToDefaults = () => {
    const defaultData = {
      schoolInfo: SCHOOL_INFO,
      profileExtras: DEFAULT_PROFILE_EXTRAS,
      majors: MAJORS_DATA,
      teachers: TEACHERS_DATA,
      eskul: DEFAULT_ESKUL,
      facilities: DEFAULT_FACILITIES,
      showcase: SHOWCASE_EPISODES
    };
    saveContent(defaultData);
    localStorage.removeItem(STORAGE_KEY);
    return true;
  };

  return (
    <ContentContext.Provider value={{
      content,
      schoolInfo: content.schoolInfo,
      profileExtras: content.profileExtras,
      majors: content.majors,
      teachers: content.teachers,
      eskul: content.eskul,
      facilities: content.facilities,
      showcase: content.showcase,
      ppdbSubmissions,
      contactMessages,
      updateSchoolInfo,
      updateProfileExtras,
      updateMajors,
      updateTeachers,
      updateEskul,
      updateFacilities,
      saveContent,
      addPpdbSubmission,
      deletePpdbSubmission,
      addContactMessage,
      deleteContactMessage,
      exportContentJson,
      importContentJson,
      resetToDefaults
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
