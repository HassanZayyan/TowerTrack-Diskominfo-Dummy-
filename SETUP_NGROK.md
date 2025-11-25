# 🚀 Setup Ngrok & Local Development

## 📋 Quick Setup

### Local Development (HTTP)

1. **Update `.env`:**
   ```env
   APP_URL=http://127.0.0.1:8000
   FORCE_HTTPS=false
   ```

2. **Jalankan server:**
   ```bash
   php artisan serve
   ```

3. **Akses aplikasi:**
   ```
   http://127.0.0.1:8000
   ```

---

### Demo dengan Ngrok (HTTPS)
Matikan npm run dev

1. **Update `.env`:**
   ```env
   APP_URL=https://YOUR_NGROK_URL.ngrok-free.app
   ASSET_URL=https://YOUR_NGROK_URL.ngrok-free.app
   FORCE_HTTPS=true
   ```

2. **Jalankan server Laravel:**
   ```bash
   php artisan serve
   ```

3. **Jalankan ngrok (terminal baru):**
   ```bash
   ngrok http 8000
   ```

4. **Copy URL ngrok** (contoh: `https://b7c19c9f0504.ngrok-free.app`)

5. **Update `.env`** dengan URL ngrok yang baru

6. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

7. **Akses aplikasi:**
   ```
   https://YOUR_NGROK_URL.ngrok-free.app
   ```

---

## ⚙️ Konfigurasi Otomatis

Aplikasi akan otomatis:
- ✅ Menggunakan **HTTP** untuk localhost
- ✅ Menggunakan **HTTPS** jika URL mengandung "ngrok" atau `FORCE_HTTPS=true`
- ✅ Trust proxies untuk ngrok

---

## 🔄 Switch antara Local & Ngrok

**Dari Local → Ngrok:**
1. Update `APP_URL` dan `ASSET_URL` ke URL ngrok
2. Set `FORCE_HTTPS=true`
3. `php artisan config:clear`

**Dari Ngrok → Local:**
1. Update `APP_URL=http://127.0.0.1:8000`
2. Set `FORCE_HTTPS=false` atau hapus barisnya
3. `php artisan config:clear`

---

## 📝 Catatan Penting

- ⚠️ Pastikan server Laravel berjalan dengan `--host=0.0.0.0` untuk ngrok
- ⚠️ Port ngrok harus sama dengan port server Laravel (default: 8000)
- ⚠️ Jika URL ngrok berubah, update `.env` dan clear cache lagi
- 💡 Build assets production: `npm run build` sebelum demo

