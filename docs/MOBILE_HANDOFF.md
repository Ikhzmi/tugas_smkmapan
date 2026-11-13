# Mobile Handoff — Flutter

Gunakan base URL yang sama dengan API. Semua request mengirim:

```text
Accept: application/json
Content-Type: application/json
Authorization: Bearer <token>   # endpoint privat
```

Simpan token pada secure storage perangkat, bukan source code. Setelah login,
simpan `data.token`, `data.user.role`, dan `data.session.id`. Logout memanggil
`POST /auth/logout`; ganti password mencabut token lama sehingga aplikasi harus
kembali ke halaman login.

## Siswa

Login NISN melalui `/auth/login`, lalu gunakan `/auth/me`, dashboard/LMS,
`/siswa/materials`, `/siswa/assignments`, `/siswa/attendance`, dan
`/siswa/exams`. Pengumpulan tugas memakai multipart file atau `file_url`.

Alur ujian: unlock bila perlu → `POST /siswa/exams/{id}/attempts` → tampilkan
only allow-list soal → autosave `PUT .../answers/{question}` → submit. Jangan
pernah mengharapkan `kunci_jawaban` pada respons siswa.

## Guru

Gunakan `/guru/materials`, `/guru/assignments`, `/guru/submissions`,
`/guru/attendance`, dan `/guru/exams`. Polling event ujian menggunakan
`GET /guru/exams/events?since=<last-created-at>` setiap 5–10 detik.

## Jaringan

- Android emulator: akses server lokal melalui `10.0.2.2` bila memakai
  `php artisan serve --host=0.0.0.0 --port=8000`.
- Perangkat fisik: gunakan IP LAN komputer, pastikan firewall mengizinkan PHP.
- Demo remote: gunakan domain Herd/tunnel HTTPS yang disetujui; jangan menaruh
  DB host, password, atau key Supabase di aplikasi.

Token Sanctum opaque tidak dapat di-refresh. Saat 401, hapus token dan login
kembali. Status 403 berarti role/ownership tidak boleh mengakses resource;
404 pada ID privat dapat berarti resource milik pengguna lain.
