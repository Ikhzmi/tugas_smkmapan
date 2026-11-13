# 06 — Realtime dan Analitik

## 1. Realtime yang ditemukan

### Event ujian guru

`src/hooks/useExamLiveEvents.js` membuka channel `exam-events-{teacherId}` dan
menunggu `INSERT` pada `exam_events` dengan filter `teacher_id`. Event yang
ditampilkan adalah `warning`, `submitted`, dan `terminated`.

API tahap ini mengganti Realtime dengan polling:

```text
GET /api/v1/guru/exams/events?since=2026-11-03T10:00:00Z&exam_id={uuid}
```

Respons hanya event yang boleh dilihat guru tersebut, dengan `created_at` dan
ID yang dapat dipakai sebagai cursor. Interval awal 5–10 detik; klien menyimpan
`since` dari event terakhir. Opsi Laravel Reverb/SSE dicatat untuk tahap
lanjutan, bukan dependensi fase ini.

### Sesi tunggal

`useSessionGuard.js` juga berlangganan perubahan realtime tabel sesi agar
perangkat yang dicabut langsung logout. API menggantinya dengan heartbeat
setiap 30 detik dan status endpoint. Bila heartbeat mengembalikan `active=false`
atau HTTP 401, frontend harus menghapus token dan kembali ke login.

### ContentContext

Context memanggil `onAuthStateChange` untuk memuat ulang/menutup subscription
konten. API tidak mengirim event realtime; frontend dapat memuat ulang konten
setelah operasi mutasi berhasil.

## 2. Site visits

`src/lib/analytics.js` membuat `session_id` browser di `sessionStorage` dan
mencatat setiap page view:

```json
{
  "path": "/",
  "role": "anon|admin|guru|siswa",
  "user_id": "uuid|null",
  "session_id": "browser-session-id",
  "user_agent": "maksimum 300 karakter"
}
```

Pengganti: `POST /api/v1/public/visits`. IP dan user-agent ditangkap server
secukupnya untuk rate limiting; endpoint tidak boleh mengganggu UX bila gagal.
Data mentah hanya admin, sedangkan dashboard menerima agregasi.

## 3. Login events

Login sukses lama meng-insert `user_id`, role, dan snapshot nama ke
`login_events`. API mencatat ini di service login setelah password benar dan
sebelum respons sukses. Login gagal tidak dicatat sebagai `login_events` pada
tabel ini (rate limiter/log monitoring menangani abuse).

Dashboard admin memakai rentang 7, 30, atau 90 hari dan memuat:

- jumlah kunjungan per hari dan role;
- jumlah login per hari dan role;
- daftar login/event terbaru;
- statistik ujian, presensi, siswa, dan konten yang memang dipakai dashboard.

Endpoint agregasi: `GET /api/v1/admin/analytics?range=7|30|90`.
Agregasi PostgreSQL harus mengelompokkan seluruh kolom non-agregat dan query
test SQLite menggunakan ekspresi portable atau cabang grammar terkontrol.

## 4. Privasi dan batasan

- Endpoint analytics publik hanya menerima event baru; tidak pernah
  mengembalikan data analytics.
- Admin adalah satu-satunya role yang membaca data mentah/agregat.
- `user_agent` dipotong 300 karakter, path dinormalisasi, dan input tidak
  dirender sebagai HTML.
- Tidak ada Supabase Realtime, Supabase Data API, atau service key pada API.
