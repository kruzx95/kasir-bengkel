# Requirements Document

## Introduction

Aplikasi manajemen bengkel motor **Irian Motor** sudah berjalan dengan fitur inti: data pelanggan, master sparepart, master servis, transaksi kasir, restock barang, dan laporan harian. Dokumen ini mendefinisikan persyaratan untuk pengembangan bertahap (multi-phase) guna menutup gap kebutuhan operasional yang teridentifikasi dari analisis pengguna.

Implementasi dibagi menjadi **4 Phase** berdasarkan prioritas, ketergantungan antar fitur, dan dampak operasional:

| Phase | Fokus | Prioritas |
|-------|-------|-----------|
| Phase 1 | Penyempurnaan Data Master (Pelanggan & Sparepart) | Tinggi — fondasi data |
| Phase 2 | Manajemen Pembelian & Nota (Restock + Indent) | Tinggi — operasional harian |
| Phase 3 | Pelanggan Korporat & Pembayaran Borongan | Sedang — ekspansi bisnis |
| Phase 4 | Profil Bengkel & Penyempurnaan Nota | Rendah — estetika & branding |

---

## Glossary

- **System**: Aplikasi manajemen bengkel motor Irian Motor (Next.js + Prisma + MySQL)
- **Admin**: Pengguna dengan role ADMIN yang memiliki akses penuh ke semua cabang
- **Kasir**: Pengguna dengan role KASIR yang hanya mengakses data cabangnya sendiri
- **Customer**: Data pelanggan individual yang terdaftar di salah satu cabang
- **CorporateCustomer**: Pelanggan berbentuk perusahaan/instansi yang pembayarannya ditagih secara kolektif
- **Sparepart**: Komponen kendaraan yang dijual atau digunakan dalam servis
- **Restock**: Proses pencatatan pembelian/pengadaan sparepart dari supplier
- **IndentOrder**: Pemesanan sparepart kepada supplier yang barangnya belum diterima
- **NotaPembelian**: Bukti pembelian fisik (foto) dari supplier saat restock
- **Odometer**: Pembacaan jarak tempuh kendaraan (km) saat kendaraan masuk bengkel
- **Branch**: Cabang bengkel (entitas `Branch` di database)
- **Invoice**: Nota transaksi yang dicetak/ditampilkan kepada pelanggan
- **TagihanKorporat**: Rekap tagihan gabungan untuk satu CorporateCustomer dalam periode tertentu

---

## Requirements

### Requirement 1: Penyempurnaan Data Kendaraan Pelanggan

**User Story:** Sebagai kasir, saya ingin mencatat informasi kendaraan pelanggan secara lebih detail (merk, warna, bahan bakar, odometer, alamat), agar riwayat servis lebih akurat dan memudahkan identifikasi kendaraan.

> **Phase 1 — Penyempurnaan Data Pelanggan**

#### Acceptance Criteria

1. THE System SHALL menyimpan field `vehicleBrand` (merk kendaraan, contoh: Honda, Yamaha, Suzuki) secara terpisah dari `vehicleType` (tipe/model, contoh: Beat, Vario, Mio) pada data Customer.
2. THE System SHALL menyimpan field `vehicleColor` (warna kendaraan) pada data Customer.
3. THE System SHALL menyimpan field `fuelType` dengan nilai yang dibatasi pada `GASOLINE` atau `DIESEL` pada data Customer.
4. THE System SHALL menyimpan field `odometer` (nilai numerik dalam satuan km) pada data Customer sebagai odometer terakhir tercatat saat kendaraan masuk bengkel.
5. THE System SHALL menyimpan field `address` (alamat lengkap pelanggan) pada data Customer.
6. WHEN kasir membuat transaksi baru dan memilih pelanggan yang sudah terdaftar, THE System SHALL menampilkan ringkasan data kendaraan pelanggan (merk, tipe, warna, plat nomor) untuk konfirmasi identitas.
7. WHEN kasir memperbarui data pelanggan, THE System SHALL memvalidasi bahwa nilai `fuelType` hanya boleh berisi `GASOLINE` atau `DIESEL`.
8. IF field `vehicleBrand`, `vehicleColor`, `fuelType`, `odometer`, dan `address` tidak diisi, THEN THE System SHALL tetap menyimpan data Customer dengan field tersebut bernilai null (opsional).
9. THE System SHALL memigrasikan skema database dengan menambahkan kolom baru (`vehicle_brand`, `vehicle_color`, `fuel_type`, `odometer`, `address`) pada tabel `customers` tanpa menghapus data yang sudah ada.

---

### Requirement 2: Penyempurnaan Data Sparepart

**User Story:** Sebagai admin, saya ingin mencatat informasi sparepart secara lebih lengkap (jenis, ukuran, merk), agar pencarian dan pengelompokan sparepart lebih mudah.

> **Phase 1 — Penyempurnaan Data Sparepart**

#### Acceptance Criteria

1. THE System SHALL menyimpan field `sparepartType` (jenis sparepart, contoh: Oli, Filter, Kampas, Busi) pada data Sparepart.
2. THE System SHALL menyimpan field `sparepartSize` (ukuran, contoh: 20W-50, 17 inch, 110/70-17) pada data Sparepart.
3. THE System SHALL menyimpan field `sparepartBrand` (merk sparepart, contoh: AHM, Yamalube, NGK) pada data Sparepart.
4. WHEN admin membuat atau memperbarui data Sparepart, THE System SHALL menyimpan ketiga field baru tersebut sebagai opsional (boleh null).
5. WHEN admin melihat daftar sparepart, THE System SHALL menampilkan kolom `sparepartType` dan `sparepartBrand` pada tabel daftar sparepart.
6. WHEN admin melakukan pencarian sparepart, THE System SHALL mendukung pencarian berdasarkan `sparepartType` atau `sparepartBrand` selain nama dan SKU.
7. THE System SHALL memigrasikan skema database dengan menambahkan kolom `sparepart_type`, `sparepart_size`, `sparepart_brand` pada tabel `spareparts` tanpa menghapus data yang sudah ada.

---

### Requirement 3: Laporan Rekap Pembelian Sparepart per Bulan

**User Story:** Sebagai admin, saya ingin melihat laporan rekap pengeluaran pembelian sparepart per bulan, agar saya dapat memantau biaya pengadaan dan tren pembelian.

> **Phase 1 — Laporan Rekap Pembelian Sparepart**

#### Acceptance Criteria

1. WHEN admin mengakses halaman laporan, THE System SHALL menyediakan tab atau seksi "Laporan Pembelian Sparepart".
2. WHEN admin memilih rentang bulan pada laporan pembelian, THE System SHALL menampilkan rekap total pengeluaran restock per bulan untuk cabang yang dipilih.
3. THE System SHALL menampilkan detail laporan pembelian yang mencakup: nama supplier, tanggal restock, nama sparepart, jumlah unit, harga beli per unit, dan subtotal.
4. THE System SHALL menampilkan ringkasan laporan pembelian yang mencakup: total pengeluaran periode, jumlah transaksi restock, dan sparepart dengan pengeluaran tertinggi.
5. WHERE Admin memiliki akses multi-cabang, THE System SHALL menyediakan filter cabang pada laporan pembelian sparepart.
6. WHEN admin mengekspor laporan pembelian, THE System SHALL menghasilkan tampilan cetak (print-friendly) yang dapat dicetak langsung dari browser.

---

### Requirement 4: Upload Foto Nota Pembelian saat Restock

**User Story:** Sebagai admin, saya ingin mengunggah foto nota pembelian fisik saat mencatat restock, agar ada bukti digital yang tersimpan dan dapat diverifikasi kapan saja.

> **Phase 2 — Upload Foto Nota Pembelian**

#### Acceptance Criteria

1. WHEN admin mengisi form restock baru, THE System SHALL menyediakan field upload file untuk foto nota pembelian.
2. THE System SHALL menerima file upload dengan format JPG, JPEG, atau PNG saja.
3. THE System SHALL menerima file upload dengan ukuran maksimal 5 MB per file.
4. IF admin mengunggah file dengan format selain JPG/JPEG/PNG, THEN THE System SHALL menampilkan pesan error "Format file tidak didukung. Gunakan JPG atau PNG."
5. IF admin mengunggah file dengan ukuran lebih dari 5 MB, THEN THE System SHALL menampilkan pesan error "Ukuran file terlalu besar. Maksimal 5 MB."
6. WHEN file nota berhasil diunggah, THE System SHALL menyimpan path file pada record Restock di database.
7. WHEN admin melihat detail restock, THE System SHALL menampilkan foto nota pembelian jika tersedia, dengan opsi untuk memperbesar tampilan.
8. IF field foto nota tidak diisi, THEN THE System SHALL tetap menyimpan data restock tanpa foto (opsional).
9. THE System SHALL menyimpan file foto pada direktori yang hanya dapat diakses melalui endpoint yang terautentikasi, bukan sebagai file publik statis.
10. THE System SHALL memigrasikan skema database dengan menambahkan kolom `receipt_image_path` pada tabel `restocks`.

---

### Requirement 5: Manajemen Barang Indent

**User Story:** Sebagai admin, saya ingin mencatat pemesanan sparepart yang belum diterima (indent), agar saya dapat memantau status pengadaan dan menginformasikan pelanggan yang menunggu.

> **Phase 2 — Manajemen Barang Indent**

#### Acceptance Criteria

1. THE System SHALL menyediakan entitas `IndentOrder` dengan field: `branchId`, `supplierName`, `orderDate`, `expectedDate` (estimasi tiba), `notes`, `status`, dan relasi ke item-item yang dipesan.
2. THE System SHALL mendukung status `IndentOrder` dengan nilai: `PENDING` (belum diterima), `PARTIAL` (sebagian diterima), dan `RECEIVED` (sudah diterima semua).
3. WHEN admin membuat indent order baru, THE System SHALL menyimpan daftar sparepart yang dipesan beserta jumlah dan harga beli estimasi.
4. WHEN admin mencatat penerimaan barang dari indent, THE System SHALL memperbarui stok sparepart terkait dan mengubah status `IndentOrder` menjadi `RECEIVED` atau `PARTIAL` sesuai jumlah yang diterima.
5. WHEN status `IndentOrder` berubah menjadi `RECEIVED`, THE System SHALL secara otomatis membuat record `Restock` yang terhubung dengan `IndentOrder` tersebut.
6. THE System SHALL menampilkan daftar indent order dengan filter berdasarkan status dan cabang.
7. IF `expectedDate` pada `IndentOrder` sudah terlewati dan status masih `PENDING`, THEN THE System SHALL menandai indent tersebut dengan indikator visual "Terlambat" pada daftar indent.
8. THE System SHALL memigrasikan skema database dengan menambahkan tabel `indent_orders` dan `indent_order_items`.

---

### Requirement 6: Manajemen Pelanggan Korporat

**User Story:** Sebagai admin, saya ingin mendaftarkan pelanggan perusahaan/instansi sebagai pelanggan korporat, agar transaksi kendaraan-kendaraan mereka dapat dikelompokkan dan ditagih secara kolektif.

> **Phase 3 — Manajemen Pelanggan Korporat**

#### Acceptance Criteria

1. THE System SHALL menyediakan entitas `CorporateCustomer` dengan field: `name` (nama perusahaan), `contactPerson`, `contactPhone`, `address`, `taxId` (NPWP, opsional), `billingCycle` (siklus tagihan: `WEEKLY`, `BIWEEKLY`, `MONTHLY`), `branchId`, dan `isActive`.
2. WHEN admin mendaftarkan pelanggan korporat baru, THE System SHALL memvalidasi bahwa `name` dan `billingCycle` wajib diisi.
3. THE System SHALL mendukung asosiasi antara `Customer` (individual) dengan `CorporateCustomer`, sehingga satu perusahaan dapat memiliki banyak kendaraan/pelanggan terdaftar.
4. WHEN kasir membuat transaksi baru, THE System SHALL menyediakan opsi untuk menandai transaksi sebagai "tagihan korporat" jika pelanggan terpilih berasosiasi dengan `CorporateCustomer`.
5. WHEN transaksi ditandai sebagai tagihan korporat, THE System SHALL mengubah status pembayaran transaksi menjadi `PENDING_CORPORATE` (belum dibayar, menunggu tagihan kolektif).
6. THE System SHALL menambahkan nilai `PENDING_CORPORATE` pada enum `TransactionStatus` yang sudah ada (`COMPLETED`, `CANCELLED`).
7. THE System SHALL memigrasikan skema database dengan menambahkan tabel `corporate_customers` dan kolom `corporate_customer_id` pada tabel `customers`.

---

### Requirement 7: Laporan Tagihan Korporat

**User Story:** Sebagai admin, saya ingin melihat dan mencetak laporan tagihan per perusahaan, agar proses penagihan pembayaran borongan dapat dilakukan secara terstruktur.

> **Phase 3 — Laporan Tagihan Korporat**

#### Acceptance Criteria

1. WHEN admin mengakses halaman laporan, THE System SHALL menyediakan seksi "Tagihan Korporat".
2. WHEN admin memilih satu `CorporateCustomer` dan rentang tanggal, THE System SHALL menampilkan semua transaksi dengan status `PENDING_CORPORATE` milik perusahaan tersebut dalam periode yang dipilih.
3. THE System SHALL menampilkan ringkasan tagihan korporat yang mencakup: nama perusahaan, periode tagihan, jumlah transaksi, dan total tagihan.
4. THE System SHALL menampilkan detail tagihan korporat per transaksi yang mencakup: nomor invoice, tanggal, nama pelanggan/kendaraan, plat nomor, rincian servis/sparepart, dan subtotal.
5. WHEN admin menandai tagihan korporat sebagai "Lunas", THE System SHALL memperbarui status semua transaksi terkait dari `PENDING_CORPORATE` menjadi `COMPLETED` dalam satu operasi atomik (database transaction).
6. IF proses pelunasan tagihan korporat gagal sebagian, THEN THE System SHALL membatalkan seluruh operasi dan mengembalikan status transaksi ke `PENDING_CORPORATE` (rollback).
7. THE System SHALL menyediakan tampilan cetak (print-friendly) untuk laporan tagihan korporat yang dapat digunakan sebagai dokumen penagihan resmi.

---

### Requirement 8: Informasi Media Sosial pada Profil Cabang

**User Story:** Sebagai admin, saya ingin menambahkan akun media sosial pada profil cabang, agar informasi kontak digital bengkel dapat ditampilkan pada nota transaksi.

> **Phase 4 — Informasi Media Sosial pada Profil Cabang**

#### Acceptance Criteria

1. THE System SHALL menyimpan field `instagramHandle` (username Instagram tanpa @), `facebookPage` (nama halaman Facebook), dan `whatsappNumber` (nomor WhatsApp format internasional) pada entitas `Branch`.
2. WHEN admin memperbarui profil cabang, THE System SHALL menyimpan ketiga field media sosial tersebut sebagai opsional (boleh null).
3. IF admin mengisi `whatsappNumber`, THEN THE System SHALL memvalidasi bahwa nilai berupa angka dengan panjang 10 hingga 15 digit.
4. THE System SHALL memigrasikan skema database dengan menambahkan kolom `instagram_handle`, `facebook_page`, `whatsapp_number` pada tabel `branches`.

---

### Requirement 9: Tampilan Media Sosial pada Nota Transaksi

**User Story:** Sebagai kasir, saya ingin nota transaksi yang dicetak menampilkan informasi media sosial bengkel, agar pelanggan dapat dengan mudah menemukan dan menghubungi bengkel secara digital.

> **Phase 4 — Tampilan Media Sosial pada Nota Transaksi**

#### Acceptance Criteria

1. WHEN kasir atau admin melihat halaman detail transaksi (invoice), THE System SHALL mengambil data profil cabang termasuk field media sosial.
2. WHERE `instagramHandle` pada profil cabang terisi, THE System SHALL menampilkan username Instagram pada bagian footer nota transaksi.
3. WHERE `facebookPage` pada profil cabang terisi, THE System SHALL menampilkan nama halaman Facebook pada bagian footer nota transaksi.
4. WHERE `whatsappNumber` pada profil cabang terisi, THE System SHALL menampilkan nomor WhatsApp pada bagian footer nota transaksi dalam format yang dapat diklik (wa.me link) pada tampilan digital.
5. IF semua field media sosial pada profil cabang bernilai null, THEN THE System SHALL tidak menampilkan seksi media sosial pada nota transaksi.
6. THE System SHALL memastikan tampilan nota transaksi tetap rapi dan terbaca dengan baik pada mode cetak (print CSS) baik dengan maupun tanpa informasi media sosial.

---

## Ringkasan Ketergantungan Antar Phase

```
Phase 1 (Data Master: Pelanggan & Sparepart)
  └─► Phase 2 (Pembelian & Nota: Restock + Indent)
        └─► Phase 3 (Korporat & Tagihan Borongan)
Phase 4 (Profil & Nota)  ← independen, dapat paralel dengan Phase 2 atau 3
```

Phase 1 adalah fondasi yang harus diselesaikan terlebih dahulu karena perubahan skema database pada tabel `customers` dan `spareparts` akan digunakan oleh semua phase berikutnya. Phase 4 bersifat independen dan dapat dikerjakan kapan saja.
