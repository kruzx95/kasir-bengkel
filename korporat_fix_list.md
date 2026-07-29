# 🛠️ DAFTAR PERBAIKAN MENU KORPORAT

> **Berdasarkan**: Audit Lapangan — 29 Juli 2026  
> **Status Awal**: Fungsional ~80-85%, beberapa celah perlu diperbaiki  
> **Versi Codebase**: Phase 5 (Post-Implementation)

---

## 📊 Ringkasan Temuan

| # | Temuan | Prioritas | Status |
|---|---|---|---|
| 1 | Filter jasa di invoice cetak (`hideServiceOnInvoice`) tidak efektif | 🔴 Tinggi | ✅ Selesai |
| 2 | Tombol "Batalkan" (void) terlihat oleh Kasir di tab Riwayat | 🟠 Sedang | ✅ Selesai |
| 3 | Halaman Bukti Pembayaran tidak bisa diakses Kasir | 🟠 Sedang | ✅ Selesai |
| 4 | Dead code `handleSettle` lama masih ada | 🟢 Rendah | ✅ Selesai |

---

## 🔴 Bug #1 — Filter Jasa di Invoice Cetak Tidak Berfungsi

### Deskripsi Masalah

Saat Admin/Kasir mencetak **Invoice Tagihan Korporat**, semua item transaksi (termasuk jasa servis) ditampilkan tanpa memperhatikan flag `hideServiceOnInvoice` yang sudah dikonfigurasi pada master data korporat.

**Padahal alur yang benar:**
- Jika `corporate.hideServiceOnInvoice === true` → item bertipe `SERVICE` **TIDAK** boleh muncul di invoice print.
- Item bertipe `SPAREPART` tetap tampil dengan harga normal.

### Letak Bug

**File**: `src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx`  
**Baris**: ~474 (bagian render item di print section)

```tsx
// ❌ SEBELUM (tidak ada filter):
{tx.items.map((item, i) => (
  <tr key={i}>
    <td>{item.itemName}</td>
    ...
  </tr>
))}
```

### Solusi yang Diperlukan

```tsx
// ✅ SESUDAH (dengan filter hideServiceOnInvoice):
{tx.items
  .filter(item =>
    billingData?.corporate?.hideServiceOnInvoice
      ? item.itemType !== 'SERVICE'
      : true
  )
  .map((item, i) => (
    <tr key={i}>
      <td>{item.itemName}</td>
      ...
    </tr>
  ))
}
```

### Dampak di Lapangan

> ⚠️ PT yang telah mengkonfigurasi "Sembunyikan Jasa di Invoice" tetap menerima invoice dengan rincian jasa di dalamnya. Hal ini bisa menyebabkan **dispute tagihan** dengan klien korporat.

### File yang Perlu Diubah

- `src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx` — tambahkan filter `.filter()` pada render item di blok `print:block`

---

## 🟠 Bug #2 — Tombol "Batalkan" Terlihat oleh Kasir di Tab Riwayat Pembayaran

### Deskripsi Masalah

Di tab **Riwayat Pembayaran** pada halaman tagihan korporat, kolom "Aksi" menampilkan tombol **"Batalkan"** kepada **semua role** termasuk Kasir.

Memang di sisi server action (`voidCorporatePayment`) sudah ada guard `isAdmin()` sehingga Kasir tidak dapat benar-benar melakukan void. Namun di sisi UI tidak ada pembatasan — Kasir yang menekan tombol tersebut akan mendapatkan **error alert** yang membingungkan.

### Letak Bug

**File**: `src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx`  
**Baris**: ~656-674 (render kolom Aksi di tabel riwayat)

```tsx
// ❌ SEBELUM (semua role lihat tombol Batalkan):
{!row.voidedAt && (
  <button onClick={() => handleVoidPayment(row.id)}>
    Batalkan
  </button>
)}
```

### Solusi yang Diperlukan

Komponen `TagihanClient` perlu menerima prop `isAdmin: boolean` dari server page, kemudian kondisikan visibilitas tombol:

```tsx
// ✅ SESUDAH (hanya Admin yang melihat tombol Batalkan):
{!row.voidedAt && isAdmin && (
  <button onClick={() => handleVoidPayment(row.id)}>
    Batalkan
  </button>
)}
```

### File yang Perlu Diubah

1. `src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx` — tambahkan prop `isAdmin?: boolean`, kondisikan tombol Batalkan
2. `src/app/admin/korporat/[id]/tagihan/page.tsx` — teruskan `isAdmin={isAdmin(session)}`
3. `src/app/kasir/korporat/[id]/tagihan/page.tsx` — teruskan `isAdmin={false}`

---

## 🟠 Bug #3 — Halaman Bukti Pembayaran Tidak Bisa Diakses Kasir

### Deskripsi Masalah

Halaman cetak bukti pembayaran (`/admin/korporat/[id]/pembayaran/[paymentId]`) dikunci hanya untuk Admin:

```ts
// ❌ SEBELUM:
if (!session || session.role !== 'ADMIN') redirect('/login')
```

Sementara itu, link **"Lihat Bukti"** di tab Riwayat Pembayaran (`TagihanClient.tsx`) sudah mengarah ke path tersebut dan bisa diklik oleh Kasir.

**Akibatnya**: Kasir yang mencoba melihat atau mencetak bukti pembayaran akan diredirect ke halaman login — pengalaman yang sangat membingungkan.

### Letak Bug

**File**: `src/app/admin/korporat/[id]/pembayaran/[paymentId]/page.tsx`  
**Baris**: 17

```ts
// ❌ SEBELUM:
if (!session || session.role !== 'ADMIN') redirect('/login')
```

### Solusi yang Diperlukan

```ts
// ✅ SESUDAH (Admin dan Kasir boleh lihat bukti bayar):
if (!session || (session.role !== 'ADMIN' && session.role !== 'KASIR')) redirect('/login')
```

### File yang Perlu Diubah

- `src/app/admin/korporat/[id]/pembayaran/[paymentId]/page.tsx` — longgarkan role guard agar Kasir bisa akses

---

## 🟢 Perbaikan #4 — Hapus Dead Code `handleSettle`

### Deskripsi Masalah

Fungsi `handleSettle` (baris ~153 di `TagihanClient.tsx`) merupakan sisa dari implementasi lama yang masih memanggil `settleCorporateBilling` dengan metode bayar yang di-hardcode `'CASH'` tanpa meminta konfirmasi metode pembayaran dari user.

Fungsi ini **sudah tidak terhubung ke tombol apapun** di UI (sudah digantikan oleh `handlePayFull` dan `PaymentModal`), tetapi masih ada di codebase dan mengimpor action yang tidak lagi digunakan.

```tsx
// ❌ Fungsi ini sudah tidak dipakai (dead code):
const handleSettle = () => {
  if (!confirm(`Tandai semua tagihan sebagai LUNAS? ...`)) return
  startTransition(async () => {
    const res = await settleCorporateBilling(corporate.id, startDate, endDate)
    ...
  })
}
```

### Solusi yang Diperlukan

1. Hapus fungsi `handleSettle` dari `TagihanClient.tsx`
2. Hapus import `settleCorporateBilling` dari baris 7 jika tidak digunakan di tempat lain

### File yang Perlu Diubah

- `src/app/admin/korporat/[id]/tagihan/TagihanClient.tsx` — hapus `handleSettle` dan import terkait

---

## 📋 Urutan Eksekusi yang Disarankan

```
Tahap 1 (Kritis — Langsung Kerjakan):
  ✏️ Bug #1: Filter hideServiceOnInvoice di invoice print
  ✏️ Bug #3: Izinkan Kasir akses halaman bukti pembayaran

Tahap 2 (UX — Kerjakan Segera):
  ✏️ Bug #2: Sembunyikan tombol "Batalkan" dari Kasir (+ props isAdmin)

Tahap 3 (Cleanup — Opsional):
  ✏️ Perbaikan #4: Hapus dead code handleSettle
```

---

## ✅ Definition of Done

- [ ] Invoice cetak korporat tidak menampilkan item jasa jika `hideServiceOnInvoice = true`
- [ ] Kasir tidak melihat tombol "Batalkan" di tab Riwayat Pembayaran
- [ ] Kasir dapat membuka dan mencetak halaman Bukti Pembayaran
- [ ] Tidak ada TypeScript error setelah perubahan (`npx tsc --noEmit` ✅)
- [ ] Semua skenario uji di [BLUEPRINT_KORPORAT.md](file:///home/kruza/Documents/irian-motor/docs/BLUEPRINT_KORPORAT.md) (Skenario 1-5) tetap lulus
