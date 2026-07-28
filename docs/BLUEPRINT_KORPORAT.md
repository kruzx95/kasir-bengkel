# 🏗️ BLUEPRINT PEROMBAKAN MENU KORPORAT

> **Project**: Irian Motor (Bengkel Multi-Cabang — Majalengka & Pekanbaru)
> **Tanggal Disusun**: 28 Juli 2026
> **Versi**: 1.0
> **Status**: Menunggu eksekusi (Act Mode)

---

## 📌 Latar Belakang & Alur Bisnis

### Alur Korporat yang Diinginkan
```
🚗 Mobil Masuk
   ↓
📋 Masukkan Data Mobil (ke customer korporat)
   ↓
🔧 Pengecekan & Service
   ↓
🧾 Catat Sparepart Terpakai + Jasa
   ↓
🧾 Berikan Nota Tagihan (per transaksi individual)
   ↓
💰 Akumulasi ke Piutang Korporat (belum dibayar)
   ↓
📅 Saatnya Siklus Tagihan → Cetak Invoice Korporat → Bayar (lunas / cicil)
```

### Konfirmasi Kebutuhan

| # | Kebutuhan | Keputusan |
|---|---|---|
| 1 | Nota otomatis vs manual | Dua-duanya: default PENDING_CORPORATE, ada tombol "Langsung Bayar" |
| 2 | Pembayaran | Dua mode: langsung bayar (COMPLETED) atau piutang (PENDING_CORPORATE) |
| 3 | Cicilan | Lunas sekaligus + partial payment, sisa tetap PENDING_CORPORATE |
| 4 | Stok sparepart | Keluar dari stok toko **saat service selesai**, tidak menunggu pelunasan |
| 5 | Multi-cabang | Korporat terikat 1 cabang (kota), tidak perlu ubah |
| 6 | Sembunyikan jasa di invoice | Cukup filter visual di invoice (`hideServiceOnInvoice` flag), harga tidak berubah |
| 7 | Akses kasir | Kasir Majalengka + Pekanbaru boleh akses menu Korporat |
| A | Data master korporat | Tidak diubah (nama, PIC, NPWP, siklus tetap) |
| B | Asosiasi customer ↔ korporat | Tetap di tab "Kelola Kendaraan" |
| C | Role | Kasir boleh akses (tidak admin-only). Hapus korporat tetap admin-only. |
| D | Riwayat lunas | Tambah tab "Riwayat Pembayaran" |

---

## 1. 📐 Perubahan Skema Database (Migration Baru)

### a. Tambah field di `CorporateCustomer`
```prisma
model CorporateCustomer {
  // ... field existing ...
  hideServiceOnInvoice Boolean @default(false) @map("hide_service_on_invoice")
}
```

### b. Tabel baru `CorporatePayment` (untuk cicilan & histori)
```prisma
model CorporatePayment {
  id                  String           @id @default(cuid())
  corporateCustomerId String           @map("corporate_customer_id")
  branchId            String           @map("branch_id")
  amount              Float
  paymentMethod       PaymentMethod    @map("payment_method")
  notes               String?
  paidAt              DateTime         @default(now()) @map("paid_at")
  createdById         String           @map("created_by_id")
  periodStart         DateTime         @map("period_start")  // untuk filter periode tagihan
  periodEnd           DateTime         @map("period_end")
  voidedAt            DateTime?        @map("voided_at")
  voidedById          String?          @map("voided_by_id")
  voidReason          String?          @map("void_reason")
  createdAt           DateTime         @default(now())

  corporateCustomer   CorporateCustomer @relation(fields: [corporateCustomerId], references: [id])
  branch              Branch            @relation(fields: [branchId], references: [id])
  createdBy           User              @relation("CorporatePaymentCreatedBy", fields: [createdById], references: [id])
  voidedBy            User?             @relation("CorporatePaymentVoidedBy", fields: [voidedById], references: [id])
  transactionLinks    CorporatePaymentTransaction[]

  @@index([corporateCustomerId])
  @@index([branchId])
  @@index([paidAt])
  @@map("corporate_payments")
}

model CorporatePaymentTransaction {
  id            String          @id @default(cuid())
  paymentId     String          @map("payment_id")
  transactionId String          @map("transaction_id")
  amount        Float           // porsi bayar dari transaksi ini
  payment       CorporatePayment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  transaction   Transaction      @relation(fields: [transactionId], references: [id])

  @@unique([paymentId, transactionId])
  @@map("corporate_payment_transactions")
}
```

### c. Tambah field partial-payment di `Transaction`
```prisma
model Transaction {
  // ... field existing ...
  paidAmount         Float  @default(0) @map("paid_amount")  // akumulasi pembayaran korporat
  // paidAmount < total → masih PENDING_CORPORATE
  // paidAmount == total → lunas
  // paidAmount > total → invalid (divalidasi di action)
  // relasi baru:
  corporatePaymentLinks CorporatePaymentTransaction[]
}
```

### d. Relasi User ↔ CorporatePayment
```prisma
model User {
  // ... existing
  corporatePaymentsCreated CorporatePayment[] @relation("CorporatePaymentCreatedBy")
  corporatePaymentsVoided  CorporatePayment[] @relation("CorporatePaymentVoidedBy")
}
```

### e. Relasi CorporateCustomer ↔ CorporatePayment
```prisma
model CorporateCustomer {
  // ... existing
  payments CorporatePayment[]
}
```

---

## 2. ⚙️ Server Action Baru & Yang Diubah

### File: `src/actions/corporate.ts`

**Existing (tetap ada, mungkin update minor):**
- `getCorporateCustomers()` → tambah field `hideServiceOnInvoice` & `totalUnpaidAmount` (running piutang)
- `getCorporateCustomerById(id)` → tetap
- `createCorporateCustomer()` → handle field baru `hideServiceOnInvoice`
- `updateCorporateCustomer()` → handle field baru
- `deleteCorporateCustomer()` → tetap (soft delete, **admin-only**)
- `assignCustomerToCorporate()` → tetap
- `getCorporateBilling()` → tetap (untuk PENDING_CORPORATE), tambah info `paidAmount` per transaksi
- `settleCorporateBilling()` → **DIROMBAK** jadi wrapper, panggil `createCorporatePayment` dengan amount penuh

**Baru:**
- `getCorporatePaymentHistory(corporateCustomerId, limit?, offset?)` → list pembayaran
- `getCorporatePaymentById(paymentId)` → detail 1 pembayaran + alokasi
- `createCorporatePayment({ corporateCustomerId, periodStart, periodEnd, amount, paymentMethod, notes, transactionAllocations: [{transactionId, amount}] })` → catat pembayaran + alokasi FIFO
- `voidCorporatePayment(paymentId, reason)` → batalkan pembayaran (admin only), restore piutang
- `getCorporateStats(corporateCustomerId)` → summary: total transaksi 6 bulan terakhir, piutang berjalan, total terbayar

### File: `src/actions/transaction.ts`

**Update `createTransaction`:**
- **PENTING**: Pindahkan/pastikan logika `decrementStock` agar **SELALU jalan** saat transaksi dibuat (baik COMPLETED maupun PENDING_CORPORATE). Stok keluar di kasir setelah nota dibuat, bukan saat pelunasan.
- Validasi: kalau `customerId` punya `corporateCustomerId`, status = `PENDING_CORPORATE`, `paymentMethod` = `null` (karena belum bayar)
- Set `paidAmount: 0` di transaksi baru
- Sediakan opsi override "Langsung Bayar" yang akan set status = COMPLETED, paymentMethod normal

### File: `src/lib/session.ts` atau role check
- Update role check di `corporate.ts`: ganti `session.role !== 'ADMIN'` jadi cek role-based:
  - Read/list/show: ADMIN + KASIR boleh
  - Create/edit korporat: ADMIN + KASIR boleh
  - Delete korporat: ADMIN only
  - Bayar/cicil: ADMIN + KASIR boleh
  - Void payment: ADMIN only

---

## 3. 🖥️ Halaman UI Baru & Yang Diubah

### A. Halaman Daftar Korporat (`/admin/korporat`)
- **Update** form modal: tambah checkbox "Sembunyikan Jasa di Invoice"
- Tambah kolom di tabel: `Invoice` (badge: "Tampil Jasa" / "Tanpa Jasa")
- Counter piutang total: ubah `Tagihan Berjalan` jadi `Piutang Berjalan` (seimbang dengan `paidAmount`)
- Tambah search bar (by nama korporat/PIC/plat nomor)
- Role guard: tampil untuk ADMIN + KASIR

### B. Halaman Detail Korporat (`/admin/korporat/[id]/tagihan`)
**3 Tab (saat ini 2):**

#### Tab 1: **Tagihan Berjalan** ✅ (existing, update)
- Filter tanggal seperti sekarang
- Kolom baru: `Sudah Dibayar` di setiap transaksi (kalau `paidAmount > 0`)
- Tombol "Bayar Sekarang" (buka modal pembayaran)
- Modal pembayaran: input nominal, metode bayar, catatan, alokasi otomatis FIFO ke transaksi terlama (user bisa override alokasi)
- Tombol "Tandai Lunas Penuh" seperti sekarang (panggil `createCorporatePayment` dengan amount = sisa piutang)

#### Tab 2: **Kelola Kendaraan** ✅ (existing, tidak berubah)

#### Tab 3: **Riwayat Pembayaran** 🆕
- Tabel: Tanggal Bayar, Periode, Nominal, Metode, Petugas, Status (Aktif/Void), Aksi (Detail/Cetak/Batal)
- Filter berdasarkan periode (tahun/bulan) & status
- Pagination
- Tombol "Cetak Bukti Pembayaran" → buka halaman print
- Tombol "Batalkan" (admin only, dengan konfirmasi)

### C. Halaman Baru: Print Bukti Pembayaran (`/admin/korporat/[id]/pembayaran/[paymentId]/cetak`)
- Layout print-friendly: kop, info korporat, periode, daftar transaksi yang dibayar, total, tanda tangan
- Mirip invoice tapi untuk bukti lunas

### D. Update Form Customer (`src/components/kasir/CustomerFormModal.tsx`)
- Tambah field dropdown "Korporat" (optional)
- Munculkan hanya di mode admin/kasir
- List korporat dari `getCorporateCustomers(currentBranchId)` saat modal dibuka
- Update `customer.ts` action untuk handle `corporateCustomerId`

### E. Update Transaksi (`src/app/admin/transaksi/baru/AdminNewTransactionClient.tsx` & `src/app/kasir/transaksi/baru/NewTransactionClient.tsx`)
- Tambah toggle/info: "Transaksi Korporat — Piutang" (auto-detect dari customer, non-editable)
- Tombol "Langsung Bayar" muncul untuk customer korporat (override jadi COMPLETED)
- Info di nota: "Status: Piutang Korporat (PT Maju Bersama)"

### F. Update Sidebar (`src/components/layout/Sidebar.tsx`)
- Menu "Korporat" muncul untuk role `KASIR` juga (tidak admin-only)

---

## 4. 🔒 Role & Permission Matrix

| Aksi | Admin | Kasir |
|---|---|---|
| Lihat daftar korporat | ✅ | ✅ |
| Buat/edit korporat | ✅ | ✅ |
| Hapus korporat (soft) | ✅ | ❌ (audit) |
| Asosiasi customer ↔ korporat | ✅ | ✅ |
| Lihat tagihan berjalan | ✅ | ✅ |
| Bayar / cicil | ✅ | ✅ |
| Lihat riwayat pembayaran | ✅ | ✅ |
| Batalkan pembayaran (void) | ✅ | ❌ (audit) |
| Cetak invoice / bukti bayar | ✅ | ✅ |

---

## 5. 📋 Urutan Eksekusi (Bertahap, Aman)

### **Tahap 1: Fondasi Database & Action** (inti)
1. ✏️ Buat migration: tambah `hideServiceOnInvoice`, buat tabel `CorporatePayment` & `CorporatePaymentTransaction`, tambah `paidAmount` di `Transaction`, tambah relasi User
2. ✏️ Update `prisma/schema.prisma`
3. ✏️ Jalankan `npx prisma migrate dev --name corporate_phase5_payment`
4. ✏️ Generate prisma client
5. ✏️ Update `src/actions/transaction.ts` → stok SELALU keluar saat transaksi dibuat
6. ✏️ Update `src/actions/corporate.ts` → tambah action baru (`createCorporatePayment`, `getCorporatePaymentHistory`, `voidCorporatePayment`, dll)
7. ✏️ Update role check di corporate actions

### **Tahap 2: UI Daftar & Modal Form** (quick win)
8. ✏️ Update `CorporateFormModal.tsx` → checkbox "Sembunyikan Jasa"
9. ✏️ Update `KorporatClient.tsx` → kolom baru, search bar
10. ✏️ Update `Sidebar.tsx` → tampil untuk kasir

### **Tahap 3: Tagihan Berjalan & Pembayaran** (fitur utama)
11. ✏️ Update `TagihanClient.tsx` → tambah tombol "Bayar", modal pembayaran, kolom `Sudah Dibayar`
12. ✏️ Update tampilan invoice print → filter item jasa kalau `hideServiceOnInvoice=true`

### **Tahap 4: Riwayat & Print Bukti Bayar**
13. ✏️ Tambah tab "Riwayat Pembayaran" di `TagihanClient.tsx`
14. ✏️ Buat halaman `/admin/korporat/[id]/pembayaran/[paymentId]/cetak/page.tsx` + PrintButton
15. ✏️ Implementasi `voidCorporatePayment` (admin only)

### **Tahap 5: Integrasi Customer & Transaksi**
16. ✏️ Update `CustomerFormModal.tsx` → dropdown korporat
17. ✏️ Update `customer.ts` action → handle `corporateCustomerId`
18. ✏️ Update `NewTransactionClient.tsx` & `AdminNewTransactionClient.tsx` → info "Piutang Korporat", tombol "Langsung Bayar"
19. ✏️ Update notifikasi: `notification.ts` bisa handle "transaksi korporat baru"

### **Tahap 6: Testing & Edge Cases**
20. ✏️ Test: buat korporat → assign customer → transaksi → bayar sebagian → lunas
21. ✏️ Test: invoice tanpa jasa (hideServiceOnInvoice)
22. ✏️ Test: multi-cabang (korporat Majalengka vs Pekanbaru)
23. ✏️ Test: batalkan pembayaran → piutang kembali
24. ✏️ Test: kasir vs admin permission

---

## 6. ⚠️ Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Migration gagal karena data existing | Backup DB dulu sebelum migrate. `paidAmount` di-backfill `0` (default) — query `Transaction WHERE status='PENDING_CORPORATE' AND paidAmount=0` valid |
| Stok tidak keluar untuk PENDING_CORPORATE | Cek `transaction.ts` existing. Kalau memang sudah decrement di create, tidak ada masalah. Kalau belum, perlu hati-hati agar stok lama tidak double-count |
| `voidCorporatePayment` membingungkan pembukuan | Hanya admin. Field `voidedById`, `voidedAt`, `voidReason` di CorporatePayment untuk jejak audit |
| Concurrent payment (2 kasir bayar bareng) | Pakai `prisma.$transaction` di `createCorporatePayment` dengan row-level lock (Prisma interactive transaction) |
| Print invoice terlalu panjang | Sudah ada grouping per tanggal ✅ |
| Validasi `paidAmount > total` | Validasi Zod + check di `createCorporatePayment` (throw error jika overpay) |
| Customer pindah korporat tapi masih ada PENDING_CORPORATE | Untuk sekarang: biarkan, piutang tetap di korporat asal. Bisa ditambah validasi di tahap selanjutnya. |

---

## 7. 📁 File yang Akan Berubah / Dibuat

### Berubah:
- `prisma/schema.prisma`
- `src/actions/corporate.ts`
- `src/actions/transaction.ts`
- `src/actions/customer.ts` (minor, tambah handle corporate)
- `src/app/admin/korporat/KorporatClient.tsx`
- `src/app/admin/korporat/CorporateFormModal.tsx`
- `src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx`
- `src/app/admin/korporat/[id]/tagihan/page.tsx` (jika perlu)
- `src/app/admin/transaksi/baru/AdminNewTransactionClient.tsx`
- `src/app/kasir/transaksi/baru/NewTransactionClient.tsx`
- `src/components/kasir/CustomerFormModal.tsx`
- `src/components/layout/Sidebar.tsx`

### Dibuat Baru:
- `prisma/migrations/XXXXXX_corporate_phase5_payment/`
- `src/app/admin/korporat/[id]/pembayaran/[paymentId]/cetak/page.tsx`
- `src/app/admin/korporat/[id]/pembayaran/[paymentId]/cetak/PrintButton.tsx`
- `src/app/admin/korporat/[id]/tagihan/PaymentModal.tsx` (komponen modal pembayaran)
- `src/app/admin/korporat/[id]/tagihan/PaymentHistory.tsx` (tab riwayat)

---

## 8. ✅ Definition of Done (per tahap)

- **Tahap 1**: `npx prisma migrate dev` sukses, type-check tidak error
- **Tahap 2**: Form tambah korporat ada checkbox baru, sidebar tampil di kasir
- **Tahap 3**: Bisa bayar lunas & partial, stok sparepart berkurang di kasir (untuk PENDING_CORPORATE)
- **Tahap 4**: Tab riwayat tampil, bisa cetak bukti bayar, admin bisa void
- **Tahap 5**: Form customer ada dropdown korporat, transaksi korporat auto status PENDING_CORPORATE
- **Tahap 6**: Skenario 1-4 lulus manual test, permission kasir vs admin sesuai matriks

---

## 9. 🎯 Skenario Uji Manual

### Skenario 1: Korporat Standar (Tampil Jasa)
1. Buat korporat "PT Maju Bersama" (cabang Majalengka, siklus MONTHLY)
2. Asosiasi 2 customer
3. Buat transaksi service → status PENDING_CORPORATE, stok sparepart berkurang
4. Buka halaman Tagihan → tampil 2 transaksi
5. Bayar sebagian (cicil) → nominal < total, transaksi masih PENDING_CORPORATE, `paidAmount` terisi
6. Bayar lunas → status COMPLETED, `paidAmount == total`
7. Cek tab Riwayat → muncul 2 entry pembayaran

### Skenario 2: Korporat Tanpa Jasa di Invoice
1. Buat korporat dengan `hideServiceOnInvoice = true`
2. Transaksi yang ada item SERVICE → di invoice print, item jasa tidak muncul
3. Sparepart tetap tampil dengan harga normal

### Skenario 3: Multi-cabang
1. Buat korporat di Majalengka, tidak muncul di list korporat Pekanbaru
2. Customer korporat Majalengka, transaksi di kasir Pekanbaru → tidak boleh (customer tidak ditemukan di sana)

### Skenario 4: Void Payment (Admin Only)
1. Kasir tidak bisa lihat tombol "Batalkan" di Riwayat Pembayaran
2. Admin bisa void → modal konfirmasi + alasan → piutang transaksi kembali

### Skenario 5: Permission Kasir
1. Login sebagai kasir → menu Korporat tampil di sidebar
2. Bisa buat korporat baru ✅
3. Tidak bisa hapus (tombol tidak ada) ✅
4. Bisa bayar piutang ✅
5. Tidak bisa void payment ✅

---

## 10. 📝 Catatan Tambahan

- **Backup strategy**: Opsi A — langsung `prisma migrate dev` (dev environment, rollback via `migrate reset` jika gagal)
- **Backward compatibility**: Transaksi lama akan memiliki `paidAmount=0` dan `status=PENDING_CORPORATE` (sama seperti sekarang). Tampilan tetap konsisten.
- **Migration name**: `corporate_phase5_payment`
- **Branch kerja**: tetap di main (tidak perlu branch terpisah untuk eksekusi tahap awal)

---

**Dokumen ini siap dieksekusi. Tahap 1 akan dimulai dengan perubahan schema, lalu action, lalu UI bertahap.**