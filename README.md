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
| Murid (NISN) | `2026000001` | `password` |
| Guru | `guru1` | `password` |

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

Data diambil dari API Laravel live (`https://smkm8medan-api.wasmer.app/api/v1`,
Sanctum bearer token). Basis URL dapat diganti saat build dengan
`--dart-define=API_BASE_URL=...`.

## Menjalankan dengan API lokal (folder `../api`)

Backend Laravel 13 butuh PHP ≥ 8.3. Bila `php` di PATH masih 8.2 (XAMPP),
pakai PHP 8.4 bawaan Herd: `~/.config/herd/bin/php.bat`. Konfigurasi lokal
memakai `.env.local` (SQLite, tanpa Supabase) sehingga `.env` utama tidak
terganggu:

```bash
cd ../api
composer install                      # autoload optimized bisa lama di Windows
APP_ENV=local php artisan key:generate
APP_ENV=local php artisan migrate:fresh --seed --force
APP_ENV=local php artisan serve --host=0.0.0.0 --port=8000
```

Lalu jalankan app mengarah ke backend lokal:

```bash
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/v1
# emulator Android : http://10.0.2.2:8000/api/v1
# perangkat fisik  : http://<IP-LAN-komputer>:8000/api/v1
```

Akun seeder lokal: murid NISN `2026000001`–`2026000010`, guru `guru1`–`guru3`,
semua password `password`. Struktur kode:

```
lib/
  main.dart            # entry point + lebar konten ponsel (maks 430px)
  theme.dart           # token glass Pal (terang/gelap) + LoginPal login
  models.dart          # model data
  data.dart            # konstanta sekolah & pengumuman statis
  app_state.dart       # AppState (ChangeNotifier) + AppScope, async API
  services/            # ApiClient (REST) + adapter model
  widgets.dart         # komponen bersama (Glass, Panel, Pill, sheet, dll)
  portal_widgets.dart  # header portal, hero banner, bento, bottom nav
  shells.dart          # shell murid & guru (IndexedStack + nav melayang)
  screens/             # semua layar
test/                  # widget test alur utama (fake backend MockClient)
```

## Uji

```bash
flutter analyze
flutter test
```