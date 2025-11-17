# Setup Cloudflare Turnstile CAPTCHA

## Konfigurasi .env

Tambahkan konfigurasi berikut di file `.env` Anda:

```env
# Cloudflare Turnstile (Development - Test Keys)
# Test keys ini selalu return success untuk development
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

## Untuk Production

1. Daftar di Cloudflare Dashboard: https://dash.cloudflare.com
2. Pilih domain atau buat site baru
3. Buka "Turnstile" di sidebar
4. Klik "Add Site"
5. Isi:
   - Site name: "Tagging Tower Kominfo"
   - Domain: domain production Anda
   - Widget mode: "Managed" (recommended)
6. Klik "Create"
7. Copy Site Key dan Secret Key
8. Update `.env`:
```env
TURNSTILE_SITE_KEY=your-production-site-key
TURNSTILE_SECRET_KEY=your-production-secret-key
```

## Setelah Update .env

Jalankan perintah berikut:

```bash
php artisan config:clear
php artisan cache:clear
```

## Testing

1. Test di localhost: Buka `/feedback` atau `/complaint` sebagai guest
2. Widget Turnstile akan muncul otomatis
3. Test keys akan selalu pass
4. Submit form dan pastikan berhasil

## Catatan

- CAPTCHA hanya muncul untuk guest (user yang tidak login)
- User yang sudah login (complainant/tower_owner) tidak perlu CAPTCHA
- Test keys hanya untuk development, jangan gunakan di production

