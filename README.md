# 📡 Tagging Tower Kominfo

Aplikasi web untuk mengelola dan memantau data menara telekomunikasi di Kabupaten Semarang. Platform ini memungkinkan pengelolaan menara, pengajuan pengaduan, dan pengumpulan masukan.

## 📑 Table of Contents

- [✨ Fitur Utama](#-fitur-utama)
- [🛠️ Teknologi yang Digunakan](#️-teknologi-yang-digunakan)
- [👥 Peran Pengguna](#-peran-pengguna)
  - [Role Terdaftar (Database)](#role-terdaftar-database)
  - [Guest User (Non-Role)](#guest-user-non-role)
- [⚙️ Instalasi Lengkap](#️-instalasi-lengkap)
  - [1. Clone Repositori](#1-clone-repositori)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Konfigurasi Environment](#3-konfigurasi-environment)
  - [4. Setup Aplikasi](#4-setup-aplikasi)
  - [5. Jalankan Server](#5-jalankan-server)
  - [6. Akses Aplikasi](#6-akses-aplikasi)
- [🚀 Opsi Deployment: Local vs Ngrok](#-opsi-deployment-local-vs-ngrok)
  - [📍 Local Development (HTTP)](#-local-development-http)
  - [🌐 Ngrok (HTTPS) - Untuk Demo](#-ngrok-https---untuk-demo)
- [🔄 Switch antara Local & Ngrok](#-switch-antara-local--ngrok)
- [🌐 Monitoring Infrastruktur Telekomunikasi](#-monitoring-infrastruktur-telekomunikasi)
- [🛠️ Perintah Berguna](#️-perintah-berguna)
- [📚 Dokumentasi Tambahan](#-dokumentasi-tambahan)
- [⚠️ Troubleshooting](#️-troubleshooting)
- [📄 License](#-license)

---

## ✨ Fitur Utama

- **🗂️ Pengelolaan Data Menara**: Lihat, cari, dan filter data menara telekomunikasi
- **🗺️ Peta Interaktif**: Visualisasikan lokasi menara menggunakan peta Leaflet
- **📝 Pengajuan Pengaduan**: Ajukan dan pantau pengaduan tentang menara telekomunikasi
- **💬 Sistem Umpan Balik**: Berikan masukan tentang menara tertentu
- **👥 Manajemen Pengguna**: 4 role dengan level akses berbeda + guest user
- **📣 Sistem Respons**: Staf dapat merespons pengaduan dan umpan balik pengguna
- **📊 Pelacakan Status**: Pantau status pengaduan dan umpan balik yang diajukan
- **🔐 Guest Email Verification**: Sistem verifikasi email untuk pengguna tamu

## 🛠️ Teknologi yang Digunakan

- **Backend**: Laravel 12
- **Frontend**: React dengan TypeScript
- **UI Framework**: TailwindCSS
- **Peta**: Leaflet/React-Leaflet
- **Manajemen State**: Inertia.js
- **CAPTCHA**: Cloudflare Turnstile

## 📋 Persyaratan Sistem

### PHP Version
- **PHP 8.3 atau lebih tinggi** (wajib)
- Pastikan menggunakan **PHP 64-bit** (bukan 32-bit)
- Beberapa dependensi seperti `maennchen/zipstream-php` memerlukan PHP 8.3+

### Rekomendasi Environment
- **Laragon** (disarankan untuk Windows)
  - Download: https://laragon.org/download/
  - Laragon menyediakan PHP 8.3+ dan semua tools yang diperlukan (MySQL, Composer, dll)
  - Mudah untuk switch antara versi PHP
  - Built-in terminal dan database management

### Tools Lainnya
- **Composer** (untuk PHP dependencies)
- **Node.js & npm** (untuk JavaScript dependencies)
- **MySQL** atau database server lainnya
- **Git** (untuk clone repository)

### Verifikasi Instalasi
```bash
# Cek versi PHP (harus 8.3 atau lebih tinggi)
php -v

# Cek apakah PHP 64-bit
php -r "echo PHP_INT_SIZE * 8 . '-bit' . PHP_EOL;"

# Cek versi Composer
composer --version

# Cek versi Node.js
node -v
npm -v
```

## 👥 Peran Pengguna

Aplikasi ini memiliki **4 role** yang terdaftar di database dan **1 guest user** (unauthenticated):

### Role Terdaftar (Database)

- **👑 Admin**: Akses penuh untuk mengelola pengguna, menara, dan merespons pengaduan
- **🛠️ Operator**: Dapat mengelola menara dan merespons pengaduan pengguna
- **👤 Complainant**: Dapat mengajukan pengaduan dan memberikan umpan balik
- **🏢 Tower Owner**: Dapat melihat menara miliknya dan merespons pengaduan terkait

### Guest User (Non-Role)

- **🌐 Guest**: User yang tidak login dapat mengajukan pengaduan/umpan balik dengan verifikasi email. Guest bukan role di database, melainkan status authentication (`!auth()->check()`).

## ⚙️ Instalasi Lengkap

### 1. Clone Repositori

```bash
git clone https://github.com/HassanZayyan/Tagging_Tower_Kominfo.git
cd Tagging_Tower_Kominfo
```

### 2. Install Dependencies

**⚠️ Pastikan PHP 8.3+ sudah terinstall sebelum menjalankan `composer install`**

```bash
# Install PHP dependencies (helper functions akan otomatis ter-load)
composer install

# Install JavaScript dependencies
npm install
```

**Catatan**: Jika muncul error tentang PHP version, pastikan:
- PHP versi 8.3 atau lebih tinggi sudah terinstall
- Menggunakan PHP 64-bit
- Path PHP sudah benar di environment variables
- Jika menggunakan Laragon, pastikan versi PHP yang aktif adalah 8.3+

### 3. Konfigurasi Environment

```bash
# Copy file environment
cp .env.example .env
```

Edit file `.env` dan sesuaikan konfigurasi:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database_anda
DB_USERNAME=username_database_anda
DB_PASSWORD=password_database_anda

# Application URL (untuk local)
APP_URL=http://127.0.0.1:8000
FORCE_HTTPS=false

# Cloudflare Turnstile (Test keys untuk development)
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Mail Configuration (untuk email verification)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 4. Setup Aplikasi

```bash
# Generate application key
php artisan key:generate

# Jalankan migrasi dan seeder database
php artisan migrate --seed

# Build assets frontend
npm run build
```

### 5. Jalankan Server

```bash
# Development server
php artisan serve

# Atau dengan hot reloading (terminal terpisah)
npm run dev
```

### 6. Akses Aplikasi

Buka browser dan navigasikan ke: **http://127.0.0.1:8000**

---

## 🚀 Opsi Deployment: Local vs Ngrok

### 📍 Local Development (HTTP)

**Konfigurasi `.env`:**
```env
APP_URL=http://127.0.0.1:8000
FORCE_HTTPS=false
```

**Apa yang bisa dilakukan:**
- ✅ Development dan testing lokal
- ✅ Semua fitur aplikasi berfungsi normal
- ✅ Email verification (jika mail server dikonfigurasi)
- ✅ CAPTCHA berfungsi dengan test keys
- ❌ Tidak bisa diakses dari device lain di network yang sama
- ❌ Tidak bisa demo ke client secara remote
- ❌ Tidak support HTTPS (beberapa fitur browser mungkin terbatas)

**Cara menjalankan:**
```bash
php artisan serve
# Akses: http://127.0.0.1:8000
```

---

### 🌐 Ngrok (HTTPS) - Untuk Demo

**Persiapan:**
1. Install ngrok: https://ngrok.com/download
2. Daftar akun ngrok (gratis)
3. Dapatkan authtoken dari dashboard

**Konfigurasi `.env`:**
```env
APP_URL=https://YOUR_NGROK_URL.ngrok-free.app
ASSET_URL=https://YOUR_NGROK_URL.ngrok-free.app
FORCE_HTTPS=true
```

**Apa yang bisa dilakukan:**
- ✅ Demo ke client secara remote
- ✅ Dapat diakses dari device lain (mobile, tablet, dll)
- ✅ Support HTTPS (semua fitur browser berfungsi)
- ✅ Email verification berfungsi penuh
- ✅ CAPTCHA berfungsi dengan test keys
- ✅ Testing di production-like environment
- ⚠️ URL berubah setiap restart ngrok (kecuali pakai plan berbayar)
- ⚠️ Ada warning page ngrok (dapat di-skip)

**Cara menjalankan:**

1. **Jalankan server Laravel:**
   ```bash
   php artisan serve
   ```

2. **Jalankan ngrok (terminal baru):**
   ```bash
   ngrok http 8000
   ```

3. **Copy URL ngrok** (contoh: `https://b7c19c9f0504.ngrok-free.app`)

4. **Update `.env`** dengan URL ngrok:
   ```env
   APP_URL=https://b7c19c9f0504.ngrok-free.app
   ASSET_URL=https://b7c19c9f0504.ngrok-free.app
   FORCE_HTTPS=true
   ```

5. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

6. **Akses aplikasi:**
   ```
   https://b7c19c9f0504.ngrok-free.app
   ```

**Catatan Penting:**
- ⚠️ Pastikan build assets production: `npm run build` sebelum demo
- ⚠️ Jika URL ngrok berubah, update `.env` dan clear cache lagi
- ⚠️ Untuk production build, matikan `npm run dev` dan gunakan `npm run build`

---

## 🔄 Switch antara Local & Ngrok

### Dari Local → Ngrok:
1. Update `APP_URL` dan `ASSET_URL` ke URL ngrok
2. Set `FORCE_HTTPS=true`
3. `php artisan config:clear`
4. Jalankan ngrok: `ngrok http 8000`

### Dari Ngrok → Local:
1. Update `APP_URL=http://127.0.0.1:8000`
2. Set `FORCE_HTTPS=false` atau hapus barisnya
3. `php artisan config:clear`
4. Stop ngrok

---

## 🌐 Monitoring Infrastruktur Telekomunikasi

Aplikasi ini berperan sebagai pusat pantau untuk persebaran menara telekomunikasi sekaligus jalur fiber optic di Kabupaten Semarang. Data geospasial menampilkan:
- Lokasi tower beserta status operasional dan operator penyedia.
- Jalur fiber optic utama dan cabang yang menghubungkan desa, kecamatan, hingga pusat layanan.
- Titik prioritas pembangunan baru berdasarkan kebutuhan layanan data dan suara.

Dengan visualisasi interaktif, tim dapat:
- Mengidentifikasi daerah minim cakupan sinyal atau belum terhubung fiber.
- Menyusun rencana ekspansi jaringan backbone dan distribusi.
- Memantau progres pembangunan secara real time saat melakukan survey lapangan.

Informasi tower dan fiber optic dapat diperbarui melalui dashboard admin sehingga pemangku kebijakan selalu memiliki gambaran terkini terkait kesiapan infrastruktur digital di wilayah tersebut.

---

## 🛠️ Perintah Berguna

```bash
# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimize untuk production
composer dump-autoload --optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Regenerate autoload (setelah pull dari git)
composer dump-autoload
```

---

## 📚 Dokumentasi Tambahan

- **Setup Ngrok**: Lihat `SETUP_NGROK.md` untuk detail lengkap
- **Setup CAPTCHA**: Lihat `CLOUDFLARE_TURNSTILE_SETUP.md` untuk konfigurasi Turnstile
- **Setup GeoJSON Routes**: Lihat `SETUP_GEOJSON_ROUTES.md` untuk routing

---

## ⚠️ Troubleshooting

### Error: PHP version tidak kompatibel saat `composer install`
**Error**: `maennchen/zipstream-php requires php-64bit ^8.3 -> your php-64bit version (8.2.x) does not satisfy that requirement`

**Solusi**:
1. Upgrade PHP ke versi 8.3 atau lebih tinggi
2. Jika menggunakan Laragon:
   - Buka Laragon
   - Klik kanan → PHP → pilih versi 8.3 atau lebih tinggi
   - Restart Laragon
3. Verifikasi versi PHP: `php -v`
4. Jalankan `composer update` atau `composer install` lagi

### Helper functions tidak tersedia
```bash
composer dump-autoload
```

### Config tidak ter-update setelah ubah .env
```bash
php artisan config:clear
```

### Assets tidak ter-update
```bash
npm run build
# atau untuk development
npm run dev
```

### Email verification tidak berfungsi
- Pastikan konfigurasi mail di `.env` sudah benar
- Test dengan Mailtrap atau service mail testing lainnya
- Pastikan `APP_URL` sesuai dengan environment (local/ngrok)

---

## 📄 License

[Owajiji Addict]

---

**Developed by**: BabyMuffin and ZX  
**Last Updated**: 2025