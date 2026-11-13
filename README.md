<<<<<<< HEAD
# SMK Muhammadiyah 8 Medan — Portal Akademik Mobile

Aplikasi mobile Flutter untuk murid dan guru, mengikuti desain portal web
referensi (glassmorphism cream/orange, header traffic-lights, bottom nav pil
melayang, maskot Teddy Rive di login). Fitur: login terpadu NISN/username,
dashboard, jadwal, tugas (kumpul & penilaian), absensi 5 status, nilai,
notifikasi, dan pengumuman sekolah. Tersedia mode terang & gelap.

## Menjalankan

```bash
flutter pub get
flutter run                 # pilih emulator / perangkat Android / iOS
flutter run -d chrome       # versi web (tampilan dibatasi lebar ponsel)
```

Build rilis:

```bash
flutter build apk --release     # Android
flutter build ios --release     # iOS (perlu macOS + Xcode)
flutter build web --release     # Web
```

> Catatan web: runtime Rive (maskot Teddy) membutuhkan header
> `Cross-Origin-Opener-Policy: same-origin` dan
> `Cross-Origin-Embedder-Policy: require-corp` agar WASM threads aktif.
> Tanpa header tersebut aplikasi tetap berjalan (maskot memakai fallback).

## Akun demo

| Peran | ID | Kata sandi |
|-------|----|-----------|
| Murid (Rafi Pratama, XII RPL 1) | `20241001` | `murid123` |
| Murid (Salsa Nuraini, XII RPL 1) | `20241002` | `murid123` |
| Guru (Dwi Hartono, S.Kom. — wali XII RPL 1) | `1001` | `guru123` |
| Guru (Sri Wahyuni, M.Pd.) | `1002` | `guru123` |

Di layar login, ketuk kartu **Akun demo** untuk mengisi otomatis. Peran
dideteksi otomatis dari ID (satu kolom NISN / username, sesuai referensi).

## Fitur

- **Login terpadu** — satu kolom NISN/username + kata sandi, maskot Teddy
  (Rive) yang bereaksi saat mengetik, validasi & error state, ingat ID,
  lupa sandi, bantuan admin.
- **Dashboard murid (LMS MAPAN)** — hero banner, 4 kartu KPI (mapel, tugas,
  kehadiran, rata-rata nilai), jadwal hari ini, tugas perlu dikerjakan,
  grid mapel, pengumuman.
- **Dashboard guru (PORTAL GURU)** — hero banner, KPI kelas/mapel/penilaian/
  sesi hari ini, jadwal mengajar, pengumpulan terbaru + penilaian cepat.
- **Tugas dua arah** — guru membuat & menilai (nilai cepat + umpan balik);
  murid mengumpulkan; notifikasi lintas peran.
- **Absensi 5 status** — H/T/I/S/A (hadir, terlambat, izin, sakit, alpa);
  guru merekam per kelas & tanggal; murid melihat rekap + riwayat.
- **Nilai** — rekap per mapel (tugas/UTS/UAS, bobot 30/30/40) + predikat.
- **Profil** — identitas akun, preferensi mode gelap & notifikasi, logout
  dengan dialog konfirmasi kaca.

Data masih seed lokal (belum terhubung API). Struktur kode:

```
lib/
  main.dart            # entry point + lebar konten ponsel (maks 430px)
  theme.dart           # token glass Pal (terang/gelap) + LoginPal login
  models.dart          # model data
  data.dart            # seed: akun, jadwal, roster, tugas, absensi, nilai
  app_state.dart       # AppState (ChangeNotifier) + AppScope
  widgets.dart         # komponen bersama (Glass, Panel, Pill, sheet, dll)
  portal_widgets.dart  # header portal, hero banner, bento, bottom nav
  shells.dart          # shell murid & guru (IndexedStack + nav melayang)
  screens/             # semua layar
test/                  # widget test alur utama
```

## Uji

```bash
flutter analyze
flutter test
```
=======
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

### Cleanup file orphan

Pemeriksaan storage selalu dry-run secara default:

```powershell
php artisan storage:prune-orphans --disk=public
php artisan storage:prune-orphans --disk=local
```

Periksa daftar kandidat sebelum menghapus. Penghapusan eksplisit memakai
`--delete`; command hanya menerima disk `public` atau `local` dan tidak pernah
menghapus file yang masih direferensikan database:

```powershell
php artisan storage:prune-orphans --disk=public --delete
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

Kontrak lengkap dan contoh request ada di [`docs/API.md`](docs/API.md). Koleksi
siap impor untuk Postman tersedia di
[`docs/postman_collection.json`](docs/postman_collection.json).
Dokumen analisis Web ada di `docs/analysis/01-feature-inventory.md` sampai
`09-frontend-migration-map.md`. Panduan mobile ada di
[`docs/MOBILE_HANDOFF.md`](docs/MOBILE_HANDOFF.md), dan spesifikasi OpenAPI
lengkap ada di [`docs/openapi.yaml`](docs/openapi.yaml).

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
>>>>>>> bc2c3ba7a78a80ed498ad55e4b88971c4edaf07e
