import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const url = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
  allowPublicKeyRetrieval: true,
  connectTimeout: 10000,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create super admin — branchId null means access to all branches
  const adminPassword = await bcrypt.hash('Mallikrs08!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@irianmotor.com' },
    update: {
      name: 'Owner Bengkel',
      passwordHash: adminPassword,
      role: 'ADMIN',
      branchId: null,
      isActive: true,
    },
    create: {
      name: 'Owner Bengkel',
      email: 'admin@irianmotor.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      branchId: null,
    },
  })

  console.log('✅ Super admin created:', admin.email)

  // 1. Create or upsert Demo Branch
  const demoBranch = await prisma.branch.upsert({
    where: { code: 'DEMO' },
    update: {
      name: 'Cabang Demo (Showroom)',
      address: 'Jl. Pameran Otomotif No. 88, Jakarta',
      phone: '081299887766',
      isActive: true,
    },
    create: {
      code: 'DEMO',
      name: 'Cabang Demo (Showroom)',
      address: 'Jl. Pameran Otomotif No. 88, Jakarta',
      phone: '081299887766',
      isActive: true,
    },
  })
  console.log('✅ Demo branch created/verified:', demoBranch.name)

  // 2. Create Demo Admin user (Assigned to demo branch for 100% data isolation & privacy)
  const demoPassword = await bcrypt.hash('DemoBengkel123!', 10)
  const demoAdmin = await prisma.user.upsert({
    where: { email: 'demo.admin@irianmotor.com' },
    update: {
      name: 'Demo Admin (Owner)',
      passwordHash: demoPassword,
      role: 'ADMIN',
      branchId: demoBranch.id,
      isActive: true,
    },
    create: {
      name: 'Demo Admin (Owner)',
      email: 'demo.admin@irianmotor.com',
      passwordHash: demoPassword,
      role: 'ADMIN',
      branchId: demoBranch.id,
      isActive: true,
    },
  })
  console.log('✅ Demo admin user created:', demoAdmin.email)

  // 3. Create Demo Kasir user (Assigned to Demo Branch)
  const demoKasir = await prisma.user.upsert({
    where: { email: 'demo.kasir@irianmotor.com' },
    update: {
      name: 'Demo Kasir',
      passwordHash: demoPassword,
      role: 'KASIR',
      branchId: demoBranch.id,
      isActive: true,
    },
    create: {
      name: 'Demo Kasir',
      email: 'demo.kasir@irianmotor.com',
      passwordHash: demoPassword,
      role: 'KASIR',
      branchId: demoBranch.id,
      isActive: true,
    },
  })
  console.log('✅ Demo kasir user created:', demoKasir.email)

  // 4. Sample mechanics for demo branch
  const mechanicsData = [
    { name: 'Budi Santoso (Mekanik Senior)', phone: '08123456701' },
    { name: 'Rian Pratama (Mekanik)', phone: '08123456702' },
    { name: 'Asep Hidayat (Spesialis Matic)', phone: '08123456703' },
    { name: 'Doni Saputra (Spesialis Kelistrikan)', phone: '08123456704' },
  ]
  const createdMechanics: Record<string, string> = {}
  for (const m of mechanicsData) {
    let mech = await prisma.mechanic.findFirst({
      where: { branchId: demoBranch.id, name: m.name }
    })
    if (!mech) {
      mech = await prisma.mechanic.create({
        data: { ...m, branchId: demoBranch.id, isActive: true }
      })
    }
    createdMechanics[m.name] = mech.id
  }

  // 5. Sample services for demo branch
  const servicesData = [
    { name: 'Servis Ringan / Berkala', price: 45000, category: 'Servis Ringan' },
    { name: 'Ganti Oli Mesin & Gardan', price: 20000, category: 'Pelumasan' },
    { name: 'Tune Up Injeksi & Throttle Body', price: 75000, category: 'Tune Up' },
    { name: 'Servis CVT Lengkap & Roller', price: 60000, category: 'Transmisi' },
    { name: 'Ganti Kampas Rem & Minyak Rem', price: 35000, category: 'Pengereman' },
    { name: 'Overhaul / Turun Mesin Total', price: 350000, category: 'Mesin' },
    { name: 'Ganti Ban Luar & Pasang Tubeless', price: 25000, category: 'Roda & Ban' },
    { name: 'Perbaikan Kelistrikan & Pasang Aki', price: 30000, category: 'Kelistrikan' },
  ]
  const createdServices: Record<string, { id: string; price: number; name: string }> = {}
  for (const s of servicesData) {
    let srv = await prisma.service.findFirst({
      where: { branchId: demoBranch.id, name: s.name }
    })
    if (!srv) {
      srv = await prisma.service.create({
        data: { ...s, branchId: demoBranch.id, isActive: true }
      })
    }
    createdServices[s.name] = { id: srv.id, price: srv.price, name: srv.name }
  }

  // 6. Sample spareparts for demo branch
  const sparepartsData = [
    { name: 'Oli Mesin MPX2 Matic 0.8L', sku: 'OLI-MPX2-08', sellPrice: 55000, buyPrice: 42000, stock: 45, warehouseStock: 80, unit: 'botol', sparepartBrand: 'AHM' },
    { name: 'Oli Mesin SPX1 Bebek/Sport 1L', sku: 'OLI-SPX1-10', sellPrice: 75000, buyPrice: 58000, stock: 28, warehouseStock: 40, unit: 'botol', sparepartBrand: 'AHM' },
    { name: 'Oli Gardan Matic AHM 120ml', sku: 'OLI-GRD-120', sellPrice: 18000, buyPrice: 12000, stock: 60, warehouseStock: 120, unit: 'botol', sparepartBrand: 'AHM' },
    { name: 'Busi Denso U24EPR-9', sku: 'BUSI-DNS-U24', sellPrice: 25000, buyPrice: 15000, stock: 50, warehouseStock: 100, unit: 'pcs', sparepartBrand: 'Denso' },
    { name: 'Busi NGK CPR9EA-9', sku: 'BUSI-NGK-CPR9', sellPrice: 30000, buyPrice: 19000, stock: 35, warehouseStock: 70, unit: 'pcs', sparepartBrand: 'NGK' },
    { name: 'Kampas Rem Depan Matic Honda', sku: 'BRK-FR-HND', sellPrice: 45000, buyPrice: 30000, stock: 25, warehouseStock: 50, unit: 'set', sparepartBrand: 'Federal' },
    { name: 'Kampas Rem Belakang Tromol', sku: 'BRK-RR-TRM', sellPrice: 40000, buyPrice: 26000, stock: 20, warehouseStock: 40, unit: 'set', sparepartBrand: 'Federal' },
    { name: 'V-Belt Kit Vario 125/150', sku: 'VBLT-VARIO-125', sellPrice: 145000, buyPrice: 105000, stock: 15, warehouseStock: 25, unit: 'set', sparepartBrand: 'Bando' },
    { name: 'Roller Set Beat FI / Vario 110', sku: 'RLR-BEAT-SET', sellPrice: 65000, buyPrice: 45000, stock: 18, warehouseStock: 30, unit: 'set', sparepartBrand: 'KTC' },
    { name: 'Filter Udara Vario 125/150 eSP', sku: 'FLT-VARIO-150', sellPrice: 55000, buyPrice: 38000, stock: 30, warehouseStock: 50, unit: 'pcs', sparepartBrand: 'AHM' },
    { name: 'Aki Kering GS Astra GTZ-5S', sku: 'AKI-GS-GTZ5S', sellPrice: 235000, buyPrice: 185000, stock: 10, warehouseStock: 20, unit: 'unit', sparepartBrand: 'GS Astra' },
    { name: 'Ban Luar Tubeless Maxxis 90/90-14', sku: 'BAN-MXS-909014', sellPrice: 245000, buyPrice: 195000, stock: 8, warehouseStock: 15, unit: 'pcs', sparepartBrand: 'Maxxis' },
  ]
  const createdSpareparts: Record<string, { id: string; sellPrice: number; buyPrice: number; name: string }> = {}
  for (const sp of sparepartsData) {
    let part = await prisma.sparepart.findFirst({
      where: { branchId: demoBranch.id, sku: sp.sku }
    })
    if (!part) {
      part = await prisma.sparepart.create({
        data: { ...sp, branchId: demoBranch.id, isActive: true }
      })
    }
    createdSpareparts[sp.sku] = { id: part.id, sellPrice: part.sellPrice, buyPrice: part.buyPrice, name: part.name }
  }

  // 7. Sample corporate customer for demo branch
  const corporateData = [
    { name: 'PT Logistik Cepat Aman', contactPerson: 'Hendra Setiawan', contactPhone: '081288990011', address: 'Kawasan Industri Pulogadung Blok C', billingCycle: 'MONTHLY' as const },
    { name: 'CV Berkah Antar Bersama', contactPerson: 'Maya Kartika', contactPhone: '081288990022', address: 'Jl. Pemuda No. 45, Rawamangun', billingCycle: 'BIWEEKLY' as const },
  ]
  const createdCorporates: Record<string, string> = {}
  for (const corp of corporateData) {
    let cp = await prisma.corporateCustomer.findFirst({
      where: { branchId: demoBranch.id, name: corp.name }
    })
    if (!cp) {
      cp = await prisma.corporateCustomer.create({
        data: { ...corp, branchId: demoBranch.id, isActive: true }
      })
    }
    createdCorporates[corp.name] = cp.id
  }

  // 8. Sample customers for demo branch
  const customersData = [
    { name: 'Ahmad Fauzi', phone: '081234567891', plateNumber: 'B 1234 ABC', vehicleBrand: 'Honda', vehicleType: 'Vario 150', vehicleYear: '2022', odometer: 18500 },
    { name: 'Siti Rahma', phone: '081234567892', plateNumber: 'B 5678 DEF', vehicleBrand: 'Honda', vehicleType: 'Beat FI', vehicleYear: '2021', odometer: 24300 },
    { name: 'Bambang Kusuma', phone: '081234567893', plateNumber: 'B 9012 GHI', vehicleBrand: 'Yamaha', vehicleType: 'NMAX 155', vehicleYear: '2023', odometer: 12100 },
    { name: 'Dedi Irawan', phone: '081234567894', plateNumber: 'B 3456 JKL', vehicleBrand: 'Honda', vehicleType: 'Scoopy Prestige', vehicleYear: '2020', odometer: 31200 },
    { name: 'Eko Prasetyo', phone: '081234567895', plateNumber: 'B 7890 MNO', vehicleBrand: 'Yamaha', vehicleType: 'Aerox 155', vehicleYear: '2022', odometer: 16700 },
    { name: 'Fajar Nugraha', phone: '081234567896', plateNumber: 'B 2345 PQR', vehicleBrand: 'Honda', vehicleType: 'PCX 160 ABS', vehicleYear: '2023', odometer: 8900 },
    { name: 'Kurir 01 (Armada PT Logistik)', phone: '081288990033', plateNumber: 'B 6789 STU', vehicleBrand: 'Honda', vehicleType: 'Revo Fit', vehicleYear: '2021', odometer: 45000, corporateCustomerId: createdCorporates['PT Logistik Cepat Aman'] },
    { name: 'Kurir 02 (Armada PT Logistik)', phone: '081288990034', plateNumber: 'B 1122 VWX', vehicleBrand: 'Honda', vehicleType: 'Supra X 125', vehicleYear: '2020', odometer: 52000, corporateCustomerId: createdCorporates['PT Logistik Cepat Aman'] },
    { name: 'Hendra Wijaya', phone: '081234567897', plateNumber: 'B 4567 XYZ', vehicleBrand: 'Honda', vehicleType: 'Vario 125 CBS', vehicleYear: '2021', odometer: 28500 },
    { name: 'Dewi Lestari', phone: '081234567898', plateNumber: 'B 8901 GHI', vehicleBrand: 'Yamaha', vehicleType: 'Mio M3 125', vehicleYear: '2020', odometer: 34000 },
  ]
  const createdCustomers: Record<string, string> = {}
  for (const c of customersData) {
    let cust = await prisma.customer.findFirst({
      where: { branchId: demoBranch.id, plateNumber: c.plateNumber }
    })
    if (!cust) {
      cust = await prisma.customer.create({
        data: { ...c, branchId: demoBranch.id }
      })
    }
    createdCustomers[c.plateNumber] = cust.id
  }

  // 9. Sample transactions history to populate rich analytics & graphs
  const mechBudi = createdMechanics['Budi Santoso (Mekanik Senior)'] || Object.values(createdMechanics)[0]
  const mechRian = createdMechanics['Rian Pratama (Mekanik)'] || Object.values(createdMechanics)[0]
  const mechAsep = createdMechanics['Asep Hidayat (Spesialis Matic)'] || Object.values(createdMechanics)[0]

  const srvRingan = createdServices['Servis Ringan / Berkala']
  const srvGantiOli = createdServices['Ganti Oli Mesin & Gardan']
  const srvTuneUp = createdServices['Tune Up Injeksi & Throttle Body']
  const srvCVT = createdServices['Servis CVT Lengkap & Roller']
  const srvRem = createdServices['Ganti Kampas Rem & Minyak Rem']

  const spOliMPX2 = createdSpareparts['OLI-MPX2-08']
  const spOliSPX1 = createdSpareparts['OLI-SPX1-10']
  const spOliGardan = createdSpareparts['OLI-GRD-120']
  const spBusiDenso = createdSpareparts['BUSI-DNS-U24']
  const spBusiNGK = createdSpareparts['BUSI-NGK-CPR9']
  const spKampasDepan = createdSpareparts['BRK-FR-HND']
  const spKampasBelakang = createdSpareparts['BRK-RR-TRM']
  const spVBelt = createdSpareparts['VBLT-VARIO-125']
  const spRoller = createdSpareparts['RLR-BEAT-SET']
  const spFilter = createdSpareparts['FLT-VARIO-150']

  const now = new Date()
  const daysAgo = (days: number, hour = 10, minute = 30) => {
    const d = new Date(now)
    d.setDate(d.getDate() - days)
    d.setHours(hour, minute, 0, 0)
    return d
  }

  const transactionsPlan = [
    {
      invoiceNumber: 'INV-DEMO-001',
      date: daysAgo(0, 9, 15),
      customerId: createdCustomers['B 1234 ABC'],
      mechanicId: mechBudi,
      paymentMethod: 'QRIS' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 18500,
      notes: 'Servis rutin + ganti oli matic',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvRingan?.id, itemName: srvRingan?.name || 'Servis Ringan', quantity: 1, unitPrice: 45000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliMPX2?.id, itemName: spOliMPX2?.name || 'Oli Mesin MPX2', quantity: 1, unitPrice: 55000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliGardan?.id, itemName: spOliGardan?.name || 'Oli Gardan', quantity: 1, unitPrice: 18000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-002',
      date: daysAgo(0, 11, 0),
      customerId: createdCustomers['B 5678 DEF'],
      mechanicId: mechAsep,
      paymentMethod: 'CASH' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 24300,
      notes: 'Keluhan tarikan gredek, servis CVT + ganti roller',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvCVT?.id, itemName: srvCVT?.name || 'Servis CVT', quantity: 1, unitPrice: 60000 },
        { itemType: 'SPAREPART' as const, sparepartId: spRoller?.id, itemName: spRoller?.name || 'Roller Set Beat FI', quantity: 1, unitPrice: 65000 },
        { itemType: 'SPAREPART' as const, sparepartId: spBusiDenso?.id, itemName: spBusiDenso?.name || 'Busi Denso', quantity: 1, unitPrice: 25000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-003',
      date: daysAgo(1, 14, 20),
      customerId: createdCustomers['B 9012 GHI'],
      mechanicId: mechRian,
      paymentMethod: 'TRANSFER' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 12100,
      notes: 'Tune Up & ganti oli SPX1 NMAX',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvTuneUp?.id, itemName: srvTuneUp?.name || 'Tune Up Injeksi', quantity: 1, unitPrice: 75000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliSPX1?.id, itemName: spOliSPX1?.name || 'Oli Mesin SPX1 1L', quantity: 1, unitPrice: 75000 },
        { itemType: 'SPAREPART' as const, sparepartId: spFilter?.id, itemName: spFilter?.name || 'Filter Udara', quantity: 1, unitPrice: 55000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-004',
      date: daysAgo(2, 10, 45),
      customerId: createdCustomers['B 3456 JKL'],
      mechanicId: mechBudi,
      paymentMethod: 'CASH' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 31200,
      notes: 'Ganti kampas rem depan & belakang',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvRem?.id, itemName: srvRem?.name || 'Ganti Kampas Rem', quantity: 1, unitPrice: 35000 },
        { itemType: 'SPAREPART' as const, sparepartId: spKampasDepan?.id, itemName: spKampasDepan?.name || 'Kampas Rem Depan', quantity: 1, unitPrice: 45000 },
        { itemType: 'SPAREPART' as const, sparepartId: spKampasBelakang?.id, itemName: spKampasBelakang?.name || 'Kampas Rem Belakang', quantity: 1, unitPrice: 40000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-005',
      date: daysAgo(3, 16, 10),
      customerId: createdCustomers['B 7890 MNO'],
      mechanicId: mechAsep,
      paymentMethod: 'QRIS' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 16700,
      notes: 'Ganti V-Belt & Oli Mesin',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvCVT?.id, itemName: srvCVT?.name || 'Servis CVT', quantity: 1, unitPrice: 60000 },
        { itemType: 'SPAREPART' as const, sparepartId: spVBelt?.id, itemName: spVBelt?.name || 'V-Belt Kit Vario', quantity: 1, unitPrice: 145000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliMPX2?.id, itemName: spOliMPX2?.name || 'Oli Mesin MPX2', quantity: 1, unitPrice: 55000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-006',
      date: daysAgo(4, 13, 0),
      customerId: createdCustomers['B 6789 STU'],
      mechanicId: mechRian,
      paymentMethod: 'TRANSFER' as const,
      status: 'PENDING_CORPORATE' as const,
      type: 'MIXED' as const,
      odometer: 45000,
      notes: 'Servis armada bulanan PT Logistik',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvRingan?.id, itemName: srvRingan?.name || 'Servis Ringan', quantity: 1, unitPrice: 45000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliMPX2?.id, itemName: spOliMPX2?.name || 'Oli Mesin MPX2', quantity: 1, unitPrice: 55000 },
        { itemType: 'SPAREPART' as const, sparepartId: spBusiDenso?.id, itemName: spBusiDenso?.name || 'Busi Denso', quantity: 1, unitPrice: 25000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-007',
      date: daysAgo(5, 15, 30),
      customerId: createdCustomers['B 2345 PQR'],
      mechanicId: mechBudi,
      paymentMethod: 'QRIS' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 8900,
      notes: 'Servis berkala PCX 160',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvRingan?.id, itemName: srvRingan?.name || 'Servis Ringan', quantity: 1, unitPrice: 45000 },
        { itemType: 'SERVICE' as const, serviceId: srvTuneUp?.id, itemName: srvTuneUp?.name || 'Tune Up Injeksi', quantity: 1, unitPrice: 75000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliSPX1?.id, itemName: spOliSPX1?.name || 'Oli Mesin SPX1', quantity: 1, unitPrice: 75000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-008',
      date: daysAgo(7, 11, 20),
      customerId: createdCustomers['B 1234 ABC'],
      mechanicId: mechRian,
      paymentMethod: 'CASH' as const,
      status: 'COMPLETED' as const,
      type: 'SPAREPART' as const,
      odometer: null,
      notes: 'Beli sparepart bawa pulang',
      items: [
        { itemType: 'SPAREPART' as const, sparepartId: spOliMPX2?.id, itemName: spOliMPX2?.name || 'Oli Mesin MPX2', quantity: 2, unitPrice: 55000 },
        { itemType: 'SPAREPART' as const, sparepartId: spBusiNGK?.id, itemName: spBusiNGK?.name || 'Busi NGK', quantity: 2, unitPrice: 30000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-009',
      date: daysAgo(95, 10, 0), // 3.1 bulan lalu
      customerId: createdCustomers['B 4567 XYZ'],
      mechanicId: mechBudi,
      paymentMethod: 'CASH' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 25000,
      notes: 'Servis berkala Vario 125 (Uji Coba Reminder 3 Bulan)',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvRingan?.id, itemName: srvRingan?.name || 'Servis Ringan / Berkala', quantity: 1, unitPrice: 45000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliMPX2?.id, itemName: spOliMPX2?.name || 'Oli Mesin MPX2', quantity: 1, unitPrice: 55000 },
      ]
    },
    {
      invoiceNumber: 'INV-DEMO-010',
      date: daysAgo(130, 14, 30), // 4.3 bulan lalu
      customerId: createdCustomers['B 8901 GHI'],
      mechanicId: mechAsep,
      paymentMethod: 'QRIS' as const,
      status: 'COMPLETED' as const,
      type: 'MIXED' as const,
      odometer: 31000,
      notes: 'Tune up & servis CVT Mio (Uji Coba Reminder 4 Bulan)',
      items: [
        { itemType: 'SERVICE' as const, serviceId: srvTuneUp?.id, itemName: srvTuneUp?.name || 'Tune Up Injeksi & Throttle Body', quantity: 1, unitPrice: 75000 },
        { itemType: 'SERVICE' as const, serviceId: srvCVT?.id, itemName: srvCVT?.name || 'Servis CVT Lengkap & Roller', quantity: 1, unitPrice: 60000 },
        { itemType: 'SPAREPART' as const, sparepartId: spOliGardan?.id, itemName: spOliGardan?.name || 'Oli Gardan', quantity: 1, unitPrice: 18000 },
      ]
    }
  ]

  for (const t of transactionsPlan) {
    const existingTx = await prisma.transaction.findUnique({
      where: { invoiceNumber: t.invoiceNumber }
    })
    if (!existingTx) {
      const totalAmount = t.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const paidAmount = t.status === 'PENDING_CORPORATE' ? 0 : totalAmount

      await prisma.transaction.create({
        data: {
          invoiceNumber: t.invoiceNumber,
          branchId: demoBranch.id,
          userId: demoKasir.id,
          customerId: t.customerId || null,
          mechanicId: t.mechanicId || null,
          type: t.type,
          status: t.status,
          subtotal: totalAmount,
          total: totalAmount,
          paidAmount: paidAmount,
          paymentMethod: t.paymentMethod,
          notes: t.notes,
          odometer: t.odometer,
          transactionDate: t.date,
          createdAt: t.date,
          items: {
            create: t.items.map((item: any) => ({
              itemType: item.itemType,
              serviceId: item.serviceId || null,
              sparepartId: item.sparepartId || null,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice
            }))
          }
        }
      })
    }
  }

  console.log('✅ Demo rich transactions seeded (10+ records with charts data)')
  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📋 Login credentials:')
  console.log('   Super Admin: admin@irianmotor.com / Mallikrs08!')
  console.log('   Demo Admin : demo.admin@irianmotor.com / DemoBengkel123!')
  console.log('   Demo Kasir : demo.kasir@irianmotor.com / DemoBengkel123!')
  console.log('')
  console.log('ℹ️  Akses instan demo siap digunakan di halaman login!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
