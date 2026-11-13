# 07 — Peta Aturan Bisnis

## 1. Ujian

### Ketersediaan sesi

- Ujian siswa harus `is_active=true`, memiliki soal, dan berada pada sesi
  `waktu_mulai <= now <= waktu_selesai`, kecuali `admin_override=true`.
- `waktu_mulai` dan `waktu_selesai` disimpan sebagai timestamp UTC; UI
  menampilkan Asia/Jakarta.
- Waktu efektif attempt adalah minimum antara durasi ujian sejak
  `dimulai_at` dan `waktu_selesai`. Server, bukan timer browser, menjadi sumber
  kebenaran.
- Ujian tanpa jadwal tidak dapat dimulai siswa. Admin override dapat membuka
  sesi di luar jadwal.

### Attempt dan penilaian

- Satu attempt berjalan per siswa+ujian; attempt selesai tidak dapat dimulai
  ulang kecuali guru/admin meresetnya.
- `question_order` dibuat server, acak bila `acak_soal=true`, dan dipertahankan
  saat resume/reload.
- Autosave jawaban bersifat upsert per question. Jawaban hanya boleh untuk
  soal milik attempt dan exam yang sama.
- Submit, auto-close, terminate, dan reset memakai transaksi. Penilaian PG
  dilakukan server dengan `bobot`; soal essay belum dinilai otomatis dan harus
  mengikuti kebijakan guru.
- `kunci_jawaban`, nilai berjalan, dan field internal tidak pernah ada di
  resource siswa. Endpoint siswa hanya mengirim `pertanyaan`, `opsi`, tipe,
  bobot/gambar yang aman.

### Kode akses dan anti-curang

- Kode default 6 karakter uppercase alfanumerik; panjang dapat dibatasi
  4–10. Kode aktif hanya untuk satu ujian dan guru/admin dapat menggantinya.
- Verifikasi benar membuat unlock unik siswa+ujian. Percobaan dibatasi rate
  limit dan setelah lima kegagalan UI menonaktifkan input.
- Warning dicatat paling banyak sekali per cooldown yang ditangani klien,
  tetapi server tetap mengamankan increment. Warning ke-3 menghentikan attempt
  dengan alasan yang tersimpan.
- Pindah tab/window, meninggalkan halaman, copy/cut, PrintScreen, print, dan
  save adalah indikasi pelanggaran; ini bukan pengganti pengawasan manusia.
- Reset guru/admin menghapus/menyelesaikan attempt lama secara eksplisit,
  membersihkan unlock bila kebijakan ujian mengharuskannya, dan tidak membuka
  kunci jawaban.

## 2. LMS

- Materi/tugas yang terlihat siswa harus `is_published=true` dan `class_id`
  sama dengan kelas siswa.
- Materi tipe `file` membutuhkan PDF; `video`/`link` membutuhkan URL HTTP(S);
  tipe `teks` memakai `deskripsi`.
- Tugas dapat memiliki deadline lampau. Pengumpulan terlambat tetap diterima,
  tetapi status dihitung `late` sebelum submit.
- Satu submission per assignment+siswa. Minimal ada file atau URL. Guru hanya
  dapat menilai assignment yang dimilikinya; nilai 0–100 dan feedback.
- File tugas privat; guru menerima akses sementara setelah authorization.

## 3. Presensi

- Duplikasi dicegah per siswa, jadwal, dan tanggal; bila jadwal kosong, server
  memakai siswa+kelas+tanggal.
- Siswa hanya mengisi dirinya sendiri untuk jadwal kelasnya pada tanggal hari
  ini. Guru mengisi siswa pada jadwal yang diajar; admin penuh.
- Status: `hadir`, `terlambat`, `izin`, `sakit`, `alpa`. Metode: `mandiri` atau
  `guru`. Rekap menghitung status dalam rentang tanggal.

## 4. Akademik

- NISN unik; username/email unik bila akun dibuat.
- Jadwal menolak bentrok kelas atau guru pada hari dan rentang waktu yang sama.
- Kelas unik berdasarkan nama+tahun ajaran. Menghapus kelas mengosongkan
  `students.class_id`; menghapus guru tidak menghapus materi/tugas/ujian,
  melainkan me-null-kan pemilik sesuai FK.
- Siswa/guru hanya melihat cakupan kelas/mapel miliknya; admin dapat melihat
  semua.

## 5. Publik, CMS, dan PPDB

- Konten publik hanya item aktif/terbit dan tidak mengirim `profile_id`, token,
  kunci ujian, atau path privat.
- PPDB menyimpan nama, sekolah asal, kontak, pilihan jurusan, dan status
  `baru|menunggu_verifikasi|diterima|ditolak`; endpoint publik rate limited.
- Saran/kontak dapat anonim dan hanya admin yang membaca/menghapus.
- Upload CMS admin-only, nama file dibuat server dan teks dibersihkan dengan
  validasi panjang/karakter. Tidak ada HTML mentah yang dieksekusi.

## 6. Keamanan lintas role

- Semua ID resource milik pihak lain dikembalikan 404 untuk mencegah enumerasi,
  kecuali operasi admin yang memang mengelola resource tersebut.
- Siswa tidak menerima data siswa lain, submission lain, attempt lain, atau
  kunci jawaban. Guru dibatasi pada kelas/mapel/ujian yang diajarnya.
- Token dicabut saat logout, reset password, perubahan role, akun nonaktif,
  penghapusan akun, dan sesi tunggal digantikan.
