# PROGRESS — SMKM 8 Medan API

Terakhir diperbarui: 2026-11-03

## Ringkasan

Membangun REST API Laravel 13 (PHP 8.4) sebagai pengganti Supabase pada Web React SMKM 8 Medan.
Database: **PostgreSQL Supabase project BARU** (Session pooler, port 5432). Auth: Sanctum. File: Laravel Storage.
Mobile Flutter TIDAK dibuat pada tahap ini.

## Checklist Fase

| Fase | Status | Catatan |
| --- | --- | --- |
| 0 — Audit & persiapan | doing | Menunggu kredensial Supabase dari user |
| 1 — Analisis Web (9 dokumen) | todo | |
| 2 — Fondasi kode | todo | |
| 3 — Auth & akun | todo | |
| 4 — Akademik | todo | |
| 5 — LMS | todo | |
| 6 — Presensi | todo | |
| 7 — Ujian online | todo | |
| 8 — CMS publik & PPDB | todo | |
| 9 — Analitik & penutup | todo | |

## Fase 0 — Audit & Persiapan

### Hasil audit awal

- Laravel Framework **13.39.0**, PHP **8.4.27** (Herd), Composer 2.10.3.
- Project mentah: hanya `Controller.php`, `User.php`, `AppServiceProvider.php`; belum ada `routes/api.php` dan Sanctum.
- Ekstensi `pgsql` dan `pdo_pgsql` **sudah aktif** (tidak perlu ubah php.ini).
- Git belum ada → `git init` + commit awal skeleton.
- `php artisan install:api --no-interaction` dijalankan → Sanctum 4.x, `routes/api.php`, migrasi `personal_access_tokens`, `config/sanctum.php`.
- `HasApiTokens` ditambahkan ke `App\Models\User`.
- `.env` / `.env.example` diubah ke PostgreSQL Supabase; **DB_HOST / DB_USERNAME / DB_PASSWORD sengaja kosong** (diisi user).
- `config/app.php`: timezone dari `APP_TIMEZONE` (Asia/Jakarta), locale `id`.
- CORS dipublikasikan: origin `http://localhost:5173`, `http://127.0.0.1:5173`; header Authorization/Content-Type/Accept/Origin/X-Requested-With.
- `php artisan storage:link` berhasil.
- `GET /api/v1/ping` → `{"status":"ok","app":"SMKM 8 Medan API"}` (terverifikasi lewat Herd).

### Keputusan penting

- Semua akses DB hanya lewat Laravel (role `postgres`); RLS diaktifkan tanpa policy di semua tabel public (command `db:secure-rls`, dibuat di Fase 2/3).
- Test otomatis memakai SQLite in-memory (`phpunit.xml`), bukan Supabase.
- Tidak ada impor data dari Supabase lama.

### Langkah berikutnya

1. User mengisi `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` di `.env` (Supabase → Connect → Session pooler).
2. Verifikasi `php artisan db:show` / `migrate:status`.
3. Jalankan Fase 1 (analisis Web).
