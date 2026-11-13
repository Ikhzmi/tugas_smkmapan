# Panduan Deployment Vercel & Supabase Storage

Dokumen ini berisi panduan untuk menghubungkan REST API SMKM 8 Medan ke Vercel dan Supabase Storage (S3 Protocol).

## 1. Persiapan Supabase Storage (S3 Protocol)

Agar API stateless dan tidak memakai filesystem lokal:
1. Buka Dashboard Supabase project Anda -> **Storage**.
2. Buat 2 bucket:
   - `smkm8-public`: Bucket Publik (toggle **Public bucket** diaktifkan) untuk foto profil, fasilitas, eskul, galeri, banner hero, dll.
   - `smkm8-private`: Bucket Privat (toggle **Public bucket** dimatikan) untuk materi PDF dan submission tugas siswa.
3. Buka **Project Settings** -> **Storage** -> Aktifkan **S3 Connection** bila belum aktif.
4. Salin kredensial S3:
   - `Access Key ID`
   - `Secret Access Key`
   - `Endpoint` (contoh: `https://<project-ref>.supabase.co/storage/v1/s3`)
   - `Region` (contoh: `ap-northeast-2`)

## 2. Environment Variables untuk Vercel / Production

Tambahkan variabel-variabel berikut di **Vercel Dashboard -> Project Settings -> Environment Variables**:

### App & Security
- `APP_NAME` = `SMKM 8 Medan API`
- `APP_ENV` = `production`
- `APP_DEBUG` = `false`
- `APP_KEY` = `base64:...` (salin nilai `APP_KEY` dari `.env` lokal Anda)
- `APP_URL` = `https://<nama-project-anda>.vercel.app`
- `APP_TIMEZONE` = `Asia/Jakarta`
- `LOG_CHANNEL` = `stderr`

### Database (Supabase Session Pooler)
- `DB_CONNECTION` = `pgsql`
- `DB_HOST` = `<host-pooler-supabase>` (misal: `aws-0-ap-northeast-2.pooler.supabase.com`)
- `DB_PORT` = `5432`
- `DB_DATABASE` = `postgres`
- `DB_USERNAME` = `postgres.<project-ref>`
- `DB_PASSWORD` = `<password-db-anda>`
- `DB_SSLMODE` = `require`
- `SUPABASE_NEW_PROJECT_CONFIRMED` = `true`

### Session, Cache, & Queue
- `SESSION_DRIVER` = `database`
- `CACHE_STORE` = `database`
- `QUEUE_CONNECTION` = `database`

### Supabase Storage (S3 Protocol)
- `FILESYSTEM_DISK` = `local`
- `MEDIA_DISK` = `supabase-public`
- `PRIVATE_DISK` = `supabase`
- `SUPABASE_S3_KEY` = `<access-key-id-s3-supabase>`
- `SUPABASE_S3_SECRET` = `<secret-access-key-s3-supabase>`
- `SUPABASE_S3_REGION` = `ap-northeast-2`
- `SUPABASE_S3_ENDPOINT` = `https://<project-ref>.supabase.co/storage/v1/s3`
- `SUPABASE_S3_BUCKET` = `smkm8-private`
- `SUPABASE_S3_PUBLIC_BUCKET` = `smkm8-public`
- `SUPABASE_S3_PUBLIC_URL` = `https://<project-ref>.supabase.co/storage/v1/object/public/smkm8-public`

## 3. Langkah Deploy di Vercel

1. Buka [vercel.com](https://vercel.com) dan login ke akun Anda.
2. Klik **Add New...** -> **Project**.
3. Import repository GitHub: `Sky-last/MobileApp_smk`.
4. Pada form konfigurasi:
   - **Production Branch**: ubah dari `main` menjadi `api`.
   - **Root Directory**: biarkan `.` (karena repo branch `api` berada di root Laravel).
   - Vercel akan otomatis mendeteksi `Dockerfile` dan `vercel.json` runtime container.
5. Masukkan seluruh **Environment Variables** dari poin 2 di atas.
6. Klik **Deploy**.
7. Setelah selesai, uji endpoint ping atau health check:
   - `GET https://<domain-vercel>.vercel.app/health` -> `{"status":"ok","app":"SMKM 8 Medan API"}`
   - `GET https://<domain-vercel>.vercel.app/api/v1/ping` -> `{"status":"ok","app":"SMKM 8 Medan API"}`

## 4. Catatan Batasan & Alur Unggah Berkas Besar

- Vercel Container Function memiliki batas ukuran request body HTTP sekitar 4.5 MB.
- Untuk berkas gambar/dokumen <= 4 MB, klien tetap dapat mengunggah via multipart standar.
- Untuk berkas besar (PDF materi hingga 25 MB atau submission tugas):
  1. Klien memanggil endpoint URL presigned (`POST /api/v1/guru/materials/{id}/upload-url` atau `POST /api/v1/siswa/assignments/{id}/upload-url`).
  2. Klien melakukan HTTP `PUT` berkas langsung ke `data.upload_url` Supabase Storage.
  3. Klien memanggil endpoint konfirmasi (`upload-confirm` atau `submissions` dengan `file_path`).
