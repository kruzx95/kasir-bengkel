# Panduan Step-by-Step Deployment ke VPS (Ubuntu)
**Sistem Informasi Operational & Kasir — Irian Motor**

Panduan ini berisi langkah-langkah lengkap untuk melakukan *deployment* aplikasi **Irian Motor** ke VPS Linux (Ubuntu 22.04 / 24.04 LTS) dari nol hingga siap digunakan secara publik dengan domain dan SSL/HTTPS.

---

## 📋 1. Prasyarat (Prerequisites)

Sebelum memulai, pastikan Anda telah menyiapkan:
1. **VPS Baru** dengan OS Ubuntu 22.04 LTS atau 24.04 LTS.
2. **Akses SSH** ke VPS (IP Address & kredensial `root` / sudo user).
3. **Domain / Subdomain** yang A-Record-nya sudah di-pointing ke IP Public VPS (contoh: `bengkel.irianmotor.com`).
4. Repositori Git (GitHub / GitLab) yang berisi kode sumber proyek Irian Motor.

---

## 🚀 2. Langkah 1: Setup Awal VPS (Server Environment)

Masuk ke VPS Anda via terminal SSH:

```bash
ssh root@IP_VPS_ANDA
```

Gunakan skrip [deploy/setup-vps.sh](file:///home/kruza/Documents/irian-motor/deploy/setup-vps.sh) yang sudah tersedia dalam proyek untuk mengonfigurasi environment server secara otomatis:

```bash
# 1. Download skrip setup ke VPS
curl -fsSL https://raw.githubusercontent.com/USERNAME/REPO/main/deploy/setup-vps.sh -o setup-vps.sh

# 2. Edit password database default sebelum mengeksekusi
nano setup-vps.sh
# Ganti baris: DB_PASS="GANTI_PASSWORD_DATABASE_ANDA" menjadi password yang aman

# 3. Beri hak akses eksekusi dan jalankan skrip
chmod +x setup-vps.sh
./setup-vps.sh
```

### Komponen yang Di-install Otomatis:
- **Paket Dasar & Security:** `curl`, `git`, `ufw` (Firewall), `fail2ban`.
- **Node.js 22 LTS** & `npm`.
- **Database Server:** MariaDB / MySQL Server.
- **Web Server & Reverse Proxy:** Nginx.
- **Process Manager:** PM2 (diatur agar otomatis aktif saat server reboot).
- **Konfigurasi Firewall (UFW):** Membuka Port 22 (SSH), 80 (HTTP), dan 443 (HTTPS).

---

## 📦 3. Langkah 2: Clone Repository & Konfigurasi `.env`

1. Masuk ke direktori aplikasi yang telah dibuat oleh skrip setup:
   ```bash
   cd /var/www/irian-motor
   ```

2. Clone repositori Git Anda ke direktori tersebut:
   ```bash
   git clone https://github.com/USERNAME/REPO.git .
   ```

3. Buat file `.env` di VPS:
   ```bash
   nano .env
   ```

4. Isi file `.env` untuk lingkungan *Production*:
   ```env
   DATABASE_URL="mysql://irianmotor:PASSWORD_DB_ANDA@127.0.0.1:3306/irian_motor"
   SESSION_SECRET="generat-string-random-panjang-minimal-32-karakter"
   NODE_ENV="production"
   PORT=3000
   ```

   > **Tips:** Untuk membuat `SESSION_SECRET` yang aman, jalankan perintah ini di terminal:
   > ```bash
   > openssl rand -base64 32
   > ```

---

## 🛠️ 4. Langkah 3: Install Dependencies, Migrasi DB & Build Application

1. Install dependensi Node.js secara bersih:
   ```bash
   npm ci
   ```

2. Generate Prisma Client & jalankan migrasi database ke MariaDB/MySQL VPS:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

3. Build proyek Next.js untuk lingkungan produksi:
   ```bash
   npm run build
   ```

4. Jalankan aplikasi menggunakan PM2 (mengacu pada [ecosystem.config.js](file:///home/kruza/Documents/irian-motor/ecosystem.config.js)):
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

5. Pastikan status PM2 dalam kondisi `online`:
   ```bash
   pm2 status
   ```

---

## 🔒 5. Langkah 4: Konfigurasi Nginx & Domain HTTPS (SSL)

1. Salin template konfigurasi Nginx [deploy/nginx/irian-motor.conf](file:///home/kruza/Documents/irian-motor/deploy/nginx/irian-motor.conf):
   ```bash
   cp deploy/nginx/irian-motor.conf /etc/nginx/sites-available/irian-motor
   ```

2. Edit file konfigurasi Nginx:
   ```bash
   nano /etc/nginx/sites-available/irian-motor
   ```
   *Ganti seluruh tulisan `DOMAIN_ANDA` dengan nama domain asli Anda (misal `bengkel.irianmotor.com`).*

3. Aktifkan file konfigurasi dengan membuat *symlink*:
   ```bash
   ln -s /etc/nginx/sites-available/irian-motor /etc/nginx/sites-enabled/
   ```

4. Uji dan restart service Nginx:
   ```bash
   nginx -t
   systemctl restart nginx
   ```

5. Pasang Sertifikat SSL Gratis (Certbot / Let's Encrypt):
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d DOMAIN_ANDA -d www.DOMAIN_ANDA
   ```

---

## 👤 6. Langkah 5: Inisialisasi Data Master & User Admin Pertama

Masuk ke CLI MySQL/MariaDB VPS untuk membuat Cabang Utama & User Admin pertama:

```bash
mysql -u irianmotor -p irian_motor
```

Jalankan perintah SQL berikut:

```sql
-- 1. Buat data cabang utama
INSERT INTO branches (id, code, name, address, is_active, created_at, updated_at)
VALUES ('cabang-001', 'PUSAT', 'Irian Motor Pusat', 'Alamat Bengkel Pusat', 1, NOW(), NOW());

-- 2. Buat user Admin pertama (Default Password: password)
INSERT INTO users (id, branch_id, name, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'user-admin-001',
  'cabang-001',
  'Administrator',
  'admin@irianmotor.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'ADMIN',
  1,
  NOW(),
  NOW()
);
```

> ⚠️ **Penting:** Segera login ke sistem menggunakan `admin@irianmotor.com` / `password` dan langsung ganti kata sandi di menu Pengaturan Akun.

---

## 🔄 7. Alur Pembaruan Aplikasi (Redeploy) di Masa Depan

Setiap kali ada pembaruan kode di repositori Git, Anda cukup masuk ke VPS dan menjalankan skrip [deploy/deploy.sh](file:///home/kruza/Documents/irian-motor/deploy/deploy.sh):

```bash
cd /var/www/irian-motor
bash deploy/deploy.sh
```

Skrip [deploy/deploy.sh](file:///home/kruza/Documents/irian-motor/deploy/deploy.sh) akan otomatis melakukan:
1. `git pull` perubahan terbaru.
2. `npm ci` (jika ada *package* baru).
3. `npx prisma migrate deploy` (jika ada perubahan skema database).
4. `npm run build`.
5. `pm2 reload` tanpa mengganggu koneksi user yang sedang aktif (*zero-downtime reload*).
