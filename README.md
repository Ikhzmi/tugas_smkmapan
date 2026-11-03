# SMKM 8 Medan API

REST API Laravel 13 untuk menggantikan akses Supabase Web SMKM 8 Medan.
Frontend React dan Flutter nantinya hanya memanggil API ini.

## Arsitektur

- Laravel 13 + PHP 8.4, Sanctum bearer token.
- PostgreSQL pada **Supabase project baru**, melalui Session pooler port 5432.
- Laravel adalah satu-satunya akses database. Supabase Auth, Storage,
  Realtime, `supabase-js`, Data API/PostgREST, anon key, dan service key tidak
  dipakai serta tidak boleh dimasukkan ke Web/mobile.
- File dikelola Laravel Storage: disk `public` untuk konten publik dan disk
  `local` untuk submission tugas privat.
- RLS diaktifkan tanpa policy pada semua tabel schema `public`; Laravel memakai
  role database `postgres` yang dapat melewati RLS.

## Menjalankan di Herd

1. Pastikan folder project dipetakan Herd sebagai `smkm8medan-api`.
2. Salin `.env.example` menjadi `.env`, lalu jalankan `php artisan key:generate`.
3. Isi hanya kredensial project Supabase baru pada `.env`:

   ```dotenv
   DB_CONNECTION=pgsql
   DB_HOST=host-session-pooler-dari-dashboard
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.<project-ref>
   DB_PASSWORD=password-database
   DB_SSLMODE=require
   SUPABASE_NEW_PROJECT_CONFIRMED=true
   ```

   Ambil string tersebut dari dashboard Supabase project baru → **Connect** →
   **Session pooler**. Jangan memakai host langsung `db.<ref>.supabase.co` atau
   Transaction pooler port 6543.
4. Aktifkan `pdo_pgsql` dan `pgsql` pada `php.ini` Herd bila belum muncul dari
   `php -m`, lalu restart Herd.
5. Verifikasi tanpa mencetak password: `php artisan db:show` atau
   `php artisan migrate:status`.
6. Setelah project baru terkonfirmasi, development database dapat disiapkan:

   ```powershell
   php artisan migrate:fresh --seed --force
   php artisan db:secure-rls
   ```

   `migrate:fresh` menghapus schema public. Jangan jalankan pada database lama
   atau database berisi data penting.

Supabase free tier dapat dijeda otomatis bila project lama tidak aktif;
aktifkan kembali project sebelum demo. Sebelum demo/operasi destruktif, buat
backup dari mesin yang memiliki `pg_dump`:

```powershell
pg_dump --format=custom --file=smkm8medan-api-$(Get-Date -Format yyyyMMdd).dump "<connection-string-session-pooler>"
```

Jangan menaruh connection string, password, atau hasil dump di git.

## Test dan pemeriksaan

Test otomatis selalu menggunakan SQLite in-memory dari `phpunit.xml`, bukan
Supabase utama:

```powershell
php artisan test --compact
vendor/bin/pint --dirty --format agent
```

Migrasi dan seeder juga diuji dengan SQLite temporary. Query pencarian API
sebaiknya memakai `ILIKE` di PostgreSQL dan fallback `LOWER(...) LIKE` pada
SQLite; jangan menggunakan asumsi MySQL.

## Akun development seeder

Semua akun seeder memakai password `password` dan hanya untuk development:

- `admin@smkm8medan.test` — admin
- `guru1@smkm8medan.test` sampai `guru3@smkm8medan.test` — guru
- NISN `2026000001` sampai `2026000010` — siswa

Ganti password sebelum demo. Password tidak dikembalikan endpoint dan tidak
ditulis ke log.

## Endpoint

Kontrak lengkap dan contoh request ada di [`docs/API.md`](docs/API.md).
Dokumen analisis Web ada di `docs/analysis/01-feature-inventory.md` sampai
`09-frontend-migration-map.md`. Panduan mobile ada di
[`docs/MOBILE_HANDOFF.md`](docs/MOBILE_HANDOFF.md), dan spesifikasi awal OpenAPI
ada di [`docs/openapi.yaml`](docs/openapi.yaml).

## Struktur utama

```text
app/Http/Controllers/Api/V1/  controller REST versi 1
app/Http/Requests/             validasi request
app/Models/                    model UUID domain
app/Services/                  logika sesi dan ujian
database/migrations/           schema PostgreSQL/SQLite-portable
database/seeders/              data development
docs/                          analisis, API, dan handoff
routes/api.php                 route /api/v1
```
