import { prisma } from '../src/lib/prisma'

/**
 * Fix: Branch Majalengka & Pekanbaru → pakai code BRG-05 & BRG-06
 * Sesuai permintaan user: "kasir Majalengka branch id nya BRG-05",
 * "kasir pekanbaru branch id nya BRG-06"
 * "ke 2 user itu fitur nya sudah lengkap" → masing-masing punya branch sendiri.
 */
async function main() {
  console.log('=== Fix branch code ===')

  // 1. Rename Majalengka (BRG-MJL atau BRG-05) → BRG-05
  const mjl = await prisma.branch.findFirst({ where: { name: 'Majalengka' } })
  if (!mjl) {
    throw new Error('Branch Majalengka tidak ditemukan')
  }
  if (mjl.code !== 'BRG-05') {
    const updated = await prisma.branch.update({
      where: { id: mjl.id },
      data: { code: 'BRG-05' },
    })
    console.log(`✅ ${updated.name}: ${mjl.code} → BRG-05`)
  } else {
    console.log(`✓  ${mjl.name}: sudah BRG-05 (skip)`)
  }

  // 2. Rename Pekanbaru (BRG-PKB atau BRG-06) → BRG-06
  const pkb = await prisma.branch.findFirst({ where: { name: 'Pekanbaru' } })
  if (!pkb) {
    throw new Error('Branch Pekanbaru tidak ditemukan')
  }
  if (pkb.code !== 'BRG-06') {
    const updated = await prisma.branch.update({
      where: { id: pkb.id },
      data: { code: 'BRG-06' },
    })
    console.log(`✅ ${updated.name}: ${pkb.code} → BRG-06`)
  } else {
    console.log(`✓  ${pkb.name}: sudah BRG-06 (skip)`)
  }

  // Tampilkan state akhir
  console.log('\n=== STATE AKHIR ===')
  const branches = await prisma.branch.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })
  console.log('Branches:', JSON.stringify(branches, null, 2))

  const users = await prisma.user.findMany({
    where: { email: { in: ['admin@irianmotor.com', 'admin@majalengka.com', 'admin@pekanbaru2.com'] } },
    select: { email: true, name: true, role: true, branchId: true, branch: { select: { code: true, name: true } } },
  })
  console.log('Users:', JSON.stringify(users, null, 2))

  await prisma.$disconnect()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})