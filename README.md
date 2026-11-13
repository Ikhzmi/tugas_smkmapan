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