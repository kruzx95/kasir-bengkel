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

interface TransactionItem {
  quantity: number
  itemName: string
  subtotal: number
}

interface TransactionRow {
  id: string
  invoiceNumber: string
  transactionDate: string | Date
  items: TransactionItem[]
  branch: { name: string }
  user: { name: string }
  customer?: { name?: string; plateNumber?: string | null } | null
  type: string
  total: number
  subtotal: number
  discount?: number
  paymentMethod?: string
}

interface RestockItem {
  quantity: number
  sparepart: { name: string; sparepartBrand?: string }
  buyPrice: number
}

interface RestockRow {
  id: string
  date: string | Date
  supplierName: string
  branch: { name: string }
  items: RestockItem[]
  total: number
}

interface ReportClientProps {
  branches: { id: string; name: string }[]
  initialData: TransactionRow[]
  initialSummary: { total: number; service: number; sparepart: number; pendingCorporate: number }
  shopName: string
}

export default function ReportClient({ branches, initialData, initialSummary, shopName }: ReportClientProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'transaksi' | 'pembelian'>('transaksi')

  const todayStr = new Date().toISOString().slice(0, 10)
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  // Transaksi state
  const [startDate, setStartDate] = useState(firstDayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [branchId, setBranchId] = useState('')
  const [data, setData] = useState<TransactionRow[]>(initialData)
  const [summary, setSummary] = useState(initialSummary)

  // Pembelian state
  const [buyStartDate, setBuyStartDate] = useState(firstDayStr)
  const [buyEndDate, setBuyEndDate] = useState(todayStr)
  const [buyBranchId, setBuyBranchId] = useState('')
  const [buyData, setBuyData] = useState<RestockRow[]>([])
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
    const exportData = data.map((tx: TransactionRow) => {
      const date = new Date(tx.transactionDate).toLocaleDateString('id-ID')
      const itemsStr = tx.items.map((i: TransactionItem) => `${i.quantity}x ${i.itemName} (Rp${i.subtotal})`).join('\n')
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
      render: (row: TransactionRow) => (
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
      render: (row: TransactionRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">{row.user.name}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipe',
      render: (row: TransactionRow) => (
        <Badge variant={row.type === 'SERVICE' ? 'primary' : row.type === 'SPAREPART' ? 'warning' : 'success'} size="sm">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: 'Total Item',
      render: (row: TransactionRow) => (
        <span className="text-sm font-medium text-slate-700">{row.items.length} item</span>
      ),
    },
    {
      key: 'total',
      header: 'Total Akhir',
      render: (row: TransactionRow) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  const restockColumns = [
    {
      key: 'date',
      header: 'Tanggal',
      render: (row: RestockRow) => (
        <p className="text-sm text-slate-700">
          {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier / Cabang',
      render: (row: RestockRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.supplierName}</p>
          <p className="text-xs text-slate-400">{row.branch.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Rincian Barang',
      render: (row: RestockRow) => (
        <div className="space-y-0.5">
          {row.items.map((item: RestockItem, i: number) => (
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
      render: (row: RestockRow) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit print:hidden">
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
        <div className="print:hidden">
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm border-l-4 border-l-amber-400">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Tagihan Korporat (Belum Lunas)</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.pendingCorporate)}</p>
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
              keyExtractor={(row: TransactionRow) => row.id}
              emptyMessage="Tidak ada transaksi pada rentang tanggal tersebut."
            />
          </div>
        </div>
      )}

      {/* ===== TAB: PEMBELIAN SPAREPART ===== */}
      {activeTab === 'pembelian' && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4 print:hidden">
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
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 print:hidden">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Klik tombol Filter untuk menampilkan laporan pembelian sparepart.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
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

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                    Data Pembelian Sparepart
                  </h3>
                </div>
                <Table
                  columns={restockColumns}
                  data={buyData}
                  keyExtractor={(row: RestockRow) => row.id}
                  emptyMessage="Tidak ada data pembelian pada rentang tanggal tersebut."
                />
              </div>

              {/* Print Layout */}
              <div className="hidden print:block text-slate-900 bg-white text-[11px]">
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    @page { size: A4 portrait; margin: 12mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  }
                `}} />
                
                {/* Header Kop Surat */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                    <p className="text-[10px] text-slate-500">Manajemen Bengkel & Sparepart</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">Laporan Pembelian Sparepart</h2>
                    <p className="text-[10px] mt-0.5">Periode: {new Date(buyStartDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} s/d {new Date(buyEndDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                  </div>
                </div>
                
                {Object.entries(
                  buyData.reduce((acc, row) => {
                    if (!acc[row.supplierName]) {
                      acc[row.supplierName] = { rows: [], total: 0 }
                    }
                    acc[row.supplierName].rows.push(row)
                    acc[row.supplierName].total += row.total
                    return acc
                  }, {} as Record<string, { rows: RestockRow[], total: number }>)
                ).map(([supplier, data]) => (
                  <div key={supplier} className="mb-5 break-inside-avoid">
                    <div className="bg-slate-100 py-1 px-3 border-l-4 border-slate-900 mb-2 flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase">Supplier: {supplier}</h3>
                      <span className="text-[10px] font-semibold">{data.rows.length} Transaksi</span>
                    </div>
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-20">Tanggal</th>
                          <th className="text-left py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-24">Cabang</th>
                          <th className="text-left py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px]">Barang</th>
                          <th className="text-right py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-28">Harga Satuan</th>
                          <th className="text-right py-1.5 px-2 border border-slate-300 font-bold uppercase text-[10px] w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map(row => (
                          <tr key={row.id}>
                            <td className="py-1.5 px-2 border border-slate-300 align-top">
                              {new Date(row.date).toLocaleDateString('id-ID')}
                            </td>
                            <td className="py-1.5 px-2 border border-slate-300 align-top">
                              {row.branch.name}
                            </td>
                            <td className="py-1.5 px-2 border border-slate-300 align-top">
                              <div className="space-y-0.5 text-[10px]">
                                {row.items.map((item: RestockItem, i: number) => (
                                  <div key={i}><span className="font-semibold">{item.quantity}x</span> {item.sparepart.name}</div>
                                ))}
                              </div>
                            </td>
                            <td className="py-1.5 px-2 border border-slate-300 align-top text-right">
                              <div className="space-y-0.5 text-[10px]">
                                {row.items.map((item: RestockItem, i: number) => (
                                  <div key={i}>{formatCurrency(item.buyPrice)}</div>
                                ))}
                              </div>
                            </td>
                            <td className="text-right py-1.5 px-2 border border-slate-300 align-top font-bold">
                              {formatCurrency(row.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="text-right font-black py-1.5 px-2 border border-slate-300 uppercase text-[10px]">Subtotal {supplier}:</td>
                          <td className="text-right font-black py-1.5 px-2 border border-slate-300">{formatCurrency(data.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}
                
                {/* Grand Total */}
                <div className="bg-slate-900 text-white rounded-lg py-3 px-4 flex justify-between items-center break-inside-avoid mt-4">
                  <span className="text-sm font-bold uppercase tracking-wider">Total Pengeluaran Keseluruhan</span>
                  <span className="text-base font-black">{formatCurrency(buySummary.total)}</span>
                </div>

                {/* Signatures */}
                <div className="mt-10 grid grid-cols-2 gap-8 text-center break-inside-avoid text-[10px]">
                  <div>
                    <p className="mb-16 font-medium text-slate-600">Dibuat Oleh,</p>
                    <div className="w-36 mx-auto border-b border-slate-900"></div>
                    <p className="mt-1 font-bold uppercase text-slate-800">Admin / Staff</p>
                  </div>
                  <div>
                    <p className="mb-16 font-medium text-slate-600">Disetujui Oleh,</p>
                    <div className="w-36 mx-auto border-b border-slate-900"></div>
                    <p className="mt-1 font-bold uppercase text-slate-800">Manajer / Pemilik</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
