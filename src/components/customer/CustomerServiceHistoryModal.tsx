'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import {
  getCustomerServiceHistory,
  type CustomerServiceHistoryResult,
} from '@/actions/customer-history'
import { formatCurrency } from '@/lib/utils'
import { exportProfessionalExcel } from '@/lib/exportExcel'
import Button from '@/components/ui/Button'
import {
  Wrench,
  Search,
  Printer,
  Download,
  Calendar,
  Car,
  User,
  Gauge,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  X,
  Phone,
  MapPin,
  Bike,
} from 'lucide-react'
import Link from 'next/link'

interface CustomerServiceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string | null
  customerName?: string
  plateNumber?: string | null
  isAdmin?: boolean
  shopName?: string
}

export default function CustomerServiceHistoryModal({
  isOpen,
  onClose,
  customerId,
  customerName = 'Pelanggan',
  plateNumber,
  isAdmin = false,
  shopName = 'IRIAN MOTOR',
}: CustomerServiceHistoryModalProps) {
  const [isPending, startTransition] = useTransition()
  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultStartStr = new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const [startDate, setStartDate] = useState<string>(defaultStartStr)
  const [endDate, setEndDate] = useState<string>(todayStr)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activePreset, setActivePreset] = useState<string>('last_1_year')

  // History data
  const [historyData, setHistoryData] = useState<CustomerServiceHistoryResult | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetchHistory = (sDate?: string, eDate?: string, query?: string) => {
    if (!customerId) return
    startTransition(async () => {
      const res = await getCustomerServiceHistory(
        customerId,
        sDate !== undefined ? sDate : startDate,
        eDate !== undefined ? eDate : endDate,
        query !== undefined ? query : searchQuery
      )
      setHistoryData(res)
    })
  }

  useEffect(() => {
    if (isOpen && customerId) {
      fetchHistory(startDate, endDate, searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customerId])

  const handleApplyFilter = () => {
    fetchHistory(startDate, endDate, searchQuery)
  }

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset)
    const now = new Date()
    let newStart = defaultStartStr
    const newEnd = now.toISOString().slice(0, 10)

    if (preset === 'this_month') {
      newStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    } else if (preset === 'last_3_months') {
      newStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10)
    } else if (preset === 'last_6_months') {
      newStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)
    } else if (preset === 'last_1_year') {
      newStart = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().slice(0, 10)
    } else if (preset === 'all_time') {
      newStart = '2020-01-01'
    }

    setStartDate(newStart)
    setEndDate(newEnd)
    fetchHistory(newStart, newEnd, searchQuery)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleExpandAll = () => {
    if (!historyData) return
    if (expandedIds.size === historyData.transactions.length) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(historyData.transactions.map((t) => t.id)))
    }
  }

  const handlePrint = () => {
    window.print()
  }

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

      const rincianPengerjaan = tx.items
        .map((i) => {
          const typeTag = i.itemType === 'SERVICE' ? '[JASA]' : '[PART]'
          return `${typeTag} ${i.quantity}x ${i.itemName} (@Rp ${i.unitPrice.toLocaleString('id-ID')} = Rp ${i.subtotal.toLocaleString('id-ID')})`
        })
        .join('\n')

      const statusTag =
        tx.status === 'COMPLETED'
          ? 'LUNAS'
          : tx.status === 'PENDING_PAYMENT'
          ? 'TEMPO / PIUTANG'
          : tx.status

      return {
        no: idx + 1,
        tanggal: formattedDate,
        noInvoice: tx.invoiceNumber,
        odometer: tx.odometer ? `${tx.odometer.toLocaleString('id-ID')} km` : '—',
        selisihKm: tx.odometerDelta ? `+${tx.odometerDelta.toLocaleString('id-ID')} km` : '—',
        mekanik: tx.mechanic?.name || '—',
        rincian: rincianPengerjaan,
        total: tx.total,
        status: statusTag,
      }
    })

    const vehicleSubtitle = historyData.customer.plateNumber
      ? `KENDARAAN [${historyData.customer.plateNumber}] — ${historyData.customer.name.toUpperCase()}`
      : `PELANGGAN ${historyData.customer.name.toUpperCase()}`

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
      shopName: shopName || 'IRIAN MOTOR',
      title: `RIWAYAT SERVIS ${vehicleSubtitle}`,
      period: periodStr,
      filename: `Riwayat_Servis_${(historyData.customer.plateNumber || historyData.customer.name).replace(/\s+/g, '_')}_${startDate}_to_${endDate}.xlsx`,
      sheetName: 'Riwayat Servis',
      columns: [
        { header: 'No', key: 'no', width: 6, align: 'center' },
        { header: 'Tanggal & Jam', key: 'tanggal', width: 20 },
        { header: 'No. Invoice', key: 'noInvoice', width: 22, align: 'center' },
        { header: 'Odometer (KM)', key: 'odometer', width: 16, align: 'right' },
        { header: 'Selisih KM', key: 'selisihKm', width: 16, align: 'right' },
        { header: 'Mekanik', key: 'mekanik', width: 20 },
        { header: 'Rincian Jasa Servis & Suku Cadang', key: 'rincian', width: 55 },
        { header: 'Total Biaya (Rp)', key: 'total', width: 18, numFmt: '"Rp "#,##0', align: 'right' },
        { header: 'Status Pembayaran', key: 'status', width: 18, align: 'center' },
      ],
      rows,
      summaries: [
        { label: 'Total Kunjungan Servis', value: rows.length },
        { label: 'Total Item Jasa', value: historyData.summary.totalServiceItemsCount },
        { label: 'Total Suku Cadang', value: historyData.summary.totalSparepartItemsCount },
        { label: 'Total Pengeluaran Servis', value: historyData.summary.totalAmount, currency: true },
      ],
    })
  }

  if (!isOpen) return null

  const customer = historyData?.customer
  const transactions = historyData?.transactions || []
  const summary = historyData?.summary || {
    totalTransactions: 0,
    totalAmount: 0,
    totalServiceItemsCount: 0,
    totalSparepartItemsCount: 0,
    lastOdometer: null,
    firstOdometer: null,
    totalOdometerTraveled: null,
    averageSpendPerVisit: 0,
  }

  const invoiceBasePath = isAdmin ? '/admin/transaksi' : '/kasir/transaksi'
  const vehicleInfo = [customer?.vehicleBrand, customer?.vehicleType, customer?.vehicleYear ? `(${customer.vehicleYear})` : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 shrink-0 flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/30 border border-blue-400/40 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs sm:text-sm bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md">
                  {customer?.plateNumber || plateNumber || 'TANPA PLAT'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  Riwayat Servis: {customer?.name || customerName}
                </h2>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-2">
                {vehicleInfo && <span>🚗 {vehicleInfo}</span>}
                {customer?.phone && <span>📞 {customer.phone}</span>}
                {customer?.branch?.name && <span>📍 {customer.branch.name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Quick Info & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">Rentang Waktu:</span>
              {[
                { id: 'last_3_months', label: '3 Bulan' },
                { id: 'last_6_months', label: '6 Bulan' },
                { id: 'last_1_year', label: '1 Tahun' },
                { id: 'this_month', label: 'Bulan Ini' },
                { id: 'all_time', label: 'Semua' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetChange(preset.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activePreset === preset.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                icon={Download}
                onClick={handleExportExcel}
                disabled={transactions.length === 0}
                className="text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Export Excel
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={Printer}
                onClick={handlePrint}
                disabled={transactions.length === 0}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cetak Laporan
              </Button>
            </div>
          </div>

          {/* Filter Dates & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setActivePreset('custom')
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setActivePreset('custom')
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Pencarian Item / Invoice
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik nama part, jasa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                variant="outline"
                icon={RefreshCw}
                onClick={handleApplyFilter}
                loading={isPending}
                className="w-full text-xs py-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Terapkan Filter
              </Button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Car className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Servis
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {summary.totalTransactions} <span className="text-xs font-normal text-slate-500">kali</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalServiceItemsCount} jasa • {summary.totalSparepartItemsCount} part
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Biaya
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">
                {formatCurrency(summary.totalAmount)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rata-rata: {formatCurrency(summary.averageSpendPerVisit)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Gauge className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  KM Terakhir
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {summary.lastOdometer ? `${summary.lastOdometer.toLocaleString('id-ID')}` : '—'}
                <span className="text-xs font-normal text-slate-500 ml-1">km</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalOdometerTraveled
                  ? `+${summary.totalOdometerTraveled.toLocaleString('id-ID')} km terpantau`
                  : 'Odometer servis'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pemilik Kendaraan
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">
                {customer?.name || customerName}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {customer?.address || 'Alamat tidak tercatat'}
              </p>
            </div>
          </div>

          {/* List of Service Transactions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Daftar Riwayat Transaksi Servis</span>
                <span className="text-xs font-normal text-slate-500">
                  ({transactions.length} kunjungan)
                </span>
              </h4>
              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={toggleExpandAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  {expandedIds.size === transactions.length ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}
                </button>
              )}
            </div>

            {isPending ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Memuat riwayat servis kendaraan...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">Tidak ada riwayat servis ditemukan</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Belum ada transaksi servis yang tercatat untuk kendaraan / rentang tanggal ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isExpanded = expandedIds.has(tx.id)
                  const serviceItems = tx.items.filter((i) => i.itemType === 'SERVICE')
                  const sparepartItems = tx.items.filter((i) => i.itemType === 'SPAREPART')

                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                    >
                      {/* Transaction Summary Row */}
                      <div
                        onClick={() => toggleExpand(tx.id)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold text-xs">
                            {new Date(tx.transactionDate).getDate()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {tx.invoiceNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  tx.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {tx.status === 'COMPLETED' ? 'LUNAS' : tx.status}
                              </span>
                              {tx.mechanic && (
                                <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                  👨‍🔧 {tx.mechanic.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                              <span>
                                🗓️{' '}
                                {new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {tx.odometer && (
                                <span className="font-mono text-slate-700 font-medium">
                                  🚗 Odo: <strong>{tx.odometer.toLocaleString('id-ID')} km</strong>
                                  {tx.odometerDelta && (
                                    <span className="text-emerald-600 ml-1 font-bold">
                                      (+{tx.odometerDelta.toLocaleString('id-ID')} km)
                                    </span>
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                              {formatCurrency(tx.total)}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {serviceItems.length} Jasa • {sparepartItems.length} Part
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Link
                              href={`${invoiceBasePath}/${tx.id}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 hover:text-blue-800 transition-colors"
                              title="Buka Nota / Invoice"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Item Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-3 animate-fade-in">
                          {tx.notes && (
                            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl font-medium">
                              💬 <strong>Catatan / Keluhan:</strong> {tx.notes}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Jasa Servis Table */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                              <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
                                <span className="flex items-center gap-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                                  Pekerjaan Jasa ({serviceItems.length})
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {formatCurrency(serviceItems.reduce((s, it) => s + it.subtotal, 0))}
                                </span>
                              </div>
                              {serviceItems.length === 0 ? (
                                <p className="text-slate-400 italic text-[11px]">Tidak ada jasa servis</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {serviceItems.map((item, i) => (
                                    <div key={item.id || i} className="flex justify-between items-center text-slate-700">
                                      <span className="font-medium truncate pr-2">• {item.itemName}</span>
                                      <span className="font-mono font-semibold text-slate-900 shrink-0">
                                        {formatCurrency(item.subtotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Sparepart Table */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                              <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
                                <span className="flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-blue-600" />
                                  Suku Cadang ({sparepartItems.length})
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {formatCurrency(sparepartItems.reduce((s, it) => s + it.subtotal, 0))}
                                </span>
                              </div>
                              {sparepartItems.length === 0 ? (
                                <p className="text-slate-400 italic text-[11px]">Tidak ada penggantian sparepart</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {sparepartItems.map((item, i) => (
                                    <div key={item.id || i} className="flex justify-between items-center text-slate-700">
                                      <span className="font-medium truncate pr-2">
                                        • {item.quantity}x {item.itemName}
                                      </span>
                                      <span className="font-mono font-semibold text-slate-900 shrink-0">
                                        {formatCurrency(item.subtotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-slate-200 shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Riwayat servis dicatat otomatis dari setiap transaksi kasir &amp; memo selesai.
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
