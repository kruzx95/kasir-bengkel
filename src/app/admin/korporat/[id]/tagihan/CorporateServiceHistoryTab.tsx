'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import {
  getCorporateServiceHistory,
  type CorporateServiceHistoryResult,
} from '@/actions/corporate'
import { formatCurrency } from '@/lib/utils'
import { exportProfessionalExcel } from '@/lib/exportExcel'
import Button from '@/components/ui/Button'
import {
  Wrench,
  Search,
  Filter,
  Printer,
  Download,
  Calendar,
  Car,
  User,
  Gauge,
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'

interface VehicleOption {
  id: string
  name: string
  plateNumber: string | null
  vehicleBrand?: string | null
  vehicleType?: string | null
  odometer?: number | null
}

interface CorporateServiceHistoryTabProps {
  corporateId: string
  corporateName: string
  corporateCustomers: VehicleOption[]
  initialVehicleId?: string
  isAdmin?: boolean
  shopName?: string
  branchInfo?: { name: string; address?: string | null; phone?: string | null }
}

export default function CorporateServiceHistoryTab({
  corporateId,
  corporateName,
  corporateCustomers,
  initialVehicleId = '',
  isAdmin = false,
  shopName = 'MULYA LESTARI',
  branchInfo,
}: CorporateServiceHistoryTabProps) {
  const [isPending, startTransition] = useTransition()
  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultStartStr = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
    .toISOString()
    .slice(0, 10)

  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId)
  const [prevInitialVehicleId, setPrevInitialVehicleId] = useState<string>(initialVehicleId)
  if (initialVehicleId !== prevInitialVehicleId) {
    setPrevInitialVehicleId(initialVehicleId)
    setVehicleId(initialVehicleId)
  }

  const [startDate, setStartDate] = useState<string>(defaultStartStr)
  const [endDate, setEndDate] = useState<string>(todayStr)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activePreset, setActivePreset] = useState<string>('last_3_months')

  // History data
  const [historyData, setHistoryData] = useState<CorporateServiceHistoryResult | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetchHistory = (vId?: string, sDate?: string, eDate?: string, query?: string) => {
    startTransition(async () => {
      const res = await getCorporateServiceHistory(
        corporateId,
        vId !== undefined ? vId : vehicleId,
        sDate !== undefined ? sDate : startDate,
        eDate !== undefined ? eDate : endDate,
        query !== undefined ? query : searchQuery
      )
      setHistoryData(res)
    })
  }

  useEffect(() => {
    fetchHistory(vehicleId, startDate, endDate, searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corporateId])

  const handleApplyFilter = () => {
    fetchHistory(vehicleId, startDate, endDate, searchQuery)
  }

  const handleQuickPreset = (preset: 'this_month' | 'last_3_months' | 'this_year' | 'all') => {
    setActivePreset(preset)
    const now = new Date()
    let s = ''
    const e = now.toISOString().slice(0, 10)

    if (preset === 'this_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    } else if (preset === 'last_3_months') {
      s = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10)
    } else if (preset === 'this_year') {
      s = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    } else {
      s = '2020-01-01'
    }

    setStartDate(s)
    setEndDate(e)
    fetchHistory(vehicleId, s, e, searchQuery)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedVehicleObj = useMemo(() => {
    return corporateCustomers.find((c) => c.id === vehicleId)
  }, [corporateCustomers, vehicleId])

  // Export to Excel
  const handleExportExcel = async () => {
    if (!historyData || historyData.transactions.length === 0) {
      alert('Tidak ada data riwayat servis untuk diekspor pada filter ini.')
      return
    }

    const rows = historyData.transactions.map((tx, idx) => {
      const formattedDate = new Date(tx.transactionDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      const vehicleInfo = tx.customer
        ? `${tx.customer.plateNumber ? `[${tx.customer.plateNumber}] ` : ''}${tx.customer.name}`
        : '—'

      const rincianPengerjaan = tx.items
        .map((i) => {
          const typeTag = i.itemType === 'SERVICE' ? '[JASA]' : '[PART]'
          return `${typeTag} ${i.quantity}x ${i.itemName} (@Rp ${i.unitPrice.toLocaleString('id-ID')} = Rp ${i.subtotal.toLocaleString('id-ID')})`
        })
        .join('\n')

      const statusTag =
        tx.status === 'COMPLETED'
          ? 'LUNAS'
          : tx.status === 'PENDING_CORPORATE'
          ? 'PENDING TAGIHAN'
          : tx.status

      return {
        no: idx + 1,
        tanggal: formattedDate,
        noInvoice: tx.invoiceNumber,
        kendaraan: vehicleInfo,
        odometer: tx.odometer ? `${tx.odometer.toLocaleString('id-ID')} km` : '—',
        mekanik: tx.mechanic?.name || '—',
        rincian: rincianPengerjaan,
        total: tx.total,
        status: statusTag,
      }
    })

    const vehicleSubtitle = selectedVehicleObj
      ? `KENDARAAN ${selectedVehicleObj.plateNumber || ''} (${selectedVehicleObj.name})`
      : 'SELURUH ARMADA KENDARAAN'

    const periodStr = `${new Date(historyData.startDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} s/d ${new Date(historyData.endDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`

    await exportProfessionalExcel({
      shopName: shopName || (branchInfo?.name ? `BENGKEL - ${branchInfo.name}` : 'BENGKEL'),
      title: `RIWAYAT SERVIS ${vehicleSubtitle} — ${corporateName.toUpperCase()}`,
      period: periodStr,
      filename: `Riwayat_Servis_${corporateName.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.xlsx`,
      sheetName: 'Riwayat Servis',
      columns: [
        { header: 'No', key: 'no', width: 6, align: 'center' },
        { header: 'Tanggal & Jam', key: 'tanggal', width: 20 },
        { header: 'No. Invoice', key: 'noInvoice', width: 24, align: 'center' },
        { header: 'Kendaraan / Plat', key: 'kendaraan', width: 28 },
        { header: 'Odometer (KM)', key: 'odometer', width: 16, align: 'right' },
        { header: 'Mekanik', key: 'mekanik', width: 20 },
        { header: 'Rincian Pengerjaan & Suku Cadang', key: 'rincian', width: 55 },
        { header: 'Total Biaya (Rp)', key: 'total', width: 18, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Status Tagihan', key: 'status', width: 18, align: 'center' },
      ],
      rows,
      summaries: [
        { label: 'Total Pengerjaan Servis', value: rows.length },
        { label: 'Total Item Jasa', value: historyData.summary.totalServiceItemsCount },
        { label: 'Total Suku Cadang', value: historyData.summary.totalSparepartItemsCount },
        { label: 'Total Pengeluaran Servis', value: historyData.summary.totalAmount, currency: true },
      ],
    })
  }

  const transactions = historyData?.transactions || []
  const summary = historyData?.summary || {
    totalTransactions: 0,
    totalAmount: 0,
    totalServiceItemsCount: 0,
    totalSparepartItemsCount: 0,
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. ON-SCREEN INTERACTIVE UI (HIDDEN DURING PRINT)                         */}
      {/* ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Top Header & Export Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-violet-600" />
              Riwayat Servis Kendaraan Korporat
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rekap log pengerjaan servis &amp; pergantian suku cadang kendaraan <strong>{corporateName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={() => {
                window.print()
              }}
              disabled={transactions.length === 0}
              className="border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
            >
              Cetak Laporan Servis
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={handleExportExcel}
              disabled={transactions.length === 0}
              className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-medium"
            >
              Export Excel (.xlsx)
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-violet-600" /> Filter Riwayat
            </span>

            {/* Quick Period Presets */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => handleQuickPreset('this_month')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activePreset === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('last_3_months')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activePreset === 'last_3_months' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                3 Bulan
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('this_year')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activePreset === 'this_year' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Tahun Ini
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activePreset === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Vehicle Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-violet-500" /> Armada Kendaraan
              </label>
              <div className="relative">
                <select
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value)
                    fetchHistory(e.target.value, startDate, endDate, searchQuery)
                  }}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 pr-8 font-medium"
                >
                  <option value="">Semua Armada ({corporateCustomers.length} Kendaraan)</option>
                  {corporateCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.plateNumber ? `[${c.plateNumber}] ` : ''}
                      {c.name} {c.vehicleBrand ? `(${c.vehicleBrand} ${c.vehicleType || ''})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            {/* Search Box */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-500" /> Cari Keyword
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Invoice, mekanik, sparepart..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <Button
                  size="sm"
                  icon={isPending ? RefreshCw : Filter}
                  onClick={handleApplyFilter}
                  loading={isPending}
                  className="bg-violet-600 hover:bg-violet-700 shrink-0"
                >
                  Cari
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Kunjungan */}
          <div className="bg-linear-to-br from-violet-50 to-indigo-50/50 border border-violet-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Total Servis</span>
              <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-700">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.totalTransactions}</p>
            <p className="text-xs text-slate-500 mt-1">Kali pengerjaan servis</p>
          </div>

          {/* Total Biaya Servis */}
          <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Biaya Servis</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-700">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-700">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">Akumulasi biaya servis</p>
          </div>

          {/* Total Jasa Dikerjakan */}
          <div className="bg-linear-to-br from-blue-50 to-sky-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Jasa Dikerjakan</span>
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-700">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.totalServiceItemsCount}</p>
            <p className="text-xs text-slate-500 mt-1">Item jasa perawatan</p>
          </div>

          {/* Total Sparepart Dipasang */}
          <div className="bg-linear-to-br from-amber-50 to-orange-50/50 border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Sparepart Dipasang</span>
              <div className="w-8 h-8 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-700">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{summary.totalSparepartItemsCount}</p>
            <p className="text-xs text-slate-500 mt-1">Unit suku cadang</p>
          </div>
        </div>

        {/* Service Record List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Daftar Transaksi Servis</h4>
              <p className="text-xs text-slate-500">
                Menampilkan {transactions.length} riwayat servis pada periode terpilih
              </p>
            </div>

            {selectedVehicleObj && (
              <div className="flex items-center gap-2 bg-violet-100 text-violet-800 border border-violet-200 px-3 py-1 rounded-xl text-xs font-semibold">
                <Car className="w-3.5 h-3.5" />
                <span>
                  {selectedVehicleObj.plateNumber ? `[${selectedVehicleObj.plateNumber}] ` : ''}
                  {selectedVehicleObj.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVehicleId('')
                    fetchHistory('', startDate, endDate, searchQuery)
                  }}
                  className="text-violet-600 hover:text-violet-900 ml-1 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Wrench className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-base">Tidak ada riwayat servis ditemukan</p>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
                Coba sesuaikan filter tanggal atau pilih kendaraan armada yang lain.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isExpanded = expandedIds.has(tx.id)
                const isCompleted = tx.status === 'COMPLETED'
                const txDetailUrl = `${isAdmin ? '/admin/transaksi' : '/kasir/transaksi'}/${tx.id}`

                return (
                  <div key={tx.id} className="transition-colors hover:bg-slate-50/70">
                    {/* Row Header Card */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Invoice */}
                          <a
                            href={txDetailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-sm text-violet-700 hover:text-violet-900 inline-flex items-center gap-1 hover:underline"
                          >
                            {tx.invoiceNumber}
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>

                          {/* Status */}
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Tagihan
                            </span>
                          )}

                          {/* Date */}
                          <span className="text-xs text-slate-400">
                            {new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Vehicle & Mechanic */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-slate-600">
                          {tx.customer && (
                            <span className="flex items-center gap-1.5 font-medium text-slate-900">
                              <Car className="w-3.5 h-3.5 text-violet-600" />
                              {tx.customer.plateNumber && (
                                <span className="font-mono bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.2 rounded font-bold">
                                  {tx.customer.plateNumber}
                                </span>
                              )}
                              <span>{tx.customer.name}</span>
                            </span>
                          )}

                          {tx.odometer && (
                            <span className="flex items-center gap-1 text-slate-500 font-mono">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              {tx.odometer.toLocaleString('id-ID')} km
                            </span>
                          )}

                          {tx.mechanic && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Mekanik: <strong className="text-slate-700">{tx.mechanic.name}</strong>
                            </span>
                          )}
                        </div>

                        {/* Summary of Items */}
                        <div className="text-xs text-slate-500 line-clamp-1">
                          <strong>Item ({tx.items.length}):</strong>{' '}
                          {tx.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                        </div>
                      </div>

                      {/* Right: Total & Action */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-left lg:text-right">
                          <span className="text-xs text-slate-400 block">Total Biaya</span>
                          <span className="text-lg font-black text-slate-900">{formatCurrency(tx.total)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpand(tx.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <span>Tutup</span>
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            </>
                          ) : (
                            <>
                              <span>Rincian Item</span>
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Item Breakdown */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-5 pt-2 bg-slate-50/70 border-t border-slate-100">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3">Tipe</th>
                                <th className="py-2.5 px-3">Nama Pekerjaan / Barang</th>
                                <th className="py-2.5 px-3 text-center">Qty</th>
                                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                                <th className="py-2.5 px-3 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {tx.items.map((item) => {
                                const isService = item.itemType === 'SERVICE'
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3">
                                      {isService ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                          <Wrench className="w-3 h-3" /> Jasa
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-semibold text-[10px]">
                                          <Package className="w-3 h-3" /> Sparepart
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 font-medium text-slate-900">{item.itemName}</td>
                                    <td className="py-2 px-3 text-center font-semibold text-slate-700">{item.quantity}</td>
                                    <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                                      {formatCurrency(item.subtotal)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                              {tx.discount > 0 && (
                                <tr>
                                  <td colSpan={4} className="py-1.5 px-3 text-right font-medium text-slate-500">
                                    Diskon:
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-medium text-red-600">
                                    - {formatCurrency(tx.discount)}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td colSpan={4} className="py-2 px-3 text-right font-bold text-slate-900">
                                  Total Nota:
                                </td>
                                <td className="py-2 px-3 text-right font-black text-slate-900 text-sm">
                                  {formatCurrency(tx.total)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {tx.notes && (
                          <div className="mt-2.5 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                            <strong className="text-slate-700">Catatan Servis:</strong> {tx.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED CLEAN PRINT DOCUMENT (ONLY VISIBLE DURING BROWSER PRINT)      */}
      {/* ========================================================================= */}
      <div className="hidden print:block w-full text-black bg-white font-sans text-xs">
        {/* Kop Bengkel */}
        <div className="border-b-2 border-black pb-3 mb-4 text-center">
          <h1 className="text-xl font-black uppercase tracking-tight mb-0.5">{shopName}</h1>
          {branchInfo?.name && (
            <h2 className="text-sm font-bold text-gray-800">CABANG {branchInfo.name.toUpperCase()}</h2>
          )}
          {branchInfo?.address && (
            <p className="text-xs text-gray-600 mt-0.5">{branchInfo.address}</p>
          )}
          {branchInfo?.phone && (
            <p className="text-xs text-gray-600">Telp/WA: {branchInfo.phone}</p>
          )}
        </div>

        {/* Document Title */}
        <div className="text-center mb-4 pb-2 border-b border-gray-300">
          <h2 className="text-base font-black uppercase tracking-wider">
            LAPORAN RIWAYAT SERVIS KENDARAAN KORPORAT
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Periode:{' '}
            {new Date(startDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            s/d{' '}
            {new Date(endDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Info Korporat & Kendaraan */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 border border-gray-300 rounded text-xs mb-4">
          <div>
            <p className="text-gray-500">Klien Korporat:</p>
            <p className="font-bold text-sm text-black">{corporateName}</p>
            <p className="text-gray-500 mt-1">Target Armada:</p>
            <p className="font-semibold text-black">
              {selectedVehicleObj
                ? `${selectedVehicleObj.plateNumber ? `[${selectedVehicleObj.plateNumber}] ` : ''}${selectedVehicleObj.name} (${selectedVehicleObj.vehicleBrand || ''} ${selectedVehicleObj.vehicleType || ''})`
                : `Seluruh Armada (${corporateCustomers.length} Kendaraan)`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Total Kunjungan Servis:</p>
            <p className="font-bold text-sm text-black">{summary.totalTransactions} Transaksi</p>
            <p className="text-gray-500 mt-1">Total Biaya Perawatan:</p>
            <p className="font-black text-black text-base">{formatCurrency(summary.totalAmount)}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs border-collapse border border-gray-400 mb-6">
          <thead>
            <tr className="bg-gray-100 font-bold border-b border-gray-400">
              <th className="p-2 border border-gray-400 w-8 text-center">No</th>
              <th className="p-2 border border-gray-400 w-24">Tanggal</th>
              <th className="p-2 border border-gray-400 w-28 text-center">No. Invoice</th>
              <th className="p-2 border border-gray-400 w-32">Kendaraan / Plat</th>
              <th className="p-2 border border-gray-400 w-20 text-right">Odometer</th>
              <th className="p-2 border border-gray-400">Rincian Jasa &amp; Suku Cadang</th>
              <th className="p-2 border border-gray-400 w-24 text-right">Biaya (Rp)</th>
              <th className="p-2 border border-gray-400 w-20 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={tx.id} className="print:break-inside-avoid">
                <td className="p-2 border border-gray-400 text-center font-medium">{idx + 1}</td>
                <td className="p-2 border border-gray-400">
                  {new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-2 border border-gray-400 font-mono font-bold text-center">
                  {tx.invoiceNumber}
                </td>
                <td className="p-2 border border-gray-400">
                  {tx.customer?.plateNumber && (
                    <span className="font-mono font-bold block">{tx.customer.plateNumber}</span>
                  )}
                  <span>{tx.customer?.name}</span>
                </td>
                <td className="p-2 border border-gray-400 text-right font-mono">
                  {tx.odometer ? `${tx.odometer.toLocaleString('id-ID')} km` : '—'}
                </td>
                <td className="p-2 border border-gray-400 space-y-0.5">
                  {tx.items.map((i) => (
                    <div key={i.id} className="text-[11px]">
                      • {i.quantity}x {i.itemName} (@{formatCurrency(i.unitPrice)})
                    </div>
                  ))}
                  {tx.notes && (
                    <div className="text-[10px] text-gray-500 italic mt-0.5">
                      Ket: {tx.notes}
                    </div>
                  )}
                </td>
                <td className="p-2 border border-gray-400 text-right font-bold">
                  {formatCurrency(tx.total)}
                </td>
                <td className="p-2 border border-gray-400 text-center text-[10px] font-bold">
                  {tx.status === 'COMPLETED' ? 'LUNAS' : 'PENDING'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-600">
              <td colSpan={6} className="p-2 border border-gray-400 text-right">
                TOTAL PENGELUARAN SERVIS:
              </td>
              <td className="p-2 border border-gray-400 text-right font-black">
                {formatCurrency(summary.totalAmount)}
              </td>
              <td className="p-2 border border-gray-400"></td>
            </tr>
          </tfoot>
        </table>

        {/* Signature Block */}
        <div className="grid grid-cols-2 gap-8 pt-6 mt-4 text-center text-xs print:break-inside-avoid">
          <div>
            <p className="text-gray-600">Dikeluarkan Oleh,</p>
            <p className="font-bold mt-0.5">{shopName}</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1 w-48 mx-auto whitespace-nowrap">
              ( Bagian Operasional )
            </p>
          </div>

          <div>
            <p className="text-gray-600">Diterima &amp; Diverifikasi Oleh,</p>
            <p className="font-bold mt-0.5">{corporateName}</p>
            <div className="h-16" />
            <p className="font-bold border-t border-black pt-1 w-48 mx-auto whitespace-nowrap">
              ( Penanggung Jawab )
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
