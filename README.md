# Irian Motor — Sistem Manajemen Bengkel

Aplikasi berbasis web untuk manajemen operasional bengkel motor (multi-cabang). Mencakup fitur point-of-sale (kasir), rekap transaksi, manajemen stok sparepart, dan laporan operasional harian.

Dibangun menggunakan:

- **Next.js 16 (App Router)** — Framework frontend & backend
- **Prisma ORM** — Interaksi database
- **MySQL / MariaDB** — Database utama
- **Tailwind CSS** — Styling
- **Zod** — Validasi data

---

## 📋 Panduan Jalankan Project di Komputer Lain (Lengkap)

Panduan ini digunakan jika Anda ingin memindahkan atau menjalankan project **Aplikasi Kasir Bengkel** di komputer baru / komputer lain (Windows, macOS, atau Linux).

---

### 1. Persyaratan Sistem (Prerequisites)

Sebelum memulai, pastikan perangkat lunak berikut telah terinstal di komputer baru:

1. **Node.js** (Versi `20 LTS` atau lebih baru)
   - Unduh di: [nodejs.org](https://nodejs.org/)
   - Cek via terminal/CMD: `node -v`
2. **Database Engine** (Pilih salah satu):
   - **MySQL 8.0+** atau **MariaDB 10.11+**
   - Atau aplikasi bundle seperti **Laragon** (Rekomendasi untuk Windows), **XAMPP**, atau **Docker**
3. **Git** (Opsional, jika mendownload via `git clone`)

---

### 2. Langkah-Langkah Instalasi & Setup

#### **Langkah 1: Salin Project ke Komputer Baru**

- Jika menggunakan Git:
  ```bash
  git clone https://github.com/username/irian-motor.git
  cd irian-motor
  ```
- Jika menggunakan Flashdisk / ZIP / Folder Copy:
  - Copy folder project `irian-motor` ke komputer baru.
  - Buka terminal / Command Prompt / PowerShell di folder project tersebut (`cd irian-motor`).

---

#### **Langkah 2: Install Dependencies**

Jalankan perintah berikut di terminal:

```bash
npm install
```

> _Catatan: Perintah ini secara otomatis akan menjalankan `npx prisma generate` untuk membuat Prisma Client di dalam folder `src/generated/prisma`._

---

#### **Langkah 3: Konfigurasi File `.env`**

1. Duplikat / salin file `.env.example` menjadi `.env`:
   - **Linux / macOS / PowerShell**:
     ```bash
     cp .env.example .env
     ```
   - **Windows CMD**:
     ```cmd
     copy .env.example .env
     ```

2. Buka file `.env` yang baru dibuat dengan Code Editor (VS Code / Notepad) dan sesuaikan nilainya:

   ```env
   # Format: mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE
   DATABASE_URL="mysql://root:password_mysql_anda@localhost:3306/irian_motor"

   # Secret Key untuk Enkripsi Session JWT (Minimal 32 karakter)
   SESSION_SECRET="bebas_isi_string_acak_rahasia_dan_panjang_minimal_32_char"

   NODE_ENV="development"
   PORT=3000
   ```

   _Tips Generate `SESSION_SECRET` otomatis via terminal:_

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

#### **Langkah 4: Buat Database MySQL / MariaDB**

Buka MySQL Client (Terminal SQL, phpMyAdmin, DBeaver, atau Laragon Database Management):

Jalankan perintah SQL berikut untuk membuat database:

```sql
CREATE DATABASE irian_motor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

_(Opsional)_ Jika ingin membuat user database khusus untuk aplikasi:

```sql
CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'irianmotor123';
GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'localhost';
FLUSH PRIVILEGES;
```

_Jika menggunakan user khusus di atas, sesuaikan `DATABASE_URL` di `.env` menjadi:_
`DATABASE_URL="mysql://irianmotor:irianmotor123@localhost:3306/irian_motor"`

---

#### **Langkah 5: Migrasi Database & Seed Data Awal**

1. **Jalankan Migrasi Database:**

   ```bash
   npx prisma migrate deploy
   ```

   _(Atau jalankan `npx prisma db push` jika migrasi belum pernah dicommit)._

2. **Jalankan Seeding Account Admin Utama:**
   ```bash
   npm run db:seed
   ```
   _Output akan menampilkan akun admin default yang berhasil dibuat:_
   - **Email:** `admin@irianmotor.com`
   - **Password:** `Mallikrs08!`

---

#### **Langkah 6: Jalankan Aplikasi**

- **Mode Development (Untuk Pengembangan / Testing):**

  ```bash
  npm run dev
  ```

  Buka browser di: **http://localhost:3000**

- **Mode Production (Untuk Penggunaan Operasional):**
  ```bash
  npm run build
  npm run start
  ```
  Buka browser di: **http://localhost:3000**

---

### 🐳 Cara Alternatif: Jalankan Menggunakan Docker (Opsional)

Jika di komputer baru sudah terinstal **Docker** & **Docker Compose**, Anda tidak perlu menginstall Node.js dan MySQL secara manual di OS host.

1. Salin `.env`:
   ```bash
   cp .env.example .env
   ```
2. Jalankan container:
   ```bash
   docker-compose up -d
   ```
3. Terapkan migrasi database & seed data:
   ```bash
   docker exec -it irian-motor-app npx prisma migrate deploy
   docker exec -it irian-motor-app npm run db:seed
   ```
4. Buka aplikasi di: **http://localhost:3000**

---

### 🛠️ Pertanyaan Umum & Troubleshooting (F.A.Q)

1. **Error: `Client generated with prisma@x.x.x but trying to use prisma@y.y.y`**
   - Solusi: Jalankan ulang `npx prisma generate`

2. **Error Database Connection (Access Denied / Connection Refused):**
   - Pastikan service MySQL/MariaDB atau Laragon/XAMPP sudah dalam status **RUNNING**.
   - Cek ulang username, password, dan nama database di file `.env`.
   - Untuk MySQL 8+, jika muncul kendala otentikasi tambahkan parameter di `DATABASE_URL`:
     `DATABASE_URL="mysql://root:password@localhost:3306/irian_motor?allowPublicKeyRetrieval=true&sslAccept=strict"`

3. **Lupa Credential Admin:**
   - Jalankan `npm run db:seed` kembali untuk me-reset akun Super Admin `admin@irianmotor.com`.

---

## 🚀 Deploy ke VPS

Panduan lengkap step-by-step deploy ke VPS tersedia di [docs/PANDUAN_DEPLOY_VPS.md](file:///home/kruza/Documents/irian-motor/docs/PANDUAN_DEPLOY_VPS.md).

File skrip pendukung di folder `deploy/`:

- `deploy/deploy.sh` — Skrip update/redeploy otomatis via Git
- `deploy/setup-vps.sh` — Skrip setup awal Ubuntu server
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

---

## ⚙️ Teknologi & Versi

| Teknologi       | Versi         |
| --------------- | ------------- |
| Next.js         | 16.2.4        |
| React           | 19.2.4        |
| Prisma          | 7.x           |
| MariaDB / MySQL | 8.0+ / 10.11+ |
| Node.js         | 20 LTS        |
| Tailwind CSS    | 4.x           |
