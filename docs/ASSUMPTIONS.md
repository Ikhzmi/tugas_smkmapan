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

## Asumsi produk (sementara, akan dilengkapi Fase 1)

- Role pengguna: `admin`, `guru`, `siswa`.
- Login kemungkinan memakai email untuk guru/admin dan NIS untuk siswa — akan dikonfirmasi dari kode Web.
- Sesi tunggal: login baru mencabut token lama; heartbeat/resume/release disediakan setara RPC Supabase lama.
- Penilaian ujian dilakukan di server; kunci jawaban tidak pernah dikirim ke siswa.

## Risiko

- Definisi RPC Supabase mungkin tidak tersedia di repo Web; perilakunya disimpulkan dari pemakaian frontend dan dicatat sebagai asumsi.
- Supabase free tier bisa dijeda otomatis bila lama tidak aktif (perlu dibangunkan sebelum demo).
