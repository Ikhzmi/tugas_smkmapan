# Panduan Deployment ke Wasmer Edge

Dokumen ini menjelaskan konfigurasi dan langkah deployment REST API SMKM 8 Medan ke **Wasmer Edge**.

---

## 1. Karakteristik Wasmer Edge & WebAssembly

Wasmer Edge berjalan di atas runtime **WebAssembly (WASM/WASIX)** dan bukan container Linux standar (Docker).
- Eksekusi PHP menggunakan package WebAssembly `php/php` via protokol WASI.
- Konfigurasi aplikasi didefinisikan melalui `wasmer.toml` dan `app.yaml`.

> [!WARNING]
> Karena Wasmer Edge menjalankan PHP dalam bentuk WebAssembly, dukungan ekstensi native PostgreSQL (`pdo_pgsql`) dan koneksi socket SSL ke Supabase bergantung pada kompatibilitas modul WASI. Jika terjadi kendala koneksi database di lingkungan WASM, platform berbasis native container (seperti Vercel FrankenPHP, Koyeb, atau Render) direkomendasikan sebagai alternatif langsung.

---

## 2. Berkas Konfigurasi Wasmer

Project ini telah dilengkapi berkas konfigurasi Wasmer:
1. `wasmer.toml`: Konfigurasi package, dependensi runtime `php/php`, dan command runner WASI (`serve`).
2. `app.yaml`: Spesifikasi aplikasi Wasmer Edge App beserta seluruh environment variables (koneksi database Supabase & Supabase Storage S3).

---

## 3. Langkah Deploy ke Wasmer Edge

### Opsi A: Melalui Wasmer CLI (Terminal)

1. **Install Wasmer CLI di Windows (PowerShell Administrator):**
   ```powershell
   iwr -useb https://wasmer.io/install.ps1 | iex
   ```

2. **Login ke Akun Wasmer Anda:**
   ```powershell
   wasmer login
   ```
   *(Browser akan terbuka untuk autentikasi akun Wasmer/GitHub Anda).*

3. **Deploy Aplikasi:**
   Jalankan perintah berikut di direktori root project:
   ```powershell
   wasmer deploy
   ```
   Bila memerlukan build remote:
   ```powershell
   wasmer deploy --build-remote
   ```

4. **Tambahkan Secret Storage S3 (Jika Diperlukan):**
   ```powershell
   wasmer app secrets set SUPABASE_S3_KEY="<Access Key ID Anda>"
   wasmer app secrets set SUPABASE_S3_SECRET="<Secret Access Key Anda>"
   ```

---

### Opsi B: Melalui Wasmer Web Dashboard

1. Buka [wasmer.io](https://wasmer.io) dan login dengan akun GitHub Anda.
2. Buka menu **Edge Apps** -> **New App**.
3. Hubungkan ke repository GitHub: `Sky-last/MobileApp_smk` (branch `api`).
4. Wasmer akan otomatis mendeteksi berkas `app.yaml` dan `wasmer.toml`.
5. Klik **Deploy**.

