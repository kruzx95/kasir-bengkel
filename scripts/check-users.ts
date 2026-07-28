import { prisma } from '../src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, branchId: true, isActive: true, passwordHash: true },
  })
  console.log('=== ALL USERS ===')
  console.log(`Total: ${users.length}`)
  users.forEach(u => {
    console.log({
      email: u.email,
      name: u.name,
      role: u.role,
      branchId: u.branchId,
      isActive: u.isActive,
      hashStart: u.passwordHash?.slice(0, 20) + '...',
      hashLen: u.passwordHash?.length,
    })
  })
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, code: true } })
  console.log('\n=== BRANCHES ===')
  branches.forEach(b => console.log(b))
  await prisma.$disconnect()
}
main()