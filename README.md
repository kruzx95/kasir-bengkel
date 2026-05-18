# 🏍️ Irian Motor — Sistem Manajemen Bengkel

Aplikasi web modern untuk mengelola multi-cabang bengkel motor. Dilengkapi dengan fitur kasir (transaksi harian), manajemen master data (servis & sparepart), dan monitoring dashboard untuk owner/admin.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: MySQL 8.0
- **ORM**: Prisma 7 (menggunakan `@prisma/adapter-mariadb`)
- **Authentication**: Custom JWT Session (dengan library `jose`)

---

## 🛠️ Panduan Instalasi & Menjalankan Proyek (Lokal)

### 1. Persyaratan Sistem

Pastikan Anda sudah menginstal:

- [Node.js](https://nodejs.org/) (versi 18.x atau yang lebih baru)
- [MySQL](https://www.mysql.com/) (versi 8.0 atau yang lebih baru, berjalan di lokal komputer Anda)

### 2. Instalasi Dependensi

Buka terminal/command prompt di dalam folder proyek ini, lalu jalankan:

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Di dalam root folder proyek, buat file baru bernama `.env` (Anda bisa meng-copy dari `.env.local` jika ada).
Isi file `.env` dengan konfigurasi berikut:

```env
# Sesuaikan dengan username, password, dan nama database MySQL Anda
DATABASE_URL="mysql://root:@localhost:3306/irian_motor"

# Secret key untuk mengenkripsi sesi login (bisa diganti dengan string acak apa saja)
SESSION_SECRET="ganti-dengan-secret-key-anda-yang-aman-minimal-32-karakter"
```

### 4. Setup Database & Generate Client

Jalankan perintah-perintah berikut secara berurutan untuk menyiapkan database:

```bash
# 1. Menjalankan migrasi untuk membuat tabel-tabel di database
npx prisma migrate dev --name init

# 2. Meng-generate Prisma Client (menggunakan adapter Prisma 7)
npx prisma generate

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
