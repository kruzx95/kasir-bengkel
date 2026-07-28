import { prisma } from '../src/lib/prisma'

async function main() {
  const branches = await prisma.branch.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })
  console.log(JSON.stringify(branches, null, 2))
  await prisma.$disconnect()
}
main()