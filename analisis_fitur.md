# 🏍️ Analisis Project Irian Motor — Fitur yang Bisa Dibuat

## Yang Sudah Ada (Summary)

| Modul | Status | Catatan |
|---|---|---|
| Autentikasi (JWT Cookie) | ✅ Lengkap | ADMIN & KASIR |
| Dashboard (chart, trend, low stock) | ✅ Lengkap | Multi-cabang |
| Master Sparepart | ✅ Lengkap | CRUD, import Excel |
| Master Servis | ✅ Lengkap | CRUD |
| Master Mekanik | ✅ Lengkap | CRUD |
| Data Pelanggan | ✅ Lengkap | CRUD + riwayat transaksi |
| Transaksi Kasir | ✅ Lengkap | Invoice, cetak, batal |
| Restock Barang Masuk | ✅ Lengkap | Upload nota, update stok |
| Indent Order | ✅ Lengkap | Parsial, terima barang |
| Pelanggan Korporat & Tagihan | ✅ Lengkap | Pelunasan massal |
| Laporan Transaksi | ✅ Lengkap | Ekspor Excel |
| Laporan Restock | ✅ Lengkap | Print-friendly |
| Kelola Cabang | ✅ Lengkap | Medsos, telepon |
| Kelola Pengguna | ✅ Lengkap | CRUD + reset password |

---

## 🚀 Fitur yang Bisa Dibuat

### Prioritas Tinggi (Langsung Berguna Operasional)

---

#### 1. 🔔 Notifikasi & Alert System
**Gap**: Tidak ada sistem notifikasi aktif. Peringatan stok menipis hanya tampil di dashboard — tidak ada yang "push".

**Yang bisa dibuat:**
- Badge/counter notifikasi di navbar (stok menipis, indent terlambat, tagihan korporat jatuh tempo)
- Panel notifikasi dropdown di header
- Menyimpan notifikasi ke DB agar bisa di-dismiss per user

**Perubahan schema**: Tambah tabel `Notification` (userId, type, message, isRead, createdAt)

---

#### 2. 📊 Dashboard Kasir yang Lebih Informatif
**Gap**: Dashboard kasir (`/kasir`) sangat minimalis dibanding admin.

**Yang bisa dibuat:**
- Jumlah transaksi hari ini + target harian
- Grafik pendapatan 7 hari cabang sendiri
- Ringkasan metode pembayaran hari ini (Cash / QRIS / Transfer)
- Stok kritis cabang sendiri
- Transaksi terbaru (5 terakhir) langsung di dashboard

---

#### 3. 🔍 Halaman Riwayat Pelanggan yang Detail
**Gap**: `getCustomerById` sudah ada tapi hanya mengambil 10 transaksi terakhir. Tidak ada halaman dedicated profil pelanggan.

**Yang bisa dibuat:**
- Halaman `/kasir/pelanggan/[id]` — profil lengkap pelanggan
- Timeline riwayat servis kendaraan
- Total pengeluaran pelanggan selama ini
- Informasi kendaraan + catatan servis terakhir
- Odometer tracker (kapan terakhir update odometer)

---

#### 4. 🖨️ Cetak Struk/Invoice yang Lebih Baik
**Gap**: Invoice sudah ada tapi belum ada:

**Yang bisa dibuat:**
- Format struk kasir ukuran kecil (58mm/80mm thermal printer)
- QR Code pada invoice yang mengarah ke detail transaksi online
- Template invoice yang bisa dikustomisasi per cabang
- Struk digital via WhatsApp (generate link atau teks struk)

---

#### 5. 📦 Manajemen Stok yang Lebih Canggih
**Gap**: Stok hanya berubah saat transaksi & restock. Tidak ada:

**Yang bisa dibuat:**
- **Stock Opname** — Halaman untuk rekonsiliasi stok fisik vs sistem
  - Admin input stok aktual, sistem hitung selisih
  - Catat alasan penyesuaian (hilang, rusak, salah hitung)
- **Riwayat Mutasi Stok** per sparepart — masuk dari mana, keluar ke transaksi apa
- **Threshold stok minimum** per sparepart yang bisa diatur (bukan hardcode 5)
- **Transfer stok antar cabang** — catat perpindahan sparepart antar cabang

---

#### 6. 🧾 Manajemen Supplier
**Gap**: Nama supplier hanya disimpan sebagai plain text di Restock/Indent, tidak ada entitas Supplier.

**Yang bisa dibuat:**
- Tabel Master Supplier (nama, alamat, nomor telepon, email, catatan)
- Dropdown supplier saat input restock/indent (bukan ketik bebas)
- Riwayat pembelian per supplier
- Statistik: supplier mana yang paling sering digunakan

**Perubahan schema**: Tambah model `Supplier`, update relasi di `Restock` dan `IndentOrder`

---

#### 7. 💳 Laporan Keuangan Lebih Lengkap
**Gap**: Laporan ada tapi terbatas (transaksi & restock saja).

**Yang bisa dibuat:**
- **Laporan Laba Rugi** — Pendapatan - HPP (harga beli sparepart) = estimasi laba
- **Laporan Stok Sparepart** — Nilai stok per cabang (stok × harga beli/jual)
- **Laporan per Mekanik** — Berapa transaksi & pendapatan yang ditangani tiap mekanik
- **Laporan per Pelanggan** — Pelanggan paling loyal (frekuensi & nilai transaksi)
- **Grafik trend bulanan** (bukan hanya 7 hari) untuk dashboard admin
- Export PDF untuk laporan (selain Excel)

---

#### 8. 📅 Jadwal Servis / Booking
**Gap**: Tidak ada fitur appointment/booking sama sekali.

**Yang bisa dibuat:**
- Kasir bisa buat jadwal servis untuk pelanggan
- Tampilan kalender/agenda harian mekanik
- Notifikasi pengingat servis (berdasarkan odometer atau interval waktu)
- Status booking: `SCHEDULED` → `IN_PROGRESS` → `DONE`

**Perubahan schema**: Tambah model `ServiceAppointment`

---

#### 9. 🔄 Fitur Edit Transaksi
**Gap**: Transaksi hanya bisa dibatalkan (cancel), tidak bisa diedit.

**Yang bisa dibuat:**
- Admin bisa edit transaksi yang sudah tersimpan (ubah item, diskon, catatan)
- Edit akan membuat audit log (siapa yang ubah, kapan, apa yang berubah)
- Hanya dalam batas waktu tertentu (misal: H+1)

---

#### 10. 📱 PWA / Offline Support
**Gap**: Aplikasi pure web, tidak bisa diakses offline.

**Yang bisa dibuat:**
- Service Worker untuk cache halaman utama
- Manifest PWA agar bisa "install" ke homescreen HP
- Offline indicator jika koneksi terputus

---

### Prioritas Menengah (Nice to Have)

---

#### 11. 📸 Foto Kendaraan Pelanggan
Saat ini pelanggan hanya punya data teks kendaraan. Bisa tambah:
- Upload foto kendaraan saat masuk bengkel
- Disimpan per transaksi (bukan per pelanggan) sebagai dokumentasi kondisi

---

#### 12. 🔐 Activity Log / Audit Trail
**Gap**: Tidak ada catatan siapa yang melakukan aksi apa.

**Yang bisa dibuat:**
- Log setiap aksi penting: buat transaksi, cancel, edit master data, reset password
- Admin bisa lihat log aktivitas per user atau per cabang
- Berguna untuk investigasi jika ada selisih data

**Perubahan schema**: Tambah model `ActivityLog`

---

#### 13. 📤 Ekspor Laporan ke PDF
**Gap**: Laporan transaksi hanya bisa ekspor Excel. Laporan restock hanya bisa print browser.

**Yang bisa dibuat:**
- Generate PDF server-side menggunakan library seperti `@react-pdf/renderer` atau `puppeteer`
- Template PDF yang rapih dengan logo/header bengkel
- Bisa langsung download tanpa harus print dulu

---

#### 14. 💬 Catatan Internal per Transaksi
**Gap**: Field `notes` ada tapi satu kolom untuk semua. Tidak ada komunikasi antar kasir/admin.

**Yang bisa dibuat:**
- Thread komentar per transaksi (misal: admin tambah catatan setelah kasir selesai)
- Flag transaksi sebagai "perlu perhatian"

---

#### 15. 📊 Komparasi Antar Cabang (Admin)
**Gap**: Dashboard admin hanya menampilkan pie chart kontribusi cabang, tidak ada perbandingan detail.

**Yang bisa dibuat:**
- Halaman `/admin/laporan/perbandingan`
- Tabel side-by-side performa semua cabang: pendapatan, jumlah transaksi, avg per transaksi, stok kritis
- Bar chart perbandingan antar cabang per bulan

---

## 📋 Ringkasan Prioritas

| # | Fitur | Kompleksitas | Dampak Bisnis |
|---|---|---|---|
| 1 | Notifikasi & Alert | Sedang | ⭐⭐⭐⭐ |
| 2 | Dashboard Kasir Informatif | Rendah | ⭐⭐⭐⭐ |
| 3 | Profil Pelanggan Detail | Rendah | ⭐⭐⭐⭐ |
| 4 | Struk Thermal / WhatsApp | Sedang | ⭐⭐⭐⭐ |
| 5 | Stock Opname & Mutasi Stok | Tinggi | ⭐⭐⭐⭐⭐ |
| 6 | Master Supplier | Sedang | ⭐⭐⭐ |
| 7 | Laporan Keuangan Lengkap | Tinggi | ⭐⭐⭐⭐⭐ |
| 8 | Jadwal Servis / Booking | Tinggi | ⭐⭐⭐ |
| 9 | Edit Transaksi + Audit Log | Sedang | ⭐⭐⭐ |
| 10 | PWA / Offline | Sedang | ⭐⭐ |
| 11 | Foto Kendaraan | Rendah | ⭐⭐ |
| 12 | Activity Log | Sedang | ⭐⭐⭐ |
| 13 | Ekspor PDF | Sedang | ⭐⭐⭐ |
| 14 | Catatan Internal | Rendah | ⭐⭐ |
| 15 | Komparasi Antar Cabang | Sedang | ⭐⭐⭐⭐ |
