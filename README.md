# Irian Motor — Sistem Manajemen Bengkel

Aplikasi berbasis web untuk manajemen operasional bengkel motor (multi-cabang). Mencakup fitur point-of-sale (kasir), rekap transaksi, manajemen stok sparepart, dan laporan operasional harian.

Dibangun menggunakan:
- **Next.js 16 (App Router)** — Framework frontend & backend
- **Prisma ORM** — Interaksi database
- **MySQL / MariaDB** — Database utama
- **Tailwind CSS** — Styling
- **Zod** — Validasi data

---

## 🛠️ Menjalankan di Komputer Baru

### Persyaratan Sistem

Pastikan sudah terinstal:
- [Node.js](https://nodejs.org/) versi **20 LTS** atau lebih baru
- [MySQL 8.0+](https://dev.mysql.com/downloads/) atau [MariaDB](https://mariadb.org/download/) versi stabil terbaru
- [Git](https://git-scm.com/)

---

### Langkah 1 — Setup Database

Jalankan MySQL/MariaDB, lalu masuk ke CLI:

```bash
# Linux / macOS
sudo mysql -u root -p

# Windows
mysql -u root -p
```

Buat database dan user:

```sql
CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'irianmotor123';
CREATE DATABASE irian_motor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Langkah 2 — Clone & Install Dependencies

```bash
git clone https://github.com/username/irian-motor.git
cd irian-motor
npm install
```

> Ganti URL dengan URL repositori Git Anda.

---

### Langkah 3 — Konfigurasi Environment

Salin file contoh environment:

```bash
# Linux / macOS
cp .env.example .env

# Windows
copy .env.example .env
```

Buka `.env` dan sesuaikan isinya:

```env
DATABASE_URL="mysql://irianmotor:irianmotor123@127.0.0.1:3306/irian_motor?allowPublicKeyRetrieval=true&sslAccept=strict"
SESSION_SECRET="isi-dengan-random-string-minimal-32-karakter"
```

Untuk membuat `SESSION_SECRET` yang aman, jalankan salah satu perintah berikut:

```bash
# Linux / macOS
openssl rand -base64 32

# Node.js (semua platform)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Salin hasilnya ke `.env`.

---

### Langkah 4 — Migrasi Database & Generate Prisma Client

Terapkan skema tabel ke database:

```bash
npx prisma migrate deploy
npx prisma generate
```

---

### Langkah 5 — Buat User Admin Pertama

Database yang baru dibuat belum memiliki user. Buat user Admin pertama melalui SQL langsung:

```bash
# Masuk ke MySQL/MariaDB
mysql -u irianmotor -pirianmotor123 irian_motor
```

Jalankan SQL berikut (ganti nilai sesuai kebutuhan):

```sql
-- 1. Buat cabang utama terlebih dahulu
INSERT INTO branches (id, code, name, address, is_active, created_at, updated_at)
VALUES (
  'cabang-utama-001',
  'PUSAT',
  'Irian Motor Pusat',
  'Alamat Cabang Pusat',
  1,
  NOW(),
  NOW()
);

-- 2. Buat user Admin
-- Password di bawah adalah hash bcrypt dari 'admin123' — ganti setelah login pertama!
INSERT INTO users (id, branch_id, name, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'user-admin-001',
  'cabang-utama-001',
  'Administrator',
  'admin@irianmotor.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'ADMIN',
  1,
  NOW(),
  NOW()
);
```

> **Penting:** Password default di atas adalah `password`. Segera ganti setelah login pertama melalui halaman pengaturan akun.

Untuk membuat hash password baru secara manual:

```bash
node -e "const b = require('bcryptjs'); b.hash('PASSWORD_BARU', 10).then(console.log)"
```

---

### Langkah 6 — Jalankan Aplikasi

**Mode Development:**

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

**Mode Production:**

```bash
npm run build
npm run start
```

---

## 🚀 Deploy ke VPS

Lihat panduan lengkap di folder `deploy/`:
- `deploy/deploy.sh` — Script deploy otomatis via Git
- `deploy/setup-vps.sh` — Setup awal Ubuntu server
- `deploy/nginx/irian-motor.conf` — Konfigurasi Nginx reverse proxy

Untuk menjalankan aplikasi secara background di VPS, project ini menggunakan **PM2**:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # agar otomatis berjalan setelah server restart
```

---

## 💾 Backup

Script backup database + folder uploads tersedia di `scripts/backup.sh`.

```bash
bash scripts/backup.sh
```

Lihat komentar di dalam script untuk cara menjadwalkan otomatis via `cron`.

---

## ⚙️ Teknologi & Versi

| Teknologi | Versi |
|---|---|
| Next.js | 16.2.4 |
| React | 19.2.4 |
| Prisma | 7.x |
| MariaDB / MySQL | 8.0+ |
| Node.js | 20 LTS |
| Tailwind CSS | 4.x |
