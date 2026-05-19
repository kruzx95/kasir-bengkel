# Irian Motor — Dokumentasi Fitur & Alur Proses

Aplikasi manajemen bengkel motor multi-cabang berbasis web (Next.js + Prisma + MySQL).

---

## Daftar Isi

1. [Autentikasi & Role](#1-autentikasi--role)
2. [Dashboard](#2-dashboard)
3. [Master Data Sparepart](#3-master-data-sparepart)
4. [Master Data Servis](#4-master-data-servis)
5. [Master Data Mekanik](#5-master-data-mekanik)
6. [Data Pelanggan](#6-data-pelanggan)
7. [Transaksi Kasir](#7-transaksi-kasir)
8. [Restock Barang Masuk](#8-restock-barang-masuk)
9. [Indent Order (Pemesanan Barang)](#9-indent-order-pemesanan-barang)
10. [Pelanggan Korporat & Tagihan Borongan](#10-pelanggan-korporat--tagihan-borongan)
11. [Laporan](#11-laporan)
12. [Kelola Cabang](#12-kelola-cabang)
13. [Kelola Pengguna](#13-kelola-pengguna)

---

## 1. Autentikasi & Role

### Fitur
- Login dengan email dan password
- Dua role: **ADMIN** dan **KASIR**
- Session berbasis JWT (cookie)

### Perbedaan Akses

| Fitur | ADMIN | KASIR |
|-------|-------|-------|
| Semua cabang | ✅ | ❌ (cabang sendiri saja) |
| Master data | ✅ | ❌ |
| Restock & Indent | ✅ | ❌ |
| Korporat | ✅ | ❌ |
| Laporan | ✅ | ✅ (cabang sendiri) |
| Transaksi | ✅ | ✅ |
| Pelanggan | ✅ | ✅ |

### Alur Login
```
Buka /login
  → Masukkan email + password
  → Validasi kredensial
  → Jika ADMIN → redirect ke /admin
  → Jika KASIR  → redirect ke /kasir
```

---

## 2. Dashboard

### Fitur
- Ringkasan pendapatan hari ini (total, servis, sparepart)
- Jumlah transaksi hari ini
- Stok sparepart yang hampir habis (≤ 5 unit)
- Transaksi terbaru

### Alur
```
Login berhasil
  → Dashboard otomatis memuat data hari ini
  → Admin: data semua cabang atau filter per cabang
  → Kasir: data cabang sendiri saja
```

---

## 3. Master Data Sparepart

### Fitur
- CRUD sparepart per cabang
- Field: nama, SKU, jenis (`sparepartType`), merk (`sparepartBrand`), ukuran (`sparepartSize`), harga beli, harga jual, stok, satuan
- Pencarian berdasarkan nama, SKU, jenis, atau merk
- Nonaktifkan sparepart (soft delete)

### Alur Tambah Sparepart
```
Admin → Master → Sparepart → Tambah Sparepart
  → Isi nama, SKU (opsional), jenis, merk, ukuran (opsional)
  → Isi harga beli, harga jual, stok awal, satuan
  → Pilih cabang
  → Simpan → sparepart aktif dan siap digunakan di transaksi
```

---

## 4. Master Data Servis

### Fitur
- CRUD jasa servis per cabang
- Field: nama, harga, kategori
- Nonaktifkan servis (soft delete)

### Alur Tambah Servis
```
Admin → Master → Servis → Tambah Servis
  → Isi nama jasa, harga, kategori (opsional)
  → Pilih cabang
  → Simpan → servis siap dipilih saat transaksi
```

---

## 5. Master Data Mekanik

### Fitur
- CRUD data mekanik per cabang
- Field: nama, nomor telepon
- Mekanik dapat dipilih saat membuat transaksi sebagai penanggung jawab

### Alur Tambah Mekanik
```
Admin → Master → Mekanik → Tambah Mekanik
  → Isi nama dan nomor telepon (opsional)
  → Pilih cabang
  → Simpan → mekanik tersedia di form transaksi
```

---

## 6. Data Pelanggan

### Fitur
- CRUD data pelanggan per cabang
- Field kendaraan: merk (`vehicleBrand`), tipe/model (`vehicleType`), warna (`vehicleColor`), plat nomor, tahun, jenis bahan bakar (`GASOLINE` / `DIESEL`), odometer terakhir
- Field kontak: nama, nomor telepon, alamat
- Asosiasi ke pelanggan korporat (opsional)
- Riwayat transaksi per pelanggan

### Alur Tambah Pelanggan
```
Kasir/Admin → Pelanggan → Tambah Pelanggan
  → Isi data pemilik (nama, telepon, alamat)
  → Isi data kendaraan (merk, tipe, warna, plat, tahun, BBM, odometer)
  → Simpan → pelanggan tersedia di form transaksi
```

---

## 7. Transaksi Kasir

### Fitur
- Buat transaksi baru (servis, sparepart, atau gabungan)
- Pilih pelanggan terdaftar atau pelanggan umum (tanpa nama)
- Pilih mekanik penanggung jawab (opsional)
- Diskon nominal (Rp)
- Metode pembayaran: CASH, TRANSFER, QRIS
- Catatan mekanik / keluhan
- Tandai sebagai **tagihan korporat** jika pelanggan terdaftar di perusahaan
- Nomor invoice otomatis: `INV-[KODE CABANG]-[YYYYMMDD]-[URUTAN]`
- Halaman detail invoice dengan opsi cetak
- Pembatalan transaksi (hanya Admin, stok otomatis dikembalikan)
- Footer invoice menampilkan media sosial cabang (jika diisi)

### Status Transaksi
| Status | Keterangan |
|--------|-----------|
| `COMPLETED` | Transaksi selesai dan dibayar |
| `PENDING_CORPORATE` | Belum dibayar, masuk tagihan korporat |
| `CANCELLED` | Dibatalkan, stok dikembalikan |

### Alur Transaksi Normal
```
Kasir → Transaksi → Transaksi Baru
  → Cari dan tambah item (servis / sparepart)
  → Pilih pelanggan (opsional)
  → Pilih mekanik (opsional)
  → Isi diskon dan catatan (opsional)
  → Pilih metode pembayaran
  → Simpan Transaksi
    → Stok sparepart otomatis berkurang
    → Invoice dibuat dengan nomor unik
    → Redirect ke halaman detail invoice
    → Kasir bisa cetak invoice
```

### Alur Transaksi Korporat
```
Kasir → Transaksi Baru
  → Pilih pelanggan yang terdaftar di perusahaan korporat
  → Centang "Tagihan Korporat"
  → Simpan → status PENDING_CORPORATE
  → Transaksi masuk ke rekap tagihan perusahaan
  → Admin melunasi via halaman Tagihan Korporat
```

---

## 8. Restock Barang Masuk

### Fitur
- Catat pembelian sparepart dari supplier
- Upload foto nota pembelian (JPG/PNG, maks 5 MB, disimpan private)
- Stok dan harga beli sparepart otomatis diperbarui
- Riwayat restock dengan filter supplier/cabang
- Halaman detail restock dengan lightbox foto nota
- Restock bisa berasal dari penerimaan indent order

### Alur Restock Manual
```
Admin → Restock → Catat Barang Masuk
  → Pilih cabang penerima
  → Isi nama supplier, tanggal, catatan (opsional)
  → Upload foto nota pembelian (opsional)
  → Cari dan tambah sparepart + qty + harga beli
  → Simpan PO
    → Stok sparepart bertambah
    → Harga beli sparepart diperbarui ke harga terbaru
    → Record restock tersimpan dengan path foto nota
```

### Alur Lihat Detail Restock
```
Admin → Restock → klik tombol → di baris restock
  → Halaman detail menampilkan:
     - Info PO (cabang, pencatat, tanggal, catatan)
     - Foto nota (klik untuk zoom/lightbox)
     - Tabel rincian barang + total
```

---

## 9. Indent Order (Pemesanan Barang)

### Fitur
- Catat pemesanan sparepart ke supplier yang barangnya belum diterima
- Estimasi tanggal tiba (`expectedDate`)
- Indikator visual **"Terlambat"** jika estimasi sudah lewat dan status masih PENDING
- Penerimaan barang parsial (sebagian diterima)
- Saat diterima → otomatis membuat record Restock

### Status Indent
| Status | Keterangan |
|--------|-----------|
| `PENDING` | Belum ada barang yang diterima |
| `PARTIAL` | Sebagian barang sudah diterima |
| `RECEIVED` | Semua barang sudah diterima |

### Alur Buat Indent
```
Admin → Indent → Buat Pesanan Indent
  → Pilih cabang, isi nama supplier
  → Isi tanggal pesan dan estimasi tiba (opsional)
  → Tambah sparepart + qty + harga estimasi
  → Simpan → status PENDING
```

### Alur Terima Barang Indent
```
Admin → Indent → klik "Terima Barang" pada baris indent
  → Isi tanggal terima, nama supplier, catatan
  → Upload foto nota (opsional)
  → Isi qty yang diterima per item + harga aktual
  → Simpan
    → Stok sparepart bertambah sesuai qty diterima
    → Harga beli sparepart diperbarui
    → Record Restock otomatis dibuat (terhubung ke indent)
    → Status indent diperbarui:
       - Semua diterima → RECEIVED
       - Sebagian diterima → PARTIAL
```

---

## 10. Pelanggan Korporat & Tagihan Borongan

### Fitur
- CRUD perusahaan/instansi sebagai pelanggan korporat
- Field: nama perusahaan, contact person, telepon, alamat, NPWP (opsional), siklus tagihan (WEEKLY / BIWEEKLY / MONTHLY)
- Assign/unassign kendaraan (pelanggan individual) ke perusahaan
- Rekap tagihan per periode dengan filter tanggal
- Pelunasan massal (semua transaksi PENDING_CORPORATE → COMPLETED) dalam satu operasi atomik
- Cetak dokumen tagihan

### Alur Daftarkan Pelanggan Korporat
```
Admin → Korporat → Tambah Korporat
  → Isi nama perusahaan, contact person, telepon, alamat
  → Isi NPWP (opsional), pilih siklus tagihan, pilih cabang
  → Simpan
```

### Alur Assign Kendaraan ke Korporat
```
Admin → Korporat → klik nama perusahaan → tab "Kelola Kendaraan"
  → Panel kanan: daftar pelanggan di cabang yang belum terdaftar
  → Klik tombol + untuk assign ke perusahaan ini
  → Klik tombol - untuk unassign
```

### Alur Tagihan Korporat
```
Admin → Korporat → klik nama perusahaan → tab "Tagihan"
  → Pilih rentang tanggal → klik "Tampilkan Tagihan"
  → Sistem menampilkan semua transaksi PENDING_CORPORATE
     dalam periode tersebut beserta total tagihan
  → Klik "Cetak" untuk mencetak dokumen tagihan
  → Klik "Tandai Lunas" → konfirmasi
    → Semua transaksi diubah ke COMPLETED secara atomik
    → Jika gagal sebagian → seluruh operasi dibatalkan (rollback)
```

---

## 11. Laporan

### Tab Laporan Transaksi
- Filter: rentang tanggal + cabang
- Ringkasan: total pendapatan, pendapatan servis, pendapatan sparepart, jumlah transaksi
- Tabel detail transaksi
- Ekspor ke Excel (.xlsx)

### Tab Laporan Pembelian Sparepart
- Filter: rentang tanggal + cabang
- Ringkasan: total pengeluaran, jumlah restock, sparepart terbanyak dibeli
- Tabel detail restock beserta rincian barang
- Cetak langsung dari browser (print-friendly)

### Alur Laporan Transaksi
```
Admin/Kasir → Laporan → tab "Laporan Transaksi"
  → Pilih rentang tanggal dan cabang (admin bisa semua cabang)
  → Klik Filter → data dimuat
  → Klik "Ekspor Excel" untuk unduh file .xlsx
```

### Alur Laporan Pembelian
```
Admin → Laporan → tab "Laporan Pembelian Sparepart"
  → Pilih rentang tanggal dan cabang
  → Klik Filter → data dimuat
  → Klik "Cetak" untuk print langsung dari browser
```

---

## 12. Kelola Cabang

### Fitur
- Lihat semua cabang aktif
- Edit profil cabang: nama, alamat, nomor telepon
- Edit media sosial cabang: Instagram, Facebook, WhatsApp
- Validasi nomor WhatsApp: angka saja, 10–15 digit
- Media sosial ditampilkan di footer nota transaksi jika terisi

### Alur Edit Cabang
```
Admin → Cabang → hover card cabang → klik ikon edit (pensil)
  → Modal edit terbuka dengan data saat ini
  → Ubah nama, alamat, telepon (opsional)
  → Isi Instagram (username tanpa @), Facebook (nama halaman),
    WhatsApp (format: 6281234567890)
  → Simpan Perubahan
    → Data cabang diperbarui
    → Media sosial langsung muncul di footer invoice
```

---

## 13. Kelola Pengguna

### Fitur
- CRUD akun pengguna (Admin dan Kasir)
- Assign cabang untuk Kasir (Admin tidak perlu cabang)
- Reset password
- Nonaktifkan akun (soft delete)

---

## Ringkasan Alur Operasional Harian

### Kasir (setiap hari)
```
1. Login → Dashboard (lihat ringkasan hari ini)
2. Transaksi Baru → pilih item → pilih pelanggan → bayar → cetak invoice
3. Cek stok sparepart di menu Sparepart
4. Tambah/edit pelanggan jika ada pelanggan baru
```

### Admin (berkala)
```
1. Pantau dashboard semua cabang
2. Restock barang → catat PO dari supplier + upload foto nota
3. Kelola indent → buat pesanan → terima barang saat tiba
4. Tagihan korporat → rekap per periode → cetak → tandai lunas
5. Laporan → filter periode → ekspor Excel atau cetak
6. Update master data (sparepart, servis, mekanik) sesuai kebutuhan
7. Update profil cabang (media sosial, telepon, alamat)
```

---

## Struktur URL

| URL | Role | Keterangan |
|-----|------|-----------|
| `/login` | Semua | Halaman login |
| `/admin` | Admin | Dashboard admin |
| `/admin/cabang` | Admin | Kelola cabang |
| `/admin/users` | Admin | Kelola pengguna |
| `/admin/master/spareparts` | Admin | Master sparepart |
| `/admin/master/services` | Admin | Master servis |
| `/admin/master/mechanics` | Admin | Master mekanik |
| `/admin/restock` | Admin | Daftar restock |
| `/admin/restock/baru` | Admin | Catat restock baru |
| `/admin/restock/[id]` | Admin | Detail restock + foto nota |
| `/admin/indent` | Admin | Daftar indent order |
| `/admin/indent/baru` | Admin | Buat indent baru |
| `/admin/indent/[id]/terima` | Admin | Terima barang indent |
| `/admin/korporat` | Admin | Daftar pelanggan korporat |
| `/admin/korporat/[id]/tagihan` | Admin | Tagihan korporat |
| `/admin/laporan` | Admin | Laporan transaksi & pembelian |
| `/admin/transaksi` | Admin | Semua transaksi |
| `/kasir` | Kasir | Dashboard kasir |
| `/kasir/transaksi` | Kasir | Daftar transaksi hari ini |
| `/kasir/transaksi/baru` | Kasir | Buat transaksi baru |
| `/kasir/transaksi/[id]` | Kasir/Admin | Detail invoice |
| `/kasir/pelanggan` | Kasir | Data pelanggan cabang |
| `/kasir/sparepart` | Kasir | Stok sparepart cabang |
