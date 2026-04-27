# 🏍️ Irian Motor — Progress Report

## ✅ Phase 1 — Project Setup & Authentication (COMPLETED)

### Tasks Completed:
| Task | Status | Files |
|------|--------|-------|
| **1.1** Initialize Next.js 15 project | ✅ | `package.json` |
| **1.2** Setup Tailwind CSS | ✅ | `globals.css` |
| **1.3** Setup Prisma ORM + PostgreSQL | ✅ | `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/prisma.ts` |
| **1.4** Schema Prisma (ALL tables) | ✅ | `prisma/schema.prisma` |
| **1.5** Seed data (3 cabang + users) | ✅ | `prisma/seed.ts` |
| **1.6** JWT Session (jose) | ✅ | `src/lib/session.ts` |
| **1.7** Login page | ✅ | `src/app/login/page.tsx` |
| **1.8** Proxy (middleware) | ✅ | `src/proxy.ts` |
| **1.9** Layouts kasir & admin | ✅ | `src/app/admin/layout.tsx`, `src/app/kasir/layout.tsx` |
| **1.10** UI Components | ✅ | See below |

### UI Components Created:
- `Button.tsx` — 5 variants (primary, secondary, outline, danger, ghost), loading state
- `Input.tsx` — Label, error, hint support
- `Select.tsx` — Custom arrow, label & error
- `Textarea.tsx` — Matching Input styling
- `Badge.tsx` — 6 color variants (default, primary, success, warning, danger, info)
- `Card.tsx` + `CardHeader.tsx` — Content container with hover effects
- `Modal.tsx` + `ModalFooter.tsx` — Backdrop blur, escape key, body scroll lock
- `Table.tsx` — Generic typed table with empty state
- `StatCard.tsx` — Dashboard stat display
- `Sidebar.tsx` — Collapsible with role-based menus
- `Header.tsx` — Sticky with search & notification

---

## ✅ Phase 2 — Master Data Management (COMPLETED)

### Server Actions Created:
| File | Functions |
|------|-----------|
| `actions/service.ts` | `getServices`, `getServiceById`, `createService`, `updateService`, `deleteService` |
| `actions/sparepart.ts` | `getSpareparts`, `getSparepartById`, `getLowStockSpareparts`, `createSparepart`, `updateSparepart`, `deleteSparepart` |
| `actions/customer.ts` | `getCustomers`, `getCustomerById`, `createCustomer`, `updateCustomer` |
| `actions/branch.ts` | `getBranches`, `getBranchById` |

### Pages Created:

#### Admin Pages:
| Route | Page | Features |
|-------|------|----------|
| `/admin` | Dashboard | Overview semua cabang, stat cards, branch performance |
| `/admin/master/services` | Master Jasa Servis | CRUD table, add/edit modal, per-branch |
| `/admin/master/spareparts` | Master Sparepart | CRUD table with buy/sell price, stock badges, margin calc |
| `/admin/cabang` | Kelola Cabang | Branch cards with gradient headers |
| `/admin/users` | Kelola Pengguna | User list with role & branch badges |
| `/admin/transaksi` | Semua Transaksi | Placeholder (Phase 3) |
| `/admin/laporan` | Laporan | Placeholder (Phase 5) |

#### Kasir Pages:
| Route | Page | Features |
|-------|------|----------|
| `/kasir` | Dashboard | Quick action, stats, recent transactions |
| `/kasir/pelanggan` | Daftar Pelanggan | Real-time search (nama/plat/HP), add/edit modal |
| `/kasir/sparepart` | Stok Sparepart | Search, filter (Semua/Menipis/Habis), color-coded badges |
| `/kasir/transaksi` | Transaksi | Placeholder (Phase 3) |

### Form Modals Created:
- `ServiceFormModal.tsx` — Add/edit jasa servis
- `SparepartFormModal.tsx` — Add/edit sparepart (2-column grid layout)
- `CustomerFormModal.tsx` — Add/edit pelanggan

---

## 🔧 Technical Notes

### Prisma 7 Migration
- Removed `url` from `datasource` in schema (moved to `prisma.config.ts`)
- Added `@prisma/adapter-pg` driver adapter (required by Prisma 7)
- Updated all imports to `@/generated/prisma/client`

### Build Status
```
✓ Compiled successfully
✓ TypeScript passed
✓ All 13 routes generated
```

### Routes Overview:
```
ƒ /
○ /_not-found
ƒ /admin
ƒ /admin/cabang
ƒ /admin/laporan
ƒ /admin/master/services
ƒ /admin/master/spareparts
ƒ /admin/transaksi
ƒ /admin/users
ƒ /kasir
ƒ /kasir/pelanggan
ƒ /kasir/sparepart
ƒ /kasir/transaksi
○ /login
```

---

## ⏭️ Next Steps — Phase 3 (Transaksi Harian)

> [!IMPORTANT]
> Phase 3 adalah fitur utama yang perlu dibangun selanjutnya.

### Tasks:
- [ ] **3.1** Invoice number generator (`INV-BRG01-20260426-001`)
- [ ] **3.2** Form transaksi baru (multi-step)
- [ ] **3.3** Auto-search servis & sparepart
- [ ] **3.4** Kalkulasi otomatis (qty × harga, subtotal, diskon, total)
- [ ] **3.5** Auto-update stok sparepart
- [ ] **3.6** List transaksi hari ini
- [ ] **3.7** Detail transaksi (view only)
- [ ] **3.8** Print/PDF struk

---

## 🔐 Login Credentials (Seed Data)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@irianmotor.com | admin123 |
| Kasir 1 (Irian Jaya) | kasir1@irianmotor.com | kasir123 |
| Kasir 2 (Irian Timur) | kasir2@irianmotor.com | kasir123 |
| Kasir 3 (Irian Barat) | kasir3@irianmotor.com | kasir123 |

> [!NOTE]
> Database PostgreSQL harus running dan sudah di-migrate + seed sebelum login bisa berfungsi. Jalankan:
> ```bash
> npx prisma migrate dev --name init
> npx prisma db seed
> ```
