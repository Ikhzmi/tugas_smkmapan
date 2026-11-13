# Panduan & Dokumentasi Wasmer Edge Deployment

Aplikasi REST API **SMKM 8 Medan** telah berhasil dideploy dan aktif secara live di **Wasmer Edge**!

---

## 1. Status Deployment & URL Live

- **Live URL**: [https://smkm8medan-api.wasmer.app](https://smkm8medan-api.wasmer.app)
- **Wasmer Dashboard**: [https://wasmer.io/apps/ikhzmi/smkm8medan-api](https://wasmer.io/apps/ikhzmi/smkm8medan-api)
- **Wasmer Package**: [https://wasmer.io/ikhzmi/smkm8medan-api](https://wasmer.io/ikhzmi/smkm8medan-api)
- **Status Runtime**: **Healthy & Active**

---

## 2. Hasil Pengujian Endpoint Langsung

| Endpoint | Method | Status | Hasil |
| :--- | :---: | :---: | :--- |
| `https://smkm8medan-api.wasmer.app/health` | `GET` | `200 OK` | `{"status":"ok","app":"SMKM 8 Medan API"}` |
| `https://smkm8medan-api.wasmer.app/api/v1/ping` | `GET` | `200 OK` | `{"status":"ok","app":"SMKM 8 Medan API"}` |
| `https://smkm8medan-api.wasmer.app/api/v1/public/majors` | `GET` | `200 OK` | Mengambil data jurusan langsung dari Supabase PostgreSQL |
| `https://smkm8medan-api.wasmer.app/api/v1/public/site` | `GET` | `200 OK` | Mengambil pengaturan landing page sekolah dari database |

---

## 3. Optimasi yang Dilakukan

1. **Pembersihan Dependensi Testing**:
   Menghapus dev package PHPUnit 13 dan Pest 5 dari autoloader produksi agar kompatibel dengan lingkungan edge runtime.
2. **Pembersihan Model Service AWS SDK yang Tidak Digunakan**:
   Menggunakan `Aws\Script\Composer\Composer::removeUnusedServices` untuk memangkas 429 service AWS yang tidak dipakai (hanya menyisakan modul S3 yang dibutuhkan Supabase Storage), memotong ukuran vendor dari 88 MB menjadi 31 MB.
3. **Penanganan Symlink**:
   Mengabaikan symlink lokal `public/storage` di `.wasmerignore` agar tidak melanggar batasan volume Wasmer.
4. **Environment Variables Terkoneksi ke Supabase**:
   Semua variabel database session pooler Supabase (`aws-0-ap-northeast-2.pooler.supabase.com`) dan Supabase Storage S3 terpasang rapi di `app.yaml`.

---

## 4. Cara Deploy Ulang di Masa Depan

Jika Anda melakukan perubahan kode di masa mendatang, cukup jalankan:

```powershell
cd "d:\Sistem Informasi\Semester 8\smkm8medan-api"
wasmer deploy --publish-package --non-interactive
```
