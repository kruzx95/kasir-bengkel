import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Setup user sesuai permintaan:
 * - Super admin: admin@irianmotor.com / Mallikrs08!
 * - Kasir Majalengka: admin@majalengka.com / kasir123
 * - Kasir Pekanbaru: admin@pekanbaru2.com / kasir123
 *
 * Run: DATABASE_URL=... npx tsx scripts/setup-users.ts
 */
async function main() {
  console.log('=== Setup user sesuai permintaan ===')

  // 1. Update password super admin
  const adminHash = await bcrypt.hash('Mallikrs08!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@irianmotor.com' },
    update: { passwordHash: adminHash, isActive: true, name: 'Owner Bengkel' },
    create: {
      name: 'Owner Bengkel',
      email: 'admin@irianmotor.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      branchId: null,
    },
  })
  console.log(`✅ ${admin.email} → password updated to "Mallikrs08!"`)

  // 2. Branch Majalengka
  const branchMajalengka = await prisma.branch.upsert({
    where: { code: 'BRG-MJL' },
    update: {},
    create: {
      name: 'Majalengka',
      code: 'BRG-MJL',
      address: 'Jl. Raya Majalengka No. 1, Kabupaten Majalengka',
      phone: '0233-281234',
    },
  })
  console.log(`✅ Branch created/updated: ${branchMajalengka.name} (${branchMajalengka.code})`)

  // 3. Branch Pekanbaru
  const branchPekanbaru = await prisma.branch.upsert({
    where: { code: 'BRG-PKB' },
    update: {},
    create: {
      name: 'Pekanbaru',
      code: 'BRG-PKB',
      address: 'Jl. HR. Soebrantas No. 1, Kota Pekanbaru',
      phone: '0761-12345',
    },
  })
  console.log(`✅ Branch created/updated: ${branchPekanbaru.name} (${branchPekanbaru.code})`)

  // 4. Kasir Majalengka
  const kasirHash = await bcrypt.hash('kasir123', 10)
  const kasirMajalengka = await prisma.user.upsert({
    where: { email: 'admin@majalengka.com' },
    update: {
      passwordHash: kasirHash,
      isActive: true,
      name: 'Kasir Majalengka',
      role: 'KASIR',
      branchId: branchMajalengka.id,
    },
    create: {
      name: 'Kasir Majalengka',
      email: 'admin@majalengka.com',
      passwordHash: kasirHash,
      role: 'KASIR',
      branchId: branchMajalengka.id,
    },
  })
  console.log(`✅ ${kasirMajalengka.email} → branch ${branchMajalengka.name}, password "kasir123"`)

  // 5. Kasir Pekanbaru
  const kasirPekanbaru = await prisma.user.upsert({
    where: { email: 'admin@pekanbaru2.com' },
    update: {
      passwordHash: kasirHash,
      isActive: true,
      name: 'Kasir Pekanbaru',
      role: 'KASIR',
      branchId: branchPekanbaru.id,
    },
    create: {
      name: 'Kasir Pekanbaru',
      email: 'admin@pekanbaru2.com',
      passwordHash: kasirHash,
      role: 'KASIR',
      branchId: branchPekanbaru.id,
    },
  })
  console.log(`✅ ${kasirPekanbaru.email} → branch ${branchPekanbaru.name}, password "kasir123"`)

  // 6. Optional: nonaktifkan user kasir lama yang tidak dipakai
  const oldKasirEmails = ['kasir1@irianmotor.com', 'kasir2@irianmotor.com', 'kasir3@irianmotor.com']
  const deactivated = await prisma.user.updateMany({
    where: { email: { in: oldKasirEmails } },
    data: { isActive: false },
  })
  console.log(`⏸️  Nonaktifkan ${deactivated.count} user kasir lama (${oldKasirEmails.join(', ')})`)

  console.log('\n=== KREDENSIAL AKTIF ===')
  console.log('Super Admin:  admin@irianmotor.com / Mallikrs08!')
  console.log('Kasir Majalengka: admin@majalengka.com / kasir123')
  console.log('Kasir Pekanbaru: admin@pekanbaru2.com / kasir123')

  await prisma.$disconnect()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})