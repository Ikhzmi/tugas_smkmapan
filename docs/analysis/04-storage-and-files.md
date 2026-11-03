# 04 — Storage dan Berkas

Web lama mengakses Supabase Storage melalui `uploadImage.js`, dashboard guru,
dan modal pengumpulan tugas. API baru menggunakan Laravel Storage saja; tidak
ada `supabase-js`, bucket Supabase, signed URL Supabase, atau data URL sebagai
fallback produksi.

## 1. Inventaris pemakaian

| Konteks Web | Sumber | Tipe | Batas | Visibilitas |
| --- | --- | --- | --- | --- |
| Foto jurusan | `uploadImage('jurusan'/'major'/'majors')` | JPG, PNG, WEBP, GIF | 5 MB | publik |
| Hero sekolah | `uploadImage('hero')` | JPG, PNG, WEBP, GIF | 5 MB | publik |
| Profil sekolah | `uploadImage('profil'/'profile')` | JPG, PNG, WEBP, GIF | 5 MB | publik |
| Foto guru | `uploadImage('teacher-photos')` | JPG, PNG, WEBP, GIF | 5 MB | publik |
| Eskul/fasilitas/galeri | upload CMS | JPG, PNG, WEBP, GIF | 5 MB | publik |
| Soal | field `gambar_url` pada bank soal | gambar | 5 MB | publik/terproteksi sesuai ujian; API default privat |
| Materi | `storage.from('materi').upload` | PDF | 25 MB | publik setelah materi dipublikasi |
| Pengumpulan tugas | `storage.from('tugas')` atau `tugas://...` | PDF, Office, ZIP/RAR, gambar, TXT | 25 MB | privat |

Video dan tautan materi tidak mengunggah berkas; Web menyimpan URL HTTP(S).

## 2. Rancangan Laravel Storage

- Disk `public`: `storage/app/public/branding/jurusan`, `branding/hero`,
  `branding/profile`, `teachers`, `eskul`, `fasilitas`, `galeri`, `soal`, dan
  `materi/{teacher_id}`. `php artisan storage:link` mengekspos URL aplikasi.
- Disk `local`/`private`: `storage/app/private/tugas/{student_id}/{assignment_id}`.
  Path tidak pernah dikirim mentah kepada klien.
- Nama file dibuat server dari UUID atau `Str::uuid()` plus ekstensi MIME yang
  tervalidasi. Nama asli hanya disimpan di `file_name`; tidak digunakan sebagai
  path dan tidak pernah boleh menimpa berkas lama.
- Submission dikirim melalui endpoint multipart. Guru menerima URL sementara
  melalui `Storage::temporaryUrl` bila driver mendukung; untuk driver local,
  endpoint download terotorisasi melakukan streaming melalui controller dengan
  TTL aplikasi.

## 3. Validasi wajib

1. Validasi MIME dan ukuran server-side; ekstensi dari MIME yang dikenali,
   bukan dari nama file saja.
2. Gambar dibatasi `mimes:jpg,jpeg,png,webp,gif` dan `max:5120`.
3. Materi PDF dibatasi `mimes:pdf` dan `max:25600`.
4. Submission dibatasi tipe yang disetujui dan `max:25600`.
5. Path selalu dibuat server dan disimpan di kolom `file_path`; URL eksternal
   divalidasi `http://` atau `https://` dan disimpan terpisah.
6. Penghapusan/replace file dilakukan setelah transaksi database berhasil atau
   melalui cleanup terjadwal; data tidak boleh menunjuk path yang salah.
7. Upload CMS hanya admin. Upload materi hanya guru pemilik materi; submission
   hanya siswa pemilik assignment dan satu kali per assignment.

## 4. Pengganti URL lama

| Web lama | API baru |
| --- | --- |
| `getPublicUrl(path)` | URL resource Laravel dari `Storage::disk('public')->url(path)` |
| `tugas://path` | `file_path` internal + endpoint download terotorisasi |
| Base64 fallback | ditolak sebagai penyimpanan; frontend harus menampilkan error |
| Bucket `materi` | disk public `materi/{teacher_id}` |
| Bucket `tugas` | disk private `tugas/{student_id}/{assignment_id}` |

Tidak ada skrip impor file atau data dari project Supabase lama. Migrasi media
lama, bila dibutuhkan, menjadi pekerjaan terpisah setelah API dan kontrak
frontend stabil.
