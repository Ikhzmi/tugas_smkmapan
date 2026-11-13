# SMK Muhammadiyah 8 Medan — Website Sekolah & Mapan Learning Ecosystem

Aplikasi web resmi **SMK Pusat Keunggulan SMK Muhammadiyah 8 Medan (MAPAN)** yang menyatukan tiga lapis kebutuhan sekolah dalam satu aplikasi React:

1. **Website publik** — profil sekolah, program keahlian, fasilitas, galeri, direktori guru, dan informasi PPDB.
2. **Mapan Learning Ecosystem (LMS)** — portal siswa dan guru untuk jadwal, materi, tugas, presensi, serta ujian berbasis CBT.
3. **CMS Admin** — seluruh konten website dan data akademik dikelola dari satu dashboard tanpa menyentuh kode.

Backend memakai **Supabase** (PostgreSQL + Auth + Storage + Row Level Security), sehingga aplikasi berjalan sebagai SPA statis tanpa server API sendiri.

| Informasi | Detail |
| :--- | :--- |
| **Sekolah** | SMK Muhammadiyah 8 Medan — Jl. Gedung Arca No. 52, Medan Kota |
| **Akreditasi** | A (BAN-SM) · NPSN 10210871 |
| **Program Keahlian** | TKJ · DKV · AKL · TSM |
| **Peran pengguna** | `admin` · `guru` · `siswa` |
| **Target deploy** | Vercel (SPA rewrite, `noindex` untuk area admin) |

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Arsitektur & Struktur Folder](#arsitektur--struktur-folder)
- [Routing & Hak Akses](#routing--hak-akses)
- [Basis Data & Storage](#basis-data--storage)
- [Menjalankan Proyek](#menjalankan-proyek)
- [Akun Demo](#akun-demo)
- [Desain & Tema](#desain--tema)
- [Deploy](#deploy)
- [Catatan Teknis & Batasan](#catatan-teknis--batasan)
- [Dokumentasi Lanjutan](#dokumentasi-lanjutan)

---

## Fitur Utama

### 1. Website Publik (`/`)

| Modul | Isi |
| :--- | :--- |
| Hero | Sambutan sekolah, video profil, CTA PPDB & portal LMS |
| Profil Sekolah | Sambutan kepala sekolah, akreditasi, kartu identitas sekolah |
| Program Keahlian | 4 jurusan lengkap dengan kurikulum, biaya, prospek karier, dan sertifikasi |
| Fasilitas & Ekstrakurikuler | Galeri sarana praktik dan kegiatan siswa |
| Galeri | Grid foto kegiatan dengan filter kategori |
| Tenaga Pendidik | Direktori guru & instruktur bersertifikasi industri |
| Kontak | Formulir saran yang **langsung masuk ke inbox CMS** (bukan redirect WhatsApp) + peta lokasi |
| PPDB | Modal pra-pendaftaran per jurusan dengan transparansi biaya |
| Navigasi | Header scroll-aware, menu mobile, dan toggle tema gelap/terang |

### 2. Portal Siswa (`/lms/dashboard`)

| Tab | Fungsi |
| :--- | :--- |
| Dashboard | Widget *Jadwal Hari Ini*, *Tugas Perlu Dikerjakan*, akses cepat mata pelajaran, dan catatan umpan balik |
| Mata Pelajaran | Daftar mapel → daftar materi → **penampil materi** (PDF/gambar/teks) |
| Jadwal | Jadwal per hari dalam bentuk kartu (responsif sampai 360px) |
| Presensi | Rekap kehadiran (hadir/izin/sakit/alfa) per pertemuan |
| Tugas Saya | Daftar tugas + modal pengumpulan (tautan/berkas) dan status penilaian |
| Ujian / CBT | Daftar ujian aktif, input kode akses, pengerjaan soal, dan hasil |

### 3. Portal Guru (`/guru/dashboard`)

`Kelas` · `Presensi` · `Materi` · `Tugas` · `Ujian` · `Rekap`

- Unggah materi (PDF ke Supabase Storage) dan penugasan per kelas.
- Bank soal, import soal dari Excel/CSV, pengaturan kode akses ujian, dan penilaian otomatis.
- Rekap nilai per kelas dan per siswa, ekspor **PDF** (jsPDF) dan **Excel** (SheetJS).
- Penilaian tugas dengan unduhan berkas siswa lewat *signed URL* (berlaku 1 jam).

### 4. Admin & CMS (`/admin/dashboard`, `/admin/cms`)

| Grup | Tab |
| :--- | :--- |
| Ringkasan & statistik | Ringkasan, Statistik (tren kunjungan & login, Recharts) |
| Konten website | Hero, Profil, Tampilan, Teks Section, Jurusan, Guru, Mapel, Jadwal, Eskul, Fasilitas, Galeri, PPDB |
| Operasional | Pesan (inbox saran), Presensi, Ujian, Data Guru, Data Siswa, Kelas, Kelola Akun |
| Panduan | Hosting |

> Tab **Jurusan** punya unggah **foto program keahlian** (JPG/PNG/WEBP, maks. 5 MB). Berkas disimpan di `public/uploads/jurusan/` dan langsung dipakai kartu Program Keahlian di beranda; jika belum ada foto, kartu memakai ilustrasi bawaan jurusan.

### 5. CBT (Ujian Online)

- Kode akses per ujian + kunci ujian (`exam_codes`, `exam_unlocks`).
- **Anti-cheat**: deteksi keluar fullscreen / pindah tab, pencatatan pelanggaran, dan penguncian sesi.
- **Session guard**: satu sesi aktif per akun (`user_sessions`) agar akun tidak dipakai bergantian.
- Penilaian otomatis, penyimpanan jawaban per butir, dan rekap hasil siap cetak.
- Soal dengan gambar; kunci jawaban tidak pernah dikirim ke klien (`questions_safe`).

---

## Teknologi yang Digunakan

### Core

| Kategori | Teknologi | Versi | Keterangan |
| :--- | :--- | :--- | :--- |
| UI library | **React** | 19.2 | `createRoot` + StrictMode |
| Routing | **React Router** | 7.18 | `BrowserRouter`, route guard per peran |
| Build tool | **Vite** | 8.3 | Bundler **Rolldown**, plugin React |
| Styling | **CSS murni + Tailwind CSS** | 4.3 | Tailwind via `@tailwindcss/vite`, `darkMode: 'class'` |
| Backend | **Supabase** | 2.118 | Postgres, Auth, Storage, RLS, Realtime |
| Linter | **oxlint** | 1.81 | Menggantikan ESLint, `.oxlintrc.json` |

> **Catatan Tailwind:** `preflight` dan `container` **dimatikan** (`tailwind.config.js`). Lapisan dashboard memakai utility Tailwind, sedangkan landing page memakai CSS murni agar reset global tidak merusak tampilan publik.

### Pendukung

| Kebutuhan | Library |
| :--- | :--- |
| Ikon | `lucide-react` |
| Animasi | `framer-motion`, `motion`, `gsap` |
| Grafis 3D & animasi vektor | `three`, `@rive-app/react-canvas` |
| Grafik statistik | `recharts` |
| Ekspor PDF | `jspdf`, `jspdf-autotable` |
| Import/ekspor Excel | `xlsx` |
| Konfeti hasil ujian | `canvas-confetti` |
| Utility className | `clsx`, `tailwind-merge` |

### Tooling & Skrip

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Dev server di `http://localhost:5173` (host aktif untuk uji di HP) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Menjalankan hasil build secara lokal |
| `npm run lint` | `oxlint` — 0 error, 1 warning bawaan (`useRef` diakses saat render) |
| `node scripts/build-question-templates.mjs` | Regenerasi template import soal di `public/templates/` |

---

## Arsitektur & Struktur Folder

```
src/
├── landing/                 # Website publik (CSS murni, komponen per section)
│   ├── LandingPage.jsx
│   ├── components/          # Navbar, Hero, ProfilSekolah, ProgramKeahlian, Galeri, Kontak, ...
│   └── data/
├── pages/                   # Login (admin & portal), DashboardAdmin/Guru/Siswa
├── components/
│   ├── ui/                  # Primitif: AppModal, Skeleton, GlassConfirmModal, ...
│   ├── siswa/               # ExamRunner, MaterialViewerModal, PresensiSiswa, SubmissionModal
│   ├── guru/                # Bank soal, kode ujian, penilaian, rekap
│   ├── AdminCMSDashboard.jsx + Admin*.jsx   # Modul CMS admin
│   └── *.css                # Gaya per komponen
├── context/                 # ContentContext (data CMS), ThemeContext (dark/light)
├── hooks/                   # useAuth, useSessionGuard, useExamLiveEvents, useTheme, useHeaderScroll
├── lib/                     # supabase client, examSession, sessionGuard, analytics,
│                            # questionImport, studentImport, uploadImage, sounds, dst.
├── styles/                  # portal-shell.css (lapisan override tema), dashboard.css
├── data/                    # Data statis landing (aset, konten sekolah)
└── App.jsx / main.jsx       # Router, provider, entry point
```

**Pola penting:**

- `ContentContext` adalah pintu data konten CMS: hero, profil, jurusan, guru, galeri, PPDB, dan pesan kontak dibaca/ditulis lewat context ini. Data akademik (kelas, materi, tugas, ujian) memakai client Supabase yang sama langsung dari masing-masing dashboard.
- `portal-shell.css` adalah **lapisan tema otoritatif** untuk dashboard. Banyak aturan memakai `!important`, sehingga perubahan gaya dashboard sebaiknya dicek di file ini lebih dulu — bukan hanya di CSS komponen.
- Modal memakai `AppModal` yang `createPortal` ke `document.body` (z-index 10000) agar tidak terjebak stacking context dashboard.

---

## Routing & Hak Akses

| Route | Komponen | Guard |
| :--- | :--- | :--- |
| `/` | `LandingPage` + `PpdbModal` | publik |
| `/login` | `LoginPortal` (siswa & guru) | publik |
| `/admin/login` | `LoginAdmin` | publik |
| `/lms/dashboard` | `DashboardSiswa` | `RequireRole role="siswa"` |
| `/guru/dashboard` | `DashboardGuru` | `RequireRole role="guru"` |
| `/admin/dashboard` | `DashboardAdmin` | `RequireRole role="admin"` |
| `/admin/cms` | `AdminCMSDashboard` | `RequireRole role="admin"` |

Alias lama (`/elearning`, `/lms`, `/login/siswa`, `/login/guru`) otomatis diarahkan ke `/login`.

**Autentikasi:**

- Supabase Auth dengan email internal: `useAuth` menempelkan domain sekolah pada username (`<username>@smkmuh8.sch.id`), dan `<NISN>@siswa.smkmuh8.sch.id` untuk siswa.
- Peran disimpan di tabel `profiles.role`; `RequireRole` memblokir akses lintas peran di sisi klien, sedangkan **RLS di Postgres** menjadi pengaman sebenarnya.
- `useSessionGuard` + tabel `user_sessions` memastikan hanya satu perangkat aktif per akun; `SessionResume` menawarkan melanjutkan sesi setelah refresh.

---

## Basis Data & Storage

Tabel utama (semua dilindungi RLS):

| Domain | Tabel |
| :--- | :--- |
| Identitas | `profiles`, `students`, `teachers`, `classes` |
| Akademik | `subjects`, `schedules`, `materials`, `materi`, `assignments`, `tugas`, `submissions` |
| Ujian | `exams`, `questions`, `questions_safe`, `answers`, `attempts`, `exam_codes`, `exam_unlocks`, `exam_question_counts` |
| Presensi | `attendance` |
| Konten publik | `site_settings`, `majors`, `facilities`, `gallery`, `videos`, `eskul` |
| Interaksi | `suggestions` (pesan kontak/PPDB), `ppdb_registrations` |
| Analitik & sesi | `site_visits`, `login_events`, `user_sessions` |

**Storage (Supabase):**

| Bucket | Isi | Akses |
| :--- | :--- | :--- |
| `materi` | PDF materi guru | URL publik |
| `tugas` | Berkas pengumpulan siswa | *signed URL* 1 jam |

**SQL migration** ada di `md/` dan bersifat idempotent. Cara tercepat: jalankan `md/SETUP_FULL.sql` di **Supabase SQL Editor**, lalu lanjut fase akun demo. Urutan manual dan penjelasan tiap file ada di [`md/SETUP_DATABASE.md`](./md/SETUP_DATABASE.md).

---

## Menjalankan Proyek

**Prasyarat:** Node.js 20+ (dikembangkan di Node 24), npm.

```bash
# 1. Install dependensi
npm ci

# 2. Siapkan .env (lihat bagian Variabel Lingkungan)

# 3. Jalankan dev server
npm run dev
```

Buka `http://localhost:5173`. `server.host` aktif, jadi bisa diuji dari HP di jaringan yang sama.

**Variabel lingkungan** (`.env` di root):

| Variabel | Wajib | Keterangan |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | ya | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | ya | Anon key (aman diekspos, dibatasi RLS) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | alternatif | Kunci publishable baru Supabase |

> DDL/migration **tidak bisa** dijalankan dengan anon key. Gunakan SQL Editor atau service-role key dari sisi server — jangan pernah menaruh service-role key di `.env` frontend.

**Upload gambar (dev/preview):** `vite.config.js` menyediakan middleware `POST /api/upload` yang menyimpan gambar ke `public/uploads/<bucket>/` dengan batas 5 MB (JPG/PNG/WEBP/GIF/SVG/AVIF). Bucket yang dipakai CMS: `jurusan` (foto program keahlian), `galeri`, `eskul`, dan `fasilitas`. Middleware ini hanya hidup di dev dan preview server.

---

## Akun Demo

Tersedia setelah menjalankan seed di `md/` (lihat `SETUP_DATABASE.md`):

| Peran | Kredensial | Halaman |
| :--- | :--- | :--- |
| Admin | `admin@smkmuh8.sch.id` / `mapan@admin` | `/admin/login` |
| Guru | `guru.demo@smkmuh8.sch.id` / `guru2026` | `/login` |
| Siswa | NISN `0068192341` / `mapan2026` | `/login` |

> Akun di atas hanya untuk demo. Ganti kata sandi dan hapus akun contoh sebelum dipakai produksi.

---

## Desain & Tema

- **Aksen utama:** oranye MAPAN (`#e8702a` pada dashboard, `#fe4000` pada landing) dengan aksen sekunder slate.
- **Mode gelap:** kelas `dark` pada `<html>` lewat `ThemeContext`; kartu memakai permukaan *glass* translusen (`rgba(255,255,255,.03–.08)`), dialog charcoal `#141619`, dan aksen oranye transparan — tanpa blok biru/navy.
- **Modal:** backdrop netral `rgba(6,8,12,.62)` + blur, diportal ke `<body>`.
- **Breakpoint utama:** `1023px` (navigasi dashboard → bottom nav), `900px` (grid widget jadi satu kolom), `640px` (kartu & baris tugas bertumpuk), `380px` (judul widget turun baris).
- **Tipografi:** Plus Jakarta Sans & Inter sebagai acuan utama, dengan Montserrat/Poppins pada beberapa komponen.

---

## Deploy

Konfigurasi siap pakai di `vercel.json`:

- Framework `vite`, install `npm ci`, build `npm run build`, output `dist/`.
- **Rewrite** semua path ke `index.html` → SPA route (`/lms/dashboard`, `/admin/cms`, dst.) aman saat refresh.
- Header `X-Robots-Tag: noindex, nofollow` untuk `/admin`, `/admin/*`, dan `/login/admin`.

Alur: push ke `main` → Vercel build otomatis. Untuk memicu ulang deploy tanpa mengubah kode:

```bash
git commit --allow-empty -m "chore: trigger deploy Vercel"
git push origin main
```

---

## Catatan Teknis & Batasan

1. **Upload gambar di produksi.** `/api/upload` adalah middleware Vite, bukan serverless function. Di Vercel (static hosting) endpoint ini tidak ada — unggahan gambar CMS perlu dipindah ke Supabase Storage atau dibuat sebagai Vercel Function. Upload materi (`materi`) dan berkas tugas (`tugas`) sudah memakai Supabase Storage sehingga tidak terpengaruh.
2. **Dua lapis gaya.** Landing page memakai CSS murni; dashboard memakai Tailwind + `portal-shell.css`. Saat mengubah tampilan dashboard, periksa dulu `src/styles/portal-shell.css` karena banyak aturan bertanda `!important`.
3. **Cache modul saat dev.** Setelah merge yang mengubah nama kelas/komponen, Vite bisa menyajikan modul lama. Lakukan hard reload sebelum menyimpulkan ada bug.
4. **Ukuran bundle.** Chunk utama ~2,6 MB (gzip ~763 kB) karena `xlsx`, `three`, dan `jspdf` ikut dalam grafik dependensi. Kandidat optimasi: dynamic import untuk modul cetak/ekspor.
5. **Kunci ujian** tidak pernah dikirim ke browser; halaman ujian memakai view `questions_safe` dan penilaian dilakukan di database.

---

## Dokumentasi Lanjutan

| Dokumen | Isi |
| :--- | :--- |
| [`md/SETUP_DATABASE.md`](./md/SETUP_DATABASE.md) | Urutan migration Supabase per fase |
| [`md/FE_INTEGRATION.md`](./md/FE_INTEGRATION.md) | Kontrak data frontend ↔ Supabase |
| [`md/CBT_SESSION_GUARD.md`](./md/CBT_SESSION_GUARD.md) | Aturan anti-cheat & session guard ujian |
| [`md/PORTAL_MODULAR_CBT.md`](./md/PORTAL_MODULAR_CBT.md) | Struktur portal modular dan alur CBT |
| [`md/brief-vibe-coding.md`](./md/brief-vibe-coding.md) | Brief produk & design system awal |
| [`md/AUDIT_DASHBOARD_2026.md`](./md/AUDIT_DASHBOARD_2026.md) | Hasil audit dashboard & daftar perbaikan |
| [`md/schema-erd.mmd`](./md/schema-erd.mmd) | ERD dalam format Mermaid |

---

Dikembangkan untuk **SMK Muhammadiyah 8 Medan (MAPAN)** — SMK Pusat Keunggulan, Medan, Sumatera Utara.
