# 📡 Tagging Tower Kominfo

Aplikasi web untuk mengelola dan memantau data menara telekomunikasi di Kabupaten Semarang. Platform ini memungkinkan pengelolaan menara, pengajuan pengaduan, dan pengumpulan masukan.

## ✨ Fitur Utama

- **🗂️ Pengelolaan Data Menara**: Lihat, cari, dan filter data menara telekomunikasi
- **🗺️ Peta Interaktif**: Visualisasikan lokasi menara menggunakan peta Leaflet
- **📝 Pengajuan Pengaduan**: Ajukan dan pantau pengaduan tentang menara telekomunikasi
- **💬 Sistem Umpan Balik**: Berikan masukan tentang menara tertentu
- **👥 Manajemen Pengguna**: Level akses berbeda untuk administrator, operator, dan pengguna biasa
- **📣 Sistem Respons**: Staf dapat merespons pengaduan dan umpan balik pengguna
- **📊 Pelacakan Status**: Pantau status pengaduan dan umpan balik yang diajukan

## 🛠️ Teknologi yang Digunakan

- **Backend**: Laravel 12
- **Frontend**: React dengan TypeScript
- **UI Framework**: TailwindCSS
- **Peta**: Leaflet/React-Leaflet
- **Manajemen State**: Inertia.js

## ⚙️ Instalasi

1. **Clone repositori**
   ```bash
   git clone https://github.com/username-anda/Tagging_Tower_Kominfo.git
   cd Tagging_Tower_Kominfo
   ```

2. **Instal dependensi PHP**
   ```bash
   composer install
   ```

3. **Instal dependensi JavaScript**
   ```bash
   npm install
   ```

4. **Konfigurasi variabel lingkungan**
   ```bash
   cp .env.example .env
   ```
   Edit file `.env` untuk mengatur database dan konfigurasi lainnya:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nama_database_anda
   DB_USERNAME=username_database_anda
   DB_PASSWORD=password_database_anda

   # Untuk produksi dengan ngrok
   APP_URL=https://url-ngrok-anda.ngrok.app
   ASSET_URL=https://url-ngrok-anda.ngrok.app
   ```

5. **Generate application key**
   ```bash
   php artisan key:generate
   ```

6. **Jalankan migrasi dan seeder database**
   ```bash
   php artisan migrate --seed
   ```

7. **Build asset frontend**
   ```bash
   npm run build
   ```

8. **Jalankan server pengembangan**
   ```bash
   php artisan serve
   ```

   Untuk pengembangan dengan hot reloading:
   ```bash
   npm run dev
   ```

9. **Akses aplikasi**
   Buka browser dan navigasikan ke: http://127.0.0.1:8000

## 🌐 Deployment Produksi dengan Ngrok

Saat menggunakan ngrok untuk demo aplikasi:

1. Gunakan build produksi (bukan server development)
2. Perbarui file `.env` dengan URL ngrok Anda:
   ```
   APP_URL=https://url-ngrok-anda.ngrok.app
   ASSET_URL=https://url-ngrok-anda.ngrok.app
   ```
3. Paksa URL HTTPS di `AppServiceProvider.php`:
   ```php
   URL::forceScheme('https');
   ```
4. Percayai proxy di `bootstrap/app.php`
5. Bersihkan cache Laravel setelah memperbarui:
   ```bash
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   php artisan cache:clear
   ```

## 👥 Peran Pengguna

- **👑 Admin**: Akses penuh untuk mengelola pengguna, menara, dan merespons pengaduan
- **🛠️ Operator**: Dapat mengelola menara dan merespons pengaduan pengguna
- **👤 Pengguna**: Dapat melihat data menara, mengajukan pengaduan, dan memberikan umpan balik

## 🤝 Kontribusi

Kontribusi sangat disambut! Silakan ajukan Pull Request.

## 📄 Lisensi

Proyek ini adalah perangkat lunak open-source yang dilisensikan di bawah [lisensi MIT](https://opensource.org/licenses/MIT).