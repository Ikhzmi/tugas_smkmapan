# PROGRESS — SMKM 8 Medan API

Terakhir diperbarui: 2026-11-03

## Ringkasan

Membangun REST API Laravel 13 (PHP 8.4) sebagai pengganti Supabase pada Web React SMKM 8 Medan.
Database: **PostgreSQL Supabase project BARU** (Session pooler, port 5432). Auth: Sanctum. File: Laravel Storage.
Mobile Flutter TIDAK dibuat pada tahap ini.

## Checklist Fase

| Fase | Status | Catatan |
| --- | --- | --- |
| 0 — Audit & persiapan | done* | Persiapan lokal selesai; verifikasi DB menunggu kredensial user |
| 1 — Analisis Web (9 dokumen) | done | Dokumen 01–09 selesai; Web tetap read-only |
| 2 — Fondasi kode | done | Schema UUID/domain, response contract, role middleware, rate limit, RLS command, SQLite migration, remote schema reset + RLS selesai |
| 3 — Auth & akun | doing | Login Sanctum, logout, me, profile/password, sesi tunggal, akun admin dasar, test SQLite + smoke Herd dibuat; profil guru/siswa terintegrasi menyusul |
| 4 — Akademik | doing | CRUD admin kelas/mapel/jadwal, guru/siswa, ownership dan conflict check tersedia |
| 5 — LMS | doing | Materi, tugas, submission privat, penilaian tersedia; dashboard agregat/upload CMS lanjutan menyusul |
| 6 — Presensi | doing | Presensi guru/siswa + duplicate/date/ownership guard tersedia; rekap admin menyusul |
| 7 — Ujian online | doing | CBT server-side critical flow tersedia; recap/admin reset/polling event lanjutan menyusul |
| 8 — CMS publik & PPDB | doing | Public content/forms + admin settings/PPDB/suggestions/facilities tersedia; eskul/gallery/video CRUD/upload menyusul |
| 9 — Analitik & penutup | doing | Analytics dasar admin, README/API/Mobile/OpenAPI draft tersedia; hardening dan endpoint audit menyusul |

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

### Fase 1 — Analisis Web

- Sembilan dokumen kontrak tersedia di `docs/analysis/01-feature-inventory.md` sampai `09-frontend-migration-map.md`.
- Ditemukan fitur publik, CMS admin, akademik, LMS, presensi, CBT, sesi tunggal, storage, analytics, dan semua RPC yang dipanggil Web.
- Tidak ada kredensial Supabase lama yang disalin ke API/dokumen.
- Temuan penting: siswa login dengan NISN, guru/admin username/email; soal siswa harus memakai allow-list tanpa kunci jawaban; realtime diganti polling.
- Fase 1 selesai tanpa mengubah folder `Web`.

### Langkah berikutnya

1. User mengisi `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` di `.env` (Supabase → Connect → Session pooler).
2. Verifikasi `php artisan db:show` / `migrate:status`.
3. Lanjutkan Fase 2: migrasi UUID/PostgreSQL-portable, response contract, role middleware, RLS command, dan test SQLite.

### Catatan sesi lanjutan 2026-11-03

- User mengonfirmasi host di `.env` adalah Session pooler project Supabase baru; `php artisan db:show` berhasil tanpa menampilkan password.
- Jangan memakai project Web lama dan jangan membaca secret Web.
- `php artisan migrate` ke schema development berhenti karena `users` scaffold lama masih bigint; setelah seeder siap, gunakan `migrate:fresh --seed` hanya pada project baru yang sudah dikonfirmasi.
- Migrasi SQLite in-memory/temporary berhasil untuk seluruh schema saat ini.
- `db:secure-rls` akan menolak koneksi PostgreSQL bila `SUPABASE_NEW_PROJECT_CONFIRMED` tidak true.
- `migrate:fresh --seed` pada project baru berhasil; 37 tabel `public` kemudian dikunci RLS tanpa policy.
- Smoke test HTTPS Herd login admin + `/auth/me` berhasil tanpa mencetak token.
