<?php

namespace Database\Seeders;

use App\Models\Eskul;
use App\Models\Facility;
use App\Models\Gallery;
use App\Models\Major;
use App\Models\SiteSetting;
use App\Models\Teacher;
use App\Models\Video;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Data konten asli SMK Muhammadiyah 8 Medan (SMK MAPAN) untuk landing page & CMS.
 *
 * Menggantikan data placeholder: identitas sekolah, hero, profil (visi/misi/
 * sejarah/kartu kepala sekolah), copy semua section, tampilan, 4 program
 * keahlian, 24 tenaga pendidik, fasilitas, galeri, ekstrakurikuler, dan video
 * profil — lengkap dengan foto (diunggah ke Supabase Storage dari
 * database/seed-assets, URL-nya disimpan di kolom *_url database).
 *
 * Idempotent: aman dijalankan berulang (updateOrCreate berdasarkan kunci unik).
 */
class SchoolContentSeeder extends Seeder
{
    /** @var array<string, string> cache URL aset per file sumber dalam satu run */
    private array $uploadedUrls = [];

    public function run(): void
    {
        $this->seedSiteSettings();
        $this->seedMajors();
        $this->seedTeachers();
        $this->seedFacilities();
        $this->seedGallery();
        $this->seedEskul();
        $this->seedVideo();
        $this->cleanupPlaceholders();
    }

    // ------------------------------------------------------------------
    // Pengaturan situs
    // ------------------------------------------------------------------

    private function seedSiteSettings(): void
    {
        $logoUrl = $this->seedAsset('logo.png', 'branding/profile');
        $heroBgUrl = $this->seedAsset('images/hero-bg.jpg', 'branding/hero');
        $kartuDepan = $this->seedAsset('images/kartu-kepala-sekolah.jpg', 'branding/profile');
        $kartuBelakang = $this->seedAsset('images/kartu-kepala-sekolah-belakang.jpg', 'branding/profile');
        $sejarahFoto = $this->seedAsset('images/gedung-kelas.jpg', 'branding/profile');

        SiteSetting::query()->updateOrCreate(['key' => 'sekolah'], ['value' => [
            'nama' => 'SMK Muhammadiyah 8 Medan',
            'singkatan' => 'SMK MAPAN',
            'predikat' => 'SMK Pusat Keunggulan',
            'akreditasi' => 'A (Unggul) BAN-SM',
            'kurikulum' => 'Kurikulum Merdeka',
            'npsn' => '10211244',
            'nss' => '3344076007096',
            'hotline' => '0813-7080-6663',
            'hotline_raw' => '6281370806663',
            'telepon' => '(061) 8229601',
            'email' => 'smkmd08medan@gmail.com',
            'website' => 'smkmuhammadiyah08.sch.id',
            'whatsapp' => '6282165415890',
            'maps_url' => 'https://maps.app.goo.gl/7QVjJmF8Z7sJepAK6',
            'instagram' => 'officialsmkmapan',
            'alamat' => 'Jl. Abdul Hakim No.2, Tanjung Sari, Kec. Medan Selayang, Kota Medan, Sumatera Utara 20132',
            'jam_pelayanan' => 'Senin – Sabtu: 07.30 – 16.00 WIB',
            'kepala_sekolah' => 'Sulastri, S.Pd.I',
            'kutipan' => 'Kegagalan adalah pelajaran, bukan akhir dari perjalananmu. Terus maju, dan kamu akan meraih kesuksesan.',
            'kutipan_penulis' => 'Keluarga Besar SMK Muhammadiyah 8 Medan',
            'logo_url' => $logoUrl,
        ]]);

        SiteSetting::query()->updateOrCreate(['key' => 'hero'], ['value' => [
            'eyebrow' => 'SMK Pusat Keunggulan',
            'titleLine1' => 'Tempat Tumbuhnya',
            'titleAccent' => 'Generasi Hebat',
            'titleLine2' => 'Masa Depan',
            'desc' => 'SMK Muhammadiyah 8 Medan hadir untuk mencetak lulusan yang cerdas, kreatif, religius, siap kerja, santun, mandiri, dan inovatif.',
            'ctaLabel' => 'Daftar PPDB 2026',
            'videoLabel' => "Tonton\nVideo Profil",
            'videoUrl' => '/profil.mp4',
            'stats' => [
                ['value' => '4', 'label' => 'Program Keahlian'],
                ['value' => 'Terakreditasi', 'label' => 'Pendidikan Berkualitas'],
                ['value' => 'Siap Kerja', 'label' => 'Masa Depan Lebih Baik'],
            ],
            'scriptWords' => ['Cerdas,', 'Kreatif,', 'Religius'],
            'backgroundImage' => $heroBgUrl,
        ]]);

        SiteSetting::query()->updateOrCreate(['key' => 'profil'], ['value' => [
            'visi' => 'Mewujudkan pendidikan vokasi yang bermutu, menghasilkan sumber daya manusia yang berakhlak mulia, memiliki karakter wirausaha, sesuai dengan IMTA & IPTEK.',
            'misi' => [
                'Menyelenggarakan pembelajaran optimal pada bidang Al-Islam dan Kemuhammadiyahan.',
                'Menerapkan pembelajaran berbasis teknologi dan informasi.',
                'Meningkatkan kompetensi guru dan siswa melalui pelatihan serta pemagangan industri.',
                'Menyiapkan lulusan yang berkarakter, terampil, dan berjiwa wirausaha.',
                'Mewujudkan lingkungan pendidikan yang hijau dan menyenangkan.',
            ],
            'tujuan' => 'Membekali siswa dengan keterampilan praktis, kesiapan kerja, dan karakter sesuai nilai-nilai Muhammadiyah.',
            'sejarah_judul' => 'Berdiri sejak 1990',
            'sejarah_paragraf' => [
                'SMK Muhammadiyah 8 Medan berdiri pada 1990 dengan nama SMEA (Sekolah Menengah Ekonomi Atas), membuka program keahlian Akuntansi dan Administrasi Perkantoran.',
                'Sempat bergabung dengan SMEA Muhammadiyah 6 Medan, sekolah ini resmi mandiri pada 1995. Sejak 2005, kegiatan belajar mengajar berlangsung pada pagi hari di gedung sendiri.',
            ],
            'sejarah_milestones' => [
                ['year' => '1990', 'label' => 'Berdiri sebagai SMEA'],
                ['year' => '1995', 'label' => 'Resmi mandiri'],
                ['year' => '2005', 'label' => 'Gedung sendiri'],
            ],
            'kepala_sekolah' => 'Sulastri, S.Pd.I',
            'kepsek_sambutan' => 'Selamat datang di SMK Muhammadiyah 8 Medan, SMK Pusat Keunggulan.',
            'kepsek_pesan' => [
                'Sebagai Kepala Sekolah, saya dengan bangga menyambut para siswa, orang tua, dan seluruh staf. Kami berkomitmen memberikan pendidikan berkualitas tinggi yang mempersiapkan siswa untuk masa depan akademis sekaligus membentuk karakter dan nilai-nilai luhur.',
                'Kami menempatkan siswa sebagai pusat dari segala upaya pendidikan, didukung teknologi terkini dan tim pengajar yang berdedikasi.',
            ],
            'sejarah_foto' => $sejarahFoto,
            'kartu_depan' => $kartuDepan,
            'kartu_belakang' => $kartuBelakang,
        ]]);

        SiteSetting::query()->updateOrCreate(['key' => 'copy'], ['value' => [
            'profil' => [
                'eyebrow' => '',
                'titleStart' => 'Profil Sekolah',
                'titleAccent' => '',
                'titleEnd' => '',
                'lead' => 'Sejarah, visi, dan identitas sekolah dalam satu tempat. Kenali lebih dekat sebelum melangkah bersama kami.',
            ],
            'program' => [
                'eyebrow' => 'Program Keahlian',
                'titleStart' => 'Empat jurusan, satu arah:',
                'titleAccent' => 'siap kerja',
                'titleEnd' => '',
                'lead' => 'Pilih jalur yang paling sesuai dengan minatmu. Setiap program dibekali praktik industri dan guru produktif berpengalaman.',
            ],
            'eskul' => [
                'eyebrow' => 'Ekstrakurikuler',
                'titleStart' => 'Ruang untuk',
                'titleAccent' => 'tumbuh',
                'titleEnd' => 'dan berprestasi',
                'lead' => 'Dari panggung musik hingga lapangan futsal, temukan kegiatan yang membuat minat dan bakatmu berkembang bersama teman-teman.',
            ],
            'galeri' => [
                'eyebrow' => 'Galeri',
                'titleStart' => 'Jejak kegiatan,',
                'titleAccent' => 'cerita',
                'titleEnd' => 'yang hidup',
                'lead' => 'Kumpulan momen dari kelas, workshop, dan kegiatan sekolah — dari prestasi hingga keseharian.',
            ],
            'fasilitas' => [
                'eyebrow' => 'Fasilitas Sekolah',
                'titleStart' => 'Ruang untuk bertumbuh,',
                'titleAccent' => 'fasilitas',
                'titleEnd' => 'untuk berkarya',
                'lead' => 'Dari masjid dan lapangan hingga laboratorium komputer — setiap ruang di SMK Muhammadiyah 8 Medan dirancang untuk mendukung belajar, praktik, dan pembinaan karakter siswa.',
            ],
            'tenaga' => [
                'eyebrow' => 'Di balik setiap kelas',
                'titleStart' => 'Tenaga',
                'titleAccent' => 'Pendidik',
                'titleEnd' => '',
                'lead' => 'Semua guru yang ada di SMK Muhammadiyah 8 Medan ini adalah guru-guru yang telah berpengalaman dan profesional di bidangnya masing-masing.',
            ],
            'kontak' => [
                'eyebrow' => 'Hubungi kami',
                'titleStart' => 'Ada yang bisa',
                'titleAccent' => 'kami bantu?',
                'titleEnd' => '',
                'lead' => 'Pertanyaan tentang pendaftaran, program keahlian, atau kunjungan sekolah? Sampaikan lewat kanal di bawah. Tim humas kami akan merespons pada hari sekolah.',
                'status' => 'Humas siap membantu',
            ],
            'ppdb' => [
                'eyebrow' => 'PPDB T.A. 2026/2027 • SMK PUSAT KEUNGGULAN',
                'titleStart' => 'PRA',
                'titleAccent' => 'PENDAFTARAN',
                'titleEnd' => '',
                'lead' => 'Pilih jurusan vokasi impianmu dengan rincian biaya transparan dan terjangkau. Klik Daftar Sekarang untuk langsung konsultasi dan registrasi via WhatsApp resmi.',
            ],
        ]]);

        SiteSetting::query()->updateOrCreate(['key' => 'tampilan'], ['value' => [
            'brand' => 'SMKM 8 MEDAN',
            'wordmark' => 'SMKM 8 MEDAN',
            'tagline' => 'Tunas Bangsa Berkarakter',
            'logo_url' => $logoUrl,
            'menu_labels' => [
                'beranda' => 'Beranda', 'profil' => 'Profil', 'program' => 'Program',
                'sekolah' => 'Sekolah', 'kontak' => 'Kontak',
            ],
            'footer_nav' => [
                ['label' => 'Beranda', 'href' => '#beranda'],
                ['label' => 'Profil Sekolah', 'href' => '#profil'],
                ['label' => 'Program Keahlian', 'href' => '#program'],
                ['label' => 'Fasilitas', 'href' => '#fasilitas'],
                ['label' => 'Ekstrakurikuler', 'href' => '#ekstrakurikuler'],
                ['label' => 'Galeri', 'href' => '#galeri'],
            ],
            'privacy_url' => '#',
            'terms_url' => '#',
        ]]);

        // Fitur ujian daring aktif (dipakai halaman guru/siswa).
        SiteSetting::query()->updateOrCreate(['key' => 'ujian'], ['value' => ['fitur_aktif' => true]]);
    }

    // ------------------------------------------------------------------
    // Program keahlian
    // ------------------------------------------------------------------

    private function seedMajors(): void
    {
        $majors = [
            [
                'kode' => 'TKJ',
                'nama' => 'Teknik Komputer dan Jaringan',
                'tagline' => 'Spesialis Cloud, Infrastruktur Jaringan & Cyber Security',
                'deskripsi' => 'Membekali siswa dengan keahlian perakitan komputer, manajemen server cloud, konfigurasi router Mikrotik & Cisco, fiber optic, serta administrasi sistem operasi jaringan modern.',
                'biaya_pendaftaran' => 825000,
                'spp_bulanan' => 275000,
                'warna' => '#0284C7',
                'warna_soft' => '#E0F2FE',
                'ikon' => 'network',
                'foto' => 'images/tkj.png',
                'kurikulum' => [
                    'Administrasi Infrastruktur Jaringan (AIJ)',
                    'Administrasi Server Jaringan (ASJ)',
                    'Teknologi Jaringan Berbasis Luas (WAN & Fiber Optic)',
                    'Perakitan Komputer & Maintenance Hardware',
                    'Sistem Keamanan Jaringan & Cloud Computing',
                    'MikroTik Certified Network Associate (MTCNA)',
                ],
                'fasilitas' => [
                    'Laboratorium Cisco Networking Academy',
                    'MikroTik Training Center & Routerboard Rack',
                    'Server Data Center Mandiri ber-AC',
                    'Fiber Optic Fusion Splicer Toolset',
                    'High-Speed Gigabit LAN & IoT Sandbox',
                ],
                'karir' => [
                    'Network Administrator',
                    'Cloud Infrastructure Specialist',
                    'IT Support & Systems Engineer',
                    'Cybersecurity Junior Analyst',
                    'Fiber Optic Technician',
                ],
                'sertifikasi' => ['Cisco CCNA Introduction', 'MikroTik MTCNA', 'BNSP Klaster Jaringan Komputer'],
            ],
            [
                'kode' => 'DKV',
                'nama' => 'Desain Komunikasi Visual',
                'tagline' => 'Pencipta Karya Animasi 3D, Motion Graphic & Creative Branding',
                'deskripsi' => 'Mengembangkan potensi visual siswa dalam pembuatan animasi motion graphics, branding visual perusahaan, video editing profesional, fotografi studio, serta UI/UX interface digital.',
                'biaya_pendaftaran' => 825000,
                'spp_bulanan' => 300000,
                'warna' => '#FF6B00',
                'warna_soft' => '#FFF7ED',
                'ikon' => 'palette',
                'foto' => 'images/dkv.png',
                'kurikulum' => [
                    'Motion Graphics & 3D Modeling (Blender & After Effects)',
                    'Desain Grafis Vektor & Ilustrasi Digital (Illustrator)',
                    'Videografi, Sinematografi & Editing Audio-Visual',
                    'Fotografi Studio & Lighting Commercial',
                    'Digital Marketing & Creative Content Strategy',
                    'UI/UX Design & Prototyping Web/Mobile',
                ],
                'fasilitas' => [
                    'Creative Lab Workstation iMac & Core-i7',
                    'Soundproof Green Screen & Podcast Studio',
                    'Wacom & Huion Drawing Tablets',
                    'DSLR & Mirrorless 4K Cinema Camera Kits',
                    'Continuous Softbox & Strobe Lighting Sets',
                ],
                'karir' => [
                    'Motion Graphic Animator',
                    'Creative Director / Art Director',
                    'UI/UX Interface Designer',
                    'Professional Video Editor & Colorist',
                    'Commercial Photographer & Brand Strategist',
                ],
                'sertifikasi' => ['Adobe Certified Associate (Illustrator & Premiere)', 'BNSP Pembuatan Desain Grafis'],
            ],
            [
                'kode' => 'AKL',
                'nama' => 'Akuntansi & Keuangan Lembaga',
                'tagline' => 'Ahli Pembukuan Modern, Perpajakan & Perbankan Syariah Digital',
                'deskripsi' => 'Mempersiapkan tenaga akuntan muda yang cakap dalam pembukuan dagang & manufaktur, otomasi akuntansi komputer (MYOB/Accurate), laporan keuangan pemerintah, dan operasional perbankan syariah.',
                'biaya_pendaftaran' => 825000,
                'spp_bulanan' => 275000,
                'warna' => '#059669',
                'warna_soft' => '#ECFDF5',
                'ikon' => 'calculator',
                'foto' => 'images/akuntansi.png',
                'kurikulum' => [
                    'Komputer Akuntansi (MYOB Premier & Accurate Accounting)',
                    'Akuntansi Perusahaan Jasa, Dagang & Manufaktur',
                    'Akuntansi Lembaga / Instansi Pemerintah',
                    'Praktikum Perpajakan (e-SPT & PPh / PPN)',
                    'Administrasi Perbankan Syariah & Lembaga Keuangan Mikro',
                    'Manajemen Kas Kecil & Spreadsheet Finansial Lanjut',
                ],
                'fasilitas' => [
                    'Laboratorium Mini Bank Syariah Mapan',
                    'Tax Center Terpadu & Simulasi DJP Online',
                    'Ruang Komputer Akuntansi Terlisensi MYOB',
                    'Mesin Kasir POS & Penghitung Uang Otomatis',
                    'Sistem Pembukuan Cloud Terintegrasi',
                ],
                'karir' => [
                    'Staff Akuntan Publik / Junior Auditor',
                    'Customer Service & Teller Perbankan',
                    'Tax Compliance Specialist',
                    'Financial Budgeting Officer',
                    'Wirausahawan Mandiri Finansial',
                ],
                'sertifikasi' => ['Sertifikasi Kompetensi BNSP Teknisi Akuntansi Yunior', 'Certified MYOB Professional'],
            ],
            [
                'kode' => 'TBSM',
                'nama' => 'Teknik Sepeda Motor',
                'tagline' => 'Teknisi Profesional Roda Dua, Injeksi Modern & Bengkel Resmi',
                'deskripsi' => 'Program keahlian teknik mekanik sepeda motor berstandar bengkel ATPM resmi. Mempelajari sistem kelistrikan injeksi EFI, overhaul mesin, sistem rem ABS, dan manajemen wirausaha bengkel modern.',
                'biaya_pendaftaran' => 825000,
                'spp_bulanan' => 275000,
                'warna' => '#DC2626',
                'warna_soft' => '#FEE2E2',
                'ikon' => 'wrench',
                'foto' => 'images/tsm.png',
                'kurikulum' => [
                    'Pemeliharaan Mesin Sepeda Motor (PMSM)',
                    'Pemeliharaan Sasis & Sistem Suspensi (PKS)',
                    'Pemeliharaan Kelistrikan & Sensor Injeksi EFI',
                    'Diagnosis Kerusakan Komputerisasi (OBD Scanner)',
                    'Manajemen Pengelolaan Bengkel & Sparepart',
                ],
                'fasilitas' => [
                    'Bengkel Praktik TBSM Standar ATPM',
                    'Unit Sepeda Motor Uji Praktik Injeksi Terbaru',
                    'Hydraulic Bike Lift & Diagnostic Scanner',
                    'Toolbox Mekanik Lengkap Berstandar Industri',
                ],
                'karir' => [
                    'Teknisi Bengkel Resmi ATPM',
                    'Service Advisor Sepeda Motor',
                    'Owner & Wirausaha Bengkel Mandiri',
                    'Quality Control Mekanik Perakitan',
                ],
                'sertifikasi' => ['BNSP Teknisi Sepeda Motor', 'Sertifikasi Uji Emisi & EFI'],
            ],
        ];

        foreach ($majors as $data) {
            $foto = $data['foto'];
            unset($data['foto']);
            Major::query()->updateOrCreate(
                ['kode' => $data['kode']],
                $data + ['foto_url' => $this->seedAsset($foto, 'branding/jurusan'), 'is_active' => true],
            );
        }
    }

    // ------------------------------------------------------------------
    // Tenaga pendidik
    // ------------------------------------------------------------------

    /** Nama guru -> file foto di seed-assets/foto_guru. */
    private const GURU_FOTO = [
        'Sulastri, S.Pd.I' => 'umi.png',
        'Luliadi, M.Pd' => 'pak luli.png',
        'Ahmad Antoni, A.Md' => 'pak toni.png',
        'Muhammad Fitra Aldy, A.Md' => 'pak aldy.png',
        'M. Fansuri Syuhada, A.Md MM' => 'pak fansuri.png',
        'Drs. Surip' => 'pak surip.png',
        'Muhammad Fauzul Iryandi, S.Kom' => 'pak fauzul.png',
        'Rafika Sari, S.Kom' => 'bu fika.png',
        'Tengku Ahmad Faisal, S.I.Kom' => 'pak fais.png',
        'Syaifah, SE, S.Pd' => 'bu syaifah.png',
        'Novriza, S.Pd' => 'pak novri.png',
        'Jaka Mulia Ramadhan, ST' => 'pak jaka.png',
        'Nana Sholehayati Pohan, S.Pd' => 'mis nana.png',
        'Nur Imayanti, S.Pd' => 'mis nuri.png',
        "Andi Syahputra, M.Kom.I" => 'pak andi.png',
        'Deni Ramanda Kasbi, S.Pd' => 'pak deni.png',
        'Azandi Pratama, S.Pd' => 'pak azandi.png',
        'Indah Mustika, S.Pd' => 'bu indah.png',
        'Ade Arihta Akbar, S.S' => 'pak akbar.png',
        'Ezaita Maisyaroh Ritonga, M.Pd' => 'bu eza.png',
        'Afifah Septiarini, S.Pd' => 'bu afifah.png',
        'Andes Martua Harahap, M.Pd' => 'pak andes.png',
        'Purwanti, S.Pd' => 'bu pur.png',
        "Nur Asni Bate'e, SE" => 'bu asni.png',
    ];

    private function seedTeachers(): void
    {
        $guru = [
            ['nama' => 'Sulastri, S.Pd.I', 'jabatan' => 'Kepala Sekolah', 'department' => 'Pimpinan Sekolah', 'bio' => 'Memimpin SMK Muhammadiyah 8 Medan menuju predikat SMK Pusat Keunggulan dengan fokus kurikulum berbasis industri 4.0, penguatan karakter Al-Islam, dan kemandirian vokasi siswa.', 'jam_kerja' => 'Senin – Jumat (07.30 – 16.00 WIB)', 'sertifikasi' => ['Kepala Sekolah Penggerak', 'Penyusun Kurikulum Merdeka Vokasi', 'Pelatih Pembelajaran Aktif']],
            ['nama' => 'Luliadi, M.Pd', 'jabatan' => 'Wakil Kepala Sekolah & Pengajar Senior', 'department' => 'Pimpinan Sekolah', 'bio' => 'Mendampingi tata kelola dan pengembangan akademik sekolah menuju standar keunggulan vokasi nasional.', 'jam_kerja' => 'Senin – Jumat (07.30 – 16.00 WIB)', 'sertifikasi' => ['Asesor Pendidikan Vokasi', 'Magister Pendidikan', 'Pendidik Profesional']],
            ['nama' => 'Ahmad Antoni, A.Md', 'jabatan' => 'Wakil Kepala Bidang Kesiswaan', 'department' => 'Kesiswaan & Ekstrakurikuler', 'bio' => 'Membimbing kedisiplinan, organisasi IPM, ekstrakurikuler Tapak Suci, seni musik, dan pembentukan karakter kepemimpinan siswa.', 'jam_kerja' => 'Senin – Jumat (07.30 – 16.00 WIB)', 'sertifikasi' => ['Pembina IPM & Kedisiplinan', 'Instruktur Karakter Vokasi']],
            ['nama' => 'Muhammad Fitra Aldy, A.Md', 'jabatan' => 'Guru Produktif TKJ', 'department' => 'Teknik Komputer & Jaringan', 'bio' => 'Instruktur perakitan server, routing MikroTik, konfigurasi jaringan fiber optic, dan keamanan data center mandiri.', 'jam_kerja' => 'Senin – Kamis (08.00 – 15.00 WIB)', 'sertifikasi' => ['MikroTik MTCNA', 'Cisco Certified', 'Spesialis Cloud Network']],
            ['nama' => 'M. Fansuri Syuhada, A.Md MM', 'jabatan' => 'Guru Produktif DKV', 'department' => 'Desain Komunikasi Visual', 'bio' => 'Membina siswa dalam produksi video sinematik, motion graphic 3D, ilustrasi digital, dan fotografi komersial.', 'jam_kerja' => 'Senin – Jumat (08.00 – 15.30 WIB)', 'sertifikasi' => ['Adobe Certified Expert', 'Creative Director Multimedia', 'Motion Specialist']],
            ['nama' => 'Drs. Surip', 'jabatan' => 'Guru Produktif Akuntansi', 'department' => 'Akuntansi & Keuangan Lembaga', 'bio' => 'Pengajar senior akuntansi keuangan, pembukuan dagang/manufaktur, dan otomasi pembukuan digital mini bank sekolah.', 'jam_kerja' => 'Senin – Kamis (08.00 – 14.30 WIB)', 'sertifikasi' => ['Certified MYOB Professional', 'Asesor Kompetensi BNSP', 'Konsultan Pajak']],
            ['nama' => 'Muhammad Fauzul Iryandi, S.Kom', 'jabatan' => 'Guru Produktif TKJ', 'department' => 'Teknik Komputer & Jaringan', 'bio' => 'Fokus pada praktikum administrasi server Linux, routing OSPF Mikrotik, dan implementasi jaringan nirkabel enterprise.', 'jam_kerja' => 'Senin – Jumat (08.00 – 15.00 WIB)', 'sertifikasi' => ['BNSP Network Administrator', 'Linux Server Specialist']],
            ['nama' => 'Rafika Sari, S.Kom', 'jabatan' => 'Guru Produktif TKJ', 'department' => 'Teknik Komputer & Jaringan', 'bio' => 'Mengembangkan modul praktikum hardware komputer, sistem operasi jaringan, dan troubleshooting perangkat jaringan.', 'jam_kerja' => 'Senin – Kamis (08.00 – 15.00 WIB)', 'sertifikasi' => ['IT Support Specialist', 'Instruktur Cisco IT Essentials']],
            ['nama' => 'Tengku Ahmad Faisal, S.I.Kom', 'jabatan' => 'Guru Produktif DKV', 'department' => 'Desain Komunikasi Visual', 'bio' => 'Mengajar teknik videografi, sinematografi, podcasting, serta tata artistik pameran karya siswa DKV.', 'jam_kerja' => 'Selasa – Sabtu (08.00 – 15.00 WIB)', 'sertifikasi' => ['Digital Content Producer', 'Broadcasting & Audio Visual']],
            ['nama' => 'Syaifah, SE, S.Pd', 'jabatan' => 'Guru Produk Kreatif & Kewirausahaan', 'department' => 'Akuntansi & Bisnis', 'bio' => 'Membimbing siswa merintis ide bisnis kreatif, penyusunan proposal usaha, serta penjualan produk karya jurusan ke pasar nyata.', 'jam_kerja' => 'Senin – Kamis (08.00 – 14.30 WIB)', 'sertifikasi' => ['Pendamping UMKM Vokasi', 'Praktisi Manajemen Bisnis']],
            ['nama' => 'Novriza, S.Pd', 'jabatan' => 'Guru Produktif TBSM', 'department' => 'Teknik Sepeda Motor', 'bio' => 'Ahli permesinan motor injeksi EFI, trouble shooting elektrikal motor, dan pembina uji kompetensi kejuruan TBSM.', 'jam_kerja' => 'Senin – Jumat (07.30 – 15.30 WIB)', 'sertifikasi' => ['Instruktur Bengkel Injeksi', 'BNSP Otomotif Roda Dua']],
            ['nama' => 'Jaka Mulia Ramadhan, ST', 'jabatan' => 'Guru Produktif TBSM', 'department' => 'Teknik Sepeda Motor', 'bio' => 'Mengajar mekanisme katup, overhaul engine, dan teknologi motor matic generasi terbaru dengan standar industri ATPM.', 'jam_kerja' => 'Senin – Kamis (08.00 – 15.00 WIB)', 'sertifikasi' => ['Sarjana Teknik Mesin', 'Spesialis Sasis & Transmisi Otomatis']],
            ['nama' => 'Nana Sholehayati Pohan, S.Pd', 'jabatan' => 'Guru Bahasa Inggris Kejuruan', 'department' => 'Bahasa & Literasi Global', 'bio' => 'Mempersiapkan siswa vokasi agar mampu berkomunikasi teknis dalam Bahasa Inggris untuk wawancara kerja dan industri global.', 'jam_kerja' => 'Senin – Kamis (08.00 – 15.00 WIB)', 'sertifikasi' => ['TOEFL Certified', 'Communicative English Trainer']],
            ['nama' => 'Nur Imayanti, S.Pd', 'jabatan' => 'Guru Matematika Terapan', 'department' => 'Sains & Matematika', 'bio' => 'Membantu siswa memahami penerapan matematika logika dalam perhitungan akuntansi, networking, dan grafika komputer.', 'jam_kerja' => 'Senin – Jumat (08.00 – 15.00 WIB)', 'sertifikasi' => ['Pembina Olimpiade Matematika', 'Instruktur Logika Algoritma']],
            ['nama' => 'Andi Syahputra, M.Kom.I', 'jabatan' => "Guru Al-Qur'an & PAI", 'department' => 'Pendidikan Agama Islam', 'bio' => 'Membina nilai moral, akhlakul karimah, keteladanan ibadah, dan kajian Islam praktis bagi generasi muda vokasi.', 'jam_kerja' => 'Senin – Kamis (07.30 – 14.00 WIB)', 'sertifikasi' => ["Hafiz Al-Qur'an", 'Magister Komunikasi Islam']],
            ['nama' => 'Deni Ramanda Kasbi, S.Pd', 'jabatan' => 'Guru PKN & Sejarah', 'department' => 'Ilmu Sosial & Humaniora', 'bio' => 'Menanamkan nilai-nilai kebangsaan, wawasan hukum ketenagakerjaan, serta sejarah perjuangan bangsa.', 'jam_kerja' => 'Senin – Jumat (08.00 – 15.00 WIB)', 'sertifikasi' => ['Pendidik Kebangsaan', 'Pelatih Debat Konstitusi']],
            ['nama' => 'Azandi Pratama, S.Pd', 'jabatan' => 'Guru PAI & Budi Pekerti', 'department' => 'Pendidikan Agama Islam', 'bio' => 'Berfokus pada pembentukan integritas, kejujuran kerja, dan etos ibadah di lingkungan sekolah dan tempat praktik kerja.', 'jam_kerja' => 'Senin – Kamis (08.00 – 14.30 WIB)', 'sertifikasi' => ['Konselor Remaja Islami', 'Trainer Tarbiyah Remaja']],
            ['nama' => 'Indah Mustika, S.Pd', 'jabatan' => 'Guru PKN & Sejarah', 'department' => 'Ilmu Sosial & Humaniora', 'bio' => 'Mengembangkan pembelajaran aktif interaktif yang mengasah daya nalar kritis siswa terhadap isu kebangsaan dan etika profesi.', 'jam_kerja' => 'Senin – Kamis (08.00 – 15.00 WIB)', 'sertifikasi' => ['Guru Penggerak', 'Pembina Literasi Sekolah']],
            ['nama' => 'Ade Arihta Akbar, S.S', 'jabatan' => 'Guru Bahasa Arab', 'department' => 'Bahasa & Al-Islam', 'bio' => "Membimbing siswa dalam percakapan Bahasa Arab dasar dan pengenalan kosakata Al-Qur'an serta literatur Islam.", 'jam_kerja' => 'Senin – Rabu (08.00 – 14.00 WIB)', 'sertifikasi' => ['Penerjemah Bahasa Arab', 'Instruktur Muhadatsah']],
            ['nama' => 'Ezaita Maisyaroh Ritonga, M.Pd', 'jabatan' => 'Guru Matematika Kejuruan', 'department' => 'Sains & Matematika', 'bio' => 'Mengajarkan konsep kalkulasi matematika terapan dalam analisis data, peluang statistik, dan pemodelan teknik.', 'jam_kerja' => 'Senin – Jumat (08.00 – 15.00 WIB)', 'sertifikasi' => ['Magister Pendidikan Matematika', 'Peneliti Model Pembelajaran Vokasi']],
            ['nama' => 'Afifah Septiarini, S.Pd', 'jabatan' => 'Guru Bahasa Indonesia', 'department' => 'Bahasa & Literasi Global', 'bio' => 'Membimbing siswa dalam penulisan laporan praktikum, karya tulis ilmiah, dan keterampilan presentasi publik profesional.', 'jam_kerja' => 'Senin – Kamis (08.00 – 15.00 WIB)', 'sertifikasi' => ['Pelatih Penulisan Kreatif & Karya Ilmiah']],
            ['nama' => 'Andes Martua Harahap, M.Pd', 'jabatan' => 'Guru Penjaskes & Olahraga', 'department' => 'Kebugaran & Prestasi Atlet', 'bio' => 'Melatih kebugaran fisik, daya tahan, kekompakan tim, dan sportivitas melalui cabang futsal, bola basket, dan atletik.', 'jam_kerja' => 'Senin – Jumat (07.30 – 15.00 WIB)', 'sertifikasi' => ['Pelatih Futsal & Atletik', 'Magister Olahraga']],
            ['nama' => 'Purwanti, S.Pd', 'jabatan' => 'Guru Piket & Bimbingan Konseling', 'department' => 'Layanan Siswa & Konseling', 'bio' => 'Mendampingi siswa dalam mengatasi kendala belajar, penjurusan minat bakat, dan konseling pengembangan pribadi.', 'jam_kerja' => 'Senin – Sabtu (07.30 – 15.00 WIB)', 'sertifikasi' => ['Konselor Pendidikan Remaja', 'Pengelola Disiplin Siswa']],
            ['nama' => "Nur Asni Bate'e, SE", 'jabatan' => 'Kepala Tata Usaha & Administrasi', 'department' => 'Tata Usaha & Keuangan', 'bio' => 'Melayani administrasi siswa, surat keterangan, kartu pelajar RFID, dan koordinasi penerimaan peserta didik baru (PPDB).', 'jam_kerja' => 'Senin – Sabtu (07.30 – 16.00 WIB)', 'sertifikasi' => ['Manajemen Arsip Digital', 'Administrasi Pendidikan']],
        ];

        foreach ($guru as $data) {
            Teacher::query()->updateOrCreate(
                ['nama' => $data['nama']],
                $data + ['foto_url' => $this->seedAsset('foto_guru/'.self::GURU_FOTO[$data['nama']], 'teachers'), 'is_active' => true],
            );
        }
    }

    // ------------------------------------------------------------------
    // Fasilitas
    // ------------------------------------------------------------------

    private function seedFacilities(): void
    {
        $utama = [
            ['judul' => 'Masjid Sekolah', 'kategori' => 'Ibadah', 'badge' => 'Ibadah', 'foto' => 'images/fasilitas/masjid.jpg', 'deskripsi' => 'Masjid sekolah untuk kegiatan sholat berjamaah dan kajian Al-Islam.', 'tags' => ['Sholat berjamaah', 'Kajian Al-Islam'], 'sort_order' => 1],
            ['judul' => 'Lab Komputer', 'kategori' => 'Praktikum', 'badge' => 'Praktikum', 'foto' => 'images/fasilitas/lab-komputer.jpg', 'deskripsi' => 'Laboratorium komputer modern dengan 40 unit PC untuk praktikum TKJ.', 'tags' => ['40 unit PC', 'Praktikum TKJ'], 'sort_order' => 2],
            ['judul' => 'Lapangan Olahraga', 'kategori' => 'Olahraga', 'badge' => 'Olahraga', 'foto' => 'images/fasilitas/lapangan.jpg', 'deskripsi' => 'Lapangan olahraga serbaguna untuk futsal, voli, dan upacara bendera.', 'tags' => ['Futsal & voli', 'Upacara bendera'], 'sort_order' => 3],
            ['judul' => 'Gedung Kelas Permanen', 'kategori' => 'Akademik', 'badge' => 'Akademik', 'foto' => 'images/fasilitas/gedung-kelas.jpg', 'deskripsi' => 'Gedung pembelajaran yang representatif dan nyaman untuk kegiatan belajar sehari-hari.', 'tags' => ['Ruang kelas permanen', 'Area belajar nyaman'], 'sort_order' => 4],
        ];

        // Fasilitas pendukung: kategori 'pendukung', badge berisi nama ikon
        // yang dikenali landing page (wrench, palette, library, building).
        $pendukung = [
            ['judul' => 'Lab Otomotif & Bengkel TBSM', 'kategori' => 'pendukung', 'badge' => 'wrench', 'deskripsi' => 'Bengkel praktik siswa TBSM berstandar industri.', 'sort_order' => 10],
            ['judul' => 'Studio DKV', 'kategori' => 'pendukung', 'badge' => 'palette', 'deskripsi' => 'Studio kreatif untuk produksi desain, foto, dan video siswa DKV.', 'sort_order' => 11],
            ['judul' => 'Perpustakaan Digital', 'kategori' => 'pendukung', 'badge' => 'library', 'deskripsi' => 'Koleksi digital dan ruang baca untuk mendukung literasi siswa.', 'sort_order' => 12],
        ];

        foreach ($utama as $data) {
            $foto = $data['foto'];
            unset($data['foto']);
            Facility::query()->updateOrCreate(
                ['judul' => $data['judul']],
                $data + ['image_url' => $this->seedAsset($foto, 'fasilitas'), 'is_active' => true],
            );
        }

        foreach ($pendukung as $data) {
            Facility::query()->updateOrCreate(
                ['judul' => $data['judul']],
                $data + ['is_active' => true],
            );
        }
    }

    // ------------------------------------------------------------------
    // Galeri
    // ------------------------------------------------------------------

    private function seedGallery(): void
    {
        $galeri = [
            ['judul' => 'Workshop Kewirausahaan Berbasis Digital', 'kategori' => 'Kegiatan', 'tanggal' => '2023-09-14', 'foto' => 'images/galeri/1.jpg', 'deskripsi' => 'Membangun bisnis dan menghasilkan income dengan kreativitas desain dan animasi, agenda SMK PK.', 'rotate' => -5, 'sort_order' => 1],
            ['judul' => 'Malam Bina Iman dan Taqwa', 'kategori' => 'Kegiatan', 'tanggal' => '2023-09-17', 'foto' => 'images/galeri/2.jpg', 'deskripsi' => 'Sosialisasi ibadah praktis sesuai sunnah untuk meningkatkan kualitas iman dan taqwa siswa.', 'rotate' => 4, 'sort_order' => 2],
            ['judul' => 'Workshop RTL Upskilling & Reskilling DKV', 'kategori' => 'Kegiatan', 'tanggal' => '2023-09-09', 'foto' => 'images/galeri/3.jpg', 'deskripsi' => 'Mengupgrade ilmu pengetahuan dan keterampilan khususnya di bidang videografi.', 'rotate' => -3, 'sort_order' => 3],
            ['judul' => 'Ujian Kompetensi Keahlian', 'kategori' => 'Prestasi', 'tanggal' => null, 'foto' => 'images/galeri/4.jpg', 'deskripsi' => 'Pelaksanaan Ujian Kompetensi Keahlian SMK Muhammadiyah 8 Medan.', 'rotate' => 5, 'sort_order' => 4],
            ['judul' => 'Gedung SMK Muhammadiyah 8 Medan', 'kategori' => 'Fasilitas', 'tanggal' => null, 'foto' => 'images/galeri/5.jpg', 'deskripsi' => 'Gedung pembelajaran yang representatif dan nyaman untuk kegiatan belajar siswa.', 'rotate' => -4, 'sort_order' => 5],
        ];

        foreach ($galeri as $data) {
            $foto = $data['foto'];
            unset($data['foto']);
            Gallery::query()->updateOrCreate(
                ['judul' => $data['judul']],
                $data + ['image_url' => $this->seedAsset($foto, 'galeri'), 'is_active' => true],
            );
        }
    }

    // ------------------------------------------------------------------
    // Ekstrakurikuler
    // ------------------------------------------------------------------

    private function seedEskul(): void
    {
        $eskul = [
            ['nama' => 'Band', 'kategori' => 'Seni Musik', 'foto' => 'images/ekskul/band.jpg', 'deskripsi' => 'Pengembangan minat dan bakat musik siswa dengan peralatan musik modern.', 'jadwal' => 'Sabtu, 14.00 - 16.00', 'warna' => '#8B5CF6', 'warna_soft' => '#f5f3ff'],
            ['nama' => 'Tapak Suci', 'kategori' => 'Bela Diri', 'foto' => 'images/ekskul/tapak-suci.jpg', 'deskripsi' => 'Seni bela diri khas Muhammadiyah berprestasi dan pembentukan raga kuat.', 'jadwal' => 'Jumat, 15.00 - 17.00', 'warna' => '#22C55E', 'warna_soft' => '#f0fdf4'],
            ['nama' => 'Paskibra', 'kategori' => 'Kedisiplinan', 'foto' => 'images/ekskul/paskibra.jpg', 'deskripsi' => 'Pelatihan kedisiplinan dan baris-berbaris untuk upacara dan lomba.', 'jadwal' => 'Kamis, 15.00 - 17.00', 'warna' => '#EF4444', 'warna_soft' => '#fef2f2'],
            ['nama' => 'Futsal', 'kategori' => 'Olahraga', 'foto' => 'images/ekskul/futsal.jpg', 'deskripsi' => 'Olahraga futsal kompetitif melatih fisik, strategi, dan kerja sama tim.', 'jadwal' => 'Sabtu, 08.00 - 10.00', 'warna' => '#F59E0B', 'warna_soft' => '#fffbeb'],
        ];

        foreach ($eskul as $data) {
            $foto = $data['foto'];
            unset($data['foto']);
            Eskul::query()->updateOrCreate(
                ['nama' => $data['nama']],
                $data + ['image_url' => $this->seedAsset($foto, 'eskul'), 'is_active' => true],
            );
        }
    }

    // ------------------------------------------------------------------
    // Video profil
    // ------------------------------------------------------------------

    private function seedVideo(): void
    {
        Video::query()->updateOrCreate(
            ['judul' => 'Profil SMK Muhammadiyah 8 Medan', 'kategori' => 'showreel'],
            [
                'deskripsi' => 'Video profil resmi SMK Muhammadiyah 8 Medan (SMK Pusat Keunggulan).',
                'software' => [],
                'is_published' => true,
                'sort_order' => 0,
            ],
        );
    }

    // ------------------------------------------------------------------
    // Pembersihan placeholder lama
    // ------------------------------------------------------------------

    private function cleanupPlaceholders(): void
    {
        // Guru placeholder dari seeder lama ("Guru 1", "Guru 2", ...).
        // Operator `~` = regex Postgres (DB memakai Supabase/PostgreSQL).
        Teacher::query()->whereRaw("nama ~ '^Guru [0-9]+$'")->delete();

        Facility::query()->where('judul', 'Laboratorium Komputer')->delete();
        Gallery::query()->where('judul', 'Kegiatan Sekolah')->delete();
        Video::query()->where('judul', 'Profil SMKM 8 Medan')->delete();
    }

    // ------------------------------------------------------------------
    // Upload aset seed ke Supabase Storage
    // ------------------------------------------------------------------

    /**
     * Unggah berkas dari database/seed-assets ke disk media (Supabase) dan
     * kembalikan URL publiknya. Mengembalikan null bila berkas tidak ada atau
     * unggahan gagal — konten teks tetap ter-seed tanpa foto.
     */
    private function seedAsset(string $relative, string $folder): ?string
    {
        if (array_key_exists($relative, $this->uploadedUrls)) {
            return $this->uploadedUrls[$relative];
        }

        $file = database_path('seed-assets/'.ltrim($relative, '/'));
        if (! is_file($file)) {
            $this->command?->warn("  [aset] Lewati {$relative}: berkas tidak ditemukan.");

            return $this->uploadedUrls[$relative] = null;
        }

        $content = file_get_contents($file);
        if ($content === false) {
            return $this->uploadedUrls[$relative] = null;
        }

        $diskName = (string) config('filesystems.media_disk', 'public');
        $disk = Storage::disk($diskName);
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $path = trim($folder, '/').'/'.Str::uuid()->toString().'.'.$extension;

        if (! $disk->put($path, $content)) {
            $this->command?->warn("  [aset] Gagal unggah {$relative} ke disk {$diskName}.");

            return $this->uploadedUrls[$relative] = null;
        }

        $url = $disk->url($path);
        // URL harus memuat path berkas; bila tidak (mis. konfigurasi disk
        // bermasalah), jangan simpan URL rusak.
        if (! $url || ! str_contains($url, $path)) {
            $this->command?->warn("  [aset] URL tidak valid untuk {$relative}.");

            return $this->uploadedUrls[$relative] = null;
        }

        return $this->uploadedUrls[$relative] = $url;
    }
}
