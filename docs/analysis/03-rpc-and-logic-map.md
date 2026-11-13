# 03 — Peta RPC dan Logika Bisnis

Dokumen ini memetakan semua `supabase.rpc(...)` yang ditemukan di `Web/src` ke
service/endpoint Laravel. Nilai kredensial atau URL Supabase lama tidak
disalin. Definisi SQL RPC tidak ditemukan sebagai sumber yang dapat dipakai,
sehingga bagian yang diberi label **asumsi** harus diuji lagi saat migrasi Web.

## 1. RPC akun admin

| RPC lama | Parameter dari Web | Nilai yang dipakai Web | Endpoint Laravel |
| --- | --- | --- | --- |
| `admin_list_accounts` | tidak ada | array baris akun: `user_id`, `email`, `nama`, `role`, timestamp | `GET /admin/accounts` |
| `admin_create_account` | `p_email`, `p_password`, `p_nama`, `p_role` | error saja; daftar dimuat ulang | `POST /admin/accounts` |
| `admin_create_guru` | `p_nama`, `p_gelar`, `p_jabatan`, `p_department`, `p_email`, `p_jam_kerja`, `p_username`, `p_password`, `p_buat_akun` | UUID `teacher_id`; foto disimpan dengan update terpisah | `POST /admin/teachers` |
| `admin_create_siswa` | `p_nama`, `p_nisn`, `p_class_id`, `p_no_hp`, `p_alamat`, `p_password`, `p_buat_akun` | error saja; daftar dimuat ulang | `POST /admin/students` |
| `admin_set_role` | `p_user_id`, `p_role` | error saja; daftar dimuat ulang | `PATCH /admin/accounts/{user}/role` |
| `admin_reset_password` | `p_user_id`, `p_password` | error saja; token lama wajib dicabut | `POST /admin/accounts/{user}/reset-password` |
| `admin_delete_account` | `p_user_id` | error saja; baris guru/siswa tidak selalu dihapus oleh Web | `DELETE /admin/accounts/{user}` |

### Aturan tersirat akun

- Hanya admin yang boleh memanggil RPC akun.
- `admin_create_guru` dan `admin_create_siswa` harus atomik: profil dan akun
  dibuat dalam satu transaksi. `buat_akun=false` tetap membuat profil tanpa
  user login.
- `admin_delete_account` pada dialog akun hanya menghapus akun login dan
  melepaskan tautan profil; tombol hapus di manager guru/siswa kemudian dapat
  menghapus profil. Endpoint Laravel menyediakan parameter eksplisit agar
  perilaku itu tidak ambigu.
- Password tidak pernah dikembalikan. Reset, perubahan role, dan penghapusan
  mencabut token Sanctum.

## 2. RPC sesi tunggal

Sumber: `Web/src/lib/sessionGuard.js` dan `hooks/useSessionGuard.js`.

| RPC lama | Parameter | Nilai kembali yang diharapkan | Endpoint Laravel |
| --- | --- | --- | --- |
| `claim_user_session` | `p_device_id`, `p_device_label`, `p_grace_minutes` (5) | baris `{status, session_id, other_device_label, other_last_seen}` | `POST /auth/session/claim` |
| `resume_user_session` | `p_device_id`, `p_grace_minutes` | string `ok`, `expired`, `revoked`, atau `none` | `POST /auth/session/resume` |
| `touch_user_session` | `p_session_id` | boolean aktif | `POST /auth/session/heartbeat` |
| `release_user_session` | `p_session_id` | tidak digunakan; operasi idempoten | `POST /auth/session/release` |

Aturan: non-admin hanya memiliki satu sesi aktif; sesi perangkat lain yang
terlihat dalam lima menit menghasilkan `409 SESSION_CONFLICT` dan perangkat
lama tetap menang. Heartbeat menyegarkan `last_seen_at`; sesi idle lebih dari
grace dianggap kedaluwarsa. Admin dikecualikan dari aturan ini.

## 3. RPC kode ujian

| RPC lama | Parameter | Nilai kembali | Endpoint Laravel |
| --- | --- | --- | --- |
| `generate_exam_code` | `p_exam_id`, `p_length=6` | string kode uppercase alfanumerik | `POST /guru/exams/{exam}/code` atau admin ekuivalen |
| `verify_exam_code` | `p_exam_id`, `p_code` | boolean; bila benar membuat/mengaktifkan `exam_unlocks` | `POST /siswa/exams/{exam}/unlock` |
| `has_exam_unlock` | `p_exam_id` | boolean | `GET /siswa/exams/{exam}/unlock` |

Kode hanya boleh dibuat guru pemilik ujian atau admin. Verifikasi hanya boleh
dilakukan siswa yang memiliki ujian dan dibatasi rate limit; kode tidak pernah
dimasukkan ke respons siswa selain hasil boolean. `exam_unlocks` unik per
ujian+siswa.

## 4. RPC attempt dan anti-curang

| RPC lama | Parameter | Nilai kembali/efek | Endpoint Laravel |
| --- | --- | --- | --- |
| `record_exam_warning` | `p_attempt_id` | jumlah warning terbaru | `POST /siswa/attempts/{attempt}/warnings` |
| `submit_attempt` | `p_attempt_id` | menyelesaikan attempt dan menghitung nilai di server | `POST /siswa/attempts/{attempt}/submit` |
| `terminate_attempt` | `p_attempt_id`, `p_alasan` | status menjadi `dibatalkan`, waktu/alasan tersimpan, event tercatat | `POST /siswa/attempts/{attempt}/terminate` |
| `reset_exam_attempt` | `p_attempt_id` | attempt dihapus/reset sehingga siswa dapat memulai ulang | `POST /guru/attempts/{attempt}/reset` |

Aturan yang terlihat dari `ExamRunner.jsx`:

- Attempt baru dibuat dengan `status=berjalan`, `exam_id`, `student_id`, dan
  `question_order`. Urutan soal diacak klien lama, tetapi API baru harus
  mengacak dan menyimpannya di server agar tidak dapat dimanipulasi.
- Satu attempt berjalan per siswa+ujian. Jawaban autosave menggunakan unique
  `(attempt_id, question_id)`.
- Batas waktu adalah nilai terkecil antara `dimulai_at + durasi_menit` dan
  `waktu_selesai` ujian, kecuali `admin_override`. Server wajib memeriksa ini
  lagi pada autosave dan submit; submit terlambat ditutup otomatis.
- Siswa mendapat soal dari resource aman tanpa `kunci_jawaban`. `submit`
  mengambil kunci dari database dalam transaksi, menghitung nilai berbobot,
  lalu baru menyimpan `nilai_akhir`.
- Peringatan dipicu oleh pindah tab, blur, PrintScreen, print/save, copy/cut,
  dan meninggalkan halaman. Cooldown klien 1,5 detik, toleransi maksimum 3;
  warning ke-3 menghentikan attempt. Server tetap melakukan increment atomik.
- Setiap warning, submit, dan terminate membuat `exam_events` untuk polling
  guru. Reset membuat attempt baru/menjadikan attempt lama tidak dapat dipakai
  dan tidak boleh mengubah jawaban milik attempt lain.

## 5. RPC yang mungkin tersirat tetapi bukan pemanggilan langsung

View `questions_safe` dan `exam_question_counts` bukan RPC. Di API keduanya
diganti resource/query server:

- `GET /siswa/exams/{exam}/questions` hanya memilih kolom soal publik.
- `questions_count` dihitung melalui `withCount('questions')` atau agregasi
  terpisah yang kompatibel dengan SQLite test.
- SQL lama/RLS tidak dijadikan dependensi. Otorisasi dikerjakan oleh Laravel
  policies dan middleware; RLS PostgreSQL tetap diaktifkan tanpa policy.

## 6. Matriks otorisasi RPC → endpoint

| Area | Admin | Guru pemilik | Siswa pemilik | Anon |
| --- | --- | --- | --- | --- |
| Akun | penuh | – | – | – |
| Sesi | token sendiri, multi-device | sesi sendiri | sesi sendiri | – |
| Kode generate/reset attempt | penuh | ujian sendiri | – | – |
| Kode verify/attempt | monitor | monitor ujian sendiri | attempt sendiri | – |

Semua error API menggunakan format `{message, errors, code?}`. Error dari
database tidak diteruskan mentah bila dapat membocorkan SQL, kredensial, atau
nama tabel internal.
