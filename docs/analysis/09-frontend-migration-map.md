# 09 — Peta Migrasi Frontend

Tujuan peta ini adalah memastikan setiap panggilan backend Web memiliki
padanan endpoint Laravel. Folder `Web` tetap read-only; tabel ini hanya
menjadi kontrak migrasi berikutnya.

## 1. Infrastruktur dan autentikasi

| File Web | Panggilan lama | Endpoint API baru | Catatan migrasi |
| --- | --- | --- | --- |
| `hooks/useAuth.jsx` | `auth.getSession`, `onAuthStateChange`, `signInWithPassword` | `GET /auth/me`, `POST /auth/login`, `POST /auth/logout` | Simpan Bearer token; login identifier langsung, bukan Supabase Auth |
| `pages/LoginPortal.jsx` | login NISN/username | `POST /auth/login` | body `{identifier,password,device_id,device_label}` |
| `pages/LoginAdmin.jsx` | login email/username + profiles | `POST /auth/login` | role ada di `data.user.role` |
| `components/RequireRole.jsx` | guard profile.role | guard client + HTTP 403 API | API tetap sumber otorisasi |
| `hooks/useSessionGuard.js` | RPC claim/resume/touch/release + realtime | `/auth/session/{claim,resume,heartbeat,release,status}` | polling 30 detik, logout pada active=false |
| `components/SessionResume.jsx` | resume session | `POST /auth/session/resume` | tidak ada subscription Realtime |
| `lib/analytics.js` | insert `site_visits`, `login_events` | `POST /public/visits`; login event otomatis oleh server | jangan kirim kredensial |

## 2. Landing dan CMS publik

| File Web/context | Panggilan lama | Endpoint API baru |
| --- | --- | --- |
| `context/ContentContext.jsx` | select `site_settings` | `GET /public/site` |
| `context/ContentContext.jsx` | select `majors` | `GET /public/majors` |
| `context/ContentContext.jsx` | select active `teachers` | `GET /public/teachers` |
| `context/ContentContext.jsx` | select active `eskul` | `GET /public/eskul` |
| `context/ContentContext.jsx` | select active `facilities` | `GET /public/facilities` |
| `context/ContentContext.jsx` | select published `videos` kategori showreel | `GET /public/videos?category=showreel` |
| `context/ContentContext.jsx` | select active `gallery` | `GET /public/gallery` |
| `landing/components/Kontak.jsx` | insert `suggestions` | `POST /public/suggestions` |
| `landing/components/PpdbModal.jsx` / `ContactAndPPDB.jsx` | insert `ppdb_registrations` | `POST /public/ppdb` |
| `landing/components/*` | render payload konten | tetap komponen; ganti sumber context menjadi API |

## 3. Admin CMS

| File Web | Panggilan lama | Endpoint API baru |
| --- | --- | --- |
| `AdminCMSDashboard.jsx` | upsert `site_settings` | `GET/PATCH /admin/site-settings/{key}` |
| `AdminCMSDashboard.jsx` | CRUD `majors` | `/admin/majors` CRUD |
| `AdminCMSDashboard.jsx` | CRUD `facilities` | `/admin/facilities` CRUD |
| `AdminCMSDashboard.jsx` | CRUD `eskul` | `/admin/eskul` CRUD |
| `AdminCMSDashboard.jsx` | CRUD `gallery` | `/admin/gallery` CRUD |
| `AdminCMSDashboard.jsx` | CRUD `videos` | `/admin/videos` CRUD |
| `AdminCMSDashboard.jsx` | delete/update PPDB dan saran | `/admin/ppdb/{id}`, `/admin/suggestions/{id}` |
| `AdminAnalytics.jsx` | select `site_visits`, `login_events` | `GET /admin/analytics?range=7|30|90` |
| `AdminAttendance.jsx` | select attendance/students/classes | `/admin/attendance/summary` |
| `AdminExamSettings.jsx` | settings `ujian`, attempts, reset RPC | `/admin/site-settings/ujian`, `/guru/attempts/{id}/reset` atau admin endpoint |
| `AdminAccountManager.jsx` | account RPC | `/admin/accounts` CRUD/action endpoints |
| `AdminGuruManager.jsx` | teachers + account RPC + upload | `/admin/teachers`, `/admin/uploads/teacher-photo` |
| `AdminSiswaManager.jsx` | students/classes + account RPC | `/admin/students`, `/admin/classes` |
| `AdminKelasManager.jsx` | CRUD `classes` | `/admin/classes` CRUD |
| `AdminKelasManager.jsx` | anggota kelas | `GET /admin/classes/{id}/students` |
| `AdminMapelManager.jsx` | CRUD `subjects` | `/admin/subjects` CRUD |
| `AdminJadwalManager.jsx` | CRUD `schedules` | `/admin/schedules` CRUD |

## 4. Dashboard guru

| File | Panggilan lama | Endpoint API baru |
| --- | --- | --- |
| `pages/DashboardGuru.jsx` | teacher by profile/user | `GET /auth/me` (teacher included) |
| `pages/DashboardGuru.jsx` | schedules/classes/subjects | `GET /guru/schedules` |
| `pages/DashboardGuru.jsx` | CRUD `materials` | `/guru/materials` CRUD |
| `pages/DashboardGuru.jsx` | upload bucket `materi` | `POST /guru/materials/{id}/file` |
| `pages/DashboardGuru.jsx` | CRUD `assignments` | `/guru/assignments` CRUD |
| `pages/DashboardGuru.jsx` | list `submissions` | `GET /guru/assignments/{id}/submissions` |
| `components/guru/GradeModal.jsx` | update submission score | `PATCH /guru/submissions/{id}/grade` |
| `components/guru/AssignmentSubmissionsModal.jsx` | download file | `GET /guru/submissions/{id}/download` |
| `pages/DashboardGuru.jsx` | CRUD `exams` | `/guru/exams` CRUD |
| `components/guru/ExamQuestionsModal.jsx` | CRUD `questions` | `/guru/exams/{id}/questions`, `/guru/questions/{id}` |
| `components/guru/ExamCodeModal.jsx` | generate/update `exam_codes` | `/guru/exams/{id}/code` |
| `pages/DashboardGuru.jsx` | reset attempt RPC | `POST /guru/attempts/{id}/reset` |
| `components/ExamAttemptsModal.jsx` | list attempts | `GET /guru/exams/{id}/attempts` |
| `components/ExamClassRecap.jsx` | aggregate attempts | `GET /guru/exams/{id}/recap` |
| `components/ExamLiveToasts.jsx`, `hooks/useExamLiveEvents.js` | Realtime `exam_events` | `GET /guru/exams/events?since=...` polling |
| `components/guru/PresensiGuru.jsx` | attendance insert/update | `/guru/attendance` CRUD/summary |

## 5. Dashboard siswa

| File | Panggilan lama | Endpoint API baru |
| --- | --- | --- |
| `pages/DashboardSiswa.jsx` | student by profile | `GET /auth/me` |
| `pages/DashboardSiswa.jsx` | class schedule | `GET /siswa/schedules` |
| `pages/DashboardSiswa.jsx` | published materials | `GET /siswa/materials` |
| `components/siswa/MaterialViewerModal.jsx` | material detail/file URL | `GET /siswa/materials/{id}` |
| `pages/DashboardSiswa.jsx` | published assignments + submissions | `GET /siswa/assignments`, `/siswa/submissions` |
| `pages/DashboardSiswa.jsx` | detail tugas | `GET /siswa/assignments/{id}` |
| `components/siswa/SubmissionModal.jsx` | insert `submissions` + bucket tugas | `POST /siswa/assignments/{id}/submissions` multipart |
| `pages/DashboardSiswa.jsx` | exams, counts, unlocks, attempts | `GET /siswa/exams` |
| `components/siswa/ExamRunner.jsx` | `questions_safe` | `GET /siswa/attempts/{id}` atau start response soal aman |
| `components/siswa/ExamRunner.jsx` | insert/update `attempts` | `POST /siswa/exams/{id}/attempts` |
| `components/siswa/ExamRunner.jsx` | select/upsert `answers` | `PUT /siswa/attempts/{attempt}/answers/{question}` |
| `components/siswa/ExamRunner.jsx` | verify/has unlock RPC | `/siswa/exams/{id}/unlock` GET/POST |
| `components/siswa/ExamRunner.jsx` | warning/submit/terminate RPC | `/siswa/attempts/{id}/{warnings,submit,terminate}` |
| `components/siswa/PresensiSiswa.jsx` | attendance self-service | `/siswa/attendance` |
| `pages/DashboardSiswa.jsx` | rekap nilai tugas/ujian | `GET /siswa/grades` |

## 6. Data shape compatibility

Resource API boleh menggunakan nama domain lama (`nama`, `nisn`, `foto_url`,
`class_id`) agar perubahan Web kecil. Perbedaan yang disengaja:

- `profile_id` menjadi `user_id` hanya di internal; resource publik tidak
  mengeksposnya.
- `file_url` submission diganti `download_url` sementara; `file_path` tidak
  dikirim.
- `questions_safe` menjadi resource `questions` dengan allow-list eksplisit
  tanpa `kunci_jawaban`.
- Supabase error tidak lagi menjadi objek `{error}`; frontend migrasi membaca
  HTTP status dan `{message,errors,code}`.

## 7. Checklist tidak ada baris tertinggal

- [x] Auth dan profile
- [x] Sesi tunggal
- [x] Konten publik
- [x] PPDB, saran, kunjungan
- [x] CMS admin
- [x] Akun dan akademik
- [x] Materi, tugas, submission, penilaian
- [x] Presensi
- [x] Ujian, kode, unlock, attempt, answer, warning, reset
- [x] Event ujian melalui polling
- [x] Analytics admin

Import Excel/CSV tetap diproses client-side oleh Web sesuai implementasi
`studentImport.js` dan `questionImport.js`; API menerima baris JSON tervalidasi
dan tidak perlu dependensi spreadsheet.
