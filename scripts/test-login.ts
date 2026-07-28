import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const candidates = [
    { email: 'admin@irianmotor.com', password: 'Mallikrs08!' },
    { email: 'admin@majalengka.com', password: 'kasir123' },
    { email: 'admin@pekanbaru2.com', password: 'kasir123' },
  ]

  for (const c of candidates) {
    const user = await prisma.user.findUnique({
      where: { email: c.email },
      select: { id: true, email: true, isActive: true, passwordHash: true, role: true, branchId: true },
    })
    if (!user) {
      console.log(`❌ ${c.email} → user not found`)
      continue
    }
    if (!user.isActive) {
      console.log(`❌ ${c.email} → user inactive`)
      continue
    }
    const match = await bcrypt.compare(c.password, user.passwordHash)
    console.log(`${match ? '✅' : '❌'} ${c.email} + "${c.password}" → match=${match} (role=${user.role}, branch=${user.branchId})`)
  }

  await prisma.$disconnect()
}
main()