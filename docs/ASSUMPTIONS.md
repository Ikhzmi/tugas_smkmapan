# ASSUMPTIONS — SMKM 8 Medan API

Dokumen ini mencatat asumsi, keputusan yang diambil tanpa konfirmasi, dan risiko.
Diperbarui setiap fase. Isi detail analisis ada di `docs/analysis/`.

## Keputusan lingkungan

- Database = PostgreSQL Supabase **project baru**, diakses HANYA oleh Laravel melalui Session pooler (port 5432). Tidak memakai Supabase Auth/Storage/Realtime/PostgREST.
- Kredensial DB tidak pernah ditulis di repo; `.env` di-ignore git.
- Test otomatis memakai SQLite in-memory. Query khusus PostgreSQL (mis. `ILIKE`) dibuat portabel/fallback agar test lulus.
- Timezone aplikasi `Asia/Jakarta`; timestamp disimpan UTC dan dikirim ISO 8601.

## Larangan sumber rahasia Web

- File `.env` milik `Web/` dan nilai kredensial Supabase lama TIDAK dibaca/disalin. Bila ditemukan kredensial hard-coded saat analisis, hanya dicatat lokasi filenya tanpa nilainya.

## Temuan produk Fase 1

- Role pengguna: `admin`, `guru`, `siswa`; tidak ada role keempat.
- Web login siswa mengubah NISN menjadi email turunan, sedangkan guru/admin memakai username/email. API baru menerima `identifier` langsung agar tidak bergantung pada Supabase Auth.
- Sesi tunggal non-admin memiliki grace 5 menit dan heartbeat 30 detik; admin boleh multi-device.
- Ujian memiliki durasi, jadwal, optional kode akses, urutan soal acak, satu attempt aktif, warning maksimum 3, dan penilaian server-side.
- `materials` dan `assignments` adalah tabel kanonik; bucket lama `materi`/`tugas` hanya konsep storage, bukan tabel.
- Realtime event ujian dan sesi diganti polling endpoint pada fase awal.
- Import Excel/CSV tetap client-side; API menerima JSON tervalidasi.

## Risiko

- Definisi RPC Supabase mungkin tidak tersedia di repo Web; perilakunya disimpulkan dari pemakaian frontend dan dicatat sebagai asumsi.
- Supabase free tier bisa dijeda otomatis bila lama tidak aktif (perlu dibangunkan sebelum demo).
- Schema/SQL RPC lengkap tidak tersedia sebagai sumber backend yang boleh dipakai; hak akses API baru harus diuji dengan feature test lintas role.
- Ditemukan penggunaan kredensial/konfigurasi Supabase pada kode Web; tidak disalin dan file rahasia Web tidak dibaca.
- Media lama tidak diimpor; URL publik lama harus dipetakan ulang ketika frontend mulai migrasi.
