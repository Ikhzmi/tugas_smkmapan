// Data repository for SMK Muhammadiyah 8 Medan (MAPAN)
// Integrated with authentic assets from src/assets and verified school records
import { ASSETS } from './assets';

export const SCHOOL_INFO = {
  name: "SMK Muhammadiyah 8 Medan",
  shortName: "SMK MAPAN",
  predicate: "SMK Pusat Keunggulan",
  accreditation: "A (Unggul) BAN-SM",
  curriculum: "Kurikulum Merdeka",
  npsn: "10211244",
  nss: "3344076007096",
  hotline: "0813-7080-6663",
  hotlineRaw: "6281370806663",
  phone: "(061) 8229601",
  website: "smkmuhammadiyah08.sch.id",
  whatsapp: "6282165415890",
  mapsUrl: "https://maps.app.goo.gl/7QVjJmF8Z7sJepAK6",
  instagram: "officialsmkmapan",
  logoUrl: "",
  email: "smkmd08medan@gmail.com",
  address: "Jl. Abdul Hakim No.2, Tanjung Sari, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20132",
  operatingHours: "Senin – Sabtu: 07.30 – 16.00 WIB",
  principal: "Sulastri, S.Pd.I",
  principalPhoto: ASSETS.teachers.umiSulastri,
  quote: {
    text: "Kegagalan adalah pelajaran, bukan akhir dari perjalananmu. Terus maju, dan kamu akan meraih kesuksesan.",
    author: "Keluarga Besar SMK Muhammadiyah 8 Medan"
  },
  stats: [
    { label: "Akreditasi BAN-SM", value: "Predikat A", detail: "Terakreditasi Unggul" },
    { label: "Keterserapan Lulusan", value: "98.5%", detail: "Industri, Wirausaha & PTN" },
    { label: "Program Keahlian", value: "4 Unggulan", detail: "TKJ, DKV, AKL & TBSM" },
    { label: "Mitra Industri Aktif", value: "45+ DUDI", detail: "Cisco, Mikrotik, Bank Syariah" }
  ]
};

export const MAJORS_DATA = [
  {
    id: "tkj",
    code: "TKJ",
    name: "Teknik Komputer dan Jaringan",
    tagline: "Spesialis Cloud, Infrastruktur Jaringan & Cyber Security",
    color: "#0284C7",
    colorSoft: "#E0F2FE",
    icon: "Network",
    registrationFee: 825000,
    monthlySpp: 275000,
    registrationFormatted: "Rp 825.000",
    sppFormatted: "Rp 275.000 / bulan",
    image: ASSETS.majors.tkj,
    facilityImage: ASSETS.facilities.labDkv,
    description: "Membekali siswa dengan keahlian perakitan komputer, manajemen server cloud, konfigurasi router Mikrotik & Cisco, fiber optic, serta administrasi sistem operasi jaringan modern.",
    curriculum: [
      "Administrasi Infrastruktur Jaringan (AIJ)",
      "Administrasi Server Jaringan (ASJ)",
      "Teknologi Jaringan Berbasis Luas (WAN & Fiber Optic)",
      "Perakitan Komputer & Maintenance Hardware",
      "Sistem Keamanan Jaringan & Cloud Computing",
      "MikroTik Certified Network Associate (MTCNA)"
    ],
    facilities: [
      "Laboratorium Cisco Networking Academy",
      "MikroTik Training Center & Routerboard Rack",
      "Server Data Center Mandiri ber-AC",
      "Fiber Optic Fusion Splicer Toolset",
      "High-Speed Gigabit LAN & IoT Sandbox"
    ],
    careers: [
      "Network Administrator",
      "Cloud Infrastructure Specialist",
      "IT Support & Systems Engineer",
      "Cybersecurity Junior Analyst",
      "Fiber Optic Technician"
    ],
    certifications: ["Cisco CCNA Introduction", "MikroTik MTCNA", "BNSP Klaster Jaringan Komputer"]
  },
  {
    id: "dkv",
    code: "DKV",
    name: "Desain Komunikasi Visual",
    tagline: "Pencipta Karya Animasi 3D, Motion Graphic & Creative Branding",
    color: "#FF6B00",
    colorSoft: "#FFF7ED",
    icon: "Palette",
    registrationFee: 825000,
    monthlySpp: 300000,
    registrationFormatted: "Rp 825.000",
    sppFormatted: "Rp 300.000 / bulan",
    image: ASSETS.majors.dkv,
    facilityImage: ASSETS.facilities.labDkv,
    description: "Mengembangkan potensi visual siswa dalam pembuatan animasi motion graphics, branding visual perusahaan, video editing profesional, fotografi studio, serta UI/UX interface digital.",
    curriculum: [
      "Motion Graphics & 3D Modeling (Blender & After Effects)",
      "Desain Grafis Vektor & Ilustrasi Digital (Illustrator)",
      "Videografi, Sinematografi & Editing Audio-Visual",
      "Fotografi Studio & Lighting Commercial",
      "Digital Marketing & Creative Content Strategy",
      "UI/UX Design & Prototyping Web/Mobile"
    ],
    facilities: [
      "Creative Lab Workstation iMac & Core-i7",
      "Soundproof Green Screen & Podcast Studio",
      "Wacom & Huion Drawing Tablets",
      "DSLR & Mirrorless 4K Cinema Camera Kits",
      "Continuous Softbox & Strobe Lighting Sets"
    ],
    careers: [
      "Motion Graphic Animator",
      "Creative Director / Art Director",
      "UI/UX Interface Designer",
      "Professional Video Editor & Colorist",
      "Commercial Photographer & Brand Strategist"
    ],
    certifications: ["Adobe Certified Associate (Illustrator & Premiere)", "BNSP Pembuatan Desain Grafis"]
  },
  {
    id: "akl",
    code: "AKL",
    name: "Akuntansi & Keuangan Lembaga",
    tagline: "Ahli Pembukuan Modern, Perpajakan & Perbankan Syariah Digital",
    color: "#059669",
    colorSoft: "#ECFDF5",
    icon: "Calculator",
    registrationFee: 825000,
    monthlySpp: 275000,
    registrationFormatted: "Rp 825.000",
    sppFormatted: "Rp 275.000 / bulan",
    image: ASSETS.majors.akl,
    facilityImage: ASSETS.facilities.belajar,
    description: "Mempersiapkan tenaga akuntan muda yang cakap dalam pembukuan dagang & manufaktur, otomasi akuntansi komputer (MYOB/Accurate), laporan keuangan pemerintah, dan operasional perbankan syariah.",
    curriculum: [
      "Komputer Akuntansi (MYOB Premier & Accurate Accounting)",
      "Akuntansi Perusahaan Jasa, Dagang & Manufaktur",
      "Akuntansi Lembaga / Instansi Pemerintah",
      "Praktikum Perpajakan (e-SPT & PPh / PPN)",
      "Administrasi Perbankan Syariah & Lembaga Keuangan Mikro",
      "Manajemen Kas Kecil & Spreadsheet Finansial Lanjut"
    ],
    facilities: [
      "Laboratorium Mini Bank Syariah Mapan",
      "Tax Center Terpadu & Simulasi DJP Online",
      "Ruang Komputer Akuntansi Terlisensi MYOB",
      "Mesin Kasir POS & Penghitung Uang Otomatis",
      "Sistem Pembukuan Cloud Terintegrasi"
    ],
    careers: [
      "Staff Akuntan Publik / Junior Auditor",
      "Customer Service & Teller Perbankan",
      "Tax Compliance Specialist",
      "Financial Budgeting Officer",
      "Wirausahawan Mandiri Finansial"
    ],
    certifications: ["Sertifikasi Kompetensi BNSP Teknisi Akuntansi Yunior", "Certified MYOB Professional"]
  },
  {
    id: "tsm",
    code: "TBSM",
    name: "Teknik Sepeda Motor",
    tagline: "Teknisi Profesional Roda Dua, Injeksi Modern & Bengkel Resmi",
    color: "#DC2626",
    colorSoft: "#FEE2E2",
    icon: "Wrench",
    registrationFee: 825000,
    monthlySpp: 275000,
    registrationFormatted: "Rp 825.000",
    sppFormatted: "Rp 275.000 / bulan",
    image: ASSETS.majors.tsm,
    facilityImage: ASSETS.facilities.gedungKelas,
    description: "Program keahlian teknik mekanik sepeda motor berstandar bengkel ATPM resmi. Mempelajari sistem kelistrikan injeksi EFI, overhaul mesin, sistem rem ABS, dan manajemen wirausaha bengkel modern.",
    curriculum: [
      "Pemeliharaan Mesin Sepeda Motor (PMSM)",
      "Pemeliharaan Sasis & Sistem Suspensi (PKS)",
      "Pemeliharaan Kelistrikan & Sensor Injeksi EFI",
      "Diagnosis Kerusakan Komputerisasi (OBD Scanner)",
      "Manajemen Pengelolaan Bengkel & Sparepart"
    ],
    facilities: [
      "Bengkel Praktik TBSM Standar ATPM",
      "Unit Sepeda Motor Uji Praktik Injeksi Terbaru",
      "Hydraulic Bike Lift & Diagnostic Scanner",
      "Toolbox Mekanik Lengkap Berstandar Industri"
    ],
    careers: [
      "Teknisi Bengkel Resmi ATPM",
      "Service Advisor Sepeda Motor",
      "Owner & Wirausaha Bengkel Mandiri",
      "Quality Control Mekanik Perakitan"
    ],
    certifications: ["BNSP Teknisi Sepeda Motor", "Sertifikasi Uji Emisi & EFI"]
  }
];

export const TEACHERS_DATA = [
  {
    id: "sulastri",
    name: "Sulastri, S.Pd.I",
    role: "Kepala Sekolah",
    department: "Pimpinan Sekolah",
    image: ASSETS.teachers.umiSulastri,
    certifications: ["Kepala Sekolah Penggerak", "Penyusun Kurikulum Merdeka Vokasi", "Pelatih Pembelajaran Aktif"],
    bio: "Memimpin SMK Muhammadiyah 8 Medan menuju predikat SMK Pusat Keunggulan dengan fokus kurikulum berbasis industri 4.0, penguatan karakter Al-Islam, dan kemandirian vokasi siswa.",
    hours: "Senin – Jumat (07.30 – 16.00 WIB)",
    email: "sulastri@smkmuh8medan.sch.id"
  },
  {
    id: "luli",
    name: "Luliadi, M.Pd",
    role: "Wakil Kepala Sekolah & Pengajar Senior",
    department: "Pimpinan Sekolah",
    image: ASSETS.teachers.pakLuli,
    certifications: ["Asesor Pendidikan Vokasi", "Magister Pendidikan", "Pendidik Profesional"],
    bio: "Mendampingi tata kelola dan pengembangan akademik sekolah menuju standar keunggulan vokasi nasional.",
    hours: "Senin – Jumat (07.30 – 16.00 WIB)",
    email: "luliadi@smkmuh8medan.sch.id"
  },
  {
    id: "antoni",
    name: "Ahmad Antoni, A.Md",
    role: "Wakil Kepala Bidang Kesiswaan",
    department: "Kesiswaan & Ekstrakurikuler",
    image: ASSETS.teachers.pakToni,
    certifications: ["Pembina IPM & Kedisiplinan", "Instruktur Karakter Vokasi"],
    bio: "Membimbing kedisiplinan, organisasi IPM, ekstrakurikuler Tapak Suci, seni musik, dan pembentukan karakter kepemimpinan siswa.",
    hours: "Senin – Jumat (07.30 – 16.00 WIB)",
    email: "ahmad.antoni@smkmuh8medan.sch.id"
  },
  {
    id: "aldy",
    name: "Muhammad Fitra Aldy, A.Md",
    role: "Guru Produktif TKJ",
    department: "Teknik Komputer & Jaringan",
    image: ASSETS.teachers.pakAldy,
    certifications: ["MikroTik MTCNA", "Cisco Certified", "Spesialis Cloud Network"],
    bio: "Instruktur perakitan server, routing MikroTik, konfigurasi jaringan fiber optic, dan keamanan data center mandiri.",
    hours: "Senin – Kamis (08.00 – 15.00 WIB)",
    email: "fitra.aldy@smkmuh8medan.sch.id"
  },
  {
    id: "fansuri",
    name: "M. Fansuri Syuhada, A.Md MM",
    role: "Guru Produktif DKV",
    department: "Desain Komunikasi Visual",
    image: ASSETS.teachers.pakFansuri,
    certifications: ["Adobe Certified Expert", "Creative Director Multimedia", "Motion Specialist"],
    bio: "Membina siswa dalam produksi video sinematik, motion graphic 3D, ilustrasi digital, dan fotografi komersial.",
    hours: "Senin – Jumat (08.00 – 15.30 WIB)",
    email: "fansuri.syuhada@smkmuh8medan.sch.id"
  },
  {
    id: "surip",
    name: "Drs. Surip",
    role: "Guru Produktif Akuntansi",
    department: "Akuntansi & Keuangan Lembaga",
    image: ASSETS.teachers.pakSurip,
    certifications: ["Certified MYOB Professional", "Asesor Kompetensi BNSP", "Konsultan Pajak"],
    bio: "Pengajar senior akuntansi keuangan, pembukuan dagang/manufaktur, dan otomasi pembukuan digital mini bank sekolah.",
    hours: "Senin – Kamis (08.00 – 14.30 WIB)",
    email: "surip@smkmuh8medan.sch.id"
  },
  {
    id: "fauzul",
    name: "Muhammad Fauzul Iryandi, S.Kom",
    role: "Guru Produktif TKJ",
    department: "Teknik Komputer & Jaringan",
    image: ASSETS.teachers.pakFauzul,
    certifications: ["BNSP Network Administrator", "Linux Server Specialist"],
    bio: "Fokus pada praktikum administrasi server Linux, routing OSPF Mikrotik, dan implementasi jaringan nirkabel enterprise.",
    hours: "Senin – Jumat (08.00 – 15.00 WIB)",
    email: "fauzul.iryandi@smkmuh8medan.sch.id"
  },
  {
    id: "fika",
    name: "Rafika Sari, S.Kom",
    role: "Guru Produktif TKJ",
    department: "Teknik Komputer & Jaringan",
    image: ASSETS.teachers.buFika,
    certifications: ["IT Support Specialist", "Instruktur Cisco IT Essentials"],
    bio: "Mengembangkan modul praktikum hardware komputer, sistem operasi jaringan, dan troubleshooting perangkat jaringan.",
    hours: "Senin – Kamis (08.00 – 15.00 WIB)",
    email: "rafika.sari@smkmuh8medan.sch.id"
  },
  {
    id: "fais",
    name: "Tengku Ahmad Faisal, S.I.Kom",
    role: "Guru Produktif DKV",
    department: "Desain Komunikasi Visual",
    image: ASSETS.teachers.pakFais,
    certifications: ["Digital Content Producer", "Broadcasting & Audio Visual"],
    bio: "Mengajar teknik videografi, sinematografi, podcasting, serta tata artistik pameran karya siswa DKV.",
    hours: "Selasa – Sabtu (08.00 – 15.00 WIB)",
    email: "ahmad.faisal@smkmuh8medan.sch.id"
  },
  {
    id: "syaifah",
    name: "Syaifah, SE, S.Pd",
    role: "Guru Produk Kreatif & Kewirausahaan",
    department: "Akuntansi & Bisnis",
    image: ASSETS.teachers.buSyaifah,
    certifications: ["Pendamping UMKM Vokasi", "Praktisi Manajemen Bisnis"],
    bio: "Membimbing siswa merintis ide bisnis kreatif, penyusunan proposal usaha, serta penjualan produk karya jurusan ke pasar nyata.",
    hours: "Senin – Kamis (08.00 – 14.30 WIB)",
    email: "syaifah@smkmuh8medan.sch.id"
  },
  {
    id: "novri",
    name: "Novriza, S.Pd",
    role: "Guru Produktif TBSM",
    department: "Teknik Sepeda Motor",
    image: ASSETS.teachers.pakNovri,
    certifications: ["Instruktur Bengkel Injeksi", "BNSP Otomotif Roda Dua"],
    bio: "Ahli permesinan motor injeksi EFI, trouble shooting elektrikal motor, dan pembina uji kompetensi kejuruan TBSM.",
    hours: "Senin – Jumat (07.30 – 15.30 WIB)",
    email: "novriza@smkmuh8medan.sch.id"
  },
  {
    id: "jaka",
    name: "Jaka Mulia Ramadhan, ST",
    role: "Guru Produktif TBSM",
    department: "Teknik Sepeda Motor",
    image: ASSETS.teachers.pakJaka,
    certifications: ["Sarjana Teknik Mesin", "Spesialis Sasis & Transmisi Otomatis"],
    bio: "Mengajar mekanisme katup, overhaul engine, dan teknologi motor matic generasi terbaru dengan standar industri ATPM.",
    hours: "Senin – Kamis (08.00 – 15.00 WIB)",
    email: "jaka.ramadhan@smkmuh8medan.sch.id"
  },
  {
    id: "nana",
    name: "Nana Sholehayati Pohan, S.Pd",
    role: "Guru Bahasa Inggris Kejuruan",
    department: "Bahasa & Literasi Global",
    image: ASSETS.teachers.misNana,
    certifications: ["TOEFL Certified", "Communicative English Trainer"],
    bio: "Mempersiapkan siswa vokasi agar mampu berkomunikasi teknis dalam Bahasa Inggris untuk wawancara kerja dan industri global.",
    hours: "Senin – Kamis (08.00 – 15.00 WIB)",
    email: "nana.pohan@smkmuh8medan.sch.id"
  },
  {
    id: "nuri",
    name: "Nur Imayanti, S.Pd",
    role: "Guru Matematika Terapan",
    department: "Sains & Matematika",
    image: ASSETS.teachers.misNuri,
    certifications: ["Pembina Olimpiade Matematika", "Instruktur Logika Algoritma"],
    bio: "Membantu siswa memahami penerapan matematika logika dalam perhitungan akuntansi, networking, dan grafika komputer.",
    hours: "Senin – Jumat (08.00 – 15.00 WIB)",
    email: "nur.imayanti@smkmuh8medan.sch.id"
  },
  {
    id: "andi",
    name: "Andi Syahputra, M.Kom.I",
    role: "Guru Al-Qur'an & PAI",
    department: "Pendidikan Agama Islam",
    image: ASSETS.teachers.pakAndi,
    certifications: ["Hafiz Al-Qur'an", "Magister Komunikasi Islam"],
    bio: "Membina nilai moral, akhlakul karimah, keteladanan ibadah, dan kajian Islam praktis bagi generasi muda vokasi.",
    hours: "Senin – Kamis (07.30 – 14.00 WIB)",
    email: "andi.syahputra@smkmuh8medan.sch.id"
  },
  {
    id: "deni",
    name: "Deni Ramanda Kasbi, S.Pd",
    role: "Guru PKN & Sejarah",
    department: "Ilmu Sosial & Humaniora",
    image: ASSETS.teachers.pakDeni,
    certifications: ["Pendidik Kebangsaan", "Pelatih Debat Konstitusi"],
    bio: "Menanamkan nilai-nilai kebangsaan, wawasan hukum ketenagakerjaan, serta sejarah perjuangan bangsa.",
    hours: "Senin – Jumat (08.00 – 15.00 WIB)",
    email: "deni.kasbi@smkmuh8medan.sch.id"
  },
  {
    id: "azandi",
    name: "Azandi Pratama, S.Pd",
    role: "Guru PAI & Budi Pekerti",
    department: "Pendidikan Agama Islam",
    image: ASSETS.teachers.pakAzandi,
    certifications: ["Konselor Remaja Islami", "Trainer Tarbiyah Remaja"],
    bio: "Berfokus pada pembentukan integritas, kejujuran kerja, dan etos ibadah di lingkungan sekolah dan tempat praktik kerja.",
    hours: "Senin – Kamis (08.00 – 14.30 WIB)",
    email: "azandi.pratama@smkmuh8medan.sch.id"
  },
  {
    id: "indah",
    name: "Indah Mustika, S.Pd",
    role: "Guru PKN & Sejarah",
    department: "Ilmu Sosial & Humaniora",
    image: ASSETS.teachers.buIndah,
    certifications: ["Guru Penggerak", "Pembina Literasi Sekolah"],
    bio: "Mengembangkan pembelajaran aktif interaktif yang mengasah daya nalar kritis siswa terhadap isu kebangsaan dan etika profesi.",
    hours: "Senin – Kamis (08.00 – 15.00 WIB)",
    email: "indah.mustika@smkmuh8medan.sch.id"
  },
  {
    id: "akbar",
    name: "Ade Arihta Akbar, S.S",
    role: "Guru Bahasa Arab",
    department: "Bahasa & Al-Islam",
    image: ASSETS.teachers.pakAkbar,
    certifications: ["Penerjemah Bahasa Arab", "Instruktur Muhadatsah"],
    bio: "Membimbing siswa dalam percakapan Bahasa Arab dasar dan pengenalan kosakata Al-Qur'an serta literatur Islam.",
    hours: "Senin – Rabu (08.00 – 14.00 WIB)",
    email: "ade.akbar@smkmuh8medan.sch.id"
  },
  {
    id: "eza",
    name: "Ezaita Maisyaroh Ritonga, M.Pd",
    role: "Guru Matematika Kejuruan",
    department: "Sains & Matematika",
    image: ASSETS.teachers.buEza,
    certifications: ["Magister Pendidikan Matematika", "Peneliti Model Pembelajaran Vokasi"],
    bio: "Mengajarkan konsep kalkulasi matematika terapan dalam analisis data, peluang statistik, dan pemodelan teknik.",
    hours: "Senin – Jumat (08.00 – 15.00 WIB)",
    email: "ezaita.ritonga@smkmuh8medan.sch.id"
  },
  {
    id: "afifah",
    name: "Afifah Septiarini, S.Pd",
    role: "Guru Bahasa Indonesia",
    department: "Bahasa & Literasi Global",
    image: ASSETS.teachers.buAfifah,
    certifications: ["Pelatih Penulisan Kreatif & Karya Ilmiah"],
    bio: "Membimbing siswa dalam penulisan laporan praktikum, karya tulis ilmiah, dan keterampilan presentasi publik profesional.",
    hours: "Senin – Kamis (08.00 – 15.00 WIB)",
    email: "afifah.septiarini@smkmuh8medan.sch.id"
  },
  {
    id: "andes",
    name: "Andes Martua Harahap, M.Pd",
    role: "Guru Penjaskes & Olahraga",
    department: "Kebugaran & Prestasi Atlet",
    image: ASSETS.teachers.pakAndes,
    certifications: ["Pelatih Futsal & Atletik", "Magister Olahraga"],
    bio: "Melatih kebugaran fisik, daya tahan, kekompakan tim, dan sportivitas melalui cabang futsal, bola basket, dan atletik.",
    hours: "Senin – Jumat (07.30 – 15.00 WIB)",
    email: "andes.harahap@smkmuh8medan.sch.id"
  },
  {
    id: "pur",
    name: "Purwanti, S.Pd",
    role: "Guru Piket & Bimbingan Konseling",
    department: "Layanan Siswa & Konseling",
    image: ASSETS.teachers.buPur,
    certifications: ["Konselor Pendidikan Remaja", "Pengelola Disiplin Siswa"],
    bio: "Mendampingi siswa dalam mengatasi kendala belajar, penjurusan minat bakat, dan konseling pengembangan pribadi.",
    hours: "Senin – Sabtu (07.30 – 15.00 WIB)",
    email: "purwanti@smkmuh8medan.sch.id"
  },
  {
    id: "asni",
    name: "Nur Asni Bate'e, SE",
    role: "Kepala Tata Usaha & Administrasi",
    department: "Tata Usaha & Keuangan",
    image: ASSETS.teachers.buAsni,
    certifications: ["Manajemen Arsip Digital", "Administrasi Pendidikan"],
    bio: "Melayani administrasi siswa, surat keterangan, kartu pelajar RFID, dan koordinasi penerimaan peserta didik baru (PPDB).",
    hours: "Senin – Sabtu (07.30 – 16.00 WIB)",
    email: "nur.asni@smkmuh8medan.sch.id"
  }
];

export const LMS_DAILY_SCHEDULE = [
  {
    time: "08.00 - 10.15 WIB",
    major: "TKJ",
    subject: "Administrasi Infrastruktur Jaringan",
    teacher: "Muhammad Fitra Aldy, A.Md",
    room: "Lab Cisco & Cloud 201",
    status: "Sedang Berlangsung",
    color: "#0284C7"
  },
  {
    time: "10.45 - 12.30 WIB",
    major: "DKV",
    subject: "Motion Design & Render 3D Engine",
    teacher: "M. Fansuri Syuhada, A.Md MM",
    room: "Creative Studio iMac 104",
    status: "Selanjutnya",
    color: "#FF6B00"
  },
  {
    time: "13.30 - 15.00 WIB",
    major: "AKL",
    subject: "Komputer Akuntansi Keuangan (MYOB)",
    teacher: "Drs. Surip",
    room: "Lab Mini Bank 302",
    status: "Akan Datang",
    color: "#059669"
  }
];

export const SHOWCASE_EPISODES = [
  {
    id: "ep1",
    epNumber: "Ep. 01",
    title: "Animasi Motion Graphic Edukasi",
    creator: "Team Creative Mapan (DKV)",
    duration: "03:42",
    description: "Karya animasi 3D menceritakan pentingnya literasi digital di kalangan remaja. Menggunakan Blender 4.0 dan After Effects dengan teknik flat shaded 3D.",
    software: ["Blender 3D", "Adobe After Effects", "Cinema 4D"],
    image: ASSETS.gallery[1].image
  },
  {
    id: "ep2",
    epNumber: "Ep. 02",
    title: "Perakitan Server Rack & Konfigurasi Jaringan",
    creator: "Divisi TKJ Industri",
    duration: "05:18",
    description: "Dokumentasi instalasi 42U server rack, manajemen kabel patch panel berstandar TIA/EIA-568, serta setup OSPF multi-area pada routerboard MikroTik.",
    software: ["Cisco Packet Tracer", "MikroTik WinBox", "Wireshark"],
    image: ASSETS.facilities.labDkv
  },
  {
    id: "ep3",
    epNumber: "Ep. 03",
    title: "Otomasi Laporan Keuangan MYOB & Mini Bank",
    creator: "Laboratorium AKL",
    duration: "04:12",
    description: "Simulasi alur transaksi penjualan kredit, kartu persediaan metode perpetual FIFO, dan penyusunan neraca lajur otomatis dalam tempo 15 menit.",
    software: ["MYOB Premier v19", "Accurate 5", "Microsoft Excel Lanjut"],
    image: ASSETS.facilities.belajar
  },
  {
    id: "ep4",
    epNumber: "Ep. 04",
    title: "Karya Dokumenter Profil Sekolah MAPAN TV",
    creator: "Broadcast Club & Team Creative",
    duration: "06:30",
    description: "Video sinematik profil sekolah karya kolaborasi siswa DKV dan TKJ. Menyoroti kehidupan praktikum, fasilitas modern, dan prestasi lomba kejuruan nasional.",
    software: ["Premiere Pro", "DaVinci Resolve", "Sony FX3 Rig"],
    image: ASSETS.facilities.gedungUtama
  }
];

export const CBT_QUESTIONS = [
  {
    id: 1,
    category: "TKJ - Jaringan",
    question: "Protokol routing dinamis manakah yang menggunakan algoritma Link-State dan Dijkstra (SPF) untuk menentukan rute jaringan terpendek secara efisien?",
    options: [
      { id: "A", text: "Routing Information Protocol (RIP v2)" },
      { id: "B", text: "Open Shortest Path First (OSPF)" },
      { id: "C", text: "Interior Gateway Routing Protocol (IGRP)" },
      { id: "D", text: "Static Routing Administrative Distance 1" }
    ],
    correctAnswer: "B",
    explanation: "OSPF merupakan Link-State protocol yang memanfaatkan algoritma Dijkstra (Shortest Path First) untuk menghitung jalur terbaik dan konvergen cepat pada topologi jaringan besar."
  },
  {
    id: 2,
    category: "DKV - Grafis",
    question: "Format grafis berikut yang berbasis matematis (vektor) sehingga tidak akan mengalami pecah atau penurunan resolusi saat diperbesar tanpa batas adalah...",
    options: [
      { id: "A", text: "JPEG (Joint Photographic Experts Group)" },
      { id: "B", text: "PNG-24 dengan Alpha Transparency" },
      { id: "C", text: "SVG (Scalable Vector Graphics)" },
      { id: "D", text: "GIF 256 Colors" }
    ],
    correctAnswer: "C",
    explanation: "SVG menggunakan format XML berbasis koordinat vektor matematis sehingga resolusi independen dan sangat tajam di berbagai ukuran layar."
  },
  {
    id: 3,
    category: "AKL - Akuntansi",
    question: "Dalam persamaan dasar akuntansi, rumus yang benar untuk mencerminkan posisi neraca keuangan adalah...",
    options: [
      { id: "A", text: "Aset = Liabilitas + Ekuitas" },
      { id: "B", text: "Liabilitas = Aset + Modal" },
      { id: "C", text: "Ekuitas = Aset + Utang" },
      { id: "D", text: "Beban = Pendapatan - Kas" }
    ],
    correctAnswer: "A",
    explanation: "Persamaan dasar akuntansi menyatakan bahwa seluruh kekayaan (Aset) sekolah atau perusahaan selalu seimbang dengan jumlah Utang (Liabilitas) dan Modal Pemilik (Ekuitas)."
  }
];
