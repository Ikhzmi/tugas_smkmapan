# 01 — Inventaris Fitur Web SMKM 8 Medan

Sumber: `Web/src` (React 19 + Vite + React Router). Dokumen ini menjadi daftar fitur yang wajib tersedia di REST API Laravel.

## 1. Peta route Web

| Route | Komponen | Akses | Keterangan |
| --- | --- | --- | --- |
| `/` | `landing/LandingPage.jsx` | publik | Landing page + modal PPDB |
| `/login` | `pages/LoginPortal.jsx` | publik | Login guru/siswa (NISN atau username) |
| `/admin/login` | `pages/LoginAdmin.jsx` | publik | Login admin (username/email) |
| `/admin/dashboard` | `pages/DashboardAdmin.jsx` → `AdminCMSDashboard` | admin | Portal admin |
| `/admin/cms` | `AdminCMSDashboard` | admin | CMS konten publik |
| `/guru/dashboard` | `pages/DashboardGuru.jsx` | guru | LMS guru |
| `/lms/dashboard` | `pages/DashboardSiswa.jsx` | siswa | LMS siswa |
| `/login/guru`, `/login/siswa`, `/elearning`, `/lms`, `/lms/login` | redirect | publik | Alias lama |
| `*` | redirect `/` | publik | Fallback |

Guard: `components/RequireRole.jsx` menunggu `useAuth().loading` lalu redirect bila `profile.role` tidak cocok.

## 2. Fitur publik (landing)

| Fitur | Komponen | Sumber data |
| --- | --- | --- |
| Hero + statistik + video profil | `landing/components/Hero.jsx`, `VideoProfileModal.jsx` | `site_settings.hero` |
| Profil sekolah, visi/misi, sejarah, sambutan kepsek | `landing/components/ProfilSekolah.jsx`, `SchoolProfile.jsx` | `site_settings.sekolah`, `site_settings.profil` |
| Program keahlian + biaya | `landing/components/ProgramKeahlian.jsx`, `CurriculumAndTuition.jsx` | tabel `majors` |
| Fasilitas | `landing/components/Fasilitas.jsx`, `CampusFacilities.jsx` | tabel `facilities` |
| Ekstrakurikuler | `landing/components/Ekstrakurikuler.jsx`, `Extracurricular.jsx` | tabel `eskul` |
| Galeri | `landing/components/Galeri.jsx`, `StudentShowcase.jsx` | tabel `gallery` |
| Tenaga pendidik | `landing/components/TenagaPendidik.jsx`, `TeacherDirectory.jsx` | tabel `teachers` |
| Showreel/video | `LearningEcosystem.jsx`, `VideoProfileModal.jsx` | tabel `videos` (kategori `showreel`) |
| Kontak & saran | `landing/components/Kontak.jsx` | insert `suggestions` |
| PPDB | `PpdbModal.jsx`, `ContactAndPPDB.jsx` | insert `ppdb_registrations` |
| Tema terang/gelap | `ThemeContext.jsx` | lokal (tidak perlu API) |
| Analitik kunjungan | `AnalyticsTracker.jsx` | insert `site_visits` |

## 3. Autentikasi & sesi

| Fitur | Bukti kode | API baru |
| --- | --- | --- |
| Login siswa dengan NISN | `useAuth.jsx:57` (`emailForNisn`) | `POST /auth/login` identifier = NISN |
| Login guru/admin dengan username/email | `useAuth.jsx:9`, `LoginAdmin.jsx:51` | identifier = username/email |
| Redirect sesuai role | `LoginPortal.jsx:122-126`, `LoginAdmin.jsx:62` | respons login memuat `user.role` |
| Profil user | `useAuth.jsx:23-25` (`id,nama,role,foto_url`) | `GET /auth/me` |
| Satu akun satu perangkat (non-admin) | `lib/sessionGuard.js`, `hooks/useSessionGuard.js` | klaim/heartbeat/resume/release sesi |
| Masa tenggang 5 menit | `GRACE_MINUTES = 5` | sama |
| Admin bebas multi-perangkat | `useAuth.jsx:70-84` | role admin dikecualikan |
| Logout lokal | `signOut({ scope: 'local' })` | `POST /auth/logout` |
| Catat login | `lib/analytics.js:32` | insert `login_events` saat login sukses |
| Reset password oleh admin | `AdminAccountManager.jsx:128` | `POST /admin/accounts/{id}/reset-password` |
| Buat akun guru/siswa sekaligus data | RPC `admin_create_guru`, `admin_create_siswa` | endpoint admin terpadu |

## 4. Portal admin

Tab `AdminCMSDashboard` (`CMS_TABS`):

| Tab | Fitur | Tabel |
| --- | --- | --- |
| Ringkasan | jumlah siswa, statistik konten | `students`, `majors`, `teachers` |
| Profil | identitas sekolah (nama, NPSN, kontak, alamat, logo, kutipan) | `site_settings.sekolah` |
| Hero | eyebrow, judul, deskripsi, CTA, video, statistik, background | `site_settings.hero` |
| Tampilan | brand, wordmark, tagline, logo, label menu, footer nav | `site_settings.tampilan` |
| Teks Section | eyebrow/judul/lead tiap section | `site_settings.copy` |
| Jurusan | CRUD + foto + kurikulum/fasilitas/karir/sertifikasi | `majors` |
| Fasilitas | CRUD + foto | `facilities` |
| Eskul | CRUD + foto | `eskul` |
| Guru | CRUD data guru + akun login + foto | `teachers`, `users` |
| Galeri | CRUD + upload + rotasi | `gallery` |
| Data Siswa | CRUD siswa, import Excel/CSV, akun LMS | `students`, `users` |
| Data Guru | CRUD guru (tab terpisah) | `teachers` |
| Kelas | CRUD kelas, wali kelas, anggota | `classes`, `students` |
| Jadwal | CRUD roster + cek bentrok | `schedules` |
| Mapel | CRUD mata pelajaran | `subjects` |
| Presensi | rekap presensi semua kelas | `attendance` |
| Ujian | pengaturan CBT global, monitor attempt, reset | `site_settings.ujian`, `exams`, `attempts` |
| PPDB | daftar pendaftar, ubah status, export CSV | `ppdb_registrations` |
| Pesan | daftar saran/kontak, hapus | `suggestions` |
| Analitik | kunjungan & login 7/30/90 hari | `site_visits`, `login_events` |
| Kelola Akun | daftar akun, buat, ubah role, reset password, hapus | `users` |

Catatan: `AdminCMSDashboard.jsx` juga memakai `students` untuk hitungan awal (baris 323) dan `site_settings` untuk semua konten.

## 5. Portal guru

| Fitur | Detail | Tabel/RPC |
| --- | --- | --- |
| Identitas guru | cari `teachers` via `profile_id = user.id` | `teachers` |
| Jadwal mengajar | `schedules` + relasi kelas/mapel | `schedules` |
| Materi | CRUD, publikasi, upload PDF ke bucket `materi`, tipe `file/video/link/teks` | `materials` |
| Tugas | CRUD, publikasi, deadline | `assignments` |
| Pengumpulan | daftar submission per tugas, unduh berkas privat | `submissions`, bucket `tugas` |
| Penilaian | nilai 0-100 + feedback, status `dinilai` | `submissions` |
| Ujian | CRUD ujian, aktif/nonaktif, jadwal sesi, acak soal | `exams` |
| Bank soal | CRUD PG 4 opsi, bobot, gambar, import Excel/CSV | `questions` |
| Kode ujian | generate 6 karakter, aktif/nonaktif, wajib kode | `exam_codes`, `exams.butuh_kode` |
| Monitor attempt | daftar attempt siswa, reset attempt | `attempts`, RPC `reset_exam_attempt` |
| Live event | notifikasi warning/submit/terminate | `exam_events` (realtime lama) |
| Presensi | isi presensi per jadwal/tanggal, rekap | `attendance` |
| Rekap ujian | tabel nilai per kelas/mapel, KKM lokal 75 | `attempts`, `exams` |

## 6. Portal siswa

| Fitur | Detail | Tabel/RPC |
| --- | --- | --- |
| Identitas siswa | cari `students` via `profile_id` | `students`, `classes`, `majors` |
| Jadwal | jadwal kelas + guru | `schedules` |
| Materi | hanya `is_published` untuk kelasnya | `materials` |
| Tugas | hanya `is_published`; status buka/terlambat/selesai | `assignments`, `submissions` |
| Kumpul tugas | unggah berkas (maks 25 MB) atau tautan + catatan | bucket `tugas`, `submissions` |
| Ujian | daftar ujian aktif + status sesi | `exams`, `attempts`, `exam_question_counts` |
| Kerjakan ujian | kode, mulai, jawab autosave, submit/terminate, warning | RPC CBT |
| Presensi | presensi mandiri per jadwal hari ini + riwayat | `attendance` |
| Rekap nilai | nilai ujian & tugas | `attempts`, `submissions` |

## 7. CMS konten (bentuk data)

`site_settings` adalah key-value JSONB. Key yang dipakai:

| Key | Isi |
| --- | --- |
| `sekolah` | nama, singkatan, predikat, akreditasi, kurikulum, npsn, nss, hotline, hotline_raw, telepon, email, website, alamat, maps_url, whatsapp, instagram, jam_pelayanan, kepala_sekolah, logo_url, kutipan, kutipan_penulis |
| `profil` | visi, misi[], tujuan, sejarah_judul, sejarah_paragraf[], sejarah_milestones[], kepsek_sambutan, kepsek_pesan[], sejarah_foto, kartu_depan, kartu_belakang, kepala_sekolah |
| `hero` | eyebrow, titleLine1, titleAccent, titleLine2, desc, ctaLabel, videoLabel, videoUrl, stats[{value,label}], scriptWords[], backgroundImage |
| `tampilan` | brand, wordmark, tagline, logo_url, menu_labels{beranda,profil,program,sekolah,kontak}, footer_nav[{label,href}], privacy_url, terms_url |
| `copy` | per section (`profil`,`program`,`eskul`,`galeri`,`fasilitas`,`tenaga`,`kontak`,`ppdb`): eyebrow, titleStart, titleAccent, titleEnd, lead; kontak tambah `status` |
| `ujian` | `fitur_aktif` (boolean, default true) |

Fallback konten statis ada di `Web/src/data/schoolData.js` dan `Web/src/landing/data/*`; API baru harus menyediakan data default via seeder, bukan hardcode di frontend.

## 8. Fitur yang TIDAK perlu diporting

| Komponen | Alasan |
| --- | --- |
| `StudentLmsModal.jsx` | Demo statis (data hardcoded), tidak memakai backend |
| `content-store.js`, `assets/admin/*.html` | CMS lama berbasis localStorage, sudah digantikan React |
| `ContentContextLama.jsx` | Versi lama context |
| `src/lib/principalCard.js`, `sounds.js`, `theme` | Murni presentasi lokal |
| Realtime Supabase | Diganti polling/SSE (lihat dokumen 09) |

## 9. Ringkasan endpoint minimum

Semua di bawah prefix `/api/v1`:

- Publik: `GET /public/site`, `/public/majors`, `/public/teachers`, `/public/eskul`, `/public/facilities`, `/public/gallery`, `/public/videos`; `POST /public/ppdb`, `/public/suggestions`, `/public/visits`.
- Auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/session/{claim,resume,heartbeat,release}`.
- Admin: CRUD konten & akademik, akun, PPDB, pesan, analitik, upload.
- Guru: jadwal, materi, tugas, penilaian, presensi, ujian/soal/kode/attempt.
- Siswa: dashboard, jadwal, materi, tugas/kumpul, presensi, ujian/attempt/jawaban.

Detail kontrak ada di dokumen 04–09.
