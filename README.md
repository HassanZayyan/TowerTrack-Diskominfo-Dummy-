# TowerTrack

Sistem monitoring infrastruktur telekomunikasi Kabupaten Semarang — Diskominfo Kabupaten Semarang.

Aplikasi web untuk memetakan dan mengelola data menara telekomunikasi dan jaringan fiber optik di Kabupaten Semarang. Warga dapat melihat sebaran menara dan jalur FO di peta, lalu menyampaikan keluhan atau masukan terkait infrastruktur di sekitarnya. Petugas mengelola data dan menanggapi laporan yang masuk.

Lima peran pengguna: `admin`, `operator`, `tower_owner`, `provider_owner`, dan `complainant`. Pengunjung tanpa akun tetap bisa melihat seluruh data publik dan mengirim keluhan lewat verifikasi email.

## Stack

| Bagian | Teknologi |
|---|---|
| Backend | PHP 8.2+ · Laravel 12 |
| Frontend | React 18 · TypeScript · Inertia 2 |
| Styling | Tailwind CSS 3.4 |
| Peta | Leaflet 1.9 + OpenStreetMap |
| Build | Vite 7 |
| Database | MySQL 8 |
| CAPTCHA | Cloudflare Turnstile |

## Setup

Butuh PHP 8.2+, Composer, Node.js 18+, dan MySQL.

**1. Clone dan pasang dependensi**

```bash
git clone https://github.com/HassanZayyan/TowerTrack-Diskominfo-Dummy-.git
cd TowerTrack-Diskominfo-Dummy-
composer install
npm install
```

**2. Siapkan environment**

```bash
cp .env.example .env
php artisan key:generate
```

Buat database MySQL kosong, lalu sesuaikan di `.env`:

```env
DB_DATABASE=towertrack
DB_USERNAME=root
DB_PASSWORD=
```

`.env.example` sudah berisi kunci uji Cloudflare Turnstile yang selalu lolos, jadi CAPTCHA langsung jalan tanpa perlu daftar. Ganti dengan kunci asli dari [dashboard Turnstile](https://dash.cloudflare.com) saat akan dipakai sungguhan.

**3. Isi database**

```bash
php artisan migrate --seed
```

Seeder membuat data dummy lengkap — menara, titik dan jalur FO, pengguna, serta contoh keluhan dan masukan — sehingga aplikasi langsung bisa dicoba tanpa data asli.

**4. Jalankan**

```bash
composer dev
```

Satu perintah untuk server, queue, log, dan Vite sekaligus. Buka http://127.0.0.1:8000.

Kalau lebih suka terpisah, jalankan `php artisan serve` dan `npm run dev` di dua terminal.

### Akun uji

Semua akun hasil seeder memakai password `password123`.

| Email | Peran |
|---|---|
| `admin@kominfo.go.id` | admin |
| `operator@kominfo.go.id` | operator |
| `complainant@example.com` | complainant |

**Ganti password ini sebelum aplikasi dipakai di lingkungan nyata**, dan jangan jalankan seeder di server produksi.

## Perintah lain

```bash
npm run build      # build produksi (typecheck + Vite)
php artisan test   # jalankan test suite
```

## Memasukkan data asli

Seeder membaca dua berkas CSV di akar proyek bila tersedia, dan memakai data dummy bila tidak ada:

| Berkas | Isi |
|---|---|
| `Data_menara_rev.csv` | Data menara. Kolom ke-7 longitude, ke-8 latitude |
| `Pemetaan jalur FO ISP.csv` | Titik-titik jalur fiber optik |

Kedua berkas diabaikan git. **Jangan commit data asli ke repositori ini.**
