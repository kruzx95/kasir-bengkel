# 🏍️ Irian Motor — Sistem Manajemen Bengkel

Aplikasi web multi-cabang untuk manajemen bengkel motor. Mencakup kasir transaksi harian, master data, restock & indent barang, pelanggan korporat, laporan, dan monitoring dashboard.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Database**: MySQL 8.0
- **ORM**: Prisma 7 (`@prisma/adapter-mariadb`)
- **Authentication**: Custom JWT Session (`jose`)
- **Excel**: `xlsx` (import & ekspor)

---

## ✨ Fitur Utama

| Fitur                                 | Admin           | Kasir             |
| ------------------------------------- | --------------- | ----------------- |
| Dashboard ringkasan harian            | ✅ semua cabang | ✅ cabang sendiri |
| Transaksi (servis, sparepart, mixed)  | ✅              | ✅                |
| Draft transaksi (tersimpan otomatis)  | ✅              | ✅                |
| Invoice & cetak nota                  | ✅              | ✅                |
| Data pelanggan + kendaraan            | ✅              | ✅                |
| Master sparepart + import Excel       | ✅              | —                 |
| Master jasa servis + import Excel     | ✅              | —                 |
| Master mekanik                        | ✅              | —                 |
| Restock barang + foto nota            | ✅              | —                 |
| Indent order (pemesanan barang)       | ✅              | —                 |
| Pelanggan korporat + tagihan borongan | ✅              | —                 |
| Laporan transaksi + ekspor Excel      | ✅              | ✅                |
| Laporan pembelian sparepart           | ✅              | —                 |
| Kelola cabang (Tambah, Edit, Hapus)   | ✅              | —                 |
| Kelola pengguna + ganti password      | ✅              | —                 |
| Profil & ganti password sendiri       | ✅              | ✅                |

### ⚡ Pembaruan Performa & Keamanan
- **Server-Side Pagination:** Tabel data berskala besar (Transaksi, Pelanggan, Sparepart) kini dimuat secara bertahap (per 50 data) langsung dari server, sehingga performa aplikasi tetap sangat ringan tanpa membebani _browser_.
- **Isolasi Data Cabang:** Akun Kasir dikunci secara absolut (_backend-level_) agar hanya dapat membaca dan mencatat data (transaksi, stok, pelanggan) yang berada di cabang penugasannya sendiri, mencegah kebocoran data antar cabang.
- **Soft Delete:** Data krusial seperti cabang dan pengguna tidak dihapus secara permanen jika sudah memiliki riwayat transaksi, melainkan dinonaktifkan untuk menjaga integritas laporan riwayat masa lalu.

---

## 🛠️ Instalasi & Setup

### 1. Persyaratan Sistem

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- MySQL 8.0 (berjalan di lokal)
- Git

### 2. Setup Database MySQL

Pastikan service MySQL sudah berjalan, lalu masuk ke MySQL:

```bash
# Linux
sudo mysql -u root -p

# Windows (CMD)
mysql -u root -p
```

Jalankan perintah berikut di dalam prompt MySQL:

```sql
CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'irianmotor123';
CREATE DATABASE irian_motor;
GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'irianmotor'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Clone & Install

```bash
git clone https://github.com/username/irian-motor.git
cd irian-motor
npm install
```

### 4. Konfigurasi Environment

Salin file template environment yang sudah tersedia:

```bash
cp .env.example .env
```

Lalu edit file `.env` dan sesuaikan nilainya:

```env
# Koneksi database MySQL
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/irian_motor?allowPublicKeyRetrieval=true&sslAccept=strict"

# Kunci enkripsi sesi JWT — generate dengan:
# openssl rand -base64 32
SESSION_SECRET="isi-dengan-random-string-minimal-32-karakter"
```

### 5. Migrasi Database & Data Awal

> ℹ️ Langkah `prisma generate` dan `prisma migrate deploy` sudah **berjalan otomatis** saat `npm install` (via script `postinstall`). Anda hanya perlu menjalankan seed untuk data awal:

```bash
# Isi data awal (cabang, user, servis, sparepart)
npx prisma db seed
```

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Buka **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Kredensial Default

> ⚠️ **Ganti password sebelum digunakan di production!**
> Jalankan: `npx tsx scripts/reset-password.ts`

| Role              | Email                   | Password Default             |
| ----------------- | ----------------------- | ---------------------------- |
| Admin             | `admin@irianmotor.com`  | *(set saat seed)*Mallikrs08! |
| Kasir Indihiang   | `kasir1@irianmotor.com` | *(set saat seed)*kasir123    |
| Kasir Irian Timur | `kasir2@irianmotor.com` | _(set saat seed)_            |
| Kasir Irian Barat | `kasir3@irianmotor.com` | _(set saat seed)_            |

---

## 📁 Struktur Kode

```
src/
├── app/
│   ├── admin/          # Halaman admin (dashboard, laporan, master data, dll)
│   ├── kasir/          # Halaman kasir (transaksi, pelanggan, sparepart)
│   ├── profil/         # Halaman profil & ganti password (semua role)
│   ├── login/          # Halaman login
│   └── api/            # API routes (upload foto, import Excel)
├── actions/            # Server Actions — logika CRUD ke database
├── components/         # Komponen UI (Layout, Modal, Table, Button, dll)
└── lib/                # Prisma client, session, utils

prisma/
├── schema.prisma       # Definisi skema database
├── seed.ts             # Data awal (cabang, user, servis, sparepart)
└── migrations/         # Riwayat migrasi database

scripts/
├── backup.sh           # Script backup database & uploads
└── reset-password.ts   # Script reset password user via CLI

uploads/
└── receipts/           # Foto nota pembelian (tidak di-commit ke Git)
```

---

## 🗄️ Backup

Jalankan backup manual:

```bash
bash scripts/backup.sh
```

Atau jadwalkan otomatis setiap hari jam 02:00 via cron:

```bash
crontab -e
# Tambahkan:
0 2 * * * bash /path/to/project/scripts/backup.sh >> /tmp/backup-irian.log 2>&1
```

Hasil backup tersimpan di `~/backup-irian-motor/` (database + foto nota).

---

## 🔄 Setelah Update Schema Prisma

Setiap kali `schema.prisma` diubah:

```bash
npx prisma migrate dev --name nama_perubahan
npx prisma generate
```

---

## 📋 Catatan Production

- Gunakan **Ubuntu 22.04 LTS** di VPS
- Pasang **SSL/HTTPS** via Certbot (Let's Encrypt)
- Gunakan **PM2** untuk menjaga proses Node.js tetap berjalan
- Gunakan **Nginx** sebagai reverse proxy
- Folder `uploads/` harus di-backup secara berkala
- Jangan commit file `.env` ke repository
