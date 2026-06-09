# Irian Motor - Sistem Manajemen Bengkel

Aplikasi berbasis web untuk manajemen operasional bengkel motor (multi-cabang). Mencakup fitur point-of-sale (kasir), rekap transaksi, manajemen stok sparepart, dan laporan operasional harian.

Dibangun menggunakan:
- **Next.js (App Router)** - Framework frontend & backend
- **Prisma ORM** - Interaksi database
- **MySQL / MariaDB** - Database utama
- **Tailwind CSS** - Styling
- **Zod** - Validasi data

---

## 🛠️ Instalasi & Setup di Komputer Baru

Ikuti langkah-langkah di bawah ini untuk menjalankan *project* ini di komputer atau server baru.

### 1. Persyaratan Sistem

Pastikan Anda sudah menginstal perangkat lunak berikut:
- [Node.js](https://nodejs.org/) (Versi 20 LTS atau yang lebih baru)
- [MySQL](https://dev.mysql.com/downloads/) atau [MariaDB](https://mariadb.org/download/) (Versi 8.0+ untuk MySQL, atau versi stabil terbaru MariaDB)
- [Git](https://git-scm.com/)

### 2. Setup Database MySQL / MariaDB

Pastikan *service* MySQL sudah berjalan, lalu masuk ke MySQL CLI (melalui terminal atau CMD):

```bash
# Linux / macOS
sudo mysql -u root -p

# Windows (CMD / PowerShell)
mysql -u root -p
```

Jalankan perintah SQL berikut untuk membuat *database* dan *user* baru:

```sql
CREATE USER 'irianmotor'@'localhost' IDENTIFIED BY 'irianmotor123';
CREATE DATABASE irian_motor;
GRANT ALL PRIVILEGES ON irian_motor.* TO 'irianmotor'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'irianmotor'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Clone Repository & Install Dependencies

Clone *project* ini dari Git (sesuaikan URL dengan repositori Anda), masuk ke foldernya, dan instal semua paket yang dibutuhkan:

```bash
# Clone repository
git clone https://github.com/username/irian-motor.git
cd irian-motor

# Install NPM dependencies
npm install
```

### 4. Setup Environment Variables

Gunakan file `.env.example` sebagai referensi. Duplikat file tersebut dan ubah namanya menjadi `.env`:

```bash
# Linux / macOS
cp .env.example .env

# Windows
copy .env.example .env
```

Buka file `.env` di *code editor* Anda dan pastikan nilai koneksi database sudah sesuai dengan yang dibuat pada langkah 2:
```env
DATABASE_URL="mysql://irianmotor:irianmotor123@127.0.0.1:3306/irian_motor?allowPublicKeyRetrieval=true&sslAccept=strict"
SESSION_SECRET="ganti-dengan-random-string-minimal-32-karakter-disini-12345"
```
*(Catatan: Buat string acak yang aman untuk `SESSION_SECRET`)*

### 5. Setup Prisma (Migrasi Database)

Terapkan struktur tabel ke *database* dan *generate* Prisma Client:

```bash
# Push schema ke database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

> **Penting**: Setelah `prisma generate` dijalankan, jika *Next.js server* sedang menyala, Anda harus mematikan dan merestart server tersebut agar perubahan klien Prisma dikenali.

### 6. Menjalankan Mode Development

Jalankan *server development* lokal:

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

---

## 📦 Menjalankan Mode Production

Jika ingin menjalankan aplikasi untuk produksi (lebih cepat dan optimal):

```bash
# Buat build produksi
npm run build

# Jalankan server
npm run start
```

## 🔑 Catatan Tambahan (Reset Password / User Pertama)

Jika ini adalah database kosong, Anda perlu memasukkan data *seed* atau membuat *user Admin* secara manual melalui *database client* (seperti DBeaver/phpMyAdmin).

Jika *user* sudah ada tetapi Anda lupa *password*, Anda bisa menggunakan *script* reset *password*:
1. Buka file `scripts/reset-password.ts`.
2. Ubah variabel `EMAIL` dan `PASSWORD_BARU` di dalam *script* tersebut sesuai kebutuhan.
3. Jalankan:
```bash
npx tsx scripts/reset-password.ts
```
