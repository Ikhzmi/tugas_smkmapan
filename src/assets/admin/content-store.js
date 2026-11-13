/**
 * SMK Muhammadiyah 8 Medan - Admin Content Store
 * Manages all website content via localStorage
 */

const STORAGE_KEY = 'smk_md8_content';
const FEEDBACK_STORAGE_KEY = 'smk_feedback_messages';

// =============================================
//  DEFAULT CONTENT (initial/fallback values)
// =============================================
const DEFAULT_CONTENT = {
  // ---- SITE INFO ----
  site: {
    schoolName: 'SMK Muhammadiyah 8 Medan',
    schoolShortName: 'SMK MD 8 Medan',
    tagline: 'SMK Pusat Keunggulan',
    address: 'Jl. Abdul Hakim No.2, Tanjung Sari, Kec. Medan Selayang, Kota Medan, Sumatera Utara',
    phone: '0813-7080-6663',
    whatsapp: '+6281370806663',
    email: 'smkmd08medan@gmail.com',
    facebook: 'https://m.facebook.com/profile.php?id=1853839171595432',
    instagram: 'https://www.instagram.com/officialsmkmapan/?hl=id',
    youtube: 'https://www.youtube.com/@officialsmkmapan5320',
    mapsUrl: 'https://maps.app.goo.gl/7QVjJmF8Z7sJepAK6',
    footerText: 'Bersama-sama, mari kita ciptakan kisah sukses yang tak terlupakan di SMK Muhammadiyah 8 Medan.'
  },

  // ---- HERO SLIDER ----
  slider: [
    {
      id: 1,
      quote: 'Kecerdasan <span class="highlight">mengalahkan</span> kekuatan fisik dan pengetahuan adalah <span class="highlight">kuncinya</span>',
      image: 'images/foto (1).png'
    },
    {
      id: 2,
      quote: 'Pendidikan adalah <span class="highlight">investasi terbaik</span> dalam dirimu sendiri karna ilmu adalah <span class="highlight">harta</span> yang tak ternilai',
      image: 'images/foto (2).png'
    },
    {
      id: 3,
      quote: 'Kegagalan adalah <span class="highlight">pelajaran</span>, bukan <span class="highlight">akhir</span> dari perjalananmu. Terus maju, dan kamu akan meraih <span class="highlight">kesuksesan</span>',
      image: 'images/foto (3).png'
    }
  ],

  // ---- ABOUT ----
  about: {
    greeting: 'SELAMAT DATANG DI',
    title: 'SMK Pusat Keunggulan',
    subtitle: 'SMK Muhammadiyah 08 Medan',
    description: 'SMK MUHAMMADIYAH 8 MEDAN, terletak di kota Medan, Sumatera Utara, adalah lembaga pendidikan kejuruan unggulan. Sekolah ini menawarkan beragam program keahlian untuk menciptakan generasi muda yang terampil, siap bersaing di dunia kerja, dan berkarakter baik. Dengan fasilitas yang memadai, guru berkualitas, dan komitmen terhadap pendidikan bermutu, SMK Muhammadiyah 8 Medan menjadi pilihan utama di Medan.',
    image: 'images/gedung sekolah.jpg',
    readMoreLink: 'sejarah_sekolah.html'
  },

  // ---- NEWS ----
  news: [
    { id: 1, title: 'HARI BATIK NASIONAL', date: '2024-10-02', category: 'Kegiatan', description: 'Peringatan Hari Batik Nasional di SMK Muhammadiyah 8 Medan dengan berbagai penampilan kreativitas siswa.', image: 'gallery/1.jpg', link: 'https://www.instagram.com/officialsmkmapan/?hl=id' },
    { id: 2, title: 'SUMPAH PEMUDA', date: '2024-10-28', category: 'Kegiatan', description: 'Upacara dan pentas seni memperingati Hari Sumpah Pemuda di SMK Muhammadiyah 8 Medan.', image: 'gallery/3.jpg', link: 'https://www.instagram.com/officialsmkmapan/?hl=id' },
    { id: 3, title: 'VIDEO PROMOSI SEKOLAH', date: '2024-09-15', category: 'Informasi', description: 'Peluncuran video profil dan promosi resmi SMK Muhammadiyah 8 Medan tahun ajaran baru.', image: 'gallery/2.jpg', link: 'https://www.youtube.com/@officialsmkmapan5320' },
    { id: 4, title: 'PERINGATAN G30S PKI', date: '2024-09-30', category: 'Kegiatan', description: 'Kajian sejarah dan nonton bareng peringatan peristiwa G30S/PKI bersama dewan guru dan siswa.', image: 'gallery/4.jpg', link: 'https://www.instagram.com/officialsmkmapan/?hl=id' }
  ],

  // ---- PROGRAMS (Pra Pendaftaran) ----
  programs: [
    {
      id: 1,
      name: 'Teknik Komputer dan Jaringan',
      shortName: 'TKJ',
      registrationFee: 'Rp. 825.000,00',
      monthlyFee: 'Rp. 275.000,00',
      color: '#ff4646',
      features: [
        'Administrasi Infrastruktur Jaringan',
        'Teknologi Jaringan Berbasis Luas',
        'Teknologi Layanan Jaringan',
        'Perakitan Komputer',
        'Sistem Operasi'
      ],
      waText: "Assalamu'alaikum saya ingin bertanya, apakah pendatfaran untuk jurusan 'Teknik Komputer dan Jaringan' masih terbuka?"
    },
    {
      id: 2,
      name: 'Desain Komunikasi Visual',
      shortName: 'DKV',
      registrationFee: 'Rp. 825.000,00',
      monthlyFee: 'Rp. 300.000,00',
      color: '#ff4646',
      features: [
        'Digital Marketing',
        'Mendesain',
        'Videografi',
        'Fotografi',
        'Animator'
      ],
      waText: "Assalamu'alaikum saya ingin bertanya, apakah pendatfaran untuk jurusan 'Desain Komunikasi Visual' masih terbuka?"
    },
    {
      id: 3,
      name: 'Akuntansi',
      shortName: 'AK',
      registrationFee: 'Rp. 825.000,00',
      monthlyFee: 'Rp. 275.000,00',
      color: '#ff4646',
      features: [
        'Bisnis dan Administrasi Umum',
        'Akuntansi Dagang dan Manufaktur',
        'Akuntansi Lembaga Pemerintah',
        'Komputer Akuntansi'
      ],
      waText: "Assalamu'alaikum saya ingin bertanya, apakah pendatfaran untuk jurusan 'Akuntansi' masih terbuka?"
    },
    {
      id: 4,
      name: 'Teknik Sepeda Motor',
      shortName: 'TBSM',
      registrationFee: 'Rp. 825.000,00',
      monthlyFee: 'Rp. 275.000,00',
      color: '#ff4646',
      features: [
        'Service Berkala Sepeda Motor',
        'Perbaikan Unit Mekanisme Katup',
        'Overhoul Engine & Komponennya',
        'Perbaikan Blok dan Silinder',
        'Perbaikan Sistem Kelistrikan',
        'Sistem Chasis Sepeda Motor'
      ],
      waText: "Assalamu'alaikum saya ingin bertanya, apakah pendatfaran untuk jurusan 'Teknik Sepeda Motor' masih terbuka?"
    }
  ],

  // ---- TEACHERS ----
  teachers: [
    { id: 1, name: 'Sulastri, S.Pd.I', role: 'Waka Kurikulum', photo: 'foto_guru/umi.png' },
    { id: 2, name: 'Ahmad Antoni, A. Md.', role: 'Wkl.Kasek Bid. Kesiswaan', photo: 'foto_guru/pak toni.png' },
    { id: 3, name: 'Drs. Surip', role: 'Guru Produktif Akuntansi', photo: 'foto_guru/pak surip.png' },
    { id: 4, name: 'Syaifah, SE, S.Pd', role: 'Guru Kewirausahaan', photo: 'foto_guru/bu syaifah.png' },
    { id: 5, name: 'Nelzawaty, S.Pd', role: 'Guru B.Inggris', photo: 'foto_guru/bu nelzawaty.png' },
    { id: 6, name: 'Drs. Bambang Permadi', role: 'Guru Kemuhammadiyahan', photo: 'foto_guru/pak bambang.png' },
    { id: 7, name: 'Andi Syahputra, M.Kom.I', role: "Guru Al-Qur'an", photo: 'foto_guru/pak andi.png' },
    { id: 8, name: 'Novriza, S.Pd', role: 'Guru Produktif TBSM', photo: 'foto_guru/pak novri.png' },
    { id: 9, name: 'Alfian Julianta, S.Pd.I', role: 'Guru Kemuhammadiyahan', photo: 'foto_guru/pak alfian.png' },
    { id: 10, name: 'Afifah Septiarini, S.Pd', role: 'Guru B.Indonesia', photo: 'foto_guru/bu afifah.png' },
    { id: 11, name: 'Agung Didik Sinugroho, S.Pd', role: 'Guru B.Inggris', photo: 'foto_guru/pak agung.png' },
    { id: 12, name: 'Yeni Karsalova Br Sembiring, S.Pd', role: 'Guru IPAS', photo: 'foto_guru/bu yeni.png' },
    { id: 13, name: 'M.Fansuri Syuhada, A.Md MM', role: 'Guru Produktif DKV', photo: 'foto_guru/pak fansuri.png' },
    { id: 14, name: 'Nur Imayanti, S. Pd', role: 'Guru Matematika', photo: 'foto_guru/mis nuri.png' },
    { id: 15, name: 'Deni Ramanda Kasbi, S. Pd', role: 'Guru PKN dan Sejarah', photo: 'foto_guru/pak deni.png' },
    { id: 16, name: 'Nana Sholehayati Pohan, S. Pd', role: 'Guru B.Inggris', photo: 'foto_guru/mis nana.png' },
    { id: 17, name: 'Jaka Mulia Ramadhan, ST', role: 'Guru Produktif TBSM', photo: 'foto_guru/pak jaka.png' },
    { id: 18, name: 'Intan Amalia Tasya, S.sn', role: 'Guru Seni Budaya', photo: 'foto_guru/bu intan.png' },
    { id: 19, name: 'M.Riswan Nasution, SE,S.Pd,M. Pd', role: 'Guru B.Indonesia', photo: 'foto_guru/pak riswan.png' },
    { id: 20, name: 'Muhammad Fitra Aldy, A. Md', role: 'Guru Produktif TKJ', photo: 'foto_guru/pak aldy.png' },
    { id: 21, name: 'Azandi Pratama, S. Pd', role: 'Guru PAI dan Budi Pekerti', photo: 'foto_guru/pak azandi.png' },
    { id: 22, name: 'Indah Mustika, S. Pd', role: "Guru PKN/ Al-Qur'an/ Sejarah", photo: 'foto_guru/bu indah.png' },
    { id: 23, name: 'Epi Triyani, S. Pd', role: 'Guru Produktif Akuntansi', photo: 'foto_guru/bu epi.png' },
    { id: 24, name: 'Ade Arihta Akbar, S. S', role: 'Guru B.Arab', photo: 'foto_guru/pak akbar.png' },
    { id: 25, name: 'Herman Sakti Lubis, S. Pd', role: 'Guru Produktif DKV', photo: 'foto_guru/pak herman.png' },
    { id: 26, name: 'Muhammad Fauzul Iryandi, S.Kom', role: 'Guru Produktif TKJ', photo: 'foto_guru/pak fauzul.png' },
    { id: 27, name: 'Ezaita Maisyaroh Ritonga, M. Pd', role: 'Guru Matematika', photo: 'foto_guru/bu eza.png' },
    { id: 28, name: 'Rafika Sari, S.Kom', role: 'Guru Produktif TKJ', photo: 'foto_guru/bu fika.png' },
    { id: 29, name: 'Andes Martua Harahap, M. Pd', role: 'Guru Penjaskes', photo: 'foto_guru/pak andes.png' },
    { id: 30, name: 'Tengku Ahmad Faisal, S. I Kom', role: 'Guru Produktif DKV', photo: 'foto_guru/pak fais.png' },
    { id: 31, name: 'Iqbal Fauzi, S. Pd', role: 'Guru Bimbingan Konseling', photo: 'foto_guru/pak iqbal.png' },
    { id: 32, name: 'Purwanti, S.Pd', role: 'Guru Piket', photo: 'foto_guru/bu pur.png' },
    { id: 33, name: 'Nur Asni Bate\'e, SE', role: 'Guru Tata Usaha', photo: 'foto_guru/bu asni.png' },
    { id: 34, name: 'Febri Ariani Lubis, SE', role: 'Guru Produktif Akuntansi', photo: 'foto_guru/mis feby.png' },
    { id: 35, name: 'Muhammad Agus Faisal, SE', role: 'Ketua Lab. TBSM', photo: 'foto_guru/pak faisal tbsm.png' }
  ],

  // ---- PROFILE ----
  profile: {
    visi: 'Mewujudkan Pendidikan Vokasi yang Bermutu, menghasilkan sumber daya manusia yang berakhlak mulia, memiliki karakter wirausaha, sesuai dengan IMTA & IPTEK',
    misi: [
      'Memberikan Pembelajaran secara optimal dalam bidang Al-Islam Kemuhammadiyahan.',
      'Menyelenggarakan Pembelajaran Berbasis Teknologi dan Informasi.',
      'Meningkatkan Kompetensi Guru dan siswa melalui pelatihan dan pemagangan di dunia industri dan usaha.',
      'Menyiapkan lulusan pelajar pancasila yang berkarakter siga, tanggap, terampil, berjiwa wirausaha, berakhlaq mulia dan mampu mengembangkan diri sesuai dengan perkembangan zaman.',
      'Mewujudkan lingkungan pendidikan yang hijau dan menyenangkan.'
    ],
    tujuan: 'SMK Muhammadiyah 8 Medan bertujuan memberikan keterampilan praktis, persiapan dunia kerja, dan pembentukan karakter sesuai nilai-nilai muhammadiyah. Melibatkan pendekatan inovatif dengan teknologi, sekolah ini komit terhadap lulusan yang terampil dan integritas, menjembatani kesenjangan teori-praktik untuk menciptakan individu yang siap bersaing di pasar global.',
    identitas: {
      namaSekolah: 'SMK Muhammadiyah -8 Medan',
      npsn: '10211244',
      nss: '3344076007096',
      nds: 'G.17094208',
      siop: '/421.5 /203',
      alamat: 'Jl. Abdul Hakim No.2',
      kelurahan: 'Tanjung Sari',
      kecamatan: 'Medan Selayang',
      kota: 'Medan',
      provinsi: 'Sumatera Utara',
      kodePos: '20132',
      telepon: '(061) 8229601',
      kurikulum: 'Kurikulum Merdeka',
      statusSekolah: 'Swasta',
      akreditasi: 'A',
      kepalaSekolah: 'Sulastri, S.Pd.I'
    }
  },

  // ---- KEPALA SEKOLAH ----
  kepalaSekolah: {
    name: 'Sulastri, S.Pd.I',
    title: 'Kepala Sekolah',
    photo: 'foto_guru/umi.png',
    quote: '"SELAMAT DATANG DI SMK MUHAMMADIYAH 08 MEDAN SMK PUSAT KEUNGGULAN"',
    sambutan: 'Sebagai Kepala Sekolah, saya dengan bangga menyambut Anda semua, para siswa, orang tua, dan seluruh staf kebersamaan ini. SMK Muhammadiyah 08 Medan memiliki tekad dan komitmen untuk memberikan pendidikan berkualitas tinggi yang tidak hanya mempersiapkan siswa untuk masa depan akademis, tetapi juga membentuk karakter dan nilai-nilai luhur. Di SMK Muhammadiyah 08 Medan, kami menempatkan siswa sebagai pusat dari segala upaya pendidikan. Kami berkomitmen untuk menciptakan lingkungan yang mendukung perkembangan penuh potensi setiap siswa.'
  },

  // ---- EXTRACURRICULAR ----
  ekstrakurikuler: [
    { id: 1, name: 'Band', description: 'Pengembangan minat dan bakat musik siswa dengan peralatan musik modern', icon: 'fas fa-music', image: 'images/service1.jpg', schedule: 'Sabtu, 14.00 - 16.00' },
    { id: 2, name: 'Tapak Suci', description: 'Seni bela diri khas Muhammadiyah berprestasi dan pembentukan raga kuat', icon: 'fas fa-hand-fist', image: 'images/service.2.jpg', schedule: 'Jumat, 15.00 - 17.00' },
    { id: 3, name: 'Paskibra', description: 'Pelatihan kedisiplinan dan baris-berbaris untuk upacara dan lomba', icon: 'fas fa-flag', image: 'images/service.3.jpg', schedule: 'Kamis, 15.00 - 17.00' },
    { id: 4, name: 'Futsal', description: 'Olahraga futsal kompetitif melatih fisik, strategi, dan kerja sama tim', icon: 'fas fa-futbol', image: 'images/service1.jpg', schedule: 'Sabtu, 08.00 - 10.00' }
  ],

  // ---- GALLERY ----
  gallery: {
    categories: ['Semua', 'Kegiatan', 'Fasilitas', 'Prestasi', 'Event'],
    items: [
      { id: 1, title: 'Workshop Kewirausahaan Berbasis Digital', category: 'Kegiatan', image: 'gallery/1.jpg', date: '14 September 2023', description: 'Membangun bisnis & Menghasilkan income dengan Kreativitas Desain & Animasi, Agenda SMK PK.' },
      { id: 2, title: 'Kegiatan Malam Bina Iman dan Taqwa', category: 'Kegiatan', image: 'gallery/3.jpg', date: '17 September 2023', description: 'Sosialisasi Ibadah Praktis Sesuai Sunnah untuk meningkatkan Kualitas Iman dan Taqwa Siswa.' },
      { id: 3, title: 'Workshop RTL Upskilling dan Reskilling DKV', category: 'Kegiatan', image: 'gallery/2.jpg', date: '9 September 2023', description: 'Mengupgrade Ilmu Pengetahuan dan keterampilan khususnya di bidang Videografi.' },
      { id: 4, title: 'Kegiatan Ujian Kompetensi Keahlian', category: 'Prestasi', image: 'gallery/4.jpg', date: 'T.A 2022/2023', description: 'Pelaksanaan Ujian Kompetensi Keahlian SMK Muhammadiyah 8 Medan.' },
      { id: 5, title: 'Gedung Sekolah SMK Muhammadiyah 8 Medan', category: 'Fasilitas', image: 'images/gedung sekolah.jpg', date: 'Fasilitas Utama', description: 'Gedung pembelajaran yang representatif dan nyaman.' }
    ]
  },

  // ---- FACILITIES ----
  fasilitas: [
    { id: 1, name: 'Lab Komputer', description: 'Laboratorium komputer modern dengan 40 unit PC untuk praktikum TKJ', icon: 'fas fa-desktop', image: 'images/gedung sekolah.jpg' },
    { id: 2, name: 'Lab Otomotif & Bengkel TBSM', description: 'Bengkel otomotif lengkap berstandar industri untuk praktek TBSM', icon: 'fas fa-wrench', image: 'images/gedung kelas permanen.jpg' },
    { id: 3, name: 'Studio DKV', description: 'Studio desain komunikasi visual profesional dan editing video', icon: 'fas fa-paint-brush', image: 'images/gedung sekolah.jpg' },
    { id: 4, name: 'Perpustakaan Digital', description: 'Perpustakaan dengan koleksi buku fisik dan literasi digital yang lengkap', icon: 'fas fa-book', image: 'images/gedung kelas permanen.jpg' },
    { id: 5, name: 'Masjid Sekolah', description: 'Masjid sekolah untuk kegiatan sholat berjamaah dan kajian Al-Islam', icon: 'fas fa-mosque', image: 'images/gedung sekolah.jpg' },
    { id: 6, name: 'Lapangan Olahraga', description: 'Lapangan olahraga serbaguna untuk futsal, voli, dan upacara bendera', icon: 'fas fa-futbol', image: 'images/gedung kelas permanen.jpg' }
  ]
};

// =============================================
//  STORAGE FUNCTIONS
// =============================================
function getContent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
    const parsed = JSON.parse(stored);
    return deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONTENT)), parsed);
  } catch (e) {
    console.error('Error reading content:', e);
    return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  }
}

function saveContent(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving content:', e);
    return false;
  }
}

function resetContent() {
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

// =============================================
//  FEEDBACK STORAGE FUNCTIONS
// =============================================
function getFeedbacks() {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading feedbacks:', e);
    return [];
  }
}

function saveFeedback(feedbackItem) {
  try {
    const list = getFeedbacks();
    const item = {
      id: Date.now(),
      nama: feedbackItem.nama || 'Anonim',
      kontak: feedbackItem.kontak || '-',
      saran: feedbackItem.saran || '',
      kritik: feedbackItem.kritik || '',
      tanggal: new Date().toLocaleString('id-ID'),
      status: 'Baru'
    };
    list.unshift(item);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Error saving feedback:', e);
    return false;
  }
}

function deleteFeedback(id) {
  try {
    const list = getFeedbacks().filter(item => item.id !== id);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Error deleting feedback:', e);
    return false;
  }
}

function clearFeedbacks() {
  localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  return true;
}

// =============================================
//  EXPORT for web pages & Node.js
// =============================================
if (typeof module !== 'undefined') {
  module.exports = {
    getContent,
    saveContent,
    resetContent,
    getFeedbacks,
    saveFeedback,
    deleteFeedback,
    clearFeedbacks,
    DEFAULT_CONTENT
  };
}
