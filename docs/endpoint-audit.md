# Endpoint Audit — 2026-11-04

Audit ini membandingkan route Laravel yang terdaftar dengan
`docs/analysis/09-frontend-migration-map.md`. Perintah pemeriksaan:

```powershell
php artisan route:list --path=api/v1 --except-vendor
```

Hasil terakhir: **132 route API** terdaftar.

## Status per area

| Area | Status | Bukti route |
| --- | --- | --- |
| Health | selesai | `GET /ping` |
| Auth/token | selesai | `/auth/login`, logout, me, profile, password, session |
| Public landing | selesai | site, majors, teachers, facilities, eskul, gallery, videos |
| Public forms | selesai | PPDB, suggestions, visits + rate limit |
| Admin accounts | selesai | list/create/role/reset/delete |
| Admin people | selesai | teachers dan students CRUD |
| Academic | selesai | majors, classes, class students, subjects, schedules |
| CMS admin | selesai | settings, facilities, eskul, gallery, videos, upload |
| Admin operations | selesai | analytics, PPDB queue, suggestions, attendance summary, attempt reset/terminate |
| Guru dashboard/LMS | selesai | dashboard, schedules, materials, material file, assignments, submissions, grading, download |
| Guru presensi | selesai | list/create/update |
| Guru ujian | selesai | exams, questions, code, attempts, recap, reset, terminate, polling events |
| Siswa dashboard/LMS | selesai | dashboard, schedules, materials/detail, assignments/detail, submission, grades |
| Siswa presensi | selesai | list/create self-service |
| Siswa ujian | selesai | list, unlock, start/resume, safe questions, answer, warning, submit, terminate |

## Keamanan yang diverifikasi

- `role:admin`, `role:guru`, dan `role:siswa` diterapkan pada route privat.
- Resource privat pihak lain dikembalikan 404 pada test ownership.
- Soal siswa memakai allow-list dan tidak mengandung `kunci_jawaban`.
- Download submission memakai URL bertanda tangan satu jam dan authorization
  guru pemilik assignment.
- Login rate limit diuji: percobaan keenam pada identifier/IP yang sama
  mendapat HTTP 429.
- Query pencarian menggunakan `LOWER(...) LIKE` sebagai bentuk portable untuk
  perilaku case-insensitive PostgreSQL/SQLite.
- Upload gambar/PDF/submission tervalidasi MIME dan ukuran server-side.

## Dokumentasi klien

- `docs/API.md`: kontrak ringkas dan format respons.
- `docs/postman_collection.json`: koleksi request utama per role.
- `docs/openapi.yaml`: spesifikasi OpenAPI seluruh 132 operasi API, termasuk
  schema request, parameter, role, upload, dan signed download.
- `docs/MOBILE_HANDOFF.md`: token, jaringan, alur siswa/guru, dan aturan soal.

## Sisa non-blocking

1. Menambah script postman test otomatis dan collection runner di CI.
2. Cleanup orphan storage harus dijalankan manual setelah inspeksi dry-run;
   command tidak dijadwalkan otomatis untuk mencegah penghapusan tak sengaja.
