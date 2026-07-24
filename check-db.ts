import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

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
  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      branchId: true,
      branch: { select: { name: true } },
    }
  })
  console.log('=== USERS ===')
  console.table(users)

  // Check branches
  const branches = await prisma.branch.findMany({
    select: { id: true, code: true, name: true, isActive: true }
  })
  console.log('\n=== BRANCHES ===')
  console.table(branches)

  // Check restocks
  const restocks = await prisma.restock.findMany({
    take: 5,
    include: {
      branch: { select: { name: true } },
      user: { select: { name: true } },
      items: { include: { sparepart: { select: { name: true } } } }
    },
    orderBy: { date: 'desc' }
  })
  console.log('\n=== RESTOCKS (last 5) ===')
  restocks.forEach(r => {
    console.log(`\nPO: ${r.id}`)
    console.log(`  Branch: ${r.branch.name}`)
    console.log(`  Supplier: ${r.supplierName}`)
    console.log(`  Date: ${r.date}`)
    console.log(`  Status: ${r.paymentStatus}`)
    console.log(`  Total: ${r.total}`)
    console.log(`  Created by: ${r.user.name}`)
    r.items.forEach(item => {
      console.log(`  - ${item.sparepart.name}: ${item.quantity} x ${item.buyPrice} = ${item.subtotal}`)
    })
  })

  // Check indent orders
  const indents = await prisma.indentOrder.findMany({
    take: 5,
    include: {
      branch: { select: { name: true } },
      user: { select: { name: true } },
      customer: { select: { name: true } },
      items: { include: { sparepart: { select: { name: true } } } }
    },
    orderBy: { orderDate: 'desc' }
  })
  console.log('\n=== INDENT ORDERS (last 5) ===')
  indents.forEach(i => {
    console.log(`\nIndent: ${i.id}`)
    console.log(`  Type: ${i.type}`)
    console.log(`  Branch: ${i.branch.name}`)
    console.log(`  Supplier: ${i.supplierName}`)
    console.log(`  Customer: ${i.customer?.name || 'N/A'}`)
    console.log(`  Order Date: ${i.orderDate}`)
    console.log(`  Expected: ${i.expectedDate || 'N/A'}`)
    console.log(`  Status: ${i.status}`)
    console.log(`  DP: ${i.dpAmount}`)
    i.items.forEach(item => {
      console.log(`  - ${item.sparepart.name}: Qty ${item.quantity}, Received ${item.receivedQty}, Est. Price ${item.estimatedPrice}`)
    })
  })

  await prisma.$disconnect()
}

main().catch(console.error)