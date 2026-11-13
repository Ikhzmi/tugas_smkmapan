# 05 — Akademik & LMS (Materi, Tugas, Pengumpulan)

## 1. Cakupan

- Master akademik: kelas, siswa, guru, mata pelajaran, jadwal.
- LMS: materi, tugas, pengumpulan, penilaian.
- Dashboard agregat guru & siswa.
- Import siswa dan soal dilakukan **client-side** (Web sudah memakai `xlsx`); API menerima baris JSON hasil parsing. API tidak menambah dependensi spreadsheet.

## 2. Endpoint admin akademik

| Method | Path | Keterangan |
| --- | --- | --- |
| GET/POST | `/admin/classes` | daftar / buat kelas |
| PUT/DELETE | `/admin/classes/{id}` | ubah / hapus |
| GET | `/admin/classes/{id}/students` | anggota kelas |
| GET/POST | `/admin/students` | daftar (filter `class_id`,`q`,`page`) / buat |
| PUT/DELETE | `/admin/students/{id}` | ubah / hapus |
| POST | `/admin/students/import` | bulk JSON `{class_id, rows:[{nama,nisn,no_hp,alamat}]}` |
| GET/POST | `/admin/teachers` | daftar / buat (opsional akun) |
| PUT/DELETE | `/admin/teachers/{id}` | ubah / hapus |
| GET/POST | `/admin/subjects` | daftar / buat |
| PUT/DELETE | `/admin/subjects/{id}` | ubah / hapus |
| GET/POST | `/admin/schedules` | daftar (filter `class_id`,`teacher_id`,`hari`) / buat |
| PUT/DELETE | `/admin/schedules/{id}` | ubah / hapus |

### Validasi & aturan

- **Kelas**: `nama` wajib; `tahun_ajaran` wajib; unik (`nama`,`tahun_ajaran`); `tingkat` 10–12; `major_id`/`wali_kelas_id` harus ada bila diisi. Hapus kelas → `students.class_id = null`.
- **Siswa**: `nama` wajib; `nisn` wajib unik (angka); `nis` opsional; `class_id` opsional; `no_hp`/`alamat` opsional. Bila `create_account=true`: buat `users` role siswa dengan username = NISN, password wajib (min 8) atau digenerate; `students.user_id` diisi. Respons menyertakan `account_created` dan `initial_password` hanya saat digenerate.
- **Guru**: `nama` wajib unik; `gelar`/`jabatan`/`department`/`email`/`jam_kerja`/`bio` opsional; `sertifikasi` array. Bila `create_account=true`: username default dari email local-part atau slug nama (harus unik), role guru, password wajib/digenerate.
- **Mapel**: `nama` wajib; `kode` opsional unik; `major_id` opsional.
- **Jadwal**: `class_id` & `subject_id` wajib; `teacher_id` opsional; `hari` salah satu `senin`–`sabtu` (minggu ditolak); `jam_mulai`/`jam_selesai` format `H:i`; selesai > mulai. Tolak bentrok bila kelas **atau** guru punya jadwal overlap di hari sama → `422 SCHEDULE_CONFLICT` dengan detail jadwal bentrok.
- Hapus guru/siswa: hapus `users` terkait (bila ada) dan baris profil; data akademik anak mengikuti aturan FK (submission/attempt/attendance cascade; materi/tugas/ujian `teacher_id` null).

### Format daftar

Semua daftar mendukung `page`, `per_page` (maks 100), `q` (cari nama/nisn/kode), dan sorting default:
- students: `nama`
- teachers: `sort_order,nama`
- classes: `tingkat,nama`
- subjects: `nama`
- schedules: `hari,jam_mulai`

## 3. Endpoint guru — LMS

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/guru/dashboard` | agregat dashboard |
| GET | `/guru/schedules` | jadwal milik guru + kelas/mapel |
| GET/POST | `/guru/materials` | daftar / buat materi |
| PUT/DELETE | `/guru/materials/{id}` | ubah / hapus |
| POST | `/guru/materials/{id}/publish` | toggle publikasi (`is_published`) |
| POST | `/guru/materials/{id}/file` | unggah PDF (maks 25 MB) |
| GET/POST | `/guru/assignments` | daftar / buat tugas |
| PUT/DELETE | `/guru/assignments/{id}` | ubah / hapus |
| POST | `/guru/assignments/{id}/publish` | toggle publikasi |
| GET | `/guru/assignments/{id}/submissions` | daftar pengumpulan |
| PATCH | `/guru/submissions/{id}/grade` | `{nilai, feedback}` |
| GET | `/guru/submissions/{id}/download` | signed URL berkas (1 jam) |

### Materi

Field: `judul`, `deskripsi`, `tipe` (`file|video|link|teks`), `subject_id`, `class_id`, `is_published`, `file_url`.
- `teacher_id` diisi server dari guru login.
- `is_published=true` mewajibkan `subject_id` dan `class_id` (sama seperti `DashboardGuru.jsx:546-548`).
- `tipe=file`: wajib ada berkas (unggah multipart ke endpoint file atau `file_url` hasil unggah). Simpan URL publik.
- `tipe=video`: `file_url` wajib URL YouTube/http(s). Simpan URL asli; resource menambahkan `embed_url` (konversi YouTube) agar mobile mudah.
- `tipe=link`: `file_url` wajib http(s).
- `tipe=teks`: isi materi di `deskripsi`; `file_url` null.
- Hapus materi tidak menghapus file fisik otomatis (bisa ditambahkan nanti); dokumentasikan.

### Tugas

Field: `judul`, `deskripsi`, `deadline` (ISO 8601), `subject_id`, `class_id`, `is_published`.
- `is_published=true` mewajibkan mapel & kelas.
- Deadline boleh lampau; UI siswa menandai terlambat, server tetap menerima pengumpulan (sesuai Web).
- Hapus tugas → cascade submission.

### Pengumpulan & penilaian

- Siswa: `POST /siswa/assignments/{id}/submissions` multipart `file` **atau** `link` + `catatan`.
  - Minimal salah satu berkas/tautan.
  - Berkas maks 25 MB, disimpan privat di `tugas/{nisn}/{assignment_id}-{timestamp}.{ext}`.
  - Tautan wajib `http://`/`https://`.
  - Satu submission per (`assignment_id`,`student_id`) → duplikat `409 ALREADY_SUBMITTED`.
  - Status awal `dikumpulkan`, `dikumpulkan_at=now`.
- Guru: `PATCH /guru/submissions/{id}/grade` body `{nilai: 0..100, feedback}` → status `dinilai`, `dinilai_at=now`. Nilai boleh null untuk menghapus nilai? Web mengirim null bila kosong; dukung `nullable`.
- Guru hanya boleh mengakses submission milik assignment-nya.
- `GET /guru/submissions/{id}/download` mengembalikan `{url, expires_at}` signed URL; bila submission berupa tautan, kembalikan tautan langsung.

## 4. Endpoint siswa — LMS

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/siswa/dashboard` | agregat dashboard |
| GET | `/siswa/schedules` | jadwal kelas |
| GET | `/siswa/materials` | materi publik kelas (filter `subject_id`) |
| GET | `/siswa/materials/{id}` | detail + `file_url`/`embed_url` |
| GET | `/siswa/assignments` | tugas publik kelas + status submission |
| GET | `/siswa/assignments/{id}` | detail tugas |
| POST | `/siswa/assignments/{id}/submissions` | kumpulkan |
| GET | `/siswa/submissions` | riwayat pengumpulan + nilai |
| GET | `/siswa/grades` | rekap nilai tugas & ujian |

Aturan baca:
- Materi: `class_id = siswa.class_id` dan `is_published=true`.
- Tugas: `class_id = siswa.class_id` dan `is_published=true`.
- Status tugas dihitung server: `open` (belum kumpul, deadline belum lewat), `late` (belum kumpul, deadline lewat), `submitted` (sudah kumpul, belum dinilai), `graded` (sudah dinilai). Sertakan `deadline`, `submission` ringkas.
- Siswa tidak boleh membaca submission siswa lain.

## 5. Bentuk respons dashboard

### `GET /guru/dashboard`
```json
{
  "data": {
    "teacher": {"id":"uuid","nama":"...","gelar":"...","jabatan":"..."},
    "stats": {"classes":3,"students":96,"materials":12,"assignments":8,"pending_submissions":5,"exams":2},
    "today_schedules": [{"id":"uuid","hari":"senin","jam_mulai":"07:00","jam_selesai":"08:30","class":{"id":"uuid","nama":"X TKJ 1"},"subject":{"id":"uuid","nama":"..."}}],
    "recent_submissions": [{"id":"uuid","assignment_id":"uuid","student":{"id":"uuid","nama":"...","nisn":"..."},"status":"dikumpulkan","dikumpulkan_at":"..."}],
    "exam_events": [{"id":"uuid","type":"warning","message":"...","created_at":"..."}]
  }
}
```
`exam_events` diambil dari 20 event terbaru (pengganti realtime; lihat dokumen 07/09).

### `GET /siswa/dashboard`
```json
{
  "data": {
    "student": {"id":"uuid","nisn":"...","nama":"...","class":{"id":"uuid","nama":"X TKJ 1","tingkat":10,"major":{"kode":"TKJ","nama":"..."}}},
    "stats": {"subjects":8,"materials":12,"assignments_open":2,"exams_available":1,"attendance_percent":96},
    "today_schedules": [...],
    "materials": [...],
    "assignments": [...],
    "exams": [{"id":"uuid","judul":"...","session_state":"open","question_count":20,"attempt_status":null}],
    "attendance_summary": {"hadir":18,"terlambat":1,"izin":0,"sakit":0,"alpa":0}
  }
}
```

## 6. Aturan tambahan

- Semua endpoint guru memakai `teacher_id` dari sesi; body yang mencoba mengubah `teacher_id` diabaikan/ditolak `422`.
- Semua endpoint siswa memakai `student_id` dari sesi; body `student_id` ditolak.
- Upload gambar materi? Web hanya PDF untuk tipe file. Tidak ada gambar materi.
- File publik memakai URL `/storage/...`; file submission privat tidak pernah mengembalikan path mentah ke siswa/guru (hanya signed URL).
- Pagination respons: `{data:[...], meta:{current_page,per_page,total,last_page}}`.

## 7. Asumsi

- Tidak ada endpoint import spreadsheet di server; Web tetap mem-parsing `.xlsx/.csv` di browser.
- `submissions` tidak memiliki batas waktu keras; keterlambatan hanya penanda UI.
- Nilai tugas 0–100; tidak ada bobot tugas.
- Materi `teks` tidak memiliki kolom isi terpisah; memakai `deskripsi`.
