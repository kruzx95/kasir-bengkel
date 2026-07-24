# Rekomendasi Perbaikan - Irian Motor

> **Status**: Dikerjakan nanti (manual review)
> **Tanggal**: 2024-07-24
> **Dibuat oleh**: Code Review Otomatis

---

## 📋 Ringkasan Status Proyek

| Check | Status | Keterangan |
|-------|--------|------------|
| `npm run build` | ✅ **Pass** | Build berhasil tanpa error |
| `npx tsc --noEmit` | ✅ **Pass** | TypeScript type-checking bersih |
| `npx prisma validate` | ✅ **Valid** | Schema Prisma valid |
| `npx prisma db push` | ✅ **In Sync** | Database sinkron dengan schema |
| `npm run lint` | ⚠️ **12 Warnings** | Tidak ada error, hanya warning `any` type |

---

## 🔴 Prioritas Tinggi (Perlu Diperbaiki)

### 1. **TypeScript `any` Types di `RestocksClient.tsx`**
**File**: `src/app/admin/restock/RestocksClient.tsx`  
**Jumlah**: 12 warnings ESLint `@typescript-eslint/no-explicit-any`

**Masalah**: Props `initialPOs` dan `initialHistory` menggunakan `any[]`, serta semua render functions menggunakan `row: any`.

**Rekomendasi**: Buat interface yang proper untuk tipe data PO Restock dan History.

```typescript
// Tambahkan di atas component atau di file types terpisah
interface SparepartRef {
  name: string
}

interface POItem {
  sparepart: SparepartRef
  quantity: number
  receivedQty: number
}

interface RestockPO {
  id: string
  supplierName: string
  branch: { name: string }
  orderDate: string
  expectedDate?: string
  status: 'PENDING' | 'PARTIAL' | 'RECEIVED'
  items: POItem[]
}

interface RestockHistory {
  id: string
  date: string
  supplierName: string
  branch: { name: string }
  user: { name: string }
  items: Array<{ sparepart: SparepartRef }>
  total: number
  paymentStatus: 'LUNAS' | 'HUTANG'
  receiptImagePath?: string
}

// Update props component
export default function RestocksClient({ 
  initialPOs, 
  initialHistory 
}: { 
  initialPOs: RestockPO[]
  initialHistory: RestockHistory[] 
}) {
  // ...
  const isLate = (row: RestockPO) => ...
  // dll
}
```

---

## 🟡 Prioritas Sedang (Perbaikan Kualitas)

### 2. **Recharts Container Warning (PieChart)**
**File**: `src/app/admin/DashboardClient.tsx`  
**Gejala**: Console warning `"The width(-1) and height(-1) of chart should be greater than 0"`

**Status**: LineChart sudah diperbaiki (ditambah `min-w-0 min-h-0`), tapi PieChart belum.

**Rekomendasi**: Tambahkan `min-w-0 min-h-0` pada container PieChart (baris ~131):

```tsx
<div className="h-[250px] w-full min-w-0 min-h-0">
  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
    <PieChart>...</PieChart>
  </ResponsiveContainer>
</div>
```

### 3. **Middleware Auth (Optional tapi Direkomendasikan)**
**Lokasi**: Belum ada `src/middleware.ts`

**Masalah**: Proteksi route saat ini dilakukan di Server Actions, bukan di edge middleware. Ini berarti:
- Halaman tetap di-render sebelum redirect
- Flash of unauthenticated content mungkin terjadi

**Rekomendasi**: Buat `src/middleware.ts` menggunakan `next-auth` atau custom JWT verification:

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth' // atau custom verify
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Protect kasir routes
  if (pathname.startsWith('/kasir') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/kasir/:path*', '/profil/:path*']
}
```

### 4. **Turbopack Workspace Root Warning**
**Gejala**: `Next.js inferred your workspace root... detected multiple lockfiles`

**Penyebab**: Ada `package-lock.json` di root (`/home/kruza/Documents/irian-motor/`) dan di project (`/home/kruza/Documents/irian-motor/irian-motor/`)

**Rekomendasi**: Hapus lockfile di root parent atau set `turbopack.root` di `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
}
```

---

## 🟢 Prioritas Rendah (Nice to Have)

### 5. **Test Coverage**
**Status**: Tidak ada test script (`npm test` → "Missing script: test")

**Rekomendasi**: Tambahkan testing:
- Unit test untuk `lib/utils.ts` (formatCurrency, dll)
- Integration test untuk Server Actions
- E2E test untuk flow login → dashboard

```json
// package.json - tambahkan
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run"
},
"devDependencies": {
  "vitest": "^2.x",
  "@testing-library/react": "^16.x",
  "jsdom": "^25.x"
}
```

### 6. **Environment Validation**
**File**: `.env` dan `.env.example`

**Rekomendasi**: Tambahkan validasi env di startup (misal pakai `@t3-oss/env-nextjs` atau `zod`):

```typescript
// src/env.mjs
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SESSION_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default('Irian Motor'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
})
```

### 7. **Error Boundary & Loading States**
**Rekomendasi**: Tambahkan:
- `app/global-error.tsx` untuk error handling global
- `app/admin/loading.tsx` dan `app/kasir/loading.tsx` untuk Suspense boundaries
- `app/not-found.tsx` untuk 404 pages

### 8. **API Route Validation**
**File**: `src/app/api/upload/receipt/route.ts` dan `src/app/api/uploads/receipts/[filename]/route.ts`

**Rekomendasi**: Tambahkan validasi file type/size, rate limiting, dan sanitasi filename.

---

## 📝 Catatan Teknis

### Database Schema (Prisma)
- ✅ Schema valid dan sinkron
- ✅ Relasi lengkap: Branch, User, Customer, Service, Sparepart, Transaction, Restock, IndentOrder
- ✅ Enum yang proper: Role, TransactionType, PaymentMethod, IndentStatus, dll

### Authentication
- Menggunakan **NextAuth v5 (beta)** dengan `@auth/prisma-adapter`
- Session management di `src/lib/session.ts` (JWT-based dengan `jose`)
- Password hashing: `bcryptjs`
- **Catatan**: NextAuth v5 masih beta, pertimbangkan migrasi ke v4 stable atau Auth.js jika butuh stabilitas production

### UI Stack
- Next.js 16.2.4 (App Router + Turbopack)
- React 19.2.4
- Tailwind CSS v4
- Recharts untuk visualisasi
- Lucide React untuk icons
- shadcn-style components di `src/components/ui/`

---

## ✅ Checklist Verifikasi Manual

- [ ] Fix TypeScript `any` types di `RestocksClient.tsx`
- [ ] Fix PieChart container warning
- [ ] (Optional) Buat `middleware.ts` untuk route protection
- [ ] (Optional) Hapus lockfile duplicate / set turbopack.root
- [ ] (Optional) Tambahkan test suite
- [ ] (Optional) Tambahkan env validation
- [ ] (Optional) Tambahkan error boundaries & loading states
- [ ] (Optional) Validasi API routes upload

---

## 🔗 Referensi File Penting

| File | Deskripsi |
|------|-----------|
| `prisma/schema.prisma` | Database schema lengkap |
| `src/lib/prisma.ts` | Prisma client singleton dengan MariaDB adapter |
| `src/lib/session.ts` | JWT session management (jose) |
| `src/actions/auth.ts` | Login/logout server actions |
| `src/app/admin/DashboardClient.tsx` | Dashboard dengan Recharts |
| `src/app/admin/restock/RestocksClient.tsx` | **Perlu perbaikan type** |
| `next.config.ts` | Next.js config (minimal) |
| `.env.example` | Template environment variables |

---

> **Catatan**: Semua rekomendasi di atas bersifat **non-blocking**. Aplikasi sudah berjalan dengan baik (build pass, dev server jalan, DB connected). Perbaikan bisa dilakukan bertahap sesuai prioritas tim.