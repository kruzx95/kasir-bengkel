# Rencana Perbaikan Alur Korporat

## Latar Belakang

Ada dua celah utama pada alur korporat yang menghambat operasional:

1. **Tidak ada cara tambah kendaraan baru langsung dari menu Korporat** — Pengguna harus keluar ke menu Pelanggan dulu, tambah pelanggan baru, kemudian kembali ke menu Korporat untuk di-assign. Tidak efisien.
2. **Tidak ada indikasi visual di form transaksi baru** — Ketika Kasir memilih pelanggan yang merupakan kendaraan korporat, tidak ada tanda jelas nama PT-nya, sehingga Kasir bisa salah set status pembayaran.

> [!NOTE]
> **Piutang tidak muncul** bukan karena bug, tapi karena memang belum ada kendaraan yang di-assign ke PT manapun (A3). Setelah kendaraan terdaftar dan transaksi dibuat dengan status `PENDING_CORPORATE`, piutang akan otomatis muncul di halaman tagihan.

---

## Proposed Changes

---

### Perbaikan 1 — Tambah Kendaraan Langsung dari Tab Kendaraan Korporat

#### [MODIFY] [TagihanClient.tsx](file:///home/kruza/Documents/irian-motor/src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx)
- Tambahkan state `addVehicleModalOpen: boolean`
- Tambahkan tombol **"+ Tambah Kendaraan Baru"** di header panel "Kendaraan Terdaftar"
- Render `CustomerFormModal` dengan props:
  - `branchId={corporate.branch.id}` (agar terikat ke cabang PT)
  - `initialCorporateId={corporate.id}` (agar langsung ter-assign ke PT ini setelah disimpan)
- Setelah modal submit sukses → reload halaman agar daftar kendaraan ter-refresh

#### [NEW] Server Action: `createCorporateVehicle` di `corporate.ts`
- Server action baru yang memanggil `createCustomer` + langsung melakukan `assignCustomerToCorporate`
- Menerima semua field kendaraan + `corporateCustomerId` yang sudah pasti

---

### Perbaikan 2 — Tampilkan Nama PT di Form Transaksi Baru

#### [MODIFY] [NewTransactionClient.tsx](file:///home/kruza/Documents/irian-motor/src/app/kasir/transaksi/baru/NewTransactionClient.tsx)
- Tambahkan prop `corporates: { id: string; name: string }[]` yang berisi daftar PT aktif
- Saat pelanggan dipilih & `isSelectedCorporate === true`, tampilkan badge/banner:
  ```
  🏢 Kendaraan Korporat — [Nama PT]
  Status transaksi: Piutang Korporat (PENDING_CORPORATE)
  ```
- Badge berwarna biru/violet agar mudah terlihat

#### [MODIFY] [kasir/transaksi/baru/page.tsx](file:///home/kruza/Documents/irian-motor/src/app/kasir/transaksi/baru/page.tsx)
- Fetch `getCorporateCustomers()` dan teruskan ke `NewTransactionClient`

#### [MODIFY] (Opsional) [admin/transaksi/baru/AdminNewTransactionClient.tsx](file:///home/kruza/Documents/irian-motor/src/app/admin/transaksi/baru/AdminNewTransactionClient.tsx)
- Tambahkan indikator serupa untuk Admin

---

## Open Questions

> [!IMPORTANT]
> **Setelah kendaraan baru ditambahkan dari menu Korporat**, apakah halaman harus auto-reload penuh (`window.location.reload()`) atau cukup refresh daftar kendaraan secara in-place (tanpa reload)?

---

## Verification Plan

### Automated Tests
- `npx tsc --noEmit` ✅

### Manual Verification
1. Masuk ke menu Korporat → klik tombol Tagihan → tab Kendaraan
2. Klik **"+ Tambah Kendaraan Baru"** → isi form → simpan
3. Kendaraan baru langsung muncul di daftar "Kendaraan Terdaftar"
4. Buka menu Transaksi Baru → pilih kendaraan korporat → pastikan muncul badge nama PT-nya
5. Submit transaksi → cek tagihan korporat → piutang muncul
