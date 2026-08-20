import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
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

async function cleanupDemo() {
  console.log('🧹 Memulai pembersihan data dummy Cabang Demo...')

  const demoBranch = await prisma.branch.findUnique({
    where: { code: 'DEMO' },
  })

  if (!demoBranch) {
    console.log('ℹ️ Cabang Demo tidak ditemukan. Database sudah bersih!')
    return
  }

  const branchId = demoBranch.id
  console.log(`🔍 Menemukan Cabang Demo (ID: ${branchId})`)

  await prisma.$transaction(
    async (tx) => {
      // 1. Delete Corporate Payment Links & Payments in demo branch
      const demoPayments = await tx.corporatePayment.findMany({
        where: { branchId },
        select: { id: true },
      })
      const paymentIds = demoPayments.map((p) => p.id)
      if (paymentIds.length > 0) {
        await tx.corporatePaymentTransaction.deleteMany({
          where: { paymentId: { in: paymentIds } },
        })
        await tx.corporatePayment.deleteMany({
          where: { id: { in: paymentIds } },
        })
      }

      // 2. Delete Transactions & Items in demo branch
      const demoTransactions = await tx.transaction.findMany({
        where: { branchId },
        select: { id: true },
      })
      const txIds = demoTransactions.map((t) => t.id)
      if (txIds.length > 0) {
        await tx.corporatePaymentTransaction.deleteMany({
          where: { transactionId: { in: txIds } },
        })
        await tx.transactionItem.deleteMany({
          where: { transactionId: { in: txIds } },
        })
        await tx.transaction.deleteMany({
          where: { id: { in: txIds } },
        })
      }

      // 3. Delete Restocks & Items in demo branch
      const demoRestocks = await tx.restock.findMany({
        where: { branchId },
        select: { id: true },
      })
      const restockIds = demoRestocks.map((r) => r.id)
      if (restockIds.length > 0) {
        await tx.restockItem.deleteMany({
          where: { restockId: { in: restockIds } },
        })
        await tx.restock.deleteMany({
          where: { id: { in: restockIds } },
        })
      }

      // 4. Delete Indents & Items in demo branch
      const demoIndents = await tx.indentOrder.findMany({
        where: { branchId },
        select: { id: true },
      })
      const indentIds = demoIndents.map((i) => i.id)
      if (indentIds.length > 0) {
        await tx.indentOrderItem.deleteMany({
          where: { indentOrderId: { in: indentIds } },
        })
        await tx.indentOrder.deleteMany({
          where: { id: { in: indentIds } },
        })
      }

      // 5. Delete Stock Transfers in demo branch
      await tx.stockTransfer.deleteMany({
        where: { branchId },
      })

      // 6. Delete Customers in demo branch
      await tx.customer.deleteMany({
        where: { branchId },
      })

      // 7. Delete Corporate Customers in demo branch
      await tx.corporateCustomer.deleteMany({
        where: { branchId },
      })

      // 8. Delete Mechanics in demo branch
      await tx.mechanic.deleteMany({
        where: { branchId },
      })

      // 9. Delete Spareparts in demo branch
      await tx.sparepart.deleteMany({
        where: { branchId },
      })

      // 10. Delete Services in demo branch
      await tx.service.deleteMany({
        where: { branchId },
      })

      // 11. Delete Demo Users
      await tx.user.deleteMany({
        where: {
          OR: [
            { branchId },
            { email: { in: ['demo.admin@irianmotor.com', 'demo.kasir@irianmotor.com'] } },
          ],
        },
      })

      // 12. Delete Activity Logs for demo branch
      await tx.activityLog.deleteMany({
        where: { branchId },
      })

      // 13. Delete Demo Branch itself
      await tx.branch.delete({
        where: { id: branchId },
      })
    },
    { timeout: 60000 }
  )

  console.log('✅ SELURUH data dummy Cabang Demo berhasil dihapus total dari database!')
}

cleanupDemo()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat menghapus data dummy:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
