'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createActivityLog } from '@/lib/logger'
import { getShopName } from '@/actions/settings'

export async function exportDatabaseBackup() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengekspor backup.' }
    }

    const [
      branches,
      users,
      corporateCustomers,
      customers,
      mechanics,
      services,
      spareparts,
      transactions,
      indentOrders,
      restocks,
      stockTransfers,
      corporatePayments,
      corporatePaymentTransactions,
    ] = await Promise.all([
      prisma.branch.findMany(),
      prisma.user.findMany(),
      prisma.corporateCustomer.findMany(),
      prisma.customer.findMany(),
      prisma.mechanic.findMany(),
      prisma.service.findMany(),
      prisma.sparepart.findMany(),
      prisma.transaction.findMany({ include: { items: true } }),
      prisma.indentOrder.findMany({ include: { items: true } }),
      prisma.restock.findMany({ include: { items: true } }),
      prisma.stockTransfer.findMany(),
      prisma.corporatePayment.findMany(),
      prisma.corporatePaymentTransaction.findMany(),
    ])

    const shopNameValue = await getShopName()
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: session.name,
      shopName: shopNameValue,
      data: {
        branches,
        users,
        corporateCustomers,
        customers,
        mechanics,
        services,
        spareparts,
        transactions,
        indentOrders,
        restocks,
        stockTransfers,
        corporatePayments,
        corporatePaymentTransactions,
      },
    }

    await createActivityLog({
      action: 'EXPORT_BACKUP',
      category: 'SYSTEM',
      level: 'INFO',
      description: `Mengekspor backup lengkap database sistem`,
      details: JSON.stringify({ exportedBy: session.name, exportedAt: new Date().toISOString() }),
    })

    return {
      success: true,
      filename: `backup_mulyalestari_${new Date().toISOString().slice(0, 10)}.json`,
      jsonString: JSON.stringify(backupData, null, 2),
      summary: {
        branches: branches.length,
        users: users.length,
        spareparts: spareparts.length,
        services: services.length,
        transactions: transactions.length,
        indentOrders: indentOrders.length,
        restocks: restocks.length,
      },
    }
  } catch (error) {
    console.error('Export Backup Error:', error)
    return { success: false, message: 'Gagal mengekspor data backup.' }
  }
}

export async function cleanDatabase(
  mode: 'ALL_TESTING_DATA' | 'TRANSACTIONS_ONLY' | 'CATALOG_ONLY' | 'FULL_RESET',
  password: string
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Akses ditolak.' }
    }

    // Verify admin password
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return { success: false, message: 'User tidak ditemukan.' }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return { success: false, message: 'Password Admin salah. Konfirmasi dibatalkan.' }
    }

    await prisma.$transaction(
      async (tx) => {
        // Delete all transactional records in FK cascade order
        await tx.corporatePaymentTransaction.deleteMany()
        await tx.corporatePayment.deleteMany()
        await tx.transactionItem.deleteMany()
        await tx.transaction.deleteMany()
        await tx.indentOrderItem.deleteMany()
        await tx.indentOrder.deleteMany()
        await tx.restockItem.deleteMany()
        await tx.restock.deleteMany()
        await tx.stockTransfer.deleteMany()

        if (mode === 'ALL_TESTING_DATA') {
          // Clean all testing master data: Spareparts, Services, Customers, Mechanics, Corporate Customers, Activity Logs
          // ALL USERS AND BRANCHES ARE 100% PRESERVED
          await tx.mechanic.deleteMany()
          await tx.service.deleteMany()
          await tx.sparepart.deleteMany()
          await tx.customer.deleteMany()
          await tx.corporateCustomer.deleteMany()
          await tx.activityLog.deleteMany()
        } else if (mode === 'TRANSACTIONS_ONLY') {
          // Reset sparepart stock counters to 0
          await tx.sparepart.updateMany({
            data: {
              stock: 0,
              warehouseStock: 0,
            },
          })
        } else if (mode === 'CATALOG_ONLY') {
          // Delete Spareparts & Services catalog
          // Users (Admin, Kasir), Branches, Customers, Mechanics are 100% PRESERVED
          await tx.sparepart.deleteMany()
          await tx.service.deleteMany()
        } else if (mode === 'FULL_RESET') {
          // Reset master data except current active Super Admin & main branch
          await tx.mechanic.deleteMany()
          await tx.service.deleteMany()
          await tx.sparepart.deleteMany()
          await tx.customer.deleteMany()
          await tx.corporateCustomer.deleteMany()

          // Delete all other users except current session user
          await tx.user.deleteMany({
            where: { id: { not: session.userId } },
          })

          // Delete all other branches except current branch (if any)
          if (session.branchId) {
            await tx.branch.deleteMany({
              where: { id: { not: session.branchId } },
            })
          }
        }
      },
      { timeout: 60000 }
    )

    await createActivityLog({
      action: 'DATABASE_RESET',
      category: 'SYSTEM',
      level: 'CRITICAL',
      description: `Reset Database (Mode: ${mode}) oleh ${session.name}`,
      details: { mode },
      branchId: session.branchId || null,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/', 'layout')
    return {
      success: true,
      message:
        mode === 'ALL_TESTING_DATA'
          ? 'Seluruh data testing (transaksi, sparepart, jasa, pelanggan & mekanik) berhasil dibersihkan! Seluruh akun Login Pengguna & Cabang 100% tersimpan aman.'
          : mode === 'TRANSACTIONS_ONLY'
          ? 'Data riwayat transaksi, indent, restock & mutasi berhasil dibersihkan!'
          : mode === 'CATALOG_ONLY'
          ? 'Katalog Sparepart & Jasa Servis berhasil dikosongkan! Seluruh akun User (Admin & Kasir) serta Cabang tetap utuh.'
          : 'Database berhasil di-reset total ke kondisi awal!',
    }
  } catch (error) {
    console.error('Clean Database Error:', error)
    return { success: false, message: 'Gagal melakukan pembersihan database.' }
  }
}

export async function restoreDatabase(jsonContent: string, password: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Akses ditolak.' }
    }

    // Verify admin password
    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!currentUser) return { success: false, message: 'User tidak ditemukan.' }

    const isPasswordValid = await bcrypt.compare(password, currentUser.passwordHash)
    if (!isPasswordValid) {
      return { success: false, message: 'Password Admin salah. Restore dibatalkan.' }
    }

    // Parse JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonContent)
    } catch {
      return { success: false, message: 'Format file backup JSON tidak valid.' }
    }

    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      return { success: false, message: 'Struktur data backup tidak dikenali.' }
    }

    const {
      branches = [],
      users = [],
      corporateCustomers = [],
      customers = [],
      mechanics = [],
      services = [],
      spareparts = [],
      transactions = [],
      indentOrders = [],
      restocks = [],
      stockTransfers = [],
      corporatePayments = [],
      corporatePaymentTransactions = [],
    } = parsed.data

    await prisma.$transaction(
      async (tx) => {
        // 1. Delete all existing records
        await tx.corporatePaymentTransaction.deleteMany()
        await tx.corporatePayment.deleteMany()
        await tx.transactionItem.deleteMany()
        await tx.transaction.deleteMany()
        await tx.indentOrderItem.deleteMany()
        await tx.indentOrder.deleteMany()
        await tx.restockItem.deleteMany()
        await tx.restock.deleteMany()
        await tx.stockTransfer.deleteMany()
        await tx.mechanic.deleteMany()
        await tx.service.deleteMany()
        await tx.sparepart.deleteMany()
        await tx.customer.deleteMany()
        await tx.corporateCustomer.deleteMany()
        await tx.user.deleteMany()
        await tx.branch.deleteMany()

        // 2. Insert branches
        for (const b of branches) {
          await tx.branch.create({
            data: {
              id: b.id,
              code: b.code,
              name: b.name,
              address: b.address,
              phone: b.phone,
              isActive: b.isActive ?? true,
              facebookPage: b.facebookPage,
              instagramHandle: b.instagramHandle,
              whatsappNumber: b.whatsappNumber,
              createdAt: b.createdAt ? new Date(b.createdAt) : undefined,
              updatedAt: b.updatedAt ? new Date(b.updatedAt) : undefined,
            },
          })
        }

        // 3. Insert users
        for (const u of users) {
          await tx.user.create({
            data: {
              id: u.id,
              branchId: u.branchId,
              name: u.name,
              email: u.email,
              passwordHash: u.passwordHash,
              role: u.role,
              isActive: u.isActive ?? true,
              createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
              updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
            },
          })
        }

        // 4. Insert corporate customers
        for (const cc of corporateCustomers) {
          await tx.corporateCustomer.create({
            data: {
              id: cc.id,
              branchId: cc.branchId,
              name: cc.name,
              contactPerson: cc.contactPerson,
              contactPhone: cc.contactPhone,
              address: cc.address,
              taxId: cc.taxId,
              billingCycle: cc.billingCycle || 'MONTHLY',
              isActive: cc.isActive ?? true,
              hideServiceOnInvoice: cc.hideServiceOnInvoice ?? false,
              createdAt: cc.createdAt ? new Date(cc.createdAt) : undefined,
              updatedAt: cc.updatedAt ? new Date(cc.updatedAt) : undefined,
            },
          })
        }

        // 5. Insert customers
        for (const c of customers) {
          await tx.customer.create({
            data: {
              id: c.id,
              branchId: c.branchId,
              name: c.name,
              phone: c.phone,
              plateNumber: c.plateNumber,
              vehicleType: c.vehicleType,
              vehicleYear: c.vehicleYear,
              vehicleBrand: c.vehicleBrand,
              vehicleColor: c.vehicleColor,
              address: c.address,
              fuelType: c.fuelType,
              odometer: c.odometer,
              corporateCustomerId: c.corporateCustomerId,
              lastReminderSentAt: c.lastReminderSentAt ? new Date(c.lastReminderSentAt) : undefined,
              createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
              updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
            },
          })
        }

        // 6. Insert mechanics
        for (const m of mechanics) {
          await tx.mechanic.create({
            data: {
              id: m.id,
              branchId: m.branchId,
              name: m.name,
              phone: m.phone,
              isActive: m.isActive ?? true,
              createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
              updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
            },
          })
        }

        // 7. Insert services
        for (const s of services) {
          await tx.service.create({
            data: {
              id: s.id,
              branchId: s.branchId,
              name: s.name,
              price: s.price,
              category: s.category,
              isActive: s.isActive ?? true,
              createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
              updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
            },
          })
        }

        // 8. Insert spareparts
        for (const sp of spareparts) {
          await tx.sparepart.create({
            data: {
              id: sp.id,
              branchId: sp.branchId,
              name: sp.name,
              sku: sp.sku,
              stock: sp.stock,
              warehouseStock: sp.warehouseStock ?? 0,
              buyPrice: sp.buyPrice ?? 0,
              sellPrice: sp.sellPrice,
              unit: sp.unit || 'pcs',
              minStock: sp.minStock ?? 0,
              minWarehouseStock: sp.minWarehouseStock ?? 0,
              sparepartBrand: sp.sparepartBrand,
              sparepartSize: sp.sparepartSize,
              sparepartType: sp.sparepartType,
              isActive: sp.isActive ?? true,
              createdAt: sp.createdAt ? new Date(sp.createdAt) : undefined,
              updatedAt: sp.updatedAt ? new Date(sp.updatedAt) : undefined,
            },
          })
        }

        // 9. Insert transactions & transaction items
        for (const t of transactions) {
          const { items = [], ...txData } = t
          await tx.transaction.create({
            data: {
              id: txData.id,
              branchId: txData.branchId,
              userId: txData.userId,
              customerId: txData.customerId,
              mechanicId: txData.mechanicId,
              invoiceNumber: txData.invoiceNumber,
              transactionDate: new Date(txData.transactionDate),
              subtotal: txData.subtotal ?? 0,
              total: txData.total,
              discount: txData.discount ?? 0,
              paidAmount: txData.paidAmount,
              paymentMethod: txData.paymentMethod || 'CASH',
              notes: txData.notes,
              status: txData.status || 'COMPLETED',
              type: txData.type || 'MIXED',
              odometer: txData.odometer,
              createdAt: txData.createdAt ? new Date(txData.createdAt) : undefined,
              updatedAt: txData.updatedAt ? new Date(txData.updatedAt) : undefined,
              items: {
                create: items.map((i: any) => ({
                  id: i.id,
                  itemType: i.itemType,
                  sparepartId: i.sparepartId,
                  serviceId: i.serviceId,
                  itemName: i.itemName,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  subtotal: i.subtotal,
                })),
              },
            },
          })
        }

        // 10. Insert indent orders & items
        for (const io of indentOrders) {
          const { items = [], ...ioData } = io
          await tx.indentOrder.create({
            data: {
              id: ioData.id,
              branchId: ioData.branchId,
              userId: ioData.userId,
              customerId: ioData.customerId,
              supplierName: ioData.supplierName,
              orderDate: new Date(ioData.orderDate),
              expectedDate: ioData.expectedDate ? new Date(ioData.expectedDate) : null,
              notes: ioData.notes,
              dpAmount: ioData.dpAmount ?? 0,
              status: ioData.status || 'PENDING',
              type: ioData.type || 'CUSTOMER',
              createdAt: ioData.createdAt ? new Date(ioData.createdAt) : undefined,
              updatedAt: ioData.updatedAt ? new Date(ioData.updatedAt) : undefined,
              items: {
                create: items.map((i: any) => ({
                  id: i.id,
                  sparepartId: i.sparepartId,
                  quantity: i.quantity,
                  receivedQty: i.receivedQty ?? 0,
                  estimatedPrice: i.estimatedPrice ?? 0,
                })),
              },
            },
          })
        }

        // 11. Insert restocks & items
        for (const r of restocks) {
          const { items = [], ...rData } = r
          await tx.restock.create({
            data: {
              id: rData.id,
              branchId: rData.branchId,
              userId: rData.userId,
              supplierName: rData.supplierName,
              date: new Date(rData.date),
              notes: rData.notes,
              total: rData.total,
              paidAmount: rData.paidAmount,
              paymentStatus: rData.paymentStatus || 'LUNAS',
              receiptImagePath: rData.receiptImagePath,
              indentOrderId: rData.indentOrderId,
              createdAt: rData.createdAt ? new Date(rData.createdAt) : undefined,
              updatedAt: rData.updatedAt ? new Date(rData.updatedAt) : undefined,
              items: {
                create: items.map((i: any) => ({
                  id: i.id,
                  sparepartId: i.sparepartId,
                  quantity: i.quantity,
                  buyPrice: i.buyPrice,
                  subtotal: i.subtotal,
                })),
              },
            },
          })
        }

        // 12. Insert stock transfers
        for (const st of stockTransfers) {
          await tx.stockTransfer.create({
            data: {
              id: st.id,
              branchId: st.branchId,
              userId: st.userId,
              sparepartId: st.sparepartId,
              type: st.type,
              quantity: st.quantity,
              notes: st.notes,
              transferDate: st.transferDate ? new Date(st.transferDate) : new Date(),
              createdAt: st.createdAt ? new Date(st.createdAt) : undefined,
            },
          })
        }

        // 13. Insert corporate payments
        for (const cp of corporatePayments) {
          await tx.corporatePayment.create({
            data: {
              id: cp.id,
              corporateCustomerId: cp.corporateCustomerId,
              branchId: cp.branchId,
              amount: cp.amount,
              paymentMethod: cp.paymentMethod || 'TRANSFER',
              notes: cp.notes,
              paidAt: cp.paidAt ? new Date(cp.paidAt) : new Date(),
              createdById: cp.createdById,
              periodStart: new Date(cp.periodStart),
              periodEnd: new Date(cp.periodEnd),
              voidedAt: cp.voidedAt ? new Date(cp.voidedAt) : null,
              voidedById: cp.voidedById,
              voidReason: cp.voidReason,
              createdAt: cp.createdAt ? new Date(cp.createdAt) : undefined,
            },
          })
        }

        // 14. Insert corporate payment transactions
        for (const cpt of corporatePaymentTransactions) {
          await tx.corporatePaymentTransaction.create({
            data: {
              id: cpt.id,
              paymentId: cpt.paymentId,
              transactionId: cpt.transactionId,
              amount: cpt.amount,
            },
          })
        }
      },
      { timeout: 120000 }
    )

    await createActivityLog({
      action: 'DATABASE_RESTORE',
      category: 'SYSTEM',
      level: 'CRITICAL',
      description: `Pemulihan (Restore) Database dari file backup oleh ${session.name}`,
      details: {
        branches: branches.length,
        users: users.length,
        spareparts: spareparts.length,
        services: services.length,
        transactions: transactions.length,
      },
      branchId: session.branchId || null,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/', 'layout')
    return { success: true, message: 'Restore database berhasil! Seluruh data dipulihkan.' }
  } catch (error) {
    console.error('Restore Database Error:', error)
    const msg = error instanceof Error ? error.message : 'Gagal memulihkan database.'
    return { success: false, message: msg }
  }
}
