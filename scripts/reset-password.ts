/**
 * Script untuk reset password user
 * Jalankan: npx tsx scripts/reset-password.ts
 *
 * Ganti EMAIL dan PASSWORD_BARU sesuai kebutuhan
 */

import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const EMAIL = 'admin@irianmotor.com'   // ← ganti dengan email admin
const PASSWORD_BARU = 'Mallikrs08!'     // ← ganti dengan password baru

async function main() {
  const url = new URL(process.env.DATABASE_URL!)
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
  })
  const prisma = new PrismaClient({ adapter } as any)

  const user = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (!user) {
    console.error(`❌ User dengan email "${EMAIL}" tidak ditemukan`)
    process.exit(1)
  }

  const hash = await bcrypt.hash(PASSWORD_BARU, 10)
  await prisma.user.update({
    where: { email: EMAIL },
    data: { passwordHash: hash },
  })

  console.log(`✅ Password untuk "${EMAIL}" berhasil diubah`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
