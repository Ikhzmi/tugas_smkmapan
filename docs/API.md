# API Contract v1

Base URL: `https://smkm8medan-api.test/api/v1`  
Gunakan HTTPS langsung. URL `http://` me-redirect 301 dan klien seperti Postman
dapat mengubah POST menjadi GET sehingga muncul `405 Method Not Allowed`.

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
  `/admin/videos`, `POST /admin/uploads/{context}` dan
  `POST /admin/uploads/{context}/url` untuk unggah langsung.
- Operations: `/admin/attendance/summary`, `/admin/analytics`, PPDB dan
  suggestions; admin dapat reset/terminate attempt melalui
  `/admin/attempts/{id}/{reset,terminate}`.

## Guru

- LMS: CRUD `/guru/materials`, CRUD `/guru/assignments`,
  `GET /guru/assignments/{id}/submissions`,
  `PATCH /guru/submissions/{id}/grade`, download submission.
  Berkas besar memakai `POST /guru/materials/{id}/upload-url` lalu
  `POST /guru/materials/{id}/upload-confirm`.
- Ujian: CRUD `/guru/exams`, CRUD questions, `POST /guru/exams/{id}/code`,
  `GET /guru/exams/{id}/attempts`, reset attempt, polling
  `GET /guru/exams/events?since=<ISO8601>`.
- Presensi: `GET/POST /guru/attendance`.
- Rekap: `GET /guru/exams/{id}/recap`; reset attempt melalui
  `POST /guru/attempts/{id}/reset`.

## Siswa

- LMS: `GET /siswa/materials`, `GET /siswa/assignments`, multipart
  `POST /siswa/assignments/{id}/submissions`, `GET /siswa/submissions`.
  Unggah langsung memakai `POST /siswa/assignments/{id}/upload-url` lalu
  `POST /siswa/assignments/{id}/submissions` dengan `file_path`.
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

`GET /guru/submissions/{id}/download` mengembalikan URL sementara selama satu
jam. Bila private disk memakai driver `s3` (Supabase Storage), URL tersebut
adalah presigned URL langsung ke bucket privat. Bila masih disk lokal, URL
mengarah ke `GET /guru/submissions/{id}/file` yang bertanda tangan; otorisasi
guru pemilik assignment tetap diperiksa.

## Direct upload (berkas besar)

Vercel membatasi body request sekitar 4,5 MB, sedangkan materi dan tugas bisa
mencapai 25 MB. Karena itu klien mengunggah langsung ke object storage:

```http
POST /guru/materials/{material}/upload-url
{"filename":"materi.pdf","content_type":"application/pdf","size":1048576}
```

Respons berisi `upload_url`, `method` (`PUT`), `path`, `headers`, dan
`expires_at`. Klien melakukan `PUT` berkas ke `upload_url` dengan header yang
sama, lalu mengonfirmasi:

```http
POST /guru/materials/{material}/upload-confirm
{"path":"materi/<teacher>/<material>/<uuid>.pdf"}
```

Alur siswa: `POST /siswa/assignments/{id}/upload-url` → `PUT` ke
`upload_url` → `POST /siswa/assignments/{id}/submissions` dengan `file_path`,
`file_name`, dan `file_size`. Path selalu divalidasi harus berada di folder
milik pengguna. Endpoint `upload-url` mengembalikan `422
DIRECT_UPLOAD_UNSUPPORTED` bila disk belum memakai driver `s3`; gunakan
endpoint multipart sebagai gantinya.
