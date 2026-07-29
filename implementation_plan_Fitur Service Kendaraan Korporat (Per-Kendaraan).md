# Fitur Service Kendaraan Korporat (Per-Kendaraan)

## Deskripsi

Menambahkan alur kerja service **per kendaraan** di menu Korporat. Setiap kendaraan korporat bisa di-service, memilih sparepart dari stock toko, dan setelah service selesai muncul **tagihan/nota per kendaraan**.

Alur yang diinginkan:
1. Di tab **Kelola Kendaraan** → klik "Tambah Kendaraan" → kendaraan tersimpan
2. Setelah kendaraan ada → muncul tombol **"View / Service Kendaraan"** di setiap baris kendaraan
3. Klik tombol tersebut → **tab baru** terbuka (detail service kendaraan)
4. Di tab per-kendaraan: pilih jasa service + sparepart dari stock toko → stok otomatis berkurang
5. Setelah submit → muncul **nota/tagihan** untuk kendaraan tersebut (PENDING_CORPORATE)
6. Tagihan kendaraan muncul di tab Tagihan seperti biasa

---

## Perubahan yang Direncanakan

### 1. Tab Kendaraan (`TagihanClient.tsx`) — Tab "Kelola Kendaraan"

#### [MODIFY] [TagihanClient.tsx](file:///home/kruza/Documents/irian-motor/src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx)

- Di setiap baris kendaraan terdaftar (`assignedCustomers`), tambahkan tombol **"Service"** (icon Wrench) di samping tombol remove
- Klik tombol "Service" → buka `ServiceVehicleModal` (modal baru) yang sudah di-pre-fill dengan data kendaraan

---

### 2. Modal Service Kendaraan — **[NEW]** `ServiceVehicleModal.tsx`

File baru: `src/app/admin/korporat/[id]/tagihan/ServiceVehicleModal.tsx`

Modal ini berisi:
- **Header**: Info kendaraan (nama, plat, merk)
- **Pilih Mekanik** (opsional, dari list mekanik cabang)
- **Section Jasa Service**: Pilih dari list service + harga custom manual
- **Section Sparepart**: Cari & pilih dari sparepart (stock toko cabang), qty & harga otomatis terisi, ada validasi stok
- **Subtotal live** per item
- **Grand Total** langsung update
- **Odometer** input (opsional)
- **Catatan** (opsional)
- Tombol **Simpan & Buat Nota** → submit → create transaction dengan `status: PENDING_CORPORATE`

---

### 3. Server Action — `corporate.ts` atau `transaction.ts`

#### [MODIFY] [corporate.ts](file:///home/kruza/Documents/irian-motor/src/actions/corporate.ts)

Tambah function baru `createCorporateServiceTransaction`:
- Menerima: `customerId`, `corporateCustomerId`, `branchId`, items (service + sparepart), mekanik, odometer, catatan
- Memanggil `createTransaction` dengan `isCorporate: true` → status `PENDING_CORPORATE`
- Stok sparepart otomatis berkurang (sudah handled di `createTransaction`)
- Return: `{ success, invoiceNumber, transactionId }`

---

### 4. Action data fetching untuk Modal

Perlu data:
- **List jasa service** cabang → gunakan `getServices(branchId)` (sudah ada)
- **List sparepart** cabang dengan stok → gunakan `getSpareparts(branchId)` / `getStockToko`
- **List mekanik** cabang → gunakan `getMechanics(branchId)` (sudah ada)

Perlu dicek: apakah `getSpareparts` sudah include stok, atau perlu query berbeda.

---

### 5. Tagihan Per-Kendaraan (Nota)

Setelah service dibuat, nota bisa dilihat:
- Di tab **Tagihan** (filter tanggal → tampil seperti biasa, sudah per-kendaraan)
- Opsional: tambah "Lihat Nota" langsung di modal konfirmasi sukses

---

## Open Questions

> [!IMPORTANT]
> **Pertanyaan 1**: Setelah tombol "Service" diklik, apakah ingin **modal** yang terbuka di halaman yang sama, atau navigasi ke **halaman baru** per kendaraan?
> 
> Saat ini plan: **modal** (lebih cepat, tidak perlu halaman baru).

> [!IMPORTANT]
> **Pertanyaan 2**: Untuk harga service korporat — apakah sama dengan harga normal dari master service, atau bisa custom per korporat / per kendaraan?
>
> Saat ini plan: default dari harga master service, tapi **bisa diedit manual** di modal.

> [!IMPORTANT]
> **Pertanyaan 3**: Apakah setelah service selesai perlu **langsung print nota per kendaraan**, atau cukup muncul di tab Tagihan?
>
> Saat ini plan: muncul konfirmasi sukses + tombol "Lihat di Tab Tagihan".

> [!NOTE]
> **Sparepart source**: Berdasarkan kode yang ada, `createTransaction` sudah handle pengurangan stok dari tabel `sparepart` (stock toko). Ini akan digunakan langsung.

---

## Verification Plan

### Automated Tests
- Tidak ada unit test yang perlu dijalankan (Next.js project)

### Manual Verification
1. Buka menu Korporat → Tab Kelola Kendaraan
2. Verifikasi tombol "Service" muncul di setiap kendaraan terdaftar
3. Klik "Service" → modal terbuka dengan info kendaraan
4. Pilih jasa + sparepart → verifikasi total terhitung benar
5. Submit → verifikasi stok sparepart berkurang
6. Buka Tab Tagihan → filter tanggal hari ini → verifikasi transaksi muncul dengan status PENDING_CORPORATE
7. Cek kendaraan yang sama tidak bisa service sparepart melebihi stok
