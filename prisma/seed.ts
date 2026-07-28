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
  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📋 Login credentials:')
  console.log('   Super Admin: admin@irianmotor.com / Mallikrs08!')
  console.log('')
  console.log('ℹ️  Tambahkan cabang dan kasir lewat UI di /admin/cabang dan /admin/pengguna')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
