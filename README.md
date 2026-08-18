# Mulya Lestari — Sistem Kasir & Manajemen Bengkel

Aplikasi web modern untuk operasional bengkel motor multi-cabang (POS Kasir, Stok Toko & Gudang, Restock, Indent, Korporat, dan Reminder WhatsApp).

---

## 🚀 Quick Start (Menjalankan di Lokal)

### 1. Install Dependensi
```bash
npm install
```

### 2. Konfigurasi `.env`
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Sesuaikan koneksi database MySQL/MariaDB Anda di file `.env`.

### 3. Migrasi Database & Buat Akun Admin
```bash
npx prisma migrate deploy
npm run db:seed
```
> **Akun Default Super Admin:**  
> Email: `admin@irianmotor.com` | Password: `Mallikrs08!`

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di: **[http://localhost:3000](http://localhost:3000)**

---

## 📜 Perintah Utama

| Perintah | Keterangan |
| :--- | :--- |
| `npm run dev` | Menjalankan server development (Port 3000) |
| `npm run build` | Melakukan compile & build production |
| `npm run start` | Menjalankan build production |
| `npm run db:seed` | Mengisi data awal akun Super Admin |
| `npx prisma migrate deploy` | Menjalankan migrasi struktur database |

---

## 📚 Dokumentasi Terkait

* 📘 **Panduan Kasir:** [`docs/PANDUAN_KASIR.md`](docs/PANDUAN_KASIR.md) / [`docs/PANDUAN_KASIR.html`](docs/PANDUAN_KASIR.html)
* 🚀 **Panduan Deploy VPS:** [`docs/PANDUAN_DEPLOY_STAGING_PROD_SUMOPOD.md`](docs/PANDUAN_DEPLOY_STAGING_PROD_SUMOPOD.md)

---

**Tech Stack:** Next.js 16 (App Router) • Prisma ORM • MariaDB/MySQL • Tailwind CSS
