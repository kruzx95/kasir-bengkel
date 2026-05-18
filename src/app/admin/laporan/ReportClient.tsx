'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { getReportData, getRestockReportData } from '@/actions/report'
import { Download, Filter, Receipt, ShoppingCart, Printer } from 'lucide-react'

import * as XLSX from 'xlsx'

interface ReportClientProps {
  branches: { id: string; name: string }[]
  initialData: any
  initialSummary: any
}

export default function ReportClient({ branches, initialData, initialSummary }: ReportClientProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'transaksi' | 'pembelian'>('transaksi')

  const todayStr = new Date().toISOString().slice(0, 10)
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  // Transaksi state
  const [startDate, setStartDate] = useState(firstDayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [branchId, setBranchId] = useState('')
  const [data, setData] = useState(initialData)
  const [summary, setSummary] = useState(initialSummary)

  // Pembelian state
  const [buyStartDate, setBuyStartDate] = useState(firstDayStr)
  const [buyEndDate, setBuyEndDate] = useState(todayStr)
  const [buyBranchId, setBuyBranchId] = useState('')
  const [buyData, setBuyData] = useState<any[]>([])
  const [buySummary, setBuySummary] = useState({ total: 0, count: 0, topSparepart: null as string | null })
  const [buyLoaded, setBuyLoaded] = useState(false)

  const handleFilter = () => {
    startTransition(async () => {
      const res = await getReportData(startDate, endDate, branchId)
      setData(res.transactions)
      setSummary(res.summary)
    })
  }

  const handleBuyFilter = () => {
    startTransition(async () => {
      const res = await getRestockReportData(buyStartDate, buyEndDate, buyBranchId)
      setBuyData(res.restocks)
      setBuySummary(res.summary)
      setBuyLoaded(true)
    })
  }

  const handleExportExcel = () => {
    const exportData = data.map((tx: any) => {
      const date = new Date(tx.transactionDate).toLocaleDateString('id-ID')
      const itemsStr = tx.items.map((i: any) => `${i.quantity}x ${i.itemName} (Rp${i.subtotal})`).join('\n')
      return {
        'Tanggal': date,
        'No. Invoice': tx.invoiceNumber,
        'Cabang': tx.branch.name,
        'Kasir': tx.user.name,
        'Pelanggan': tx.customer?.name || 'Umum',
        'Tipe Transaksi': tx.type,
        'Metode Bayar': tx.paymentMethod,
        'Rincian Item': itemsStr,
        'Subtotal': tx.subtotal,
        'Diskon': tx.discount,
        'Total Akhir': tx.total,
      }
    })
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Transaksi')
    XLSX.writeFile(workbook, `Laporan_IrianMotor_${startDate}_to_${endDate}.xlsx`)
  }

  const handlePrintBuy = () => {
    window.print()
  }

  const transactionColumns = [
    {
      key: 'invoice',
      header: 'No. Invoice',
      render: (row: any) => (
        <div>
          <p className="text-sm font-bold text-slate-900 font-mono">{row.invoiceNumber}</p>
          <p className="text-xs text-slate-400">
            {new Date(row.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang / Kasir',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">{row.user.name}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipe',
      render: (row: any) => (
        <Badge variant={row.type === 'SERVICE' ? 'primary' : row.type === 'SPAREPART' ? 'warning' : 'success'} size="sm">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: 'Total Item',
      render: (row: any) => (
        <span className="text-sm font-medium text-slate-700">{row.items.length} item</span>
      ),
    },
    {
      key: 'total',
      header: 'Total Akhir',
      render: (row: any) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  const restockColumns = [
    {
      key: 'date',
      header: 'Tanggal',
      render: (row: any) => (
        <p className="text-sm text-slate-700">
          {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier / Cabang',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.supplierName}</p>
          <p className="text-xs text-slate-400">{row.branch.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Rincian Barang',
      render: (row: any) => (
        <div className="space-y-0.5">
          {row.items.map((item: any, i: number) => (
            <p key={i} className="text-xs text-slate-600">
              {item.quantity}x {item.sparepart.name}
              {item.sparepart.sparepartBrand ? ` (${item.sparepart.sparepartBrand})` : ''}
              {' — '}{formatCurrency(item.buyPrice)}/unit
            </p>
          ))}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Pengeluaran',
      render: (row: any) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'transaksi'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Laporan Transaksi
        </button>
        <button
          onClick={() => setActiveTab('pembelian')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'pembelian'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Laporan Pembelian Sparepart
        </button>
      </div>

      {/* ===== TAB: TRANSAKSI ===== */}
      {activeTab === 'transaksi' && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-auto">
              <Input label="Mulai Tanggal" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <Input label="Sampai Tanggal" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="w-full md:w-64">
              <Select
                label="Pilih Cabang"
                options={[{ label: 'Semua Cabang', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              />
            </div>
            <Button onClick={handleFilter} loading={isPending} icon={Filter}>Filter</Button>
            <Button onClick={handleExportExcel} variant="outline" icon={Download} disabled={data.length === 0}>
              Ekspor Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pendapatan</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.total)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendapatan Servis</p>
              <p className="text-xl font-bold text-primary-600">{formatCurrency(summary.service)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendapatan Sparepart</p>
              <p className="text-xl font-bold text-warning-600">{formatCurrency(summary.sparepart)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Transaksi</p>
              <p className="text-xl font-bold text-slate-700">{data.length} Struk</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-500" />
                Data Transaksi
              </h3>
            </div>
            <Table
              columns={transactionColumns}
              data={data}
              keyExtractor={(row: any) => row.id}
              emptyMessage="Tidak ada transaksi pada rentang tanggal tersebut."
            />
          </div>
        </>
      )}

      {/* ===== TAB: PEMBELIAN SPAREPART ===== */}
      {activeTab === 'pembelian' && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-auto">
              <Input label="Mulai Tanggal" type="date" value={buyStartDate} onChange={(e) => setBuyStartDate(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <Input label="Sampai Tanggal" type="date" value={buyEndDate} onChange={(e) => setBuyEndDate(e.target.value)} />
            </div>
            <div className="w-full md:w-64">
              <Select
                label="Pilih Cabang"
                options={[{ label: 'Semua Cabang', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                value={buyBranchId}
                onChange={(e) => setBuyBranchId(e.target.value)}
              />
            </div>
            <Button onClick={handleBuyFilter} loading={isPending} icon={Filter}>Filter</Button>
            <Button onClick={handlePrintBuy} variant="outline" icon={Printer} disabled={buyData.length === 0}>
              Cetak
            </Button>
          </div>

          {!buyLoaded ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Klik tombol Filter untuk menampilkan laporan pembelian sparepart.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(buySummary.total)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jumlah Restock</p>
                  <p className="text-xl font-bold text-primary-600">{buySummary.count} Transaksi</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sparepart Terbanyak Dibeli</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{buySummary.topSparepart || '—'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:shadow-none">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                    Data Pembelian Sparepart
                  </h3>
                </div>
                <Table
                  columns={restockColumns}
                  data={buyData}
                  keyExtractor={(row: any) => row.id}
                  emptyMessage="Tidak ada data pembelian pada rentang tanggal tersebut."
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
