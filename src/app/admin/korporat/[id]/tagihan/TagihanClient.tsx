'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { getCorporateBilling, assignCustomerToCorporate, createCorporatePayment, type CreatePaymentInput } from '@/actions/corporate'
import { formatCurrency } from '@/lib/utils'
import { Filter, CheckCircle, Users, Printer, UserPlus, UserMinus, Wallet, History, Car, Wrench } from 'lucide-react'
import PaymentModal from './PaymentModal'
import VehicleFormModal from './VehicleFormModal'
import ServiceVehicleModal from './ServiceVehicleModal'
import { getCorporatePaymentHistory, voidCorporatePayment } from '@/actions/corporate'

interface CorporateData {
  id: string
  name: string
  billingCycle: string
  branch: { id: string; name: string }
  customers: {
    id: string
    name: string
    plateNumber: string | null
    vehicleBrand?: string | null
    vehicleType?: string | null
    odometer?: number | null
    transactions?: { id: string; transactionDate: string | Date }[]
    _count?: { transactions: number }
  }[]
  hideServiceOnInvoice?: boolean
}

interface ServiceOption {
  id: string
  name: string
  price: number
  category?: string | null
}

interface SparepartOption {
  id: string
  name: string
  sellPrice: number
  stock: number
  unit: string
  sku?: string | null
  sparepartBrand?: string | null
}

interface MechanicOption {
  id: string
  name: string
}

interface BillingCustomer {
  name: string
  plateNumber: string | null
}

interface BillingItem {
  itemName: string
  itemType: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface BillingRow {
  id: string
  invoiceNumber: string
  transactionDate: string | Date
  customer?: BillingCustomer | null
  items: BillingItem[]
  total: number
  paidAmount: number
  remaining: number
  branch: { name: string }
}

interface CorporateBillingData {
  grandTotal: number
  totalPaid: number
  totalRemaining: number
  transactions: BillingRow[]
  corporate: { id: string; name: string; billingCycle: string; branch: { id: string; name: string }; hideServiceOnInvoice?: boolean }
  startDate: Date
  endDate: Date
}

// Transform raw response from getCorporateBilling to our local type
function transformBillingData(data: {
  corporate: {
    id: string
    name: string
    billingCycle: string
    branch: { id: string; name: string }
    hideServiceOnInvoice?: boolean
  }
  transactions: Array<{
    id: string
    invoiceNumber: string
    transactionDate: string | Date
    customer: { name: string; plateNumber: string | null } | null
    items: BillingItem[]
    total: number
    paidAmount: number
    branch: { name: string }
  }>
  grandTotal: number
  totalPaid: number
  totalRemaining: number
  startDate: Date
  endDate: Date
}): CorporateBillingData {
  return {
    corporate: data.corporate,
    transactions: data.transactions.map(t => ({
      ...t,
      remaining: Math.max(0, t.total - (t.paidAmount || 0)),
    })),
    grandTotal: data.grandTotal,
    totalPaid: data.totalPaid,
    totalRemaining: data.totalRemaining,
    startDate: data.startDate,
    endDate: data.endDate,
  }
}

interface TagihanClientProps {
  corporate: CorporateData
  allCustomers: { id: string; name: string; plateNumber: string | null; corporateCustomerId?: string | null }[]
  isAdmin?: boolean
  services?: ServiceOption[]
  spareparts?: SparepartOption[]
  mechanics?: MechanicOption[]
}

export default function TagihanClient({ corporate, allCustomers, isAdmin = false, services = [], spareparts = [], mechanics = [] }: TagihanClientProps) {
  const router = useRouter()
  const basePath = isAdmin ? '/admin/korporat' : '/kasir/korporat'
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'tagihan' | 'kendaraan' | 'riwayat'>('tagihan')
  const [paymentHistory, setPaymentHistory] = useState<Awaited<ReturnType<typeof getCorporatePaymentHistory>> | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(firstDayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [billingData, setBillingData] = useState<CorporateBillingData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [settleMsg, setSettleMsg] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  // Add vehicle modal state
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false)

  // Service vehicle modal state
  const [serviceVehicle, setServiceVehicle] = useState<CorporateData['customers'][0] | null>(null)

  const handleFilter = () => {
    startTransition(async () => {
      const res = await getCorporateBilling(corporate.id, startDate, endDate)
      if (res) {
        setBillingData(transformBillingData(res))
        setLoaded(true)
      }
    })
  }

  const refreshBilling = () => {
    startTransition(async () => {
      const res = await getCorporateBilling(corporate.id, startDate, endDate)
      if (res) {
        setBillingData(transformBillingData(res))
        setLoaded(true)
      }
    })
  }

  // Load payment history
  const loadPaymentHistory = () => {
    startTransition(async () => {
      const res = await getCorporatePaymentHistory(corporate.id)
      setPaymentHistory(res)
      setHistoryLoaded(true)
    })
  }

  // Void payment
  const handleVoidPayment = async (paymentId: string) => {
    const reason = prompt('Alasan pembatalan (wajib min. 3 karakter):')
    if (!reason || reason.trim().length < 3) return
    if (!confirm(`Batalkan pembayaran ini? Transaksi terkait akan dikembalikan.`)) return

    const res = await voidCorporatePayment(paymentId, reason)
    if (res.success) {
      loadPaymentHistory()
      refreshBilling()
    } else {
      alert(res.message)
    }
  }

  const handleAssign = async (customerId: string, assign: boolean) => {
    setAssigningId(customerId)
    await assignCustomerToCorporate(customerId, assign ? corporate.id : null)
    setAssigningId(null)
    startTransition(() => {
      router.refresh()
    })
    refreshBilling()
  }

  // Full settlement
  const handlePayFull = () => {
    if (!billingData) return
    const allocations = billingData.transactions.map(t => ({
      transactionId: t.id,
      amount: t.remaining,
    }))
    const amount = allocations.reduce((acc: number, a) => acc + a.amount, 0)

    startTransition(async () => {
      const input: CreatePaymentInput = {
        corporateCustomerId: corporate.id,
        amount,
        paymentMethod: 'CASH',
        periodStart: startDate,
        periodEnd: endDate,
        allocations,
      }
      const res = await createCorporatePayment(input)
      if (res.success) {
        const updated = await getCorporateBilling(corporate.id, startDate, endDate)
        if (updated) {
          setBillingData(transformBillingData(updated))
          setLoaded(true)
        }
        setSettleMsg(res.message ?? null)
      } else {
        alert(res.message || 'Gagal mencatat pembayaran')
      }
    })
  }

  const txColumns = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (row: BillingRow) => (
        <div>
          <p className="text-sm font-mono font-bold text-slate-900">{row.invoiceNumber}</p>
          <p className="text-xs text-slate-400">
            {new Date(row.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Kendaraan',
      render: (row: BillingRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.customer?.name || '—'}</p>
          {row.customer?.plateNumber && (
            <p className="text-xs text-slate-400 font-mono">{row.customer.plateNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Layanan',
      render: (row: BillingRow) => (
        <div className="space-y-0.5 max-w-[200px]">
          {row.items.slice(0, 2).map((item: BillingItem, i: number) => (
            <p key={i} className="text-xs text-slate-600 truncate">
              {item.quantity}x {item.itemName}
            </p>
          ))}
          {row.items.length > 2 && (
            <p className="text-xs text-slate-400">+{row.items.length - 2} lainnya</p>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: BillingRow) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: 'paid',
      header: 'Sudah Dibayar',
      render: (row: BillingRow) => (
        <span className={`text-sm font-medium ${row.paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          {formatCurrency(row.paidAmount)}
        </span>
      ),
    },
    {
      key: 'remaining',
      header: 'Sisa Piutang',
      render: (row: BillingRow) => (
        <span className={`text-sm font-bold ${row.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatCurrency(row.remaining)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Nota',
      render: (row: BillingRow) => {
        const txPath = isAdmin ? '/admin/transaksi' : '/kasir/transaksi'
        return (
          <a
            href={`${txPath}/${row.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Cetak Struk/Nota Individual"
            className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium border border-slate-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Nota</span>
          </a>
        )
      },
    },
  ]

  // Assigned customers come directly from corporate.customers (authoritative list)
  const assignedCustomers = corporate.customers
  const assignedIds = useMemo(() => new Set(corporate.customers.map(c => c.id)), [corporate.customers])

  // Customers not yet in any corporate (from same branch)
  const unassignedCustomers = useMemo(
    () => allCustomers.filter(c => !c.corporateCustomerId && !assignedIds.has(c.id)),
    [allCustomers, assignedIds]
  )

  // Vehicle filter state ('all' | 'serviced' | 'unserviced')
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'serviced' | 'unserviced'>('all')

  const vehicleStats = useMemo(() => {
    let serviced = 0
    let unserviced = 0
    assignedCustomers.forEach(c => {
      const isServiced = (c.transactions && c.transactions.length > 0) || (c._count && c._count.transactions > 0)
      if (isServiced) serviced++
      else unserviced++
    })
    return { total: assignedCustomers.length, serviced, unserviced }
  }, [assignedCustomers])

  const filteredAssignedCustomers = useMemo(() => {
    if (vehicleFilter === 'serviced') {
      return assignedCustomers.filter(
        c => (c.transactions && c.transactions.length > 0) || (c._count && c._count.transactions > 0)
      )
    }
    if (vehicleFilter === 'unserviced') {
      return assignedCustomers.filter(
        c => !(c.transactions && c.transactions.length > 0) && !(c._count && c._count.transactions > 0)
      )
    }
    return assignedCustomers
  }, [assignedCustomers, vehicleFilter])

  const groupedByDate = useMemo(() => {
    if (!billingData?.transactions) return []
    const groups: Record<string, BillingRow[]> = {}
    billingData.transactions.forEach(tx => {
      const dateStr = new Date(tx.transactionDate).toISOString().slice(0, 10)
      if (!groups[dateStr]) groups[dateStr] = []
      groups[dateStr].push(tx)
    })
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [billingData])

  // Prepare payment modal transactions
  const paymentTransactions = useMemo(() => {
    if (!billingData?.transactions) return []
    return billingData.transactions.map(t => ({
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      transactionDate: t.transactionDate,
      customerName: t.customer?.name || '—',
      plateNumber: t.customer?.plateNumber || null,
      total: t.total,
      paidAmount: t.paidAmount,
      remaining: t.remaining,
      items: t.items,
    }))
  }, [billingData])

  return (
    <div className="space-y-6">
      {/* Tab */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit print:hidden">
        <button
          onClick={() => {
            setActiveTab('tagihan')
            if (loaded) refreshBilling()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tagihan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Tagihan
        </button>
        <button
          onClick={() => setActiveTab('kendaraan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'kendaraan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Kelola Kendaraan
        </button>
        <button
          onClick={() => {
            setActiveTab('riwayat')
            if (!historyLoaded) loadPaymentHistory()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'riwayat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Riwayat Pembayaran
        </button>
      </div>

      {/* ===== TAB TAGIHAN ===== */}
      {activeTab === 'tagihan' && (
        <>
          {settleMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              {settleMsg}
            </div>
          )}

          {/* Filter */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4 print:hidden">
            <div className="w-full md:w-auto">
              <Input label="Mulai Tanggal" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <Input label="Sampai Tanggal" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleFilter} loading={isPending} icon={Filter}>Tampilkan Tagihan</Button>
            {((billingData?.transactions.length ?? 0) > 0) && (
              <>
                <Button onClick={() => window.print()} variant="outline" icon={Printer}>Cetak</Button>
                <Button
                  onClick={handlePayFull}
                  loading={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  icon={CheckCircle}
                >
                  Bayar Lunas Penuh
                </Button>
                <Button
                  onClick={() => setPaymentModalOpen(true)}
                  loading={isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  icon={Wallet}
                >
                  Bayar Sebagian
                </Button>
              </>
            )}
          </div>

          {!loaded ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Klik tombol di atas untuk menampilkan tagihan.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tagihan</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(billingData?.grandTotal || 0)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sudah Dibayar</p>
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(billingData?.totalPaid || 0)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sisa Piutang</p>
                  <p className="text-2xl font-black text-red-600">{formatCurrency(billingData?.totalRemaining || 0)}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">
                    Tagihan {corporate.name} — {new Date(startDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <Table
                  columns={txColumns}
                  data={billingData?.transactions || []}
                  keyExtractor={(row: BillingRow) => row.id}
                  emptyMessage="Tidak ada tagihan yang belum lunas pada periode ini."
                />
                {((billingData?.transactions.length ?? 0) > 0) && (
                  <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                      {billingData?.transactions.length || 0} transaksi
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Grand Total</p>
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(billingData?.grandTotal || 0)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ===== INVOICE PRINT (HIDDEN ON SCREEN) ===== */}
              <div className="hidden print:block w-full text-black print:break-inside-avoid">
                {/* Header */}
                <div className="border-b-2 border-black pb-3 mb-4 print:pb-2 print:mb-3">
                  <h1 className="text-xl font-black uppercase mb-0.5 print:text-lg">INVOICE TAGIHAN</h1>
                  <h2 className="text-base font-bold print:text-sm">{corporate.branch.name}</h2>
                  <div className="mt-2 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-600">Ditagihkan Kepada:</p>
                      <p className="text-base font-bold print:text-sm">{corporate.name}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p><span className="font-semibold">Periode:</span> {new Date(startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
                      <p><span className="font-semibold">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                {/* Content Grouped by Date */}
                <div className="space-y-4 print:space-y-3">
                  {groupedByDate.map(([dateStr, txs]) => (
                    <div key={dateStr} className="print:break-inside-avoid">
                      <div className="bg-gray-100 font-bold p-1.5 mb-1.5 border border-gray-300 text-xs">
                        Tanggal Servis: {new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="text-left py-1 px-1">Kendaraan</th>
                            <th className="text-left py-1 px-1">Layanan / Sparepart</th>
                            <th className="text-center py-1 px-1">Qty</th>
                            <th className="text-right py-1 px-1">Harga</th>
                            <th className="text-right py-1 px-1">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {txs.map((tx) => (
                            <tr key={tx.id}>
                              <td className="py-2 px-1 align-top w-1/4">
                                <p className="font-bold">{tx.customer?.name || '—'}</p>
                                {tx.customer?.plateNumber && <p className="font-mono text-[10px]">{tx.customer.plateNumber}</p>}
                                <p className="text-[10px] text-gray-500 mt-0.5">{tx.invoiceNumber}</p>
                              </td>
                              <td className="py-2 px-1 align-top" colSpan={4}>
                                <table className="w-full text-xs">
                                  <tbody>
                                    {tx.items
                                      .filter(item => (billingData?.corporate?.hideServiceOnInvoice ?? corporate.hideServiceOnInvoice) ? item.itemType !== 'SERVICE' : true)
                                      .map((item, i) => (
                                      <tr key={i}>
                                        <td className="w-1/2 py-0.5">{item.itemName}</td>
                                        <td className="w-1/6 py-0.5 text-center">{item.quantity}</td>
                                        <td className="w-1/6 py-0.5 text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="w-1/6 py-0.5 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                                      </tr>
                                    ))}
                                    {/* Transaction Subtotal Row */}
                                    <tr>
                                      <td colSpan={3} className="py-1 text-right text-[10px] font-semibold uppercase text-gray-600 border-t border-dashed border-gray-300">Total Kendaraan Ini:</td>
                                      <td className="py-1 text-right font-bold border-t border-dashed border-gray-300">{formatCurrency(tx.total)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div className="mt-4 pt-2 border-t-2 border-black flex justify-end">
                  <div className="w-1/2 md:w-1/3">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-semibold text-gray-600">Total Transaksi</span>
                      <span className="font-bold">{billingData?.transactions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-base border-t border-black pt-1">
                      <span className="font-black uppercase">Grand Total</span>
                      <span className="font-black">{formatCurrency(billingData?.grandTotal || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="mt-8 flex justify-between px-8 print:mt-6">
                  <div className="text-center">
                    <p className="mb-10 font-semibold text-xs print:mb-8">{corporate.name}</p>
                    <p className="border-t border-black pt-1 px-4 text-xs">( Tanda Tangan & Cap )</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-10 font-semibold text-xs print:mb-8">{corporate.branch.name}</p>
                    <p className="border-t border-black pt-1 px-4 text-xs">( Admin Bengkel )</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== TAB KENDARAAN ===== */}
      {activeTab === 'kendaraan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assigned */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-violet-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  Kendaraan Terdaftar ({assignedCustomers.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Car}
                  className="text-violet-600 border-violet-200 hover:bg-violet-50"
                  onClick={() => setAddVehicleModalOpen(true)}
                >
                  Tambah Kendaraan
                </Button>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setVehicleFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    vehicleFilter === 'all'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua ({vehicleStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleFilter('serviced')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                    vehicleFilter === 'serviced'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Sudah Servis ({vehicleStats.serviced})
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleFilter('unserviced')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                    vehicleFilter === 'unserviced'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Belum Servis ({vehicleStats.unserviced})
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredAssignedCustomers.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">
                  {vehicleFilter === 'all'
                    ? 'Belum ada kendaraan terdaftar.'
                    : vehicleFilter === 'serviced'
                    ? 'Belum ada kendaraan yang sudah servis.'
                    : 'Semua kendaraan sudah pernah servis.'}
                </p>
              ) : (
                filteredAssignedCustomers.map(c => {
                  const isServiced =
                    (c.transactions && c.transactions.length > 0) || (c._count && c._count.transactions > 0)
                  const lastTxDate = c.transactions?.[0]?.transactionDate

                  return (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900">{c.name}</p>
                          {isServiced ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Sudah Servis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Belum Servis
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          {c.plateNumber && <span className="font-mono">{c.plateNumber}</span>}
                          {lastTxDate && (
                            <span>
                              · Servis Terakhir:{' '}
                              {new Date(lastTxDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Wrench}
                          className="text-violet-600 border-violet-200 hover:bg-violet-50"
                          onClick={() => setServiceVehicle(c)}
                        >
                          Service
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={UserMinus}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          loading={assigningId === c.id}
                          onClick={() => handleAssign(c.id, false)}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Unassigned */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-500" />
                Pelanggan Lain di Cabang Ini
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {unassignedCustomers.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">Semua pelanggan sudah terdaftar.</p>
              ) : unassignedCustomers.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    {c.plateNumber && <p className="text-xs text-slate-400 font-mono">{c.plateNumber}</p>}
                  </div>
                  <Button
                    size="sm" variant="ghost" icon={UserPlus}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    loading={assigningId === c.id}
                    onClick={() => handleAssign(c.id, true)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB RIWAYAT PEMBAYARAN ===== */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" />
              Riwayat Pembayaran
            </h3>
          </div>
          {!historyLoaded ? (
            <div className="p-12 text-center text-slate-400">Memuat riwayat pembayaran...</div>
          ) : !paymentHistory || paymentHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Belum ada riwayat pembayaran untuk perusahaan ini.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'paidAt',
                  header: 'Tanggal Bayar',
                  render: (row: any) => (
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(row.paidAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  ),
                },
                {
                  key: 'vehicles',
                  header: 'Kendaraan / Pelanggan',
                  render: (row: any) => {
                    const links = row.transactionLinks || []
                    if (links.length === 0) return <span className="text-xs text-slate-400">—</span>

                    return (
                      <div className="space-y-1 max-w-[220px]">
                        {links.slice(0, 2).map((l: any, idx: number) => {
                          const cust = l.transaction?.customer
                          return (
                            <p key={idx} className="text-xs text-slate-800 leading-tight">
                              <span className="font-semibold">{cust?.name || '—'}</span>
                              {cust?.plateNumber && (
                                <span className="text-slate-500 font-mono ml-1 text-[11px]">({cust.plateNumber})</span>
                              )}
                            </p>
                          )
                        })}
                        {links.length > 2 && (
                          <p className="text-[11px] font-medium text-violet-600">
                            +{links.length - 2} kendaraan lainnya
                          </p>
                        )}
                      </div>
                    )
                  },
                },
                {
                  key: 'amount',
                  header: 'Jumlah',
                  render: (row: any) => (
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(row.amount)}</span>
                  ),
                },
                {
                  key: 'method',
                  header: 'Metode',
                  render: (row: any) => (
                    <span className="text-sm text-slate-700">{row.paymentMethod}</span>
                  ),
                },
                {
                  key: 'period',
                  header: 'Periode',
                  render: (row: any) => (
                    <p className="text-xs text-slate-500">
                      {new Date(row.periodStart).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} —{' '}
                      {new Date(row.periodEnd).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    </p>
                  ),
                },
                {
                  key: 'createdBy',
                  header: 'Admin',
                  render: (row: any) => (
                    <p className="text-xs text-slate-600">{row.createdBy.name}</p>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Aksi',
                  render: (row: any) => (
                    <div className="flex gap-2">
                      <a
                        href={`${basePath}/${corporate.id}/pembayaran/${row.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Lihat Bukti
                      </a>
                      {!row.voidedAt && isAdmin && (
                        <button
                          onClick={() => handleVoidPayment(row.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={paymentHistory}
              keyExtractor={(row: any) => row.id}
              emptyMessage="Tidak ada riwayat pembayaran."
            />
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        corporateCustomerId={corporate.id}
        corporateName={corporate.name}
        transactions={paymentTransactions}
        onPaymentSuccess={() => {
          // Refresh billing data after payment
          getCorporateBilling(corporate.id, startDate, endDate).then(res => {
            if (res) setBillingData(transformBillingData(res))
            setLoaded(true)
          })
        }}
      />

      {/* Add Vehicle Modal */}
      <VehicleFormModal
        key={addVehicleModalOpen ? 'vehicle-modal-open' : 'vehicle-modal-closed'}
        open={addVehicleModalOpen}
        onClose={() => setAddVehicleModalOpen(false)}
        corporateCustomerId={corporate.id}
        branchId={corporate.branch.id}
        corporateName={corporate.name}
        onSuccess={() => {
          startTransition(() => {
            router.refresh()
          })
          if (loaded) refreshBilling()
        }}
      />

      {/* Service Vehicle Modal */}
      {serviceVehicle && (
        <ServiceVehicleModal
          open={!!serviceVehicle}
          onClose={() => setServiceVehicle(null)}
          vehicle={serviceVehicle}
          corporateCustomerId={corporate.id}
          branchId={corporate.branch.id}
          corporateName={corporate.name}
          services={services}
          spareparts={spareparts}
          mechanics={mechanics}
          isAdmin={isAdmin}
          onSuccess={() => {
            startTransition(() => {
              router.refresh()
            })
            refreshBilling()
          }}
        />
      )}
    </div>
  )
}