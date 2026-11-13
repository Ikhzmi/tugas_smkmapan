# 03 — Model Data Kanonik

Dokumen ini mendefinisikan skema PostgreSQL untuk API baru. Skema **tidak harus identik** dengan Supabase lama, tetapi memetakan semua kolom yang dipakai Web. Perubahan nama kolom dicatat di bagian 11.

## 1. Keputusan ID & konvensi

- Semua tabel domain memakai **UUID** sebagai primary key (`HasUuids`, UUID terurut). Ini mempertahankan asumsi Web lama (`isDbId` memeriksa UUID) dan aman untuk mobile.
- Tabel framework (`personal_access_tokens`, `cache`, `jobs`, `failed_jobs`) tetap memakai bigint default Laravel.
- Karena `users.id` UUID, migrasi Sanctum diubah menjadi `$table->uuidMorphs('tokenable')`.
- Timestamp: `timestamptz` (disimpan UTC), dikirim ISO 8601. `date` untuk tanggal presensi/PPDB; `time` untuk jam jadwal/presensi.
- JSONB untuk array/objek dinamis (kurikulum, opsi soal, settings).
- Hapus keras (hard delete), tanpa soft delete, kecuali disebutkan.
- Semua foreign key memakai `ON DELETE` eksplisit.

## 2. Tabel inti

### `users`
| Kolom | Tipe | Aturan |
| --- | --- | --- |
| id | uuid | PK |
| name | varchar(150) | wajib |
| username | varchar(100) | nullable, unik, lowercase |
| email | varchar(150) | nullable, unik, lowercase |
| password | varchar | hash bcrypt |
| role | varchar(10) | check `admin`,`guru`,`siswa` |
| foto_url | text | nullable |
| is_active | boolean | default true |
| last_login_at | timestamptz | nullable |
| remember_token | varchar(100) | nullable |
| created_at/updated_at | timestamptz | |

Menggantikan `profiles(id, nama, role, foto_url)`. `nama` → `name`.

### `user_sessions`
| Kolom | Tipe | Aturan |
| --- | --- | --- |
| id | uuid | PK |
| user_id | uuid | FK users, cascade |
| personal_access_token_id | bigint | FK personal_access_tokens, nullOnDelete |
| device_id | varchar(100) | wajib |
| device_label | varchar(100) | nullable |
| last_seen_at | timestamptz | wajib |
| revoked_at | timestamptz | nullable |
| created_at/updated_at | timestamptz | |

Aturan: satu sesi aktif per user non-admin (ditegakkan aplikasi + partial unique index `user_id WHERE revoked_at IS NULL` di PostgreSQL). Admin tidak memakai tabel ini.

### `site_settings`
| Kolom | Tipe | Aturan |
| --- | --- | --- |
| key | varchar(50) | PK (`sekolah`,`profil`,`hero`,`tampilan`,`copy`,`ujian`) |
| value | jsonb | wajib, default `{}` |
| created_at/updated_at | timestamptz | |

### `majors`
`id` uuid PK, `kode` varchar(20) unik, `nama` varchar(150), `tagline` varchar(255) null, `deskripsi` text null, `biaya_pendaftaran` integer default 0, `spp_bulanan` integer default 0, `warna` varchar(20), `warna_soft` varchar(20), `ikon` varchar(50), `foto_url` text null, `kurikulum` jsonb default `[]`, `fasilitas` jsonb default `[]`, `karir` jsonb default `[]`, `sertifikasi` jsonb default `[]`, `is_active` boolean default true, timestamps.

### `teachers`
`id` uuid PK, `user_id` uuid unik null (FK users, nullOnDelete), `nama` varchar(150) unik, `gelar` varchar(100) null, `jabatan` varchar(100) null, `department` varchar(100) null, `email` varchar(150) null, `jam_kerja` varchar(100) null, `bio` text null, `sertifikasi` jsonb default `[]`, `foto_url` text null, `is_active` boolean default true, `sort_order` integer default 0, timestamps.

### `classes`
`id` uuid PK, `nama` varchar(100), `tingkat` smallint null, `tahun_ajaran` varchar(20), `major_id` uuid null (FK majors, nullOnDelete), `wali_kelas_id` uuid null (FK teachers, nullOnDelete), timestamps. Unik (`nama`,`tahun_ajaran`).

### `students`
`id` uuid PK, `user_id` uuid unik null (FK users, nullOnDelete), `nisn` varchar(20) unik, `nis` varchar(20) null, `nama` varchar(150), `no_hp` varchar(30) null, `alamat` text null, `class_id` uuid null (FK classes, nullOnDelete), timestamps.

### `subjects`
`id` uuid PK, `kode` varchar(20) unik null, `nama` varchar(150), `major_id` uuid null (FK majors, nullOnDelete), timestamps.

### `schedules`
`id` uuid PK, `class_id` uuid (FK classes, cascade), `subject_id` uuid (FK subjects, cascade), `teacher_id` uuid null (FK teachers, nullOnDelete), `hari` varchar(10) check `senin`..`sabtu`/`minggu`, `jam_mulai` time, `jam_selesai` time, timestamps. Index (`teacher_id`,`hari`), (`class_id`,`hari`). Cek bentrok dilakukan aplikasi (kelas atau guru overlap pada hari sama).

## 3. LMS

### `materials`
`id` uuid PK, `teacher_id` uuid null (FK teachers, nullOnDelete), `subject_id` uuid null (FK subjects, nullOnDelete), `class_id` uuid null (FK classes, nullOnDelete), `judul` varchar(200), `deskripsi` text null, `tipe` varchar(10) check `file`,`video`,`link`,`teks`, `file_url` text null, `is_published` boolean default false, timestamps. Index (`class_id`,`is_published`), (`teacher_id`).

### `assignments`
`id` uuid PK, `teacher_id` uuid null (FK teachers, nullOnDelete), `subject_id` uuid null (FK subjects, nullOnDelete), `class_id` uuid null (FK classes, nullOnDelete), `judul` varchar(200), `deskripsi` text null, `deadline` timestamptz null, `is_published` boolean default false, timestamps. Index (`class_id`,`is_published`), (`teacher_id`).

### `submissions`
| Kolom | Tipe | Aturan |
| --- | --- | --- |
| id | uuid | PK |
| assignment_id | uuid | FK assignments, cascade |
| student_id | uuid | FK students, cascade |
| file_path | text | nullable, path disk privat |
| file_name | varchar(255) | nullable |
| file_size | bigint | nullable |
| file_url | text | nullable, tautan eksternal |
| catatan | text | nullable |
| nilai | numeric(5,2) | nullable, 0–100 |
| feedback | text | nullable |
| status | varchar(15) | check `dikumpulkan`,`dinilai` |
| dikumpulkan_at | timestamptz | nullable |
| dinilai_at | timestamptz | nullable |
| created_at/updated_at | timestamptz | |

Unik (`assignment_id`,`student_id`). Web lama menyimpan `tugas://path` di `file_url`; API baru memisahkan `file_path` dan `file_url`.

## 4. Presensi

### `attendance`
| Kolom | Tipe | Aturan |
| --- | --- | --- |
| id | uuid | PK |
| student_id | uuid | FK students, cascade |
| class_id | uuid | FK classes, cascade |
| schedule_id | uuid | FK schedules, nullOnDelete |
| tanggal | date | wajib |
| jam_masuk | time | nullable |
| status | varchar(10) | check `hadir`,`terlambat`,`izin`,`sakit`,`alpa` |
| metode | varchar(10) | check `mandiri`,`guru` |
| catatan | text | nullable |
| created_at/updated_at | timestamptz | |

Unik (`student_id`,`schedule_id`,`tanggal`). Untuk `schedule_id` null, aplikasi mencegah duplikasi (`student_id`,`tanggal`,`class_id`).

## 5. Ujian CBT

### `exams`
`id` uuid PK, `teacher_id` uuid null (FK teachers, nullOnDelete), `subject_id` uuid null (FK subjects, nullOnDelete), `judul` varchar(200), `deskripsi` text null, `durasi_menit` integer default 60, `waktu_mulai` timestamptz null, `waktu_selesai` timestamptz null, `is_active` boolean default false, `is_approved` boolean default true, `butuh_kode` boolean default false, `admin_override` boolean default false, `acak_soal` boolean default true, timestamps. Index (`teacher_id`), (`is_active`).

### `questions`
`id` uuid PK, `exam_id` uuid (FK exams, cascade), `tipe` varchar(10) default `pg` check `pg`,`essay`, `pertanyaan` text, `opsi` jsonb default `[]` (4 string), `kunci_jawaban` char(1) check A–D, `bobot` numeric(5,2) default 1, `gambar_url` text null, timestamps. Index (`exam_id`).

### `exam_codes`
`id` uuid PK, `exam_id` uuid unik (FK exams, cascade), `code` varchar(10), `is_active` boolean default true, `created_at/updated_at`. Kode 6 karakter alfanumerik uppercase, unik per ujian.

### `exam_unlocks`
`id` uuid PK, `exam_id` uuid (FK exams, cascade), `student_id` uuid (FK students, cascade), `unlocked_at` timestamptz, timestamps. Unik (`exam_id`,`student_id`).

### `attempts`
| Kolom | Tipe | Aturan |
| --- | --- | --- |
| id | uuid | PK |
| exam_id | uuid | FK exams, cascade |
| student_id | uuid | FK students, cascade |
| status | varchar(12) | check `berjalan`,`selesai`,`dibatalkan` |
| dimulai_at | timestamptz | wajib |
| dikumpulkan_at | timestamptz | nullable |
| nilai_akhir | numeric(5,2) | nullable |
| question_order | jsonb | array UUID, nullable |
| warnings | smallint | default 0 |
| alasan_berhenti | text | nullable |
| dihentikan_at | timestamptz | nullable |
| created_at/updated_at | timestamptz | |

Index (`exam_id`,`student_id`), (`student_id`,`status`). Satu attempt `berjalan` per (`exam_id`,`student_id`) ditegakkan aplikasi + partial unique index.

### `answers`
`id` uuid PK, `attempt_id` uuid (FK attempts, cascade), `question_id` uuid (FK questions, cascade), `jawaban` text null, timestamps. Unik (`attempt_id`,`question_id`).

### `exam_events`
`id` uuid PK, `teacher_id` uuid null (FK teachers, nullOnDelete), `exam_id` uuid (FK exams, cascade), `attempt_id` uuid null (FK attempts, cascade), `student_id` uuid null (FK students, cascade), `type` varchar(12) check `warning`,`submitted`,`terminated`, `message` text null, `created_at` timestamptz. Index (`teacher_id`,`created_at`).

## 6. CMS publik

### `videos`
`id` uuid PK, `judul` varchar(200), `kreator` varchar(150) null, `durasi_text` varchar(30) null, `deskripsi` text null, `software` jsonb default `[]`, `thumbnail_url` text null, `episode_no` integer null, `kategori` varchar(30) default `showreel`, `is_published` boolean default false, `sort_order` integer default 0, timestamps.

### `facilities`
`id` uuid PK, `judul` varchar(200), `kategori` varchar(30) default `campus`, `image_url` text null, `specs` text null, `deskripsi` text null, `tags` jsonb default `[]`, `badge` varchar(100) null, `sort_order` integer default 0, `is_active` boolean default true, timestamps.

### `eskul`
`id` uuid PK, `nama` varchar(150) unik, `kategori` varchar(100) null, `image_url` text null, `warna` varchar(20) null, `warna_soft` varchar(20) null, `deskripsi` text null, `jadwal` varchar(150) null, `pembina` varchar(150) null, `prestasi` text null, `jumlah_anggota` integer null, `max_anggota` integer null, `is_active` boolean default true, timestamps.

### `gallery`
`id` uuid PK, `judul` varchar(200), `kategori` varchar(100) null, `tanggal` date null, `deskripsi` text null, `image_url` text null, `rotate` numeric(6,2) default 0, `sort_order` integer default 0, `is_active` boolean default true, timestamps.

## 7. PPDB, pesan, analitik

### `ppdb_registrations`
`id` uuid PK, `nama_lengkap` varchar(150), `nisn` varchar(20) null, `asal_sekolah` varchar(200) null, `no_hp` varchar(30) null, `email` varchar(150) null, `major_id` uuid null (FK majors, nullOnDelete), `status` varchar(25) default `baru` check `baru`,`menunggu_verifikasi`,`diterima`,`ditolak`, timestamps. Index (`status`), (`created_at`).

### `suggestions`
`id` uuid PK, `nama` varchar(150), `email` varchar(150) null, `no_hp` varchar(30) null, `kategori` varchar(100) null, `pesan` text, `status` varchar(20) default `baru`, timestamps.

### `site_visits`
`id` uuid PK, `visited_at` timestamptz default now, `path` text null, `role` varchar(10) default `anon` check `anon`,`admin`,`guru`,`siswa`, `user_id` uuid null (FK users, nullOnDelete), `session_id` varchar(100) null, `user_agent` varchar(300) null. Index (`visited_at` desc), (`session_id`), (`role`).

### `login_events`
`id` uuid PK, `logged_in_at` timestamptz default now, `user_id` uuid null (FK users, nullOnDelete), `role` varchar(10) check `admin`,`guru`,`siswa`, `nama` varchar(150) null. Index (`logged_in_at` desc), (`role`), (`user_id`).

## 8. Storage

Disk Laravel:
- `public` (`storage/app/public`, URL `/storage/...`): `branding/jurusan`, `branding/hero`, `branding/profile`, `eskul`, `fasilitas`, `galeri`, `soal`, `materi/{teacher_id}`.
- `local` privat (`storage/app/private`): `tugas/{nisn}/{assignment_id}-{timestamp}.{ext}`.

Aturan unggah:
| Konteks | Maks | Tipe |
| --- | --- | --- |
| gambar (branding/jurusan/hero/profile/eskul/fasilitas/galeri/soal) | 5 MB | jpg, jpeg, png, webp, gif |
| materi PDF | 25 MB | pdf |
| submission tugas | 25 MB | pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, jpg, png, webp, txt |

Nama file disanitasi (`[^\w.-]` → `_`), prefix timestamp. URL publik untuk bucket publik; submission memakai signed URL 1 jam.

## 9. Pengganti view/RPC Supabase

| Lama | Baru |
| --- | --- |
| `profiles` | `users` |
| `questions_safe` | endpoint soal siswa tanpa `kunci_jawaban` |
| `exam_question_counts` | agregasi `count(questions)` per exam |
| `materi` / `tugas` (bucket) | disk `public` / `local` |
| RPC `admin_*` | controller admin + service |
| RPC `generate/verify_exam_code` | service `ExamCodeService` |
| RPC `has_exam_unlock` | cek baris `exam_unlocks` |
| RPC `record_exam_warning` | service attempt (increment + event) |
| RPC `reset/terminate/submit_attempt` | `AttemptService` |
| RPC `claim/touch/resume/release_user_session` | `UserSessionService` |

## 10. Indeks & integritas penting

- `users`: unique `username`, `email`; index `role`.
- `teachers`: unique `nama`, unique `user_id`; index `is_active`.
- `students`: unique `nisn`, unique `user_id`; index `class_id`.
- `schedules`: index (`teacher_id`,`hari`), (`class_id`,`hari`).
- `materials`/`assignments`: index (`class_id`,`is_published`), (`teacher_id`).
- `submissions`: unique (`assignment_id`,`student_id`), index `student_id`.
- `attendance`: unique (`student_id`,`schedule_id`,`tanggal`), index (`class_id`,`tanggal`).
- `attempts`: index (`exam_id`,`student_id`), partial unique (`exam_id`,`student_id`) where status `berjalan`.
- `answers`: unique (`attempt_id`,`question_id`).
- `exam_events`: index (`teacher_id`,`created_at`).
- `site_visits`/`login_events`: index waktu desc + role.

## 11. Pemetaan nama lama → baru

| Lama | Baru |
| --- | --- |
| `profiles.id/nama/role/foto_url` | `users.id/name/role/foto_url` |
| `teachers.profile_id` | `teachers.user_id` |
| `students.profile_id` | `students.user_id` |
| `submissions.file_url = tugas://path` | `submissions.file_path` (+ `file_name`,`file_size`) |
| `gallery.rotate` numeric | sama |
| `videos.kategori` | sama |
| `site_settings.value` jsonb | sama |
| `exam_question_counts.jumlah` | `questions_count` di resource |

## 12. Catatan RLS

Command `php artisan db:secure-rls` mengaktifkan `ROW LEVEL SECURITY` di semua tabel `public` tanpa policy. Karena Laravel terhubung sebagai `postgres` (BYPASSRLS), aplikasi tetap berjalan; akses anon/service key Supabase tidak dipakai. Jalankan command setiap selesai menambah tabel.
