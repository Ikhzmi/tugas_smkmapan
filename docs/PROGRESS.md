# PROGRESS — SMKM 8 Medan API

Terakhir diperbarui: 2026-11-13

## Ringkasan

Membangun REST API Laravel 13 (PHP 8.4) sebagai pengganti Supabase pada Web React SMKM 8 Medan.
Database: **PostgreSQL Supabase project BARU** (Session pooler, port 5432). Auth: Sanctum. File: Laravel Storage.
Mobile Flutter TIDAK dibuat pada tahap ini.

## Checklist Fase

| Fase | Status | Catatan |
| --- | --- | --- |
| 0 — Audit & persiapan | done | Persiapan lokal dan koneksi project baru selesai |
| 1 — Analisis Web (9 dokumen) | done | Dokumen 01–09 selesai; Web tetap read-only |
| 2 — Fondasi kode | done | Schema UUID/domain, response contract, role middleware, rate limit, RLS command, SQLite migration, remote schema reset + RLS selesai |
| 3 — Auth & akun | done | Login/logout/me/profile/password, sesi tunggal, akun admin, akun guru/siswa, role guard, test SQLite + smoke Herd |
| 4 — Akademik | done | CRUD admin jurusan/kelas/mapel/jadwal, anggota kelas, guru/siswa, ownership dan conflict check tersedia |
| 5 — LMS | done | Materi/tugas detail, submission privat, penilaian, nilai siswa, dashboard dasar, upload materi, signed URL, dan cleanup dry-run tersedia |
| 6 — Presensi | done | Presensi guru/siswa, update owner/admin, duplicate/date/ownership guard, dan rekap admin tersedia |
| 7 — Ujian online | done* | CBT server-side critical flow, kode, attempt, autosave, score, warning, reset, recap, dan polling event tersedia; audit final masih berjalan |
| 8 — CMS publik & PPDB | done | Public content/forms + admin settings/PPDB/suggestions/facilities/eskul/gallery/video CRUD + image upload tersedia |
| 9 — Analitik & penutup | done | Analytics admin, README/API/Mobile/OpenAPI lengkap, Postman, endpoint audit, test kontrak otomatis, dan smoke test HTTPS Herd tersedia |

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

1. Tambahkan script Postman test otomatis bila collection runner dipakai.
2. Jangan menjalankan `storage:prune-orphans --delete` tanpa inspeksi dry-run.
3. `ApiContractTest` akan gagal bila route baru belum didokumentasikan di OpenAPI.

### Catatan sesi lanjutan 2026-11-03

- User mengonfirmasi host di `.env` adalah Session pooler project Supabase baru; `php artisan db:show` berhasil tanpa menampilkan password.
- Jangan memakai project Web lama dan jangan membaca secret Web.
- `php artisan migrate` ke schema development berhenti karena `users` scaffold lama masih bigint; setelah seeder siap, gunakan `migrate:fresh --seed` hanya pada project baru yang sudah dikonfirmasi.
- Migrasi SQLite in-memory/temporary berhasil untuk seluruh schema saat ini.
- `db:secure-rls` akan menolak koneksi PostgreSQL bila `SUPABASE_NEW_PROJECT_CONFIRMED` tidak true.
- `migrate:fresh --seed` pada project baru berhasil; 37 tabel `public` kemudian dikunci RLS tanpa policy.
- Smoke test HTTPS Herd login admin + `/auth/me` berhasil tanpa mencetak token.

### Catatan sesi lanjutan 2026-11-13

- Project Supabase lama tidak lagi tersedia: pooler mengembalikan
  `tenant/user ... not found` dan domain project NXDOMAIN. Ini penyebab 500 pada
  login dan seluruh endpoint ber-DB, bukan bug kode.
- Project Supabase baru dikonfigurasi melalui Session pooler port 5432 dan
  `.env` diperbarui. Kredensial tidak dicatat di dokumen.
- `php artisan migrate:fresh --seed --force` berhasil; percobaan pertama
  terputus di tengah karena koneksi pooler, lalu diulang dari awal.
- `php artisan db:secure-rls` mengaktifkan RLS pada 37 tabel public tanpa policy.
- Data development: 14 user (1 admin, 3 guru, 10 siswa), 2 kelas, 2 jurusan,
  2 mapel, 2 jadwal, 1 materi, 1 tugas, dan 1 ujian dengan 10 soal.
- Smoke test HTTPS Herd: ping 200, public site/facilities 200, login admin 200,
  `/auth/me` 200, admin accounts 200, login siswa NISN 200, dashboard siswa 200,
  logout admin/siswa 204.
- Test suite SQLite: 20 lulus, 825 assertions.
