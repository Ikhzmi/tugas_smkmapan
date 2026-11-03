# 02 — Peran, Hak Akses, dan Aturan Kepemilikan

## 1. Peran

| Role | Sumber | Deskripsi |
| --- | --- | --- |
| `admin` | `users.role` (lama: `profiles.role`) | Pengelola konten, akademik, akun, analitik |
| `guru` | `users.role` + baris `teachers.profile_id` | Pengajar; hanya mengelola data miliknya |
| `siswa` | `users.role` + baris `students.profile_id` | Peserta didik; hanya data miliknya |
| `anon` | tanpa token | Hanya endpoint publik |

Tidak ada role lain. Role disimpan sebagai string dengan CHECK constraint (`admin`,`guru`,`siswa`).

## 2. Matriks akses ringkas

| Area | Anon | Siswa | Guru | Admin |
| --- | --- | --- | --- | --- |
| Landing/CMS publik (baca) | ya | ya | ya | ya |
| PPDB & saran (kirim) | ya | ya | ya | ya |
| Analitik kunjungan (kirim) | ya | ya | ya | ya |
| Login/logout/me | ya | ya | ya | ya |
| Dashboard siswa | – | milik sendiri | – | – |
| Materi/tugas/ujian kelas | – | kelas sendiri | yang dia ampu | semua |
| Presensi mandiri | – | milik sendiri | – | – |
| Presensi oleh guru | – | – | jadwal sendiri | semua |
| CRUD materi/tugas/ujian/soal | – | – | milik sendiri | semua |
| Nilai submission | – | – | tugas miliknya | semua |
| Reset attempt | – | – | ujian miliknya | semua |
| CRUD jurusan/fasilitas/eskul/galeri/video | – | – | – | ya |
| CRUD kelas/mapel/jadwal/siswa/guru | – | – | – | ya |
| Akun & reset password | – | – | – | ya |
| Analitik agregat | – | – | – | ya |
| Pengaturan `site_settings` | – | – | – | ya |
| Monitor semua attempt | – | – | ujian miliknya | semua |

## 3. Aturan kepemilikan (ownership)

### Guru
- `teachers.profile_id = auth.id` menentukan identitas guru. Bila tidak ada baris guru → `403 GURU_PROFILE_NOT_FOUND`.
- Materi/tugas/ujian hanya boleh dibuat dengan `teacher_id` milik sendiri (diisi server, bukan dari body).
- Guru boleh melihat submission hanya untuk assignment miliknya; boleh menilai submission tersebut.
- Guru boleh melihat attempt hanya untuk exam miliknya; boleh reset attempt tersebut.
- Presensi: hanya untuk `schedule.teacher_id = teacher.id` (atau admin).
- Guru **tidak** boleh mengubah `teacher_id`, `student_id`, `profile_id`, atau role.

### Siswa
- `students.profile_id = auth.id`. Bila tidak ada → `403 SISWA_PROFILE_NOT_FOUND`.
- Hanya membaca materi/tugas/ujian untuk `class_id` miliknya dan `is_published=true` (ujian: `is_active=true`).
- Submission hanya untuk `student_id` sendiri dan assignment kelasnya.
- Attempt/answers hanya milik sendiri.
- Presensi hanya untuk dirinya, dan hanya untuk jadwal kelasnya pada hari tersebut.
- Siswa tidak boleh melihat `kunci_jawaban`, `nilai_akhir` attempt berjalan, atau data siswa lain.

### Admin
- Akses penuh ke semua data.
- **Pengecualian sesi**: admin tidak terikat aturan satu akun satu perangkat (`useAuth.jsx:70-84`). Login admin tidak memanggil claim/heartbeat dan tidak mencabut token admin lain.
- Admin tidak boleh menghapus akunnya sendiri (cegah lockout).
- Reset password admin tidak mengubah role.

## 4. Aturan publik vs privat

| Data | Publik | Privat |
| --- | --- | --- |
| `majors` | field konten + `foto_url`; hanya `is_active=true` | biaya tetap publik (dipakai landing) |
| `teachers` | nama, gelar, jabatan, department, foto, bio, sertifikasi, jam_kerja, email publik? | `profile_id` tidak pernah dikirim |
| `students` | – | semua field; `nisn`/`nis` hanya untuk admin/guru terkait |
| `submissions.file_url` | – | path privat; guru menerima signed URL sementara |
| `questions.kunci_jawaban` | – | tidak pernah dikirim ke siswa |
| `exam_codes.code` | – | hanya guru pemilik/admin |
| `site_visits`/`login_events` | – | hanya admin (agregat) |
| `ppdb_registrations`, `suggestions` | – | hanya admin |

## 5. Middleware & penegakan

- `auth:sanctum` untuk semua endpoint privat.
- `role:admin`, `role:guru`, `role:admin,guru`, `role:siswa` untuk pembatasan kasar.
- Policy/Guard level resource untuk kepemilikan:
  - `MaterialPolicy`, `AssignmentPolicy`, `SubmissionPolicy`, `ExamPolicy`, `QuestionPolicy`, `AttemptPolicy`, `SchedulePolicy`.
- `EnsureRole` mengembalikan `403` dengan `{message:"Akses ditolak.", errors:{role:["..."]}}`.
- `EnsureProfile` memastikan baris guru/siswa ada sebelum controller dijalankan.
- Semua ID di route divalidasi sebagai UUID; ID milik orang lain → `404` (bukan `403`) untuk mencegah enumerasi, kecuali admin.

## 6. Aturan tambahan

- Admin membuat akun guru/siswa sekaligus data profil; `username` guru opsional (default dari email), `nisn` siswa wajib dan unik.
- `users.is_active=false` → login ditolak `403 ACCOUNT_INACTIVE`; token yang ada dicabut.
- Guru/siswa yang dihapus: hapus `users` + baris `teachers`/`students`; relasi akademik memakai `ON DELETE SET NULL` (materi/tugas/ujian tetap ada, `teacher_id` null) atau `CASCADE` untuk data anak (submission/attempt/answer/attendance) sesuai dokumen 03.
- Perubahan role oleh admin mencabut semua token user tersebut dan membuat baris `user_sessions` revoked.

## 7. Asumsi

- Web lama mengandalkan RLS Supabase; di API baru semua otorisasi dilakukan di Laravel. RLS tetap diaktifkan tanpa policy sebagai lapisan pertahanan (akses hanya lewat role `postgres`).
- Pesan error role mengikuti gaya Web (`Akses ditolak: hanya admin ...`) agar migrasi UI mudah, tetapi kode error tetap disediakan untuk mobile.
