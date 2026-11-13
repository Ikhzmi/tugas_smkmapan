# 08 — Spesifikasi Endpoint REST v1

Semua path memakai prefix `/api/v1`. Respons sukses standar:

```json
{"data": {}, "message": "Berhasil.", "meta": {}}
```

Respons list memakai `data` array dan `meta` pagination. Error standar:

```json
{"message":"Data tidak valid.","errors":{"field":["... "]},"code":"VALIDATION_ERROR"}
```

`per_page` maksimal 100. Query search case-insensitive di PostgreSQL memakai
`ILIKE`; implementasi test SQLite menggunakan fallback `LOWER(...) LIKE`.

## Auth

| Method | Path | Role | Body/query | Hasil |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | publik | `identifier`, `password`, optional `device_id`, `device_label` | token Bearer, user, session; 401/403/409 |
| POST | `/auth/logout` | authenticated | – | 204, token dicabut |
| GET | `/auth/me` | authenticated | – | user + teacher/student ringkas |
| PATCH | `/auth/profile` | authenticated | `name`, optional `foto_url` | user terbaru |
| POST | `/auth/change-password` | authenticated | `current_password`, `password`, `password_confirmation` | 204, seluruh token dicabut |
| POST | `/auth/session/claim` | guru/siswa | `device_id`, `device_label` | sesi atau 409 conflict |
| POST | `/auth/session/resume` | guru/siswa | `device_id` | status sesi |
| POST | `/auth/session/heartbeat` | guru/siswa | `session_id` | active + last_seen |
| POST | `/auth/session/release` | guru/siswa | `session_id` | released |
| GET | `/auth/session/status` | guru/siswa | – | sesi perangkat ini |

## Admin akun

| Method | Path | Input utama |
| --- | --- | --- |
| GET | `/admin/accounts` | `q`, `role`, `page`, `per_page`, `sort` |
| POST | `/admin/accounts` | `name`, `email/username`, `role`, `password` |
| PATCH | `/admin/accounts/{user}/role` | `role` |
| POST | `/admin/accounts/{user}/reset-password` | `password`, confirmation |
| DELETE | `/admin/accounts/{user}` | –; admin sendiri ditolak |
| POST | `/admin/teachers` | profil guru + `create_account`, username/password |
| GET/PATCH/DELETE | `/admin/teachers/{teacher}` | profil guru |
| POST | `/admin/students` | profil siswa + `create_account`, password |
| GET/PATCH/DELETE | `/admin/students/{student}` | profil siswa |
| POST | `/admin/students/import` | `class_id`, `rows[]` |

## Akademik

Admin CRUD: `GET/POST/PATCH/DELETE /admin/majors`, `/admin/classes`,
`/admin/subjects`, `/admin/schedules`. Subresource `GET
/admin/classes/{class}/students`. List memakai filter relasi (`class_id`,
`major_id`, `teacher_id`, `hari`, `q`) dan sorting whitelist. Guru/siswa:

| Method | Path | Role |
| --- | --- | --- |
| GET | `/guru/schedules` | guru |
| GET | `/siswa/schedules` | siswa |
| GET | `/public/majors` | publik |
| GET | `/public/teachers` | publik |

## LMS

| Method | Path | Role |
| --- | --- | --- |
| GET | `/guru/dashboard` | guru |
| GET/POST | `/guru/materials` | guru |
| PATCH/DELETE | `/guru/materials/{material}` | pemilik/admin |
| POST | `/guru/materials/{material}/publish` | pemilik/admin |
| POST | `/guru/materials/{material}/file` | pemilik/admin, PDF 25 MB |
| GET/POST | `/guru/assignments` | guru |
| PATCH/DELETE | `/guru/assignments/{assignment}` | pemilik/admin |
| POST | `/guru/assignments/{assignment}/publish` | pemilik/admin |
| GET | `/guru/assignments/{assignment}/submissions` | pemilik/admin |
| PATCH | `/guru/submissions/{submission}/grade` | guru pemilik |
| GET | `/guru/submissions/{submission}/download` | guru pemilik |
| GET | `/siswa/dashboard` | siswa |
| GET | `/siswa/materials`, `/siswa/materials/{material}` | siswa kelas sendiri |
| GET | `/siswa/assignments`, `/siswa/assignments/{assignment}` | siswa kelas sendiri |
| POST | `/siswa/assignments/{assignment}/submissions` | siswa pemilik, multipart |
| GET | `/siswa/submissions`, `/siswa/grades` | siswa sendiri |

## Presensi

| Method | Path | Role |
| --- | --- | --- |
| GET | `/guru/attendance` | guru jadwal sendiri |
| POST | `/guru/attendance` | guru jadwal sendiri |
| PATCH | `/guru/attendance/{attendance}` | guru/admin |
| GET | `/guru/attendance/summary` | guru/admin |
| GET | `/siswa/attendance` | siswa sendiri |
| POST | `/siswa/attendance` | siswa jadwal kelas hari ini |
| GET | `/admin/attendance/summary` | admin |

Body presensi: `student_id` (guru/admin only), `schedule_id`, `tanggal`,
`status`, optional `jam_masuk`, `catatan`. Unique conflict menghasilkan 409.

## Ujian

| Method | Path | Role |
| --- | --- | --- |
| GET/POST | `/guru/exams` | guru |
| PATCH/DELETE | `/guru/exams/{exam}` | pemilik/admin |
| GET/POST | `/guru/exams/{exam}/questions` | pemilik/admin |
| PATCH/DELETE | `/guru/questions/{question}` | pemilik/admin |
| POST | `/guru/exams/{exam}/code` | pemilik/admin, optional `length` |
| PATCH | `/guru/exams/{exam}/code` | pemilik/admin, `is_active` |
| GET | `/guru/exams/{exam}/attempts` | pemilik/admin |
| POST | `/guru/attempts/{attempt}/reset` | pemilik/admin |
| POST | `/guru/attempts/{attempt}/terminate` | pemilik/admin |
| GET | `/guru/exams/events` | guru/admin, `since`, `exam_id` |
| GET | `/siswa/exams` | siswa kelas/ujian aktif |
| GET | `/siswa/exams/{exam}/unlock` | siswa |
| POST | `/siswa/exams/{exam}/unlock` | siswa, `code`, rate limited |
| POST | `/siswa/exams/{exam}/attempts` | siswa |
| GET | `/siswa/attempts/{attempt}` | siswa pemilik; soal aman + jawaban sendiri |
| PUT | `/siswa/attempts/{attempt}/answers/{question}` | siswa pemilik, `jawaban` |
| POST | `/siswa/attempts/{attempt}/warnings` | siswa pemilik |
| POST | `/siswa/attempts/{attempt}/submit` | siswa pemilik |
| POST | `/siswa/attempts/{attempt}/terminate` | siswa pemilik |
| GET | `/siswa/grades` | siswa sendiri |

`questions` untuk siswa tidak memuat `kunci_jawaban`; resource hasil hanya
memuat nilai setelah status attempt selesai dan policy memperbolehkannya.

## CMS publik, PPDB, dan saran

| Method | Path | Role |
| --- | --- | --- |
| GET | `/public/site` | publik, settings terpilih |
| GET | `/public/facilities`, `/public/eskul`, `/public/gallery`, `/public/videos` | publik |
| POST | `/public/ppdb` | publik, rate limit 10/menit/IP |
| POST | `/public/suggestions` | publik, rate limit 10/menit/IP |
| POST | `/public/visits` | publik, best effort |
| GET/PATCH | `/admin/site-settings/{key}` | admin |
| GET/POST/PATCH/DELETE | `/admin/facilities`, `/admin/eskul`, `/admin/gallery`, `/admin/videos` | admin |
| GET/PATCH/DELETE | `/admin/ppdb/{registration}`, `/admin/suggestions/{suggestion}` | admin |
| POST | `/admin/uploads/{context}` | admin, validasi MIME/ukuran |

## Analitik

`GET /admin/analytics?range=7|30|90` mengembalikan kunjungan/login harian,
role breakdown, event terbaru, dan statistik dashboard. Semua endpoint list
mendukung pagination/filters yang relevan dan eager loading relasi.
