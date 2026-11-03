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
- Academic: CRUD `/admin/classes`, `/admin/subjects`, `/admin/schedules`.
- CMS/settings, PPDB, suggestions, analytics akan memakai resource admin yang
  sama dengan policy `role:admin`.

## Guru

- LMS: CRUD `/guru/materials`, CRUD `/guru/assignments`,
  `GET /guru/assignments/{id}/submissions`,
  `PATCH /guru/submissions/{id}/grade`, download submission.
- Ujian: CRUD `/guru/exams`, CRUD questions, `POST /guru/exams/{id}/code`,
  `GET /guru/exams/{id}/attempts`, reset attempt, polling
  `GET /guru/exams/events?since=<ISO8601>`.
- Presensi: `GET/POST /guru/attendance`.

## Siswa

- LMS: `GET /siswa/materials`, `GET /siswa/assignments`, multipart
  `POST /siswa/assignments/{id}/submissions`, `GET /siswa/submissions`.
- Presensi: `GET/POST /siswa/attendance`.
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
