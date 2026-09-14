# 🐳 Panduan Deployment Docker - TowerTrack

Dokumentasi ini untuk **karyawan kantor** yang akan melakukan deployment aplikasi ke server production.

---

## 📋 Daftar Isi

1. [Persyaratan Server](#persyaratan-server)
2. [Langkah-langkah Deployment](#langkah-langkah-deployment)
3. [Konfigurasi Environment](#konfigurasi-environment)
4. [Setup Aplikasi](#setup-aplikasi)
5. [Maintenance & Troubleshooting](#maintenance--troubleshooting)

---

## 🖥️ Persyaratan Server

### Software yang Harus Terinstall

Sebelum melakukan deployment, pastikan server sudah memiliki software berikut:

1. **Docker** (versi 20.10 atau lebih baru)
2. **Docker Compose** (versi 2.0 atau lebih baru)
3. **Git** (untuk clone repository)

### Cara Install Docker & Docker Compose

#### Untuk Ubuntu/Debian

Jalankan perintah berikut di terminal server:

```bash
# Update package list
sudo apt update

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

#### Untuk CentOS/RHEL

Jalankan perintah berikut di terminal server:

```bash
# Install dependencies
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker --version
docker compose version
```

---

## 🚀 Langkah-langkah Deployment

### Langkah 1: Clone/Upload Project ke Server

#### Opsi A: Clone dari Git Repository

```bash
# Pilih direktori untuk project (contoh: /var/www)
cd /var/www

# Clone repository
git clone <URL_REPOSITORY> towertrack
cd towertrack

# Switch ke branch production (jika menggunakan branch production)
git checkout production
```

#### Opsi B: Upload via SCP/SFTP

```bash
# Dari komputer lokal, upload project ke server
scp -r /path/to/project user@server-ip:/var/www/towertrack
```

### Langkah 2: Buat File Environment

```bash
# Copy file template environment
cp .env.example .env

# Edit file .env dengan text editor
nano .env
# atau
vim .env
```

**Catatan:** Isi file `.env` dengan konfigurasi production. Lihat bagian [Konfigurasi Environment](#konfigurasi-environment) di bawah untuk detail lengkap.

### Langkah 2.5: Build Frontend Assets (Opsional)

Jika ingin build assets di host sebelum container start (opsional, karena Dockerfile sudah build assets):

```bash
# Install dependencies (jika belum)
npm install

# Build production assets
npm run build
```

**Catatan:** 
- Langkah ini opsional karena Dockerfile sudah build assets secara otomatis
- ⚠️ Jika ingin build di host: hapus `public/build` dari `.dockerignore` terlebih dahulu
- ⚠️ Build di Dockerfile lebih disarankan untuk konsistensi environment
- Volume mount `./:/var/www/html` akan menimpa build assets dari Dockerfile, jadi build di Dockerfile sudah cukup

### Langkah 3: Build dan Start Docker Containers

```bash
# Build Docker images (pertama kali atau setelah ada perubahan Dockerfile)
docker compose build

# Start semua services
docker compose up -d

# Check status containers (tunggu beberapa detik untuk health checks)
docker compose ps
```

**Output yang diharapkan:**

```
NAME                    STATUS              PORTS
towertrack_app       Up (healthy)        9000/tcp
towertrack_db        Up (healthy)        0.0.0.0:3306->3306/tcp
towertrack_nginx     Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
towertrack_queue     Up
```

**Catatan Penting:**

- Status `(healthy)` menunjukkan health check berhasil
- Jika status `(unhealthy)` atau `(starting)`, tunggu beberapa detik (30-40 detik untuk pertama kali)
- Health checks memastikan service benar-benar siap sebelum digunakan
- Jika status tetap `(unhealthy)`, lihat bagian [Troubleshooting - Service unhealthy](#service-unhealthy)

### Langkah 4: Setup Laravel Application

```bash
# Masuk ke container PHP
docker compose exec app sh

# Di dalam container, jalankan perintah berikut:

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Run seeders (jika perlu data awal)
php artisan db:seed --force

# Create storage link
php artisan storage:link

# Optimize untuk production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Exit container
exit
```

### Langkah 5: Set Permissions

```bash
# Set permissions untuk storage dan cache
docker compose exec app chown -R www-data:www-data /var/www/html/storage
docker compose exec app chown -R www-data:www-data /var/www/html/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/html/storage
docker compose exec app chmod -R 775 /var/www/html/bootstrap/cache
```

### Langkah 6: Verifikasi Deployment

```bash
# Check status containers dengan health information
docker compose ps

# Verifikasi health checks
docker inspect --format='{{.State.Health.Status}}' towertrack_app
docker inspect --format='{{.State.Health.Status}}' towertrack_nginx
docker inspect --format='{{.State.Health.Status}}' towertrack_db

# Output yang diharapkan: "healthy"

# Check logs untuk memastikan tidak ada error
docker compose logs

# Test akses aplikasi
curl http://localhost
# atau buka browser: http://YOUR_SERVER_IP
```

---

## ⚙️ Konfigurasi Environment

File `.env` harus dikonfigurasi dengan benar sebelum menjalankan aplikasi. Berikut adalah penjelasan setiap variabel:

### Konfigurasi Aplikasi

```env
APP_NAME="TowerTrack"
APP_ENV=production
APP_KEY=                    # Akan di-generate dengan: php artisan key:generate
APP_DEBUG=false             # HARUS false di production!
APP_URL=http://YOUR_SERVER_IP_OR_DOMAIN
```

### Konfigurasi Database

```env
DB_CONNECTION=mysql
DB_HOST=db                  # Nama service di docker-compose.yml (JANGAN DIUBAH!)
DB_PORT=3306
DB_DATABASE=towertrack_db
DB_USERNAME=towertrack_user
DB_PASSWORD=your_secure_password_here
DB_ROOT_PASSWORD=your_root_password_here  # Password untuk root MySQL
```

**⚠️ PENTING:**

- `DB_HOST` harus tetap `db` (nama service MySQL di docker-compose)
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` harus sama dengan environment variables di service `db` di docker-compose.yml
- Gunakan password yang kuat dan aman!

### Konfigurasi Email

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com              # SMTP server Gmail
MAIL_PORT=465                          # Port SMTP Gmail (SSL)
MAIL_USERNAME=infrastruktursemarangkab@gmail.com
MAIL_PASSWORD=                        # App Password Gmail (isi dengan App Password Anda)
MAIL_ENCRYPTION=ssl                    # SSL untuk port 465
MAIL_FROM_ADDRESS=infrastruktursemarangkab@gmail.com
MAIL_FROM_NAME="TowerTrack"
```

**⚠️ CATATAN:**

- Konfigurasi email sudah menggunakan Gmail dengan App Password
- Jika perlu mengubah konfigurasi email, sesuaikan `MAIL_USERNAME`, `MAIL_PASSWORD`, dan `MAIL_FROM_ADDRESS`
- Pastikan App Password Gmail sudah aktif dan valid

### Konfigurasi Cloudflare Turnstile

```env
TURNSTILE_SITE_KEY=your_production_site_key
TURNSTILE_SECRET_KEY=your_production_secret_key
```

**Cara mendapatkan keys:** Dapatkan keys dari Cloudflare Dashboard.

### Konfigurasi Lainnya

```env
SESSION_DRIVER=database
CACHE_STORE=database  # atau 'file' sesuai kebutuhan
QUEUE_CONNECTION=database
FORCE_HTTPS=false  # Set true jika menggunakan SSL/HTTPS
```

---

## 🔄 Update Aplikasi

Ketika ada update dari repository, ikuti langkah-langkah berikut:

```bash
# 1. Pull latest code
git pull origin production  # atau main jika sudah merge

# 2. Rebuild images (jika ada perubahan Dockerfile)
docker compose build

# 3. Restart services
docker compose restart

# 4. Run migrations (jika ada migration baru)
docker compose exec app php artisan migrate --force

# 5. Clear dan rebuild cache
docker compose exec app php artisan config:clear
docker compose exec app php artisan cache:clear
docker compose exec app php artisan view:clear

docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache

# 6. Rebuild frontend assets (jika ada perubahan frontend)
docker compose exec app npm run build

# 7. Verifikasi health checks setelah update
docker compose ps
```

---

## 🛠️ Maintenance

### Monitoring & Health Checks

Setup ini sudah dilengkapi dengan **health checks** untuk semua services. Health checks memastikan service berjalan dengan benar dan membantu monitoring.

#### Check Health Status

```bash
# Check status dengan health information
docker compose ps

# Check health status detail untuk specific service
docker inspect towertrack_app | grep -A 10 Health

# Monitor health status real-time
watch -n 2 'docker compose ps'
```

#### Resource Usage

```bash
# Check resource usage (CPU, Memory) untuk semua services
docker stats

# Check resource usage untuk specific services
docker stats towertrack_app towertrack_nginx towertrack_db towertrack_queue

# Stop monitoring (tekan Ctrl+C)
```

#### Resource Limits yang Dikonfigurasi

- **App (PHP)**: Max 1 CPU, 512MB RAM (Reservation: 0.5 CPU, 256MB RAM)
- **Nginx**: Max 0.5 CPU, 128MB RAM (Reservation: 0.25 CPU, 64MB RAM)
- **Database**: Max 1 CPU, 1GB RAM (Reservation: 0.5 CPU, 512MB RAM)
- **Queue**: Max 0.5 CPU, 256MB RAM (Reservation: 0.25 CPU, 128MB RAM)

#### Logging Configuration

- Semua services menggunakan `json-file` driver
- Log rotation: Max 10MB per file, 3 files (total max 30MB per service)
- Logs otomatis di-rotate untuk mencegah disk penuh
- Check logs: `docker compose logs <service_name>`

### View Logs

```bash
# Log semua services
docker compose logs -f

# Log specific service
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f db
docker compose logs -f queue

# Log dengan batas baris
docker compose logs --tail=100 app

# Log sejak waktu tertentu
docker compose logs --since 30m app
```

### Backup Database

```bash
# Backup database
docker compose exec db mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE} > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T db mysql -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE} < backup_file.sql
```

### Stop/Start Services

```bash
# Stop semua services
docker compose stop

# Start semua services
docker compose start

# Restart semua services
docker compose restart

# Restart specific service
docker compose restart app

# Stop dan hapus containers (data tetap aman)
docker compose down

# Stop dan hapus containers + volumes (HAPUS DATA! HATI-HATI!)
docker compose down -v
```

---

## 🐛 Troubleshooting

### Container tidak bisa start

Jika container tidak bisa start, lakukan langkah-langkah berikut:

```bash
# Check logs
docker compose logs

# Check status dengan health information
docker compose ps

# Check health status detail
docker inspect towertrack_app | grep -A 10 Health

# Rebuild dari awal
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Service unhealthy

Jika service menunjukkan status `(unhealthy)`, ikuti langkah-langkah berikut:

```bash
# Check health check logs detail
docker inspect towertrack_app | grep -A 20 Health

# Check service logs
docker compose logs app

# Check resource usage (mungkin resource limit tercapai)
docker stats towertrack_app

# Restart specific service
docker compose restart app

# Jika masih unhealthy, rebuild service
docker compose up -d --force-recreate app

# Check apakah health check script berfungsi
docker compose exec app php-fpm-healthcheck
```

**Kemungkinan penyebab:**

- Service masih starting (tunggu 30-40 detik)
- Resource limit tercapai (check dengan `docker stats`)
- Health check script error (check logs)
- Dependency service belum ready (pastikan database healthy dulu)

### Database connection error

Jika terjadi error koneksi database, lakukan langkah-langkah berikut:

1. **Pastikan service `db` sudah running dan healthy:**
   ```bash
   docker compose ps db
   # Pastikan status menunjukkan (healthy)
   ```

2. **Test koneksi:**
   ```bash
   docker compose exec app php artisan tinker
   # Di tinker: DB::connection()->getPdo();
   ```

3. **Pastikan environment variables di `.env` benar, terutama:**
   - `DB_HOST=db` (tidak boleh diubah!)
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` sesuai

4. **Pastikan database sudah fully initialized** (tunggu health check menjadi healthy)

### Permission denied errors

Jika terjadi error permission, jalankan perintah berikut:

```bash
# Fix permissions
docker compose exec app chown -R www-data:www-data /var/www/html/storage
docker compose exec app chmod -R 775 /var/www/html/storage
```

### Port already in use

Jika port 80 atau 3306 sudah digunakan aplikasi lain:

1. Edit `docker-compose.yml`
2. Ubah port mapping, contoh:
   ```yaml
   nginx:
     ports:
       - "8080:80"  # Ubah dari 80 ke 8080
   ```

### Assets tidak muncul

Jika assets tidak muncul, lakukan langkah-langkah berikut:

```bash
# Rebuild assets
docker compose exec app npm run build

# Clear cache
docker compose exec app php artisan view:clear

# Pastikan storage link sudah dibuat
docker compose exec app php artisan storage:link
```

### Aplikasi error 500

Jika aplikasi menampilkan error 500, lakukan langkah-langkah berikut:

1. **Check logs:**
   ```bash
   docker compose logs app
   ```

2. **Pastikan `.env` sudah dikonfigurasi dengan benar**

3. **Pastikan `APP_KEY` sudah di-generate**

4. **Pastikan permissions sudah benar**

5. **Pastikan semua services healthy:**
   ```bash
   docker compose ps
   ```

6. **Clear cache:**
   ```bash
   docker compose exec app php artisan config:clear
   docker compose exec app php artisan cache:clear
   ```

### Resource exhaustion

Jika aplikasi lambat atau error karena resource:

```bash
# Check resource usage
docker stats

# Jika resource limit tercapai, pertimbangkan:
# 1. Upgrade server resources
# 2. Adjust resource limits di docker-compose.yml
# 3. Optimize aplikasi
```

---

## 📝 Checklist Deployment

Gunakan checklist ini untuk memastikan deployment berhasil:

- [ ] Docker & Docker Compose sudah terinstall
- [ ] Project sudah di-upload/clone ke server
- [ ] File `.env` sudah dibuat dari `.env.example`
- [ ] File `.env` sudah dikonfigurasi dengan benar
- [ ] Docker images sudah di-build (`docker compose build`)
- [ ] Containers sudah running (`docker compose up -d`)
- [ ] Semua services menunjukkan status `(healthy)` (`docker compose ps`)
- [ ] Application key sudah di-generate (`php artisan key:generate`)
- [ ] Migrations sudah di-run (`php artisan migrate --force`)
- [ ] Storage link sudah dibuat (`php artisan storage:link`)
- [ ] Permissions sudah di-set dengan benar
- [ ] Cache sudah di-optimize
- [ ] Aplikasi bisa diakses via browser
- [ ] Health checks berfungsi dengan baik
- [ ] Resource usage dalam batas normal (`docker stats`)
- [ ] Database backup sudah dibuat (opsional tapi disarankan)

---

## 📞 Bantuan

Jika mengalami masalah, ikuti langkah-langkah berikut:

1. **Check logs**: `docker compose logs`
2. **Check status**: `docker compose ps` (perhatikan health status)
3. **Check health**: `docker inspect <container_name> | grep -A 10 Health`
4. **Check resources**: `docker stats` (pastikan tidak ada resource exhaustion)
5. **Dokumentasi Laravel**: https://laravel.com/docs
6. **Dokumentasi Docker**: https://docs.docker.com

### Fitur Best Practices yang Sudah Diterapkan

✅ **Health Checks** - Monitoring otomatis untuk semua services

✅ **Resource Limits** - Mencegah resource exhaustion

✅ **Logging Configuration** - Log rotation otomatis

✅ **Service Dependencies** - Startup order yang proper dengan healthcheck

✅ **Multi-container Architecture** - Separation of concerns

---

**Selamat! Aplikasi sudah siap digunakan! 🎉**









