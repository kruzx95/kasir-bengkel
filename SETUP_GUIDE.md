# Setup Guide — Irian Motor

Panduan lengkap untuk menjalankan project Irian Motor di komputer/machine baru (Linux & Windows).

---

## 📋 Checklist Persiapan

### 1. System Requirements

- **Node.js** v22.x (atau minimal v18.x)
- **npm** v8+
- **MariaDB/MySQL** v10.5+ (database server)
- **Git** (untuk version control)

---

## 🐧 Linux (Ubuntu/Debian)

### Install Dependencies

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install paket dasar
sudo apt install -y curl git mariadb-server mariadb-client nginx

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
```

### Verifikasi

```bash
node -v       # Harus v18+
npm -v        # Harus v8+
mysql --version  # Atau mariadb --version
git --version
```

---

## 🪟 Windows

### Install Dependencies

#### 1. Install Node.js
- Download dari https://nodejs.org/ (pilih versi LTS atau Current v22.x)
- Jalankan installer, gunakan setting default
- Centang "Automatically install necessary tools" jika ditawarkan
- **Recommended:** install **WSL2** untuk pengalaman Linux yang lebih baik

#### 2. Install Database

Pilih salah satu opsi:

**Opsi A: MariaDB lokal (tanpa WSL)**
- Download dari https://mariadb.org/download/
- Jalankan installer, set password root
- Port default: 3306

**Opsi B: MySQL lokal**
- Download dari https://dev.mysql.com/downloads/installer/
- Jalankan MySQL Installer
- Set password root

**Opsi C: Docker (Recommended untuk Windows)**
```powershell
# Jika Docker Desktop sudah terinstall
docker run --name irian-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=irian_motor -p 3306:3306 -d mysql:8.0
```

**Opsi D: Database remote/cloud** (paling mudah)
- Gunakan layanan seperti DBaaS, Railway, PlanetScale, dll

#### 3. Install Git
- Download dari https://git-scm.com/download/win
- Jalankan installer, gunakan setting default
- Pilih "Git Bash" sebagai default terminal

#### 4. Install VS Code (Recommended)
- Download dari https://code.visualstudio.com/
- Install extension: ESLint, Prettier, Prisma IO

### Verifikasi

```powershell
# Di PowerShell atau Command Prompt
node -v        # Harus v18+
npm -v         # Harus v8+
git --version
mysql --version # Jika install database lokal
```

---

## 🗄️ Database Setup

### Opsi A: Database Lokal (Development)

1. Buat database baru:

```bash
mysql -u root -p
```

2. Jalankan SQL berikut:

```sql
CREATE DATABASE irian_motor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'password_kuat_anda';
GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Windows PowerShell:** Jika ada masalah authentication, coba gunakan:
> ```sql
> CREATE USER 'irianmotor'@'127.0.0.1' IDENTIFIED BY 'password_kuat_anda';
> GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'127.0.0.1';
> FLUSH PRIVILEGES;
> ```

### Opsi B: Database Remote/Cloud

- Gunakan layanan database managed (AWS RDS, DigitalOcean Managed Database, Railway, dll)
- Catat `host`, `port`, `user`, `password`, dan `database name`
- Pastikan IP server Anda di-whitelist di firewall database

### Opsi C: Docker (Development — Recommended)

```bash
# Start MySQL container
docker run --name irian-motor-db \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=irian_motor \
  -p 3306:3306 \
  -d mysql:8.0

# Dapatkan connection string
# DATABASE_URL="mysql://root:rootpassword@localhost:3306/irian_motor"
```

---

## 📁 Clone & Install Project

```bash
# Clone repository
git clone https://github.com/kruzx95/irian-motor.git
cd irian-motor

# Install dependencies
npm install
```

> **Catatan:** `npm install` akan otomatis menjalankan `prisma generate` dan `prisma migrate deploy` via `postinstall` script.

> **Windows:** Jika ada masalah dengan symlink saat install, jalankan PowerShell sebagai Administrator atau gunakan WSL2.

---

## 🔧 Environment Variables

Buat file `.env` di root project:

```env
# Database
DATABASE_URL="mysql://irianmotor:PASSWORD_ANDA@localhost:3306/irian_motor"

# Session Secret (generate dengan openssl rand -base64 32)
SESSION_SECRET="random-secret-key-yang-kuat-di-sini"

# Optional
NODE_ENV="development"
PORT=3000
```

### Cara Generate SESSION_SECRET

```bash
# Linux / WSL / Git Bash
openssl rand -base64 32

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 8)

# Node.js (semua platform)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **PENTING:** `SESSION_SECRET` harus random dan kuat, terutama untuk production.

### Contoh DATABASE_URL per Platform

| Platform | Connection String |
|----------|------------------|
| Linux lokal | `mysql://irianmotor:pass@localhost:3306/irian_motor` |
| Windows lokal | `mysql://irianmotor:pass@localhost:3306/irian_motor` |
| Windows (127.0.0.1) | `mysql://irianmotor:pass@127.0.0.1:3306/irian_motor` |
| Docker | `mysql://root:rootpassword@localhost:3306/irian_motor` |
| Remote DB | `mysql://user:pass@db-host.example.com:3306/irian_motor` |

---

## 🏗️ Database Migration

Jika database dibuat ulang atau ada migration baru:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy
```

---

## 🌱 Seed Data (Opsional)

Untuk mengisi database dengan data awal:

```bash
npx tsx prisma/seed.ts
```

---

## 🚀 Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

### Production Mode

```bash
# Build
npm run build

# Start
npm start
```

### Production di Linux (dengan PM2)

```bash
# Install PM2 global
npm install -g pm2

# Start dengan PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Auto restart on system reboot
pm2 startup
```

### Production di Windows

Windows tidak mendukung PM2 dengan baik. Opsi untuk Windows:

**Opsi A: Gunakan WSL2 (Recommended)**
- Jalankan aplikasi di dalam WSL2 seperti Linux
- PM2 akan berfungsi normal

**Opsi B: Gunakan npx pm2**

```bash
npx pm2 start npm -- name "irian-motor" -- start
npx pm2 save
```

**Opsi C: Gunakan Forever**

```bash
npm install -g forever
forever start node_modules/.bin/next start -p 3000
forever list
```

**Opsi D: Gunakan Task Scheduler Windows**
- Buat Task Scheduler task untuk menjalankan `npm start` saat boot
- Set kondisi: "Run whether user is logged on or not"

---

## 🔐 Default Login

Setelah seed data, gunakan kredensial default yang dibuat oleh seed untuk login pertama kali.

---

## 📦 Checklist Lengkap Dependencies

### Sistem Requirements

| Komponen | Versi Minimum | Linux | Windows |
|----------|--------------|-------|---------|
| Node.js | v18.x | ✅ | ✅ |
| npm | v8.x | ✅ | ✅ |
| MariaDB/MySQL | v10.5+ | ✅ | ✅ |
| Git | v2.x | ✅ | ✅ |
| Docker | Opsional | ✅ | ✅ (Desktop) |

### NPM Dependencies Utama

| Package | Purpose |
|---------|---------|
| Next.js v16.2.4 | Framework React |
| Prisma v7.8.0 | ORM Database |
| @prisma/adapter-mariadb v7.8.0 | MariaDB adapter |
| mariadb v3.4.0 | Database driver |
| NextAuth v5.0.0-beta.31 | Authentication |
| React v19.2.4 | UI Library |
| TailwindCSS v4 | Styling |
| TypeScript v5 | Type checking |

---

## 🐛 Troubleshooting

### Windows Specific

#### Masalah: Error symlink saat `npm install`
```powershell
# Jalankan PowerShell sebagai Administrator
# Atau gunakan WSL2
npm install --no-optional
```

#### Masalah: Database connection refused
- Pastikan MySQL/MariaDB service berjalan: `Get-Service -Name mariadb` atau `Get-Service -Name mysql`
- Coba ganti `localhost` dengan `127.0.0.1` di DATABASE_URL
- Periksa apakah port 3306 terbuka: `Test-NetConnection -ComputerName 127.0.0.1 -Port 3306`

#### Masalah: Git clone gagal (SSL error)
```powershell
git config --global http.sslversion tlsv1.2
git clone https://github.com/kruzx95/irian-motor.git
```

### Cross-Platform

#### Masalah: `prisma generate` gagal
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules
npm install
```

#### Masalah: Database connection error
- Pastikan database server berjalan
- Periksa `DATABASE_URL` di `.env`
- Pastikan user database punya akses dari host yang benar

#### Masalah: Port sudah digunakan
```bash
# Ubah PORT di .env
PORT=3001
```

#### Masalah: Prisma adapter MariaDB tidak cocok
- Pastikan versi `@prisma/adapter-mariadb` cocok dengan `@prisma/client`
- Keduanya harus versi yang sama (v7.8.0)

---

## 📂 Struktur Penting

```
prisma/
  schema.prisma          → Database schema definition
  seed.ts                → Data seed awal
prisma/migrations/       → Migration files
src/lib/prisma.ts        → Prisma client configuration
src/lib/session.ts       → Session/JWT handling
ecosystem.config.js      → PM2 configuration (Linux)
deploy/                  → Deployment scripts (Linux/VPS only)
  setup-vps.sh           → VPS setup script
  deploy.sh              → Deploy script
.env.example             → (Recommended) Template environment variables
```

---

## 🔄 Pipeline Development ke Production

### Development di Semua Platform

1. Clone repo → Install deps → Setup `.env` → `npm run dev`

### Production di Linux/VPS

```bash
# Di VPS
cd /var/www/irian-motor
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart irian-motor
```

Atau gunakan script deploy:

```bash
chmod +x deploy.sh && ./deploy.sh
```

### Production di Windows

Disarankan untuk memigrasi ke Linux (Ubuntu) untuk production. Windows kurang cocok untuk production deployment karena:
- PM2 tidak support Windows native
- Nginx perlu diinstall terpisah (bisa pakai MSYS2 atau chocolatey)
- Service management lebih kompleks

Jika harus Windows, gunakan **WSL2** atau **Docker Compose**.

---

## 🐳 Docker Setup (Cross-Platform — Recommended)

Untuk konsistensi di semua platform, gunakan Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: irian_motor
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://root:rootpassword@mysql:3306/irian_motor
    depends_on:
      - mysql

volumes:
  mysql_data:
```

```bash
# Jalankan
docker-compose up -d

# Apply migrations
docker-compose exec app npx prisma migrate deploy

# Seed data
docker-compose exec app npx tsx prisma/seed.ts
```

---

## 📝 Notasi Tambahan

- Project menggunakan **MariaDB/MySQL** sebagai database (via `@prisma/adapter-mariadb`)
- Session disimpan dalam **JWT encrypted cookie** (tidak menggunakan session storage)
- `postinstall` script otomatis melakukan `prisma generate` dan `prisma migrate deploy`
- Untuk production, disarankan menggunakan **Linux + PM2 + Nginx**
- Untuk development di Windows, pertimbangkan **WSL2** atau **Docker** untuk konsistensi