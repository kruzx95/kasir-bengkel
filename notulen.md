Notulen 24 juli
-ketika input transaksi, odometer otomatis tampil (buat logika sync terbaru) (DONE)
-odometer tidak tampil di nota (DONE)
-revisi nama cabang di nota (done) 
-kasir harus punya fitur preview nita seperti admin (done)
-buat stock gudang (DONE - 27 Juli 2026)
-input nama barang manual ketika input po baru (done)
-kenaikan harga di input po baru (beri tanda alret untuk barang yg naik harga)
-fix filter cabang tidak muncul setelah input po
-input po masuk ny ke stock gudang (DONE - 27 Juli 2026)
-buat laporan barang indent terpisah

## Update 27 Juli 2026 - Warehouse Stock Management ✅
✅ Database schema updated (warehouseStock, minStock, minWarehouseStock)
✅ Migration applied successfully
✅ Backend actions created (stock-transfer.ts - for future use)
✅ Indent receive logic updated (barang masuk ke gudang)
✅ Menu "Stock Gudang" created (menampilkan stock gudang)
✅ Menu "Stock Toko" created (menampilkan stock toko) - 27 Juli 2026 sore
✅ Sidebar navigation updated

**Alur Stock:**
1. Barang Masuk (Restock/PO) → Stock GUDANG naik (warehouseStock++)
2. Stock Gudang bisa dilihat di menu "Stock Gudang"
3. Stock Toko bisa dilihat di menu "Stock Toko"
4. Admin bisa transfer gudang→toko (fitur transfer tersedia jika diperlukan)
5. Transaksi → Stock TOKO berkurang (kasir unchanged)

**Perbedaan Menu:**
- **Sparepart**: Master data sparepart (CRUD, harga, info produk)
- **Stock Toko**: View & monitor stock yang siap dijual di toko
- **Stock Gudang**: View & monitor stock yang ada di gudang
- **Barang Masuk**: Input restock/PO baru

## Penjelasan Lengkap: Stock Gudang vs Sparepart Stock

### 1. SPAREPART (Master Data)
**Sumber Data:**
- ✅ Input manual via form (createSparepart)
- ✅ Import Excel (.xlsx/.xls)
- ✅ Input otomatis saat buat PO baru dengan item manual

**Field Stock di Sparepart:**
- `stock` = Stock TOKO (berkurang saat transaksi)
- `warehouseStock` = Stock GUDANG (bertambah dari barang masuk)
- `minStock` = Minimum stock toko
- `minWarehouseStock` = Minimum stock gudang

**Karakteristik:**
- Ini adalah MASTER DATA produk
- Berisi informasi: nama, SKU, harga beli, harga jual, merk, ukuran, dll
- Bisa dibuat tanpa ada barang masuk sama sekali
- Stock awal bisa di-set manual saat input/import

### 2. STOCK GUDANG (View/Display)
**Sumber Data:**
- ✅ Menampilkan SEMUA sparepart yang ada di master data
- ✅ Menampilkan field `warehouseStock` dari setiap sparepart

**Alur Stock Gudang:**
```
1. Menu "Stock Gudang" menampilkan SEMUA sparepart dari master data
2. Setiap sparepart punya 2 angka stock:
   - warehouseStock (stock gudang) = awalnya 0
   - stock (stock toko) = dari input manual/import
3. Saat barang PO diterima → warehouseStock naik
4. Stock gudang bisa dilihat untuk semua item
```

**Karakteristik:**
- Menampilkan SEMUA sparepart dari master data
- Setiap sparepart punya field `warehouseStock` (awalnya 0)
- `warehouseStock` HANYA naik dari penerimaan barang (receiveIndentOrder)
- Jadi di menu "Stock Gudang" akan terlihat:
  - Item dengan warehouseStock = 0 (belum ada barang masuk)
  - Item dengan warehouseStock > 0 (sudah pernah terima barang)

### 3. ALUR LENGKAP

**Scenario 1: Input Sparepart Manual**
```
Admin → Master Sparepart → Tambah Baru
- Isi: nama, harga, stock TOKO (optional)
- warehouseStock = 0 (karena belum ada barang masuk)
- Sparepart terdaftar di master data
- Stock gudang masih kosong
```

**Scenario 2: Import Excel Sparepart**
```
Admin → Master Sparepart → Import Excel
- Upload file dengan kolom: nama, harga_jual, harga_beli, stok
- System buat/update sparepart di semua cabang
- Field `stock` diisi dari Excel
- Field `warehouseStock` = 0 (belum ada barang masuk)
```

**Scenario 3: PO → Barang Masuk → Stock Gudang**
```
Admin → Buat PO Baru
- Pilih sparepart atau input manual (auto create sparepart baru)
- PO tersimpan dengan status PENDING

Saat barang datang:
Admin → Terima Barang PO
- Input qty diterima & harga aktual
- System jalankan: warehouseStock += qty diterima
- buyPrice diupdate ke harga aktual

Stock Gudang sekarang:
Admin → Stock Gudang
- Tampil sparepart dengan warehouseStock yang baru naik
```

### KESIMPULAN & JAWABAN PERTANYAAN

**Q: Mengapa di Stock Gudang sudah ada nama/item sparepart?**
**A:** Karena menu "Stock Gudang" menampilkan SEMUA sparepart dari master data, bukan hanya yang punya stock gudang.

**Penjelasan:**
- Menu "Stock Gudang" = `getSpareparts()` = query SEMUA sparepart dari database
- Setiap sparepart punya 2 field stock: `stock` (toko) dan `warehouseStock` (gudang)
- Jadi yang tampil adalah:
  - ✅ Sparepart dari input manual → warehouseStock = 0, stock = nilai input
  - ✅ Sparepart dari import Excel → warehouseStock = 0, stock = nilai Excel
  - ✅ Sparepart yang sudah terima PO → warehouseStock > 0

**Perbedaan Isi Konten:**

| Menu | Sumber Item | Stock Gudang (warehouseStock) | Stock Toko (stock) |
|------|-------------|-------------------------------|-------------------|
| **Sparepart (Master)** | Input manual + Import Excel + Auto-create dari PO | Default 0 | Bisa diisi manual/import |
| **Stock Gudang** | Query semua sparepart (sama seperti master) | Dari barang masuk PO | Tampil tapi tidak bisa edit |

**Kesimpulan:**
- ❌ **BUKAN**: Stock gudang menampilkan item berbeda dari master sparepart
- ✅ **BENAR**: Stock gudang menampilkan item SAMA (semua sparepart), tapi fokus ke kolom `warehouseStock`
- ❌ **BUKAN**: warehouseStock bisa diinput manual
- ✅ **BENAR**: warehouseStock HANYA naik dari penerimaan barang PO

**Struktur Menu Sekarang (setelah penambahan Stock Toko):**
- **Menu Sparepart** = Kelola master data (CRUD sparepart, set harga, info produk)
- **Menu Stock Toko** = View & monitor stock yang siap dijual di toko (field `stock`)
- **Menu Stock Gudang** = View & monitor stock yang ada di gudang (field `warehouseStock`)

**Kejelasan:**
- Sekarang ada pemisahan yang jelas antara 3 menu
- Stock Toko dan Stock Gudang adalah 2 view yang berbeda dari data yang sama
- Tidak ada lagi kebingungan karena setiap menu punya fokus yang jelas

---

### KLARIFIKASI PENTING: Jumlah Item vs Total Unit Stock

**Pertanyaan: Item sparepart hanya 101, kenapa stock toko jadi 2569?**

**Jawaban:**
- **101** = Jumlah ITEM/PRODUK berbeda (jumlah sparepart yang terdaftar)
- **2569** = Total UNIT dari semua stock (jumlah keseluruhan barang)

**Contoh Ilustrasi:**

```
Sparepart (101 item):
1. Oli Mesin     → stock: 50 unit
2. Filter Oli    → stock: 30 unit  
3. Ban Luar      → stock: 25 unit
4. Ban Dalam     → stock: 20 unit
5. Kampas Rem    → stock: 15 unit
... (96 item lainnya dengan stock masing-masing)
---
Total Item: 101 produk berbeda
Total Stock: 50+30+25+20+15+... = 2569 unit
```

**Di Menu Stock Toko:**
- Statistik "Total Item" = 101 (jumlah produk)
- Statistik "Stock Toko" = 2569 (total unit semua produk)

**Kode yang Hitung Total Unit:**
```typescript
// Di StockTokoClient.tsx line 54
const totalStoreUnits = spareparts.reduce((sum, sp) => sum + sp.stock, 0)
```

Fungsi ini menjumlahkan field `stock` dari semua sparepart:
- Item 1: stock 50
- Item 2: stock 30
- Item 3: stock 25
- ... dst
- **Total = 2569 unit**

**Kesimpulan:**
- ✅ 101 = Jumlah jenis produk/sparepart
- ✅ 2569 = Total unit/qty dari semua produk
- Jadi TIDAK salah, ini cara hitung yang benar!

---

### PERTANYAAN LANJUTAN: Dari mana data Stock Toko (contoh: 2569)?

**Sumber Stock Toko (`stock` field) bisa dari 3 cara:**

1. **Input Manual di Menu Master Sparepart**
   ```
   Admin → Master Sparepart → Tambah Baru/Edit
   - Isi field "Stock" = 2569
   - Data tersimpan di database field `stock`
   ```

2. **Import Excel**
   ```
   Admin → Master Sparepart → Import Excel
   - File Excel kolom "stok" = 2569
   - System baca dan simpan ke field `stock`
   - Kode di: src/app/api/import/spareparts/route.ts (line 73, 92)
   ```

3. **Restock/Barang Masuk (METODE LAMA - sebelum ada warehouse)**
   ```
   Sebelum implementasi warehouse stock (27 Juli 2026):
   - Barang masuk langsung ke `stock` (stock toko)
   - Setelah 27 Juli: barang masuk ke `warehouseStock` (stock gudang)
   ```

**Cara Cek Sumber Data:**

1. **Cek History Import:**
   - Lihat apakah ada import Excel yang dilakukan
   - Data import akan update field `stock` sesuai Excel

2. **Cek Restock Lama:**
   - Cek tabel `restocks` dan `restock_items`
   - Restock sebelum 27 Juli langsung naikkan `stock`
   - Restock setelah 27 Juli naikkan `warehouseStock`

3. **Cek Input Manual:**
   - Lihat log/history edit sparepart
   - Admin bisa langsung edit field stock

**Contoh Scenario Stock Toko = 2569:**

```
Kemungkinan 1: Import Excel
- Admin import file Excel dengan kolom "stok" = 2569
- System execute: stock = 2569, warehouseStock = 0

Kemungkinan 2: Input Manual
- Admin buat/edit sparepart, isi stock = 2569
- Data tersimpan langsung

Kemungkinan 3: Data Legacy
- Stock toko 2569 dari restock sebelum system warehouse diimplementasi
- Sebelumnya barang masuk langsung ke `stock`, bukan `warehouseStock`
```

**Kode yang Set Stock Toko:**

1. **Manual Input** (src/actions/sparepart.ts):
   - Line 138: `stock: formData.get('stock')` (create)
   - Line 195: `stock: validatedFields.data.stock` (update)

2. **Import Excel** (src/app/api/import/spareparts/route.ts):
   - Line 92: `stock: isNaN(stock) ? 0 : stock`

3. **Transaksi** (stock berkurang saat jual):
   - Saat transaksi, `stock` akan decrement
   - Jadi 2569 bisa jadi hasil: stock awal - total terjual

=alur menu korporat=
Alur Laporan Korporat
Mobil masuk --> Masukkan Data Mobil --> Melakukan Pengecekan & Service --> Mencatat Sparepart Terpakai dan Jasa --> Memberikan Nota Tagihan --> Data Tagihan Masuk ke Piutang Korporat