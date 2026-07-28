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
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create 3 branches
  const branch1 = await prisma.branch.upsert({
    where: { code: 'BRG-01' },
    update: {
      name: 'Indihiang',
      address: 'Indihiang',
      phone: '0265-123456',
    },
    create: {
      code: 'BRG-01',
      name: 'Indihiang',
      address: 'Indihiang',
      phone: '0265-123456',
    },
  })

  const branch2 = await prisma.branch.upsert({
    where: { code: 'BRG-02' },
    update: {
      name: 'Irian Timur',
      address: 'Jl. Irian Timur No. 78, Kota Tasikmalaya',
      phone: '0265-234567',
    },
    create: {
      code: 'BRG-02',
      name: 'Irian Timur',
      address: 'Jl. Irian Timur No. 78, Kota Tasikmalaya',
      phone: '0265-234567',
    },
  })

  const branch3 = await prisma.branch.upsert({
    where: { code: 'BRG-03' },
    update: {
      name: 'Irian Barat',
      address: 'Jl. Irian Barat No. 12, Kota Tasikmalaya',
      phone: '0265-345678',
    },
    create: {
      code: 'BRG-03',
      name: 'Irian Barat',
      address: 'Jl. Irian Barat No. 12, Kota Tasikmalaya',
      phone: '0265-345678',
    },
  })

  console.log('✅ Branches created:', branch1.name, branch2.name, branch3.name)

  // Create super admin user
  const adminPassword = await bcrypt.hash('Mallikrs08!', 10)  // Sesuai permintaan user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@irianmotor.com' },
    update: {},
    create: {
      name: 'Owner Bengkel',
      email: 'admin@irianmotor.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      branchId: null, // Admin can access all branches
    },
  })

  console.log('✅ Admin created:', admin.email)

  // Create kasir Majalengka
  const branchMajalengka = await prisma.branch.upsert({
    where: { code: 'BRG-05' },
    update: {},
    create: {
      name: 'Majalengka',
      code: 'BRG-05',
      address: 'Jl. Raya Majalengka No. 1, Kabupaten Majalengka',
      phone: '0233-281234',
    },
  })
  const kasirPassword = await bcrypt.hash('kasir123', 10)
  const kasirMajalengka = await prisma.user.upsert({
    where: { email: 'admin@majalengka.com' },
    update: {},
    create: {
      name: 'Kasir Majalengka',
      email: 'admin@majalengka.com',
      passwordHash: kasirPassword,
      role: 'KASIR',
      branchId: branchMajalengka.id,
    },
  })

  // Create kasir Pekanbaru
  const branchPekanbaru = await prisma.branch.upsert({
    where: { code: 'BRG-06' },
    update: {},
    create: {
      name: 'Pekanbaru',
      code: 'BRG-06',
      address: 'Jl. HR. Soebrantas No. 1, Kota Pekanbaru',
      phone: '0761-12345',
    },
  })
  const kasirPekanbaru = await prisma.user.upsert({
    where: { email: 'admin@pekanbaru2.com' },
    update: {},
    create: {
      name: 'Kasir Pekanbaru',
      email: 'admin@pekanbaru2.com',
      passwordHash: kasirPassword,
      role: 'KASIR',
      branchId: branchPekanbaru.id,
    },
  })

  console.log('✅ Kasir created:', kasirMajalengka.email, kasirPekanbaru.email)

  // Create sample services for each branch
  const serviceTemplates = [
    { name: 'Ganti Oli', price: 50000, category: 'Perawatan' },
    { name: 'Tune Up', price: 75000, category: 'Perawatan' },
    { name: 'Ganti Kampas Rem', price: 60000, category: 'Rem' },
    { name: 'Ganti Ban', price: 40000, category: 'Ban' },
    { name: 'Service CVT', price: 150000, category: 'Transmisi' },
    { name: 'Ganti Busi', price: 25000, category: 'Kelistrikan' },
    { name: 'Service Injeksi', price: 100000, category: 'Mesin' },
    { name: 'Ganti V-Belt', price: 80000, category: 'Transmisi' },
  ]

  for (const branch of [branch1, branch2, branch3]) {
    for (const svc of serviceTemplates) {
      await prisma.service.create({
        data: {
          branchId: branch.id,
          name: svc.name,
          price: svc.price,
          category: svc.category,
        },
      })
    }
  }

  console.log('✅ Services created for all branches')

  // Create sample spareparts for each branch
  const sparepartTemplates = [
    { name: 'Oli Yamalube 0.8L', sku: 'OLI-001', buyPrice: 28000, sellPrice: 38000, stock: 50, unit: 'botol' },
    { name: 'Oli Enduro 0.8L', sku: 'OLI-002', buyPrice: 22000, sellPrice: 32000, stock: 40, unit: 'botol' },
    { name: 'Busi NGK', sku: 'BSI-001', buyPrice: 12000, sellPrice: 20000, stock: 30, unit: 'pcs' },
    { name: 'Kampas Rem Depan', sku: 'REM-001', buyPrice: 18000, sellPrice: 30000, stock: 25, unit: 'set' },
    { name: 'Kampas Rem Belakang', sku: 'REM-002', buyPrice: 15000, sellPrice: 25000, stock: 25, unit: 'set' },
    { name: 'V-Belt Honda Beat', sku: 'VBL-001', buyPrice: 45000, sellPrice: 70000, stock: 15, unit: 'pcs' },
    { name: 'V-Belt Yamaha Mio', sku: 'VBL-002', buyPrice: 48000, sellPrice: 75000, stock: 15, unit: 'pcs' },
    { name: 'Ban Luar 70/90-14', sku: 'BAN-001', buyPrice: 85000, sellPrice: 120000, stock: 10, unit: 'pcs' },
    { name: 'Ban Dalam 14 inch', sku: 'BAN-002', buyPrice: 20000, sellPrice: 35000, stock: 20, unit: 'pcs' },
    { name: 'Roller CVT Set', sku: 'CVT-001', buyPrice: 25000, sellPrice: 45000, stock: 20, unit: 'set' },
  ]

  for (const branch of [branch1, branch2, branch3]) {
    for (const sp of sparepartTemplates) {
      await prisma.sparepart.create({
        data: {
          branchId: branch.id,
          name: sp.name,
          sku: sp.sku,
          buyPrice: sp.buyPrice,
          sellPrice: sp.sellPrice,
          stock: sp.stock,
          unit: sp.unit,
        },
      })
    }
  }

  console.log('✅ Spareparts created for all branches')

  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📋 Login credentials:')
  console.log('   Super Admin: admin@irianmotor.com / Mallikrs08!')
  console.log('   Kasir Majalengka: admin@majalengka.com / kasir123')
  console.log('   Kasir Pekanbaru: admin@pekanbaru2.com / kasir123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
