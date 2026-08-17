# Panduan Lengkap Deploy Staging & Production (SumoPod VPS)
**Sistem Informasi Operational & Kasir — Irian Motor**

Panduan ini berisi instruksi lengkap langkah demi langkah untuk melakukan *deployment* aplikasi **Irian Motor** ke **VPS SumoPod** (Ubuntu 22.04 / 24.04 LTS) dengan arsitektur **Staging** dan **Production** terpisah dalam satu VPS, lengkap dengan DNS Cloudflare, Nginx Reverse Proxy, dan SSL HTTPS.

---

## 🏗️ 1. Arsitektur Deployment

| Komponen | 🧪 **Staging (Testing)** | 🚀 **Production (Live)** |
| :--- | :--- | :--- |
| **Git Branch** | `staging` | `master` |
| **Direktori VPS** | `/var/www/irian-motor-staging` | `/var/www/irian-motor-prod` |
| **Port Internal** | `3001` | `3000` |
| **Database MariaDB** | `irian_motor_staging` | `irian_motor_prod` |
| **Domain / URL** | `https://staging.domainanda.com` | `https://domainanda.com` |
| **Nama Proses PM2** | `irian-motor-staging` | `irian-motor-prod` |
| **File Environment** | `/var/www/irian-motor-staging/.env` | `/var/www/irian-motor-prod/.env` |

---

## 📋 2. Checklist Data yang Dibutuhkan

Sebelum memulai, pastikan Anda memegang data berikut dari dashboard SumoPod & domain registrar:
1. **IP Public VPS** (contoh: `103.xxx.xxx.xxx`)
2. **Password SSH / Root VPS**
3. **Nama Domain** yang sudah dibeli (contoh: `irianmotor.com`)

---

## 💻 3. Langkah 1: Push Source Code Lokal ke GitHub

Buka terminal di komputer lokal Anda pada folder proyek `irian-motor`:

```bash
# 1. Pastikan commit terbaru sudah tersimpan
git status

# 2. Push branch master (Production)
git push origin master

# 3. Push branch staging (Staging)
git push origin staging
```

---

## ☁️ 4. Langkah 2: Konfigurasi DNS & SSL di Cloudflare

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/) dan tambahkan domain Anda.
2. Di registrar tempat beli domain, ubah **Nameserver** ke 2 Nameserver yang diberikan Cloudflare.
3. Di Cloudflare, buka menu **DNS** $\rightarrow$ **Records**, tambahkan 3 record tipe **A** berikut:

| Type | Name | IPv4 Address (Content) | Proxy Status | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `IP_VPS_SUMOPOD` | **Proxied (Oranye)** | Domain Utama (`domainanda.com`) |
| **A** | `www` | `IP_VPS_SUMOPOD` | **Proxied (Oranye)** | Subdomain www |
| **A** | `staging` | `IP_VPS_SUMOPOD` | **Proxied (Oranye)** | Subdomain Staging (`staging.domainanda.com`) |

4. Buka menu **SSL/TLS** di Cloudflare:
   - Pada tab **Overview**: Pilih mode enkripsi **Full** atau **Full (Strict)**.
   - Pada tab **Edge Certificates**: Aktifkan **Always Use HTTPS** $\rightarrow$ `ON`.

---

## 🖥️ 5. Langkah 3: Setup Server VPS Otomatis (Sekali Saja)

1. Masuk ke VPS Anda via terminal SSH:
   ```bash
   ssh root@IP_VPS_SUMOPOD
   ```

2. Download repository untuk mengambil script setup:
   ```bash
   git clone https://github.com/kruzx95/kasir-bengkel.git /tmp/setup-irian
   cd /tmp/setup-irian/deploy
   ```

3. Tentukan password untuk database MariaDB Anda:
   ```bash
   nano setup-vps.sh
   ```
   > Ganti baris:
   > `DB_PASS="GANTI_PASSWORD_DATABASE_ANDA"` dengan password database yang aman dan kuat.
   > Tekan `Ctrl + O` $\rightarrow$ `Enter` $\rightarrow$ `Ctrl + X` untuk menyimpan.

4. Jalankan script setup otomatis:
   ```bash
   chmod +x setup-vps.sh && ./setup-vps.sh
   ```

> **Skrip ini otomatis menginstall:**
> - Node.js 22 LTS & NPM
> - MariaDB Server + membuat database `irian_motor_staging` & `irian_motor_prod`
> - Nginx Web Server
> - PM2 Process Manager
> - Certbot SSL
> - UFW Firewall (Membuka port 22, 80, 443)

---

## 🧪 6. Langkah 4: Setup Environment Staging (Port 3001)

Masih di dalam terminal SSH VPS:

```bash
# 1. Masuk ke folder staging & clone branch staging
cd /var/www/irian-motor-staging
git clone -b staging https://github.com/kruzx95/kasir-bengkel.git .

# 2. Buat file .env dari template
cp .env.staging.example .env
nano .env
```

Pastikan isi `.env` Staging seperti ini (sesuaikan password database Anda):
```env
DATABASE_URL="mysql://irianmotor:PASSWORD_DATABASE_ANDA@localhost:3306/irian_motor_staging"
SESSION_SECRET="generate_string_acak_staging_min_32_karakter"
NODE_ENV="production"
PORT=3001
```

Install dependensi, jalankan migrasi, dan build aplikasi staging:
```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

---

## 🚀 7. Langkah 5: Setup Environment Production (Port 3000)

Masih di dalam terminal SSH VPS:

```bash
# 1. Masuk ke folder production & clone branch master
cd /var/www/irian-motor-prod
git clone -b master https://github.com/kruzx95/kasir-bengkel.git .

# 2. Buat file .env dari template
cp .env.production.example .env
nano .env
```

Pastikan isi `.env` Production seperti ini (sesuaikan password database Anda):
```env
DATABASE_URL="mysql://irianmotor:PASSWORD_DATABASE_ANDA@localhost:3306/irian_motor_prod"
SESSION_SECRET="generate_string_acak_production_min_32_karakter"
NODE_ENV="production"
PORT=3000
```

Install dependensi, jalankan migrasi, dan build aplikasi production:
```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

*(Opsional: Jika ingin restore data awal dari backup ke production)*:
```bash
mysql -u irianmotor -p irian_motor_prod < backup_data.sql
```

---

## ⚙️ 8. Langkah 6: Jalankan PM2, Nginx & Pasang SSL

### A. Jalankan PM2 (Menjalankan Staging & Prod Bersamaan)
```bash
cp /var/www/irian-motor-prod/ecosystem.config.js /var/www/ecosystem.config.js
pm2 start /var/www/ecosystem.config.js
pm2 save
```
> Cek status proses:
> `pm2 status`
> Pastikan `irian-motor-prod` (port 3000) dan `irian-motor-staging` (port 3001) keduanya berstatus `online`.

### B. Pasang Konfigurasi Cloudflare & Nginx
```bash
# 1. Pasang konfigurasi Real-IP Cloudflare
cp /var/www/irian-motor-prod/deploy/nginx/cloudflare.conf /etc/nginx/conf.d/cloudflare.conf

# 2. Pasang konfigurasi virtual host Nginx
cp /var/www/irian-motor-prod/deploy/nginx/irian-motor.conf /etc/nginx/sites-available/irian-motor.conf

# 3. Edit nama domain Anda
nano /etc/nginx/sites-available/irian-motor.conf
# Ganti seluruh tulisan "DOMAIN_ANDA" menjadi nama domain asli Anda (misal: irianmotor.com)

# 4. Aktifkan konfigurasi Nginx
ln -s /etc/nginx/sites-available/irian-motor.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### C. Pasang Sertifikat SSL HTTPS (Let's Encrypt)
```bash
certbot --nginx -d domainanda.com -d www.domainanda.com -d staging.domainanda.com
```

---

## 🔄 9. SOP Alur Kerja Rilis & Update Sehari-hari

```mermaid
graph TD
    A[Kembangkan Fitur di Komputer Lokal] --> B[Push ke Branch staging]
    B --> C[Jalankan deploy-staging.sh di VPS]
    C --> D[Uji Fitur di https://staging.domainanda.com]
    D -->|Fitur Lolos Testing| E[Merge staging ke master & Push]
    E --> F[Jalankan deploy-prod.sh di VPS]
    F --> G[Aplikasi Live di https://domainanda.com Terupdate!]
```

### 1. Update Staging:
Saat Anda selesai membuat fitur di branch `staging` dan sudah di-push ke GitHub, buka terminal VPS:
```bash
/var/www/irian-motor-staging/deploy/deploy-staging.sh
```

### 2. Update Production:
Setelah fitur teruji dengan aman di staging dan di-merge ke branch `master`, buka terminal VPS:
```bash
/var/www/irian-motor-prod/deploy/deploy-prod.sh
```

---

## 🛠️ 10. Cheat Sheet Perintah Berguna di VPS

| Kebutuhan | Perintah di Terminal VPS |
| :--- | :--- |
| **Cek status aplikasi** | `pm2 status` |
| **Lihat live logs production** | `pm2 logs irian-motor-prod` |
| **Lihat live logs staging** | `pm2 logs irian-motor-staging` |
| **Restart production** | `pm2 restart irian-motor-prod` |
| **Restart staging** | `pm2 restart irian-motor-staging` |
| **Cek status Nginx** | `systemctl status nginx` |
| **Cek error log Nginx** | `tail -f /var/log/nginx/error.log` |
| **Cek database MariaDB** | `mysql -u irianmotor -p` |
| **Monitor pemakaian RAM/CPU** | `htop` atau `pm2 monit` |
