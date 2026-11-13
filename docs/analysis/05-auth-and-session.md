# 04 — Autentikasi & Sesi Tunggal

## 1. Ringkasan perilaku Web lama

- Login siswa: NISN → email `<nisn>@siswa.smkmuh8.sch.id` (`useAuth.jsx:7`).
- Login guru/admin: username → email `<username>@smkmuh8.sch.id`, kecuali sudah mengandung `@` (`useAuth.jsx:9-14`).
- Setelah login, Web membaca `profiles.role` lalu redirect:
  - `admin` → `/admin/dashboard`
  - `guru` → `/guru/dashboard`
  - `siswa` → `/lms/dashboard`
- `RequireRole` memblokir route bila role tidak cocok.
- Sesi tunggal (kecuali admin):
  - Device ID stabil di `localStorage` (`mapan.device.id`).
  - Login baru memanggil `claim_user_session`; perangkat lama menang bila masih aktif dalam masa tenggang **5 menit**.
  - Heartbeat tiap **30 detik** (`useSessionGuard.js`).
  - `resume_user_session` saat aplikasi dibuka; `release_user_session` saat logout.
  - Admin tidak memakai aturan ini dan logout hanya lokal.
- Realtime channel `session-guard-${userId}` memantau `user_sessions` agar perangkat yang dicabut langsung logout.
- Login sukses dicatat ke `login_events`.

## 2. Keputusan API baru

- Identifier tunggal `identifier` + `password`, tanpa email turunan. Resolusi:
  1. Mengandung `@` → cari `users.email`.
  2. Hanya angka → cari `students.nisn` lalu `users.username`.
  3. Selain itu → cari `users.username`.
- Kompatibilitas transisi: email berdomain `@siswa.smkmuh8.sch.id` dipetakan ke NISN; `@smkmuh8.sch.id` dipetakan ke username.
- Token: Laravel Sanctum, opaque bearer token. Masa berlaku **30 hari** (`SANCTUM_EXPIRATION=43200` menit), tanpa refresh token; login ulang setelah kedaluwarsa.
- Satu sesi aktif per user non-admin, ditegakkan `user_sessions` + partial unique index.
- Admin boleh punya banyak token dan tidak membuat baris `user_sessions`.
- Token dicabut saat: logout, reset password admin, perubahan role, `is_active=false`, user dihapus, atau sesi diklaim perangkat lain.

## 3. Alur login

```
POST /api/v1/auth/login
{ "identifier": "1234567890", "password": "rahasia", "device_id": "...", "device_label": "Chrome · Windows" }
```

Langkah server:
1. Rate limit 5 percobaan/menit per IP+identifier.
2. Resolusi identifier → user.
3. Cek `is_active`; gagal → `403 ACCOUNT_INACTIVE`.
4. Verifikasi password (Hash::check).
5. Catat `login_events` (user_id, role, nama).
6. Bila role `admin`: buat token, kembalikan `200`.
7. Bila non-admin:
   - Tidak ada sesi aktif → buat `user_sessions`, buat token.
   - Sesi aktif device sama → perbarui `last_seen_at`, buat token baru, cabut token lama device tersebut.
   - Sesi aktif device lain dan `last_seen_at` ≤ 5 menit → `409 SESSION_CONFLICT`, **tanpa token**.
   - Sesi aktif device lain tetapi `last_seen_at` > 5 menit → cabut sesi lama + token lamanya, buat sesi & token baru.

Respons sukses:
```json
{
  "data": {
    "token": "1|xxxxxxxx",
    "token_type": "Bearer",
    "expires_at": "2026-12-03T10:00:00Z",
    "user": {
      "id": "uuid",
      "name": "Nama",
      "username": "guru1",
      "email": null,
      "role": "guru",
      "foto_url": null,
      "teacher_id": "uuid",
      "student_id": null
    },
    "session": { "id": "uuid", "device_label": "Chrome · Windows", "last_seen_at": "..." }
  },
  "message": "Login berhasil."
}
```

Respons konflik:
```json
{
  "message": "Akun sedang aktif di perangkat lain.",
  "errors": {
    "session": ["Chrome · Windows, terakhir aktif 2 menit lalu. Tunggu 5 menit atau logout dari perangkat tersebut."]
  },
  "code": "SESSION_CONFLICT",
  "other_device_label": "Chrome · Windows",
  "other_last_seen": "2026-11-03T09:58:00Z"
}
```
HTTP `409`.

## 4. Endpoint sesi

| Method | Path | Body | Respons |
| --- | --- | --- | --- |
| POST | `/auth/session/claim` | `device_id`, `device_label` | `{status:"ok"\|"conflict", session, other_device_label, other_last_seen}` |
| POST | `/auth/session/resume` | `device_id` | `{status:"ok"\|"expired"\|"revoked"\|"none"}` |
| POST | `/auth/session/heartbeat` | `session_id` | `{active:true\|false, last_seen_at}` |
| POST | `/auth/session/release` | `session_id` | `{released:true}` |
| GET | `/auth/session/status` | – | `{active, session}` untuk device saat ini |
| POST | `/auth/logout` | – | `204` |
| GET | `/auth/me` | – | user + profil role |
| PATCH | `/auth/profile` | `name`, `foto_url` (opsional) | user terbaru |

Catatan:
- `claim` dipakai setelah login jika frontend memisahkan autentikasi dan klaim; API login sudah melakukan klaim otomatis, jadi endpoint ini untuk kompatibilitas dan mobile.
- `resume` tidak memerlukan `session_id`; dicari berdasarkan `user_id + device_id`.
- `heartbeat` mengembalikan `active=false` (HTTP 200) bila sesi sudah dicabut; frontend wajib logout lokal.
- `release` idempoten.

## 5. State machine sesi

```
[none] --login--> [active]
[active] --heartbeat (<5m idle)--> [active]
[active] --idle >5m--> [expired]
[active] --release/logout--> [revoked]
[active] --login device lain--> [revoked] (setelah grace)
[expired/revoked] --login--> [active]
```

- `expired` bukan status tersimpan; dihitung dari `last_seen_at + 5 menit`.
- Admin tidak masuk state machine ini.

## 6. Middleware & keamanan

- `auth:sanctum` pada semua endpoint privat.
- `EnsureRole` untuk `admin`, `guru`, `siswa`.
- `EnsureActiveUser` menolak `is_active=false` dan mencabut token.
- `EnsureSessionActive` (opsional untuk endpoint sensitif): memastikan `user_sessions` device saat ini belum revoked.
- Password: minimal 8 karakter, di-hash `bcrypt` (rounds 12).
- Tidak ada endpoint registrasi publik; akun dibuat admin.
- Tidak ada forgot-password publik; reset oleh admin.
- Rate limit:
  - login: 5/menit per IP+identifier.
  - endpoint auth lain: 60/menit per user.
  - publik PPDB/saran: 10/menit per IP.
- Pesan login gagal selalu generik (`Identifier atau kata sandi salah.`) agar tidak membocorkan keberadaan akun.
- Token disimpan di localStorage/sessionStorage Web dan secure storage Flutter; tidak di cookie.

## 7. Perbedaan yang disengaja dari Web lama

| Lama | Baru | Alasan |
| --- | --- | --- |
| Email turunan `<nisn>@...` | identifier langsung | menghilangkan ketergantungan Supabase Auth |
| Konflik sesi setelah sign-in | konflik saat login (409) | tidak ada token sia-sia |
| Realtime `user_sessions` | polling heartbeat 30 dtk | tanpa infrastruktur Realtime |
| Logout global default | logout token saat ini | admin multi-perangkat |
| Profil di `profiles` | `users` + `teachers`/`students` | satu sumber identitas |

## 8. Asumsi

- Masa tenggang 5 menit dan heartbeat 30 detik dipertahankan.
- Perangkat lama menang saat konflik (sesuai komentar `sessionGuard.js:100-101`).
- Tidak ada kebutuhan “logout semua perangkat” di UI; admin dapat mencabut token lewat reset password/role.
- Token 30 hari dapat diubah via env tanpa perubahan kode.
