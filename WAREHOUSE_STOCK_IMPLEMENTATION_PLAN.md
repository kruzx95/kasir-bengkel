# 📦 Implementation Plan: Warehouse Stock Management System

## 🎯 Overview
Sistem manajemen stock gudang dengan pemisahan stock toko dan gudang. Stock gudang akan terupdate berdasarkan input dari menu barang masuk (restock).

---

## 📊 Current System Analysis

### Existing Flow:
```
1. Restock dibuat → Stock langsung ke TOKO (Sparepart.stock)
2. Transaction terjadi → Stock TOKO berkurang
3. Tidak ada pemisahan antara stock toko dan gudang
```

### Current Schema:
```prisma
model Sparepart {
  stock  Int  @default(0)  // Stock TOKO saat ini
  // ... fields lain
}

model Restock {
  // Purchase order dari supplier
}

model RestockItem {
  quantity   Int     // Qty yang dibeli
  buyPrice   Float
}
```

---

## 🎨 New System Design

### Proposed Flow:
```
1. Barang Masuk (Restock) → Stock masuk ke GUDANG
2. Transfer Gudang → Toko → Stock pindah dari gudang ke toko
3. Transaction → Stock TOKO berkurang
4. Retur/Return → Stock TOKO kembali ke GUDANG
```

### Benefits:
- ✅ Tracking stock gudang dan toko terpisah
- ✅ Kontrol inventory lebih baik
- ✅ Audit trail transfer barang
- ✅ Laporan stock lebih detail
- ✅ Optimasi pengadaan barang

---

## 🗄️ Database Schema Changes

### 1. Add Warehouse Stock to Sparepart
```prisma
model Sparepart {
  id               String            @id @default(cuid())
  branchId         String            @map("branch_id")
  name             String
  sku              String?
  buyPrice         Float             @default(0) @map("buy_price")
  sellPrice        Float             @map("sell_price")
  
  // EXISTING: Stock di toko (display area)
  stock            Int               @default(0)
  
  // NEW: Stock di gudang
  warehouseStock   Int               @default(0) @map("warehouse_stock")
  
  // NEW: Minimum stock alert
  minStock         Int               @default(0) @map("min_stock")
  minWarehouseStock Int              @default(0) @map("min_warehouse_stock")
  
  unit             String            @default("pcs")
  isActive         Boolean           @default(true)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  // ... relasi lain
  stockTransfers   StockTransfer[]   @relation("SparepartTransfers")
  
  @@index([branchId], map: "spareparts_branch_id_fkey")
  @@map("spareparts")
}
```

### 2. Create StockTransfer Model
```prisma
model StockTransfer {
  id              String               @id @default(cuid())
  branchId        String               @map("branch_id")
  userId          String               @map("user_id")
  sparepartId     String               @map("sparepart_id")
  type            StockTransferType    // 'WAREHOUSE_TO_STORE', 'STORE_TO_WAREHOUSE'
  quantity        Int
  notes           String?
  transferDate    DateTime             @default(now()) @map("transfer_date")
  createdAt       DateTime             @default(now())
  
  branch          Branch               @relation(fields: [branchId], references: [id])
  user            User                 @relation(fields: [userId], references: [id])
  sparepart       Sparepart            @relation("SparepartTransfers", fields: [sparepartId], references: [id])
  
  @@index([branchId], map: "stock_transfers_branch_id_fkey")
  @@index([userId], map: "stock_transfers_user_id_fkey")
  @@index([sparepartId], map: "stock_transfers_sparepart_id_fkey")
  @@index([transferDate])
  @@map("stock_transfers")
}

enum StockTransferType {
  WAREHOUSE_TO_STORE  // Dari gudang ke toko
  STORE_TO_WAREHOUSE  // Retur dari toko ke gudang
}
```

### 3. Update Existing Relations
```prisma
model Branch {
  // ... existing fields
  stockTransfers   StockTransfer[]
}

model User {
  // ... existing fields
  stockTransfers   StockTransfer[]
}
```

---

## 📁 File Structure & Implementation

### Phase 1: Database Migration
**Files to Create:**
```
prisma/migrations/20260727_add_warehouse_stock/
  └─ migration.sql

Updated:
  └─ prisma/schema.prisma
```

**Migration SQL:**
```sql
-- Add warehouse stock columns to spareparts
ALTER TABLE `spareparts` 
  ADD COLUMN `warehouse_stock` INT NOT NULL DEFAULT 0,
  ADD COLUMN `min_stock` INT NOT NULL DEFAULT 0,
  ADD COLUMN `min_warehouse_stock` INT NOT NULL DEFAULT 0;

-- Create stock_transfers table
CREATE TABLE `stock_transfers` (
  `id` VARCHAR(191) NOT NULL,
  `branch_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `sparepart_id` VARCHAR(191) NOT NULL,
  `type` ENUM('WAREHOUSE_TO_STORE', 'STORE_TO_WAREHOUSE') NOT NULL,
  `quantity` INT NOT NULL,
  `notes` VARCHAR(191) NULL,
  `transfer_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `stock_transfers_branch_id_fkey`(`branch_id`),
  INDEX `stock_transfers_user_id_fkey`(`user_id`),
  INDEX `stock_transfers_sparepart_id_fkey`(`sparepart_id`),
  INDEX `stock_transfers_transfer_date_idx`(`transfer_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign keys
ALTER TABLE `stock_transfers` 
  ADD CONSTRAINT `stock_transfers_branch_id_fkey` 
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `stock_transfers` 
  ADD CONSTRAINT `stock_transfers_user_id_fkey` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `stock_transfers` 
  ADD CONSTRAINT `stock_transfers_sparepart_id_fkey` 
    FOREIGN KEY (`sparepart_id`) REFERENCES `spareparts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### Phase 2: Backend Actions

#### 2.1 Update Restock Logic
**File:** `src/actions/restock.ts`

**Changes:**
```typescript
// BEFORE: Stock langsung ke toko
await tx.sparepart.update({
  where: { id: item.sparepartId },
  data: { stock: { increment: item.quantity } }
})

// AFTER: Stock masuk ke gudang
await tx.sparepart.update({
  where: { id: item.sparepartId },
  data: { 
    warehouseStock: { increment: item.quantity },
    buyPrice: item.buyPrice  // Update harga beli
  }
})
```

#### 2.2 Create Stock Transfer Actions
**File:** `src/actions/stock-transfer.ts` (NEW)

**Functions:**
```typescript
'use server'

export type StockTransferPayload = {
  sparepartId: string
  quantity: number
  type: 'WAREHOUSE_TO_STORE' | 'STORE_TO_WAREHOUSE'
  notes?: string
  branchId?: string
}

export async function createStockTransfer(payload: StockTransferPayload)
export async function getStockTransfers(branchId?: string, dateStr?: string)
export async function getStockTransferHistory(sparepartId: string)
export async function bulkTransferToStore(items: Array<{sparepartId: string, quantity: number}>)
```

**Key Logic:**
```typescript
export async function createStockTransfer(payload: StockTransferPayload) {
  await prisma.$transaction(async (tx) => {
    const sparepart = await tx.sparepart.findUnique({
      where: { id: payload.sparepartId }
    })
    
    if (payload.type === 'WAREHOUSE_TO_STORE') {
      // Validasi stock gudang
      if (sparepart.warehouseStock < payload.quantity) {
        throw new Error('Stock gudang tidak mencukupi')
      }
      
      // Transfer: Gudang → Toko
      await tx.sparepart.update({
        where: { id: payload.sparepartId },
        data: {
          warehouseStock: { decrement: payload.quantity },
          stock: { increment: payload.quantity }
        }
      })
    } else {
      // Validasi stock toko
      if (sparepart.stock < payload.quantity) {
        throw new Error('Stock toko tidak mencukupi')
      }
      
      // Retur: Toko → Gudang
      await tx.sparepart.update({
        where: { id: payload.sparepartId },
        data: {
          stock: { decrement: payload.quantity },
          warehouseStock: { increment: payload.quantity }
        }
      })
    }
    
    // Record transfer
    await tx.stockTransfer.create({
      data: {
        branchId: payload.branchId,
        userId: session.userId,
        sparepartId: payload.sparepartId,
        type: payload.type,
        quantity: payload.quantity,
        notes: payload.notes
      }
    })
  })
}
```

#### 2.3 Update Sparepart Actions
**File:** `src/actions/sparepart.ts`

**Add to getSpareparts query:**
```typescript
select: {
  // ... existing fields
  warehouseStock: true,
  minStock: true,
  minWarehouseStock: true
}
```

---

### Phase 3: Frontend Components

#### 3.1 Stock Transfer Page
**Files to Create:**
```
src/app/admin/stock-transfer/
  ├─ page.tsx
  ├─ StockTransferClient.tsx
  └─ baru/
      ├─ page.tsx
      └─ NewStockTransferClient.tsx
```

**Features:**
- Form transfer stock gudang → toko
- Bulk transfer (multiple items)
- Transfer history table
- Real-time stock validation

#### 3.2 Update Sparepart Display
**Files to Update:**
```
src/app/admin/master/spareparts/SparepartsClient.tsx
src/app/kasir/sparepart/StockClient.tsx
```

**Display:**
```tsx
<div className="flex gap-2">
  <div className="text-center">
    <p className="text-xs text-slate-500">Toko</p>
    <p className="text-lg font-bold">{sparepart.stock}</p>
  </div>
  <div className="text-slate-300">|</div>
  <div className="text-center">
    <p className="text-xs text-slate-500">Gudang</p>
    <p className="text-lg font-bold">{sparepart.warehouseStock}</p>
  </div>
</div>
```

#### 3.3 Warehouse Dashboard Widget
**File:** `src/app/admin/page.tsx` (Update)

**New Widget:**
```tsx
<Card title="Stock Gudang">
  <div className="space-y-2">
    <div className="flex justify-between">
      <span>Total Items</span>
      <span className="font-bold">{warehouseStats.totalItems}</span>
    </div>
    <div className="flex justify-between">
      <span>Total Unit</span>
      <span className="font-bold">{warehouseStats.totalUnits}</span>
    </div>
    <div className="flex justify-between text-red-600">
      <span>Below Min Stock</span>
      <span className="font-bold">{warehouseStats.lowStock}</span>
    </div>
  </div>
</Card>
```

---

### Phase 4: Update Existing Features

#### 4.1 Restock Flow Update
**Current:**
```
Supplier → Restock Input → Stock Toko +
```

**New:**
```
Supplier → Restock Input → Stock Gudang +
                        ↓
            (Optional) Auto-transfer configured items → Stock Toko +
```

**Implementation:**
Add checkbox/setting:
```tsx
<label>
  <input type="checkbox" checked={autoTransfer} />
  Auto-transfer ke toko setelah barang masuk
</label>
```

#### 4.2 Transaction Flow (No Change)
```
Transaction → Stock Toko - (tetap sama)
```

#### 4.3 Reporting Updates
**File:** `src/actions/report.ts`

**Add reports:**
- Warehouse stock report
- Transfer history report
- Stock movement report (in/out)

---

## 🎯 Implementation Steps

### Step 1: Database (Priority: HIGH)
```bash
1. Update prisma/schema.prisma
2. Create migration
3. Run: npx prisma migrate dev
4. Run: npx prisma generate
```

### Step 2: Backend Actions (Priority: HIGH)
```bash
1. Create src/actions/stock-transfer.ts
2. Update src/actions/restock.ts
3. Update src/actions/sparepart.ts
4. Update src/actions/dashboard.ts (warehouse stats)
```

### Step 3: Stock Transfer UI (Priority: MEDIUM)
```bash
1. Create stock-transfer pages
2. Create transfer form component
3. Create transfer history table
4. Add to sidebar navigation
```

### Step 4: Update Existing UI (Priority: MEDIUM)
```bash
1. Update sparepart list (show warehouse stock)
2. Update restock form (auto-transfer option)
3. Update dashboard (warehouse widget)
```

### Step 5: Reports & Analytics (Priority: LOW)
```bash
1. Warehouse stock report
2. Transfer history report
3. Low stock alerts
```

---

## 🔄 Migration Strategy

### Data Migration:
Saat migration pertama kali, existing stock akan diperlakukan sebagai **stock toko**.

```sql
-- Jika ingin split existing stock (50% gudang, 50% toko)
UPDATE spareparts 
SET warehouse_stock = FLOOR(stock / 2),
    stock = CEILING(stock / 2);

-- Atau tetap semua di toko (gudang = 0)
-- Default migration sudah handle ini
```

### Backward Compatibility:
- Transaction tetap menggunakan `stock` (toko)
- Tidak ada breaking changes pada flow kasir
- Admin mendapat fitur baru untuk manage warehouse

---

## 📊 UI/UX Mockups

### 1. Stock Transfer Form
```
┌─────────────────────────────────────┐
│ Transfer Stock Gudang → Toko        │
├─────────────────────────────────────┤
│ Pilih Sparepart: [Dropdown]         │
│   Stock Gudang: 150 unit            │
│   Stock Toko: 25 unit               │
│                                      │
│ Jumlah Transfer: [___] unit         │
│ Catatan: [________________]         │
│                                      │
│ [ Batal ]  [ Transfer Stock ]       │
└─────────────────────────────────────┘
```

### 2. Sparepart List (Updated)
```
┌────────────────────────────────────────────────┐
│ Nama         │ Toko │ Gudang │ Total │ Aksi   │
├────────────────────────────────────────────────┤
│ Oli Merah    │  25  │  150   │  175  │ [Edit] │
│ Filter Udara │   8  │   42   │   50  │ [Edit] │
│ Busi NGK     │  15  │    0   │   15  │ [Edit] │
└────────────────────────────────────────────────┘
            ↑ Stock Warning (< minStock)
```

### 3. Dashboard Widget
```
┌─────────────────────────┐
│ 📦 Stock Gudang         │
├─────────────────────────┤
│ Total Items:  127       │
│ Total Unit:   2,450     │
│ Low Stock:    12 items  │
│                         │
│ [Lihat Detail →]        │
└─────────────────────────┘
```

---

## ⚠️ Important Considerations

### 1. Business Rules
- **Restock → Gudang**: Default behavior
- **Transfer**: Manual atau auto (configurable)
- **Transaction**: Selalu dari stock toko
- **Retur**: Dari toko kembali ke gudang (optional feature)

### 2. Stock Alerts
- Alert jika stock toko < minStock
- Alert jika stock gudang < minWarehouseStock
- Notification untuk admin

### 3. Access Control
- **Admin**: Full access (transfer, view all)
- **Kasir**: View only (lihat stock toko)

### 4. Audit Trail
- Semua transfer tercatat di `stock_transfers`
- Timestamp & user tracking
- Notes field untuk keterangan

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Stock transfer calculation
- [ ] Validation logic (stock mencukupi)
- [ ] Transaction rollback scenarios

### Integration Tests
- [ ] Restock → Warehouse stock updates
- [ ] Transfer → Both stocks update correctly
- [ ] Transaction → Only store stock decrements

### UI Tests
- [ ] Transfer form validation
- [ ] Stock display accuracy
- [ ] Real-time stock updates

---

## 📈 Future Enhancements

### Phase 2 Features:
1. **Multi-warehouse**: Support multiple warehouse locations
2. **Auto-reorder**: Automated purchase orders based on min stock
3. **Barcode scanning**: Quick transfer dengan barcode
4. **Stock opname**: Periodic stock count & adjustment
5. **Expiry tracking**: Track expiry date untuk sparepart
6. **Batch/Serial tracking**: Track serial number items

### Analytics:
1. Stock turnover rate
2. Dead stock identification
3. Optimal stock level suggestions
4. Cost analysis (FIFO/LIFO)

---

## 🎓 Training Notes

### For Admin:
1. Cara input barang masuk (restock)
2. Cara transfer stock gudang → toko
3. Monitoring stock levels
4. Reading reports

### For Kasir:
1. Cek stock toko vs gudang
2. Request stock dari admin (jika habis)

---

## 📝 Documentation Updates

Files to Update:
1. README.md - Add warehouse feature description
2. User manual - Step-by-step guide
3. API docs - New endpoints documentation

---

## ✅ Success Criteria

1. ✅ Stock gudang dan toko terpisah di database
2. ✅ Restock otomatis masuk ke gudang
3. ✅ Admin bisa transfer stock gudang → toko
4. ✅ UI menampilkan kedua jenis stock
5. ✅ History transfer tercatat dengan baik
6. ✅ Kasir tetap bisa transaksi normal (no breaking changes)
7. ✅ Laporan stock lebih comprehensive

---

## 📞 Support & Questions

Jika ada pertanyaan atau butuh klarifikasi, hubungi:
- Technical Lead
- Product Owner

---

**Last Updated:** 2026-07-27
**Version:** 1.0
**Status:** 📋 Ready for Implementation