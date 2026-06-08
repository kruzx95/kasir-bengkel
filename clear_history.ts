import 'dotenv/config'
import { PrismaClient } from './src/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

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
  console.log('Clearing transaction history...')
  
  // Delete all transactions (TransactionItem will be deleted automatically due to Cascade)
  const txDeleted = await prisma.transaction.deleteMany({})
  console.log(`✅ ${txDeleted.count} Transactions deleted`)

  // Delete all restocks (RestockItem deleted via Cascade)
  const rsDeleted = await prisma.restock.deleteMany({})
  console.log(`✅ ${rsDeleted.count} Restocks deleted`)

  // Delete all indent orders (IndentOrderItem deleted via Cascade)
  const ioDeleted = await prisma.indentOrder.deleteMany({})
  console.log(`✅ ${ioDeleted.count} Indent Orders deleted`)

  // Reset all sparepart stock to 50 for testing
  const spUpdated = await prisma.sparepart.updateMany({
    data: { stock: 50 }
  })
  console.log(`✅ ${spUpdated.count} Sparepart stock reset to 50`)

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
