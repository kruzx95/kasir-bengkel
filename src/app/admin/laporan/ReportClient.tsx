'use client'

import { useState, useTransition, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { getReportData } from '@/actions/report'
import { Download, Filter, Receipt } from 'lucide-react'

import * as XLSX from 'xlsx'

interface ReportClientProps {
  branches: { id: string; name: string }[]
  initialData: any
  initialSummary: any
}

export default function ReportClient({ branches, initialData, initialSummary }: ReportClientProps) {
  const [isPending, startTransition] = useTransition()
  
  const todayStr = new Date().toISOString().slice(0, 10)
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(firstDayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [branchId, setBranchId] = useState('')

  const [data, setData] = useState(initialData)
  const [summary, setSummary] = useState(initialSummary)

  const handleFilter = () => {
    startTransition(async () => {
      const res = await getReportData(startDate, endDate, branchId)
      setData(res.transactions)
      setSummary(res.summary)
    })
  }

  const handleExportExcel = () => {
    // Format data for Excel
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
        'Total Akhir': tx.total
      }
    })

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Set Column Widths for better readability
    const columnWidths = [
      { wch: 12 }, // Tanggal
      { wch: 25 }, // No Invoice
      { wch: 15 }, // Cabang
      { wch: 15 }, // Kasir
      { wch: 15 }, // Pelanggan
      { wch: 15 }, // Tipe
      { wch: 15 }, // Metode
      { wch: 45 }, // Rincian Item (lebar ekstra)
      { wch: 15 }, // Subtotal
      { wch: 10 }, // Diskon
      { wch: 15 }, // Total Akhir
    ]
    worksheet['!cols'] = columnWidths

    // Create Workbook and append sheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Transaksi')
    
    // Save to device
    XLSX.writeFile(workbook, `Laporan_IrianMotor_${startDate}_to_${endDate}.xlsx`)
  }

  const columns = [
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
      )
    },
    {
      key: 'branch',
      header: 'Cabang / Kasir',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">{row.user.name}</p>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipe',
      render: (row: any) => (
        <Badge variant={row.type === 'SERVICE' ? 'primary' : row.type === 'SPAREPART' ? 'warning' : 'success'} size="sm">
          {row.type}
        </Badge>
      )
    },
    {
      key: 'items',
      header: 'Total Item',
      render: (row: any) => (
        <span className="text-sm font-medium text-slate-700">{row.items.length} item</span>
      )
    },
    {
      key: 'total',
      header: 'Total Akhir',
      render: (row: any) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4">
        <div className="w-full md:w-auto">
          <Input 
            label="Mulai Tanggal" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div className="w-full md:w-auto">
          <Input 
            label="Sampai Tanggal" 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
        <div className="w-full md:w-64">
          <Select 
            label="Pilih Cabang" 
            options={[
              { label: 'Semua Cabang', value: '' },
              ...branches.map(b => ({ label: b.name, value: b.id }))
            ]}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          />
        </div>
        
        <Button onClick={handleFilter} loading={isPending} icon={Filter}>
          Filter
        </Button>
        <Button onClick={handleExportExcel} variant="outline" icon={Download} disabled={data.length === 0}>
          Ekspor Excel
        </Button>
      </div>

      {/* Summary Cards */}
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

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Receipt className="w-5 h-5 text-primary-500" />
             Data Transaksi
           </h3>
        </div>
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row: any) => row.id}
          emptyMessage="Tidak ada transaksi pada rentang tanggal tersebut."
        />
      </div>

    </div>
  )
}
