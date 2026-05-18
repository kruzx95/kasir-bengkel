# 🏍️ Irian Motor — Sistem Manajemen Bengkel

Aplikasi web modern untuk mengelola multi-cabang bengkel motor. Dilengkapi dengan fitur kasir (transaksi harian), manajemen master data (servis & sparepart), dan monitoring dashboard untuk owner/admin.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: MySQL 8.0
- **ORM**: Prisma 7 (menggunakan `@prisma/adapter-mariadb`)
- **Authentication**: Custom JWT Session (dengan library `jose`)

---

## 🛠️ Panduan Instalasi & Menjalankan Proyek (Dari Awal)

### 1. Persyaratan Sistem

Pastikan Anda sudah menginstal:

- [Node.js](https://nodejs.org/) (versi 18.x atau yang lebih baru)
- [MySQL](https://www.mysql.com/) (versi 8.0 atau yang lebih baru, berjalan di lokal komputer Anda)
- Git (opsional, untuk clone repository)

### 2. Setup Database MySQL

Sebelum menyiapkan database, pastikan service MySQL sudah berjalan di komputer Anda.

**Untuk pengguna Linux (Ubuntu/Debian):**
```bash
# Menjalankan service MySQL
sudo systemctl start mysql

# (Opsional) Mengatur agar MySQL otomatis berjalan saat komputer menyala
sudo systemctl enable mysql
```

Setelah service MySQL berjalan, masuk ke prompt MySQL sebagai root:
```bash
sudo mysql -u root -p
```
Lalu jalankan perintah SQL berikut di dalam prompt MySQL:

```sql
-- Buat user baru (opsional, tapi disarankan)
CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'irianmotor123';

-- Buat database
CREATE DATABASE irian_motor;

-- Berikan akses penuh ke user tersebut
GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'localhost';

-- Wajib: Berikan akses global agar Prisma Shadow Database bisa bekerja (untuk migrasi)
GRANT ALL PRIVILEGES ON *.* TO 'irianmotor'@'localhost';

FLUSH PRIVILEGES;
```

> **Catatan:** Jika Anda menggunakan Linux (Ubuntu/Debian), Prisma MySQL adapter memerlukan koneksi murni. Pastikan Anda menonaktifkan plugin caching pada MariaDB/MySQL jika terjadi error "unsupported capability" (seperti memodifikasi `/etc/mysql/my.cnf` untuk mengabaikan `mariadb.conf.d`).

### 3. Instalasi Dependensi & Clone Proyek

Buka terminal di lokasi tempat Anda ingin menyimpan proyek, lalu jalankan:

```bash
# Clone proyek (jika dari Github)
git clone https://github.com/username/irian-motor.git
cd irian-motor

# Install dependensi
npm install
```

### 4. Konfigurasi Environment Variables

Di dalam root folder proyek, buat file baru bernama `.env`.
Isi file `.env` dengan konfigurasi berikut, sesuaikan dengan kredensial MySQL yang dibuat di langkah 2:

```env
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://irianmotor:irianmotor123@127.0.0.1:3306/irian_motor"

# Secret key untuk mengenkripsi sesi login (bisa diganti dengan string acak apa saja)
SESSION_SECRET="ganti-dengan-secret-key-anda-yang-aman-minimal-32-karakter"
```

### 5. Generate Client, Migrasi, & Seeding Database

Jalankan perintah-perintah berikut secara berurutan untuk menyiapkan struktur database dan data awal:

```bash
# 1. Meng-generate Prisma Client (menggunakan adapter Prisma 7)
npx prisma generate

# 2. Menjalankan migrasi untuk membuat tabel-tabel di database
npx prisma migrate dev --name init

# 3. Mengisi data awal (Cabang, User Admin/Kasir, Servis, dan Sparepart)
npx prisma db seed
```

### 5. Menjalankan Server Development

Setelah database siap, Anda bisa menjalankan aplikasi:

```bash
npm run dev
```

Buka browser Anda dan akses **[http://localhost:3000](http://localhost:3000)**.

---

## 🔐 Kredensial Login (Testing)

Berikut adalah daftar akun yang terdaftar di sistem untuk pengujian aplikasi:

**Admin (Owner — Bisa melihat semua cabang & laporan):**

- Email: `[EMAIL_ADDRESS]`
- Password: `admin123`

**Kasir (Hanya bisa mengakses cabang masing-masing):**

- **Irian Motor Indihiang**: `irian@indihiang.com` / `kasir123`
- **Hidayah Auto Service**: `has@burujul.com` / `kasir123`
- **Irian Motor Ciamis**: `irian@ciamis.com` / `kasir123`

---

## 📁 Struktur Utama Kode

- `/src/app` — Routing dan halaman aplikasi (Route `/admin`, `/kasir`, `/login`).
- `/src/components` — Komponen UI terpisah (Layout, UI Reusable seperti Modal, Table, Button).
- `/src/actions` — Server Actions (Logika backend untuk operasi CRUD ke database).
- `/src/lib` — Konfigurasi Prisma client, sistem session, dan fungsi utilitas.
- `/prisma` — Skema database `schema.prisma` dan file seeding `seed.ts`.
