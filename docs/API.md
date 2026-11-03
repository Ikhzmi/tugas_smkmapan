# API Contract v1

Base URL: `http://smkm8medan-api.test/api/v1`  
Header privat: `Accept: application/json` dan `Authorization: Bearer <token>`.

## Respons

Sukses: `{ "data": ..., "message": "...", "meta": {} }`  
Error: `{ "message": "...", "errors": {}, "code": "..." }`  
List memiliki `page`, `per_page` (maksimum 100), dan `meta` pagination.

## Auth

```http
POST /auth/login
Content-Type: application/json

{"identifier":"admin@smkm8medan.test","password":"password","device_id":"browser-id","device_label":"Chrome"}
```

Mengembalikan `data.token`, `token_type`, `expires_at`, `user`, dan session.
Identifier siswa dapat berupa NISN; guru/admin dapat memakai username/email.

| Method | Path |
| --- | --- |
| POST | `/auth/login` |
| POST | `/auth/logout` |
| GET | `/auth/me` |
| PATCH | `/auth/profile` |
| POST | `/auth/change-password` |
| POST | `/auth/session/claim` |
| POST | `/auth/session/resume` |
| POST | `/auth/session/heartbeat` |
| POST | `/auth/session/release` |
| GET | `/auth/session/status` |

## Public

`GET /public/site`, `/public/majors`, `/public/teachers`,
`/public/facilities`, `/public/eskul`, `/public/gallery`, `/public/videos`.
Form publik yang rate-limited: `POST /public/ppdb`,
`POST /public/suggestions`, `POST /public/visits`.

## Admin

- Accounts: `GET/POST /admin/accounts`, `PATCH /admin/accounts/{id}/role`,
  `POST /admin/accounts/{id}/reset-password`, `DELETE /admin/accounts/{id}`.
- People: CRUD `/admin/teachers`, CRUD `/admin/students`.
- Academic: CRUD `/admin/majors`, `/admin/classes`, `/admin/subjects`,
  `/admin/schedules`; anggota kelas melalui
  `GET /admin/classes/{id}/students`.
- CMS: CRUD settings, `/admin/facilities`, `/admin/eskul`, `/admin/gallery`,
  `/admin/videos`, `POST /admin/uploads/{context}`.
- Operations: `/admin/attendance/summary`, `/admin/analytics`, PPDB dan
  suggestions; admin dapat reset/terminate attempt melalui
  `/admin/attempts/{id}/{reset,terminate}`.

## Guru

- LMS: CRUD `/guru/materials`, CRUD `/guru/assignments`,
  `GET /guru/assignments/{id}/submissions`,
  `PATCH /guru/submissions/{id}/grade`, download submission.
- Ujian: CRUD `/guru/exams`, CRUD questions, `POST /guru/exams/{id}/code`,
  `GET /guru/exams/{id}/attempts`, reset attempt, polling
  `GET /guru/exams/events?since=<ISO8601>`.
- Presensi: `GET/POST /guru/attendance`.
- Rekap: `GET /guru/exams/{id}/recap`; reset attempt melalui
  `POST /guru/attempts/{id}/reset`.

## Siswa

- LMS: `GET /siswa/materials`, `GET /siswa/assignments`, multipart
  `POST /siswa/assignments/{id}/submissions`, `GET /siswa/submissions`.
- Presensi: `GET/POST /siswa/attendance`.
- Detail dan nilai: `GET /siswa/materials/{id}`,
  `GET /siswa/assignments/{id}`, `GET /siswa/grades`.
- Ujian: `GET /siswa/exams`, `GET/POST /siswa/exams/{id}/unlock`,
  `POST /siswa/exams/{id}/attempts`, `GET /siswa/attempts/{id}`,
  `PUT /siswa/attempts/{attempt}/answers/{question}`, warning, submit, dan
  terminate.

### Contoh alur ujian

```http
POST /siswa/exams/{exam}/attempts
```

Respons `data.questions` hanya berisi `id`, `pertanyaan`, `opsi`, `tipe`,
`bobot`, dan `gambar_url`. Field `kunci_jawaban` tidak pernah dikirim.

```http
PUT /siswa/attempts/{attempt}/answers/{question}
{"jawaban":"A"}

POST /siswa/attempts/{attempt}/submit
```

Nilai dihitung server dari kunci jawaban database. Attempt siswa lain selalu
ditolak, dan attempt berjalan dibatasi satu per siswa+ujian.

## File privat

`GET /guru/submissions/{id}/download` hanya mengembalikan URL bertanda tangan
sementara selama satu jam. URL tersebut dipakai untuk `GET
/guru/submissions/{id}/file`; otorisasi guru pemilik assignment tetap diperiksa.
