# 🏍️ Irian Motor — Implementation Plan

> Aplikasi Manajemen Bengkel Motor Multi-Cabang  
> Tech Stack: **Next.js 15 (App Router)** · **Tailwind CSS** · **Prisma ORM** · **PostgreSQL** · **NextAuth.js**

---

## 📋 Ringkasan Proyek

| Item | Detail |
|------|--------|
| **Jumlah Cabang** | 3 bengkel, 1 kota |
| **User Roles** | 1 Admin (owner) + 3 Kasir (1 per cabang) |
| **Core Feature** | Transaksi harian (servis & sparepart), multi-cabang, monitoring pusat, laporan otomatis |
| **Migrasi Dari** | MYOB → Web-based |
| **Pendekatan** | Bertahap (6 Phase) |

---

## 🏗️ Arsitektur Sistem

```mermaid
graph TB
    subgraph "Frontend — Next.js 15"
        A[Login Page]
        B[Kasir Dashboard]
        C[Admin Dashboard]
    end

    subgraph "Backend — Next.js API Routes / Server Actions"
        D[Auth API — NextAuth.js]
        E[Transaction API]
        F[Report API]
        G[Master Data API]
    end

    subgraph "Database — PostgreSQL"
        H[(branches)]
        I[(users)]
        J[(transactions)]
        K[(transaction_items)]
        L[(services)]
        M[(spareparts)]
        N[(customers)]
    end

    A --> D
    B --> E
    B --> G
    C --> F
    C --> G
    D --> I
    E --> J
    E --> K
    F --> J
    G --> H
    G --> L
    G --> M
    G --> N
```

---

## 🗄️ Database Schema

> [!IMPORTANT]
> Semua tabel operasional **WAJIB** memiliki `branch_id` untuk mendukung multi-cabang.  
> Admin bisa akses semua cabang, Kasir hanya cabang sendiri.

### Entity Relationship Diagram

```mermaid
erDiagram
    branches ||--o{ users : "has"
    branches ||--o{ transactions : "has"
    branches ||--o{ spareparts : "has"
    branches ||--o{ services : "has"
    users ||--o{ transactions : "created_by"
    transactions ||--o{ transaction_items : "has"
    customers ||--o{ transactions : "has"
    services ||--o{ transaction_items : "references"
    spareparts ||--o{ transaction_items : "references"

    branches {
        string id PK
        string name
        string address
        string phone
        boolean is_active
        datetime created_at
    }

    users {
        string id PK
        string branch_id FK
        string name
        string email
        string password_hash
        enum role "ADMIN | KASIR"
        boolean is_active
        datetime created_at
    }

    customers {
        string id PK
        string branch_id FK
        string name
        string phone
        string plate_number
        string vehicle_type
        string vehicle_year
        datetime created_at
    }

    services {
        string id PK
        string branch_id FK
        string name
        decimal price
        string category
        boolean is_active
        datetime created_at
    }

    spareparts {
        string id PK
        string branch_id FK
        string name
        string sku
        decimal buy_price
        decimal sell_price
        int stock
        string unit
        boolean is_active
        datetime created_at
    }

    transactions {
        string id PK
        string branch_id FK
        string customer_id FK
        string user_id FK
        string invoice_number
        enum type "SERVICE | SPAREPART | MIXED"
        decimal subtotal
        decimal discount
        decimal total
        enum payment_method "CASH | TRANSFER | QRIS"
        string notes
        datetime transaction_date
        datetime created_at
    }

    transaction_items {
        string id PK
        string transaction_id FK
        enum item_type "SERVICE | SPAREPART"
        string service_id FK "nullable"
        string sparepart_id FK "nullable"
        string item_name
        int quantity
        decimal unit_price
        decimal subtotal
        datetime created_at
    }
```

### Tabel Detail

#### `branches` — Data Cabang
```sql
-- Setiap bengkel punya ID unik
-- Contoh: BRG-01 (Irian Jaya), BRG-02 (Irian Timur), BRG-03 (Irian Barat)
```

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| id | VARCHAR(10) | PK | ID cabang (BRG-01, BRG-02, BRG-03) |
| name | VARCHAR(100) | NOT NULL | Nama cabang |
| address | TEXT | NOT NULL | Alamat lengkap |
| phone | VARCHAR(20) | | Nomor telepon |
| is_active | BOOLEAN | DEFAULT true | Status aktif |
| created_at | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |

#### `users` — Data Pengguna
| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| id | UUID | PK | |
| **branch_id** | VARCHAR(10) | **FK → branches** | Cabang pengguna |
| name | VARCHAR(100) | NOT NULL | Nama lengkap |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email login |
| password_hash | TEXT | NOT NULL | Bcrypt hash |
| role | ENUM | NOT NULL | ADMIN / KASIR |
| is_active | BOOLEAN | DEFAULT true | Status aktif |

> [!NOTE]
> Admin memiliki `branch_id` = NULL (akses semua cabang)  
> Kasir memiliki `branch_id` = cabang spesifik

#### `transactions` — Transaksi Harian
| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| id | UUID | PK | |
| **branch_id** | VARCHAR(10) | **FK → branches** | Cabang transaksi |
| customer_id | UUID | FK → customers | Pelanggan (opsional) |
| user_id | UUID | FK → users | Kasir yang input |
| invoice_number | VARCHAR(20) | UNIQUE | Format: INV-BRG01-20260426-001 |
| type | ENUM | NOT NULL | SERVICE / SPAREPART / MIXED |
| subtotal | DECIMAL(12,2) | NOT NULL | Total sebelum diskon |
| discount | DECIMAL(12,2) | DEFAULT 0 | Diskon |
| total | DECIMAL(12,2) | NOT NULL | Total akhir |
| payment_method | ENUM | NOT NULL | CASH / TRANSFER / QRIS |
| notes | TEXT | | Catatan tambahan |
| transaction_date | DATE | NOT NULL | Tanggal transaksi |

---

## 📁 Struktur Folder Proyek

```
irian-motor/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data (cabang, admin user)
│   └── migrations/            # Auto-generated migrations
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing / Redirect to login
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   ├── kasir/
│   │   │   ├── layout.tsx     # Kasir layout (sidebar, header)
│   │   │   ├── page.tsx       # Dashboard kasir
│   │   │   ├── transaksi/
│   │   │   │   ├── page.tsx       # List transaksi hari ini
│   │   │   │   └── baru/
│   │   │   │       └── page.tsx   # Form transaksi baru
│   │   │   ├── pelanggan/
│   │   │   │   └── page.tsx       # Daftar pelanggan
│   │   │   └── sparepart/
│   │   │       └── page.tsx       # Cek stok sparepart
│   │   ├── admin/
│   │   │   ├── layout.tsx     # Admin layout
│   │   │   ├── page.tsx       # Dashboard owner (monitoring)
│   │   │   ├── cabang/
│   │   │   │   └── page.tsx       # Kelola cabang
│   │   │   ├── users/
│   │   │   │   └── page.tsx       # Kelola user/kasir
│   │   │   ├── laporan/
│   │   │   │   ├── page.tsx       # Laporan harian
│   │   │   │   └── bulanan/
│   │   │   │       └── page.tsx   # Laporan bulanan
│   │   │   ├── master/
│   │   │   │   ├── services/
│   │   │   │   │   └── page.tsx   # Master jasa servis
│   │   │   │   └── spareparts/
│   │   │   │       └── page.tsx   # Master sparepart
│   │   │   └── transaksi/
│   │   │       └── page.tsx       # Semua transaksi (all cabang)
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts   # NextAuth handler
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Badge.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── BranchSelector.tsx
│   │   ├── kasir/
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── ItemSearch.tsx
│   │   │   └── PaymentModal.tsx
│   │   ├── admin/
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── BranchComparison.tsx
│   │   │   ├── DailyReport.tsx
│   │   │   └── MonthlyReport.tsx
│   │   └── shared/
│   │       ├── InvoicePrint.tsx
│   │       └── CustomerSearch.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── utils.ts           # Utility functions
│   │   └── invoice.ts         # Invoice number generator
│   ├── actions/
│   │   ├── auth.ts            # Auth server actions
│   │   ├── transaction.ts     # Transaction CRUD
│   │   ├── customer.ts        # Customer CRUD
│   │   ├── sparepart.ts       # Sparepart CRUD
│   │   ├── service.ts         # Service CRUD
│   │   ├── report.ts          # Report generation
│   │   └── branch.ts          # Branch management
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBranch.ts
│   │   └── useTransaction.ts
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── middleware.ts          # Auth + role middleware
├── public/
│   └── logo.png
├── .env.local                 # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Phases of Development

### Phase 1 — Project Setup & Authentication
**Estimasi: 2-3 hari**

> [!NOTE]
> Fondasi proyek. Semua phase berikutnya bergantung pada phase ini.

#### Tasks:
- [ ] **1.1** Initialize Next.js 15 project dengan App Router
  ```bash
  npx -y create-next-app@latest ./
  ```
- [ ] **1.2** Setup Tailwind CSS (sudah include di Next.js)
- [ ] **1.3** Setup Prisma ORM + PostgreSQL connection
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [ ] **1.4** Buat schema Prisma — tabel `branches` dan `users`
- [ ] **1.5** Seed data: 3 cabang + 1 admin + 3 kasir
- [ ] **1.6** Setup NextAuth.js (Credentials Provider)
  ```bash
  npm install next-auth@beta @auth/prisma-adapter bcryptjs
  ```
- [ ] **1.7** Buat login page (email + password)
- [ ] **1.8** Implement middleware.ts — route protection + role check
- [ ] **1.9** Setup layout kasir & admin (sidebar, header, branch indicator)
- [ ] **1.10** Buat reusable UI components (Button, Input, Card, Modal, Table)

#### Deliverables:
- ✅ User bisa login dengan role ADMIN atau KASIR
- ✅ Redirect otomatis ke dashboard sesuai role
- ✅ Kasir hanya lihat data cabang sendiri
- ✅ Admin bisa lihat semua cabang
- ✅ UI design system siap pakai

#### Key Design Decisions:
```typescript
// middleware.ts — Contoh role-based routing
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token');
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
    return NextResponse.redirect('/kasir');
  }
  if (path.startsWith('/kasir') && !token) {
    return NextResponse.redirect('/login');
  }
}
```

---

### Phase 2 — Master Data Management
**Estimasi: 2-3 hari**

#### Tasks:
- [ ] **2.1** Buat schema Prisma — tabel `services`, `spareparts`, `customers`
- [ ] **2.2** Server Actions: CRUD untuk master jasa servis
- [ ] **2.3** Server Actions: CRUD untuk master sparepart (termasuk stok)
- [ ] **2.4** Server Actions: CRUD untuk pelanggan
- [ ] **2.5** Admin page: Kelola jasa servis (per cabang)
- [ ] **2.6** Admin page: Kelola sparepart (per cabang + stok awal)
- [ ] **2.7** Kasir page: Daftar pelanggan (search by nama/plat)
- [ ] **2.8** Kasir page: Cek stok sparepart cabang sendiri

#### Deliverables:
- ✅ Admin bisa input master data servis dan sparepart per cabang
- ✅ Kasir bisa search pelanggan dan cek stok
- ✅ Semua data terikat `branch_id`

#### Contoh Server Action:
```typescript
// actions/sparepart.ts
'use server'

export async function getSpareparts(branchId: string) {
  return prisma.sparepart.findMany({
    where: { branch_id: branchId, is_active: true },
    orderBy: { name: 'asc' },
  });
}

export async function createSparepart(data: SparepartInput) {
  // branch_id diambil dari session user
  const session = await getServerSession(authOptions);
  const branchId = session?.user?.branchId;

  return prisma.sparepart.create({
    data: { ...data, branch_id: branchId },
  });
}
```

---

### Phase 3 — Transaksi Harian (Core Feature) ⭐
**Estimasi: 4-5 hari**

> [!IMPORTANT]
> Ini adalah **fitur utama** aplikasi. Harus cepat, mudah, dan minim error untuk kasir.

#### Tasks:
- [ ] **3.1** Buat schema Prisma — tabel `transactions`, `transaction_items`
- [ ] **3.2** Invoice number generator (format: INV-BRG01-20260426-001)
- [ ] **3.3** Buat form transaksi baru (multi-step atau single page)
  - Step 1: Pilih/input pelanggan (opsional)
  - Step 2: Tambah item servis dan/atau sparepart
  - Step 3: Review, diskon, metode bayar → Submit
- [ ] **3.4** Auto-search: servis & sparepart saat kasir mengetik
- [ ] **3.5** Kalkulasi otomatis: qty × harga, subtotal, diskon, total
- [ ] **3.6** Auto-update stok sparepart setelah transaksi
- [ ] **3.7** List transaksi hari ini (per kasir, per cabang)
- [ ] **3.8** Detail transaksi (view only)
- [ ] **3.9** Print/PDF struk sederhana
- [ ] **3.10** Validasi: stok insufficient, required fields, dll

#### Deliverables:
- ✅ Kasir bisa buat transaksi baru < 2 menit
- ✅ Stok sparepart otomatis berkurang
- ✅ Invoice number auto-generate per cabang per hari
- ✅ Bisa cetak struk

#### UI Flow — Transaksi Baru:
```mermaid
flowchart LR
    A[Klik Transaksi Baru] --> B[Cari/Input Pelanggan]
    B --> C[Tambah Item Servis/Sparepart]
    C --> D{Mau tambah lagi?}
    D -->|Ya| C
    D -->|Tidak| E[Review & Diskon]
    E --> F[Pilih Metode Bayar]
    F --> G[Submit & Cetak Struk]
```

#### Contoh Invoice Number Logic:
```typescript
// lib/invoice.ts
export async function generateInvoice(branchId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const branchCode = branchId.replace('BRG-', 'BRG');

  const count = await prisma.transaction.count({
    where: {
      branch_id: branchId,
      transaction_date: new Date(),
    },
  });

  const seq = String(count + 1).padStart(3, '0');
  return `INV-${branchCode}-${today}-${seq}`;
  // Contoh: INV-BRG01-20260426-001
}
```

---

### Phase 4 — Dashboard & Monitoring Owner
**Estimasi: 3-4 hari**

#### Tasks:
- [ ] **4.1** Admin Dashboard — overview semua cabang
  - Total pendapatan hari ini (per cabang & total)
  - Jumlah transaksi hari ini
  - Top 5 servis terlaris
  - Top 5 sparepart terlaris
  - Sparepart stok menipis (< threshold)
- [ ] **4.2** Branch Selector — filter dashboard per cabang atau ALL
- [ ] **4.3** Chart: Pendapatan harian (7 hari terakhir) per cabang
- [ ] **4.4** Chart: Perbandingan pendapatan antar cabang
- [ ] **4.5** Kasir Dashboard — ringkasan cabang sendiri
  - Pendapatan hari ini
  - Jumlah transaksi hari ini
  - Transaksi terakhir
  - Stok sparepart menipis

#### Deliverables:
- ✅ Owner bisa monitoring 3 cabang dari 1 halaman
- ✅ Filter per cabang
- ✅ Chart visual yang informatif
- ✅ Kasir punya dashboard sendiri yang fokus

#### Library Tambahan:
```bash
npm install recharts          # Charting library
npm install date-fns          # Date manipulation
```

---

### Phase 5 — Laporan Otomatis
**Estimasi: 3-4 hari**

#### Tasks:
- [ ] **5.1** Laporan Harian
  - Filter: tanggal, cabang
  - Summary: total transaksi, total pendapatan, breakdown servis vs sparepart
  - Detail: list semua transaksi hari itu
- [ ] **5.2** Laporan Bulanan
  - Filter: bulan, tahun, cabang
  - Summary: total pendapatan, rata-rata harian, hari tersibuk
  - Chart: trend harian dalam sebulan
  - Perbandingan dengan bulan sebelumnya
- [ ] **5.3** Export ke Excel/CSV
  ```bash
  npm install xlsx             # Excel export
  ```
- [ ] **5.4** Print-friendly layout (CSS @media print)
- [ ] **5.5** Laporan per kasir (siapa yang paling banyak transaksi)

#### Deliverables:
- ✅ Owner bisa lihat laporan harian & bulanan per cabang
- ✅ Export ke Excel untuk arsip / analisis lanjutan
- ✅ Print friendly

#### Contoh Query Laporan:
```typescript
// actions/report.ts
'use server'

export async function getDailyReport(branchId: string | null, date: Date) {
  const where: any = { transaction_date: date };
  if (branchId) where.branch_id = branchId;

  const [summary, transactions] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.transaction.findMany({
      where,
      include: {
        branch: true,
        customer: true,
        user: true,
        items: true,
      },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  return { summary, transactions };
}
```

---

### Phase 6 — Future Features (Pengembangan Lanjutan)
**Estimasi: Sesuai prioritas**

> [!TIP]
> Phase ini dikerjakan setelah Phase 1-5 stable dan dipakai di production.

#### 6.1 Riwayat Servis Pelanggan
- [ ] Halaman profil pelanggan
- [ ] Timeline semua transaksi pelanggan (across branches)
- [ ] Search by plat nomor
- [ ] Notes per kunjungan

#### 6.2 Reminder Ganti Oli
- [ ] Catat tanggal & KM terakhir ganti oli di transaksi
- [ ] Hitung estimasi ganti oli berikutnya (per 2000 KM / 2 bulan)
- [ ] Dashboard reminder: pelanggan yang sudah waktunya ganti oli
- [ ] Integrasi WhatsApp API (optional — kirim reminder otomatis)

#### 6.3 Ranking Mekanik
- [ ] Tambah tabel `mechanics` dan field `mechanic_id` di transaksi
- [ ] Dashboard: mekanik paling produktif
- [ ] Rating dari pelanggan (opsional)
- [ ] Laporan performa mekanik per bulan

#### 6.4 Profit per Cabang
- [ ] Input harga beli (buy_price) di sparepart
- [ ] Kalkulasi: profit = sell_price - buy_price per item
- [ ] Dashboard: profit margin per cabang
- [ ] Laporan: profitabilitas bulanan per cabang
- [ ] Analisis: cabang mana paling menguntungkan

---

## 🔐 Role & Permission Matrix

| Feature | ADMIN | KASIR |
|---------|-------|-------|
| Login | ✅ | ✅ |
| Lihat semua cabang | ✅ | ❌ (hanya cabang sendiri) |
| CRUD Master Servis | ✅ | ❌ |
| CRUD Master Sparepart | ✅ | ❌ |
| Buat Transaksi | ❌ | ✅ |
| Lihat Transaksi | ✅ (semua cabang) | ✅ (cabang sendiri) |
| Dashboard Monitoring | ✅ | ✅ (terbatas) |
| Laporan Harian/Bulanan | ✅ | ❌ |
| Export Excel | ✅ | ❌ |
| Kelola User | ✅ | ❌ |
| Kelola Cabang | ✅ | ❌ |

---

## ⚙️ Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/irian_motor"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📦 Dependencies

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^15.x | Framework |
| react | ^19.x | UI Library |
| tailwindcss | ^4.x | Styling |
| prisma | ^6.x | ORM |
| @prisma/client | ^6.x | DB Client |
| next-auth | ^5.x (beta) | Authentication |
| bcryptjs | ^2.x | Password hashing |

### UI & Charts
| Package | Purpose |
|---------|---------|
| recharts | Dashboard charts |
| lucide-react | Icons |
| clsx | Conditional classNames |
| date-fns | Date formatting |

### Reports
| Package | Purpose |
|---------|---------|
| xlsx | Excel export |
| react-to-print | Print support |

---

## 📅 Timeline Ringkasan

```mermaid
gantt
    title Irian Motor — Development Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %d %b

    section Phase 1
    Project Setup & Auth          :p1, 2026-04-27, 3d

    section Phase 2
    Master Data                   :p2, after p1, 3d

    section Phase 3
    Transaksi Harian              :crit, p3, after p2, 5d

    section Phase 4
    Dashboard & Monitoring        :p4, after p3, 4d

    section Phase 5
    Laporan Otomatis              :p5, after p4, 4d

    section Phase 6
    Future Features               :p6, after p5, 7d
```

| Phase | Nama | Estimasi | Status |
|-------|------|----------|--------|
| 1 | Project Setup & Authentication | 2-3 hari | ⬜ Belum dimulai |
| 2 | Master Data Management | 2-3 hari | ⬜ Belum dimulai |
| 3 | Transaksi Harian ⭐ | 4-5 hari | ⬜ Belum dimulai |
| 4 | Dashboard & Monitoring | 3-4 hari | ⬜ Belum dimulai |
| 5 | Laporan Otomatis | 3-4 hari | ⬜ Belum dimulai |
| 6 | Future Features | Ongoing | ⬜ Belum dimulai |

**Total estimasi Phase 1-5: ~14-19 hari kerja**

---

## 🎯 Deployment Recommendation

| Environment | Rekomendasi | Alasan |
|-------------|-------------|--------|
| **Hosting** | Vercel | Optimal untuk Next.js, free tier cukup |
| **Database** | Supabase / Neon | PostgreSQL managed, free tier tersedia |
| **Domain** | Custom domain | Profesional (contoh: app.irianmotor.com) |

---

> [!NOTE]
> Plan ini dirancang untuk dikerjakan **bertahap**. Setiap phase bisa di-deploy dan dipakai sebelum phase berikutnya selesai. Misal, Phase 1-3 selesai sudah bisa dipakai kasir untuk input transaksi harian.

