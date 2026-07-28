'use client'

import { useState, useMemo } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import CorporateFormModal from './CorporateFormModal'
import { deleteCorporateCustomer } from '@/actions/corporate'
import { Plus, Pencil, Trash2, Building2, Users, FileText, Search, Wallet, CheckCircle2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface CorporateRow {
  id: string
  name: string
  contactPerson: string | null
  contactPhone: string | null
  billingCycle: string
  isActive: boolean
  branch: { name: string }
  customers: { id: string; name: string; plateNumber: string | null }[]
  currentMonthTotal: number
  totalUnpaidAmount: number
  totalPaidThisMonth: number
  hideServiceOnInvoice: boolean
}

interface KorporatClientProps {
  initialData: CorporateRow[]
  branches: { id: string; code: string; name: string }[]
  isAdmin: boolean
}

const cycleLabel: Record<string, string> = {
  WEEKLY: 'Mingguan',
  BIWEEKLY: 'Dua Mingguan',
  MONTHLY: 'Bulanan',
}

export default function KorporatClient({ initialData, branches, isAdmin }: KorporatClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CorporateRow | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')

  const handleEdit = (row: CorporateRow) => {
    setEditData(row)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Nonaktifkan pelanggan korporat ini?')) return
    setDeleting(id)
    const result = await deleteCorporateCustomer(id)
    if (result.success) {
      setData(data.filter(d => d.id !== id))
    } else {
      alert(result.message || 'Gagal menghapus')
    }
    setDeleting(null)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row => {
      if (row.name.toLowerCase().includes(q)) return true
      if (row.contactPerson?.toLowerCase().includes(q)) return true
      if (row.contactPhone?.toLowerCase().includes(q)) return true
      // Search by plate number
      if (row.customers.some(c => c.plateNumber?.toLowerCase().includes(q))) return true
      return false
    })
  }, [data, search])

  // Summary
  const summary = useMemo(() => {
    const totalUnpaid = data.reduce((acc, r) => acc + r.totalUnpaidAmount, 0)
    const totalPaidThisMonth = data.reduce((acc, r) => acc + r.totalPaidThisMonth, 0)
    const totalCorporate = data.length
    const totalVehicles = data.reduce((acc, r) => acc + r.customers.length, 0)
    return { totalUnpaid, totalPaidThisMonth, totalCorporate, totalVehicles }
  }, [data])

  const columns = [
    {
      key: 'name',
      header: 'Perusahaan',
      render: (row: CorporateRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{row.name}</p>
            {row.contactPerson && (
              <p className="text-xs text-slate-400">{row.contactPerson}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: CorporateRow) => (
        <Badge variant="primary" size="md">{row.branch.name}</Badge>
      ),
    },
    {
      key: 'billing',
      header: 'Siklus',
      render: (row: CorporateRow) => (
        <Badge variant="warning" size="md">{cycleLabel[row.billingCycle] || row.billingCycle}</Badge>
      ),
    },
    {
      key: 'invoiceMode',
      header: 'Invoice',
      render: (row: CorporateRow) => (
        row.hideServiceOnInvoice ? (
          <Badge variant="danger" size="md">Tanpa Jasa</Badge>
        ) : (
          <Badge variant="success" size="md">Tampil Jasa</Badge>
        )
      ),
    },
    {
      key: 'customers',
      header: 'Kendaraan',
      render: (row: CorporateRow) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">{row.customers.length}</span>
        </div>
      ),
    },
    {
      key: 'piutang',
      header: 'Piutang Berjalan',
      render: (row: CorporateRow) => (
        <div className="flex flex-col">
          <span className={`text-sm font-bold ${row.totalUnpaidAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {formatCurrency(row.totalUnpaidAmount)}
          </span>
          {row.totalPaidThisMonth > 0 && (
            <span className="text-[10px] text-emerald-600">
              Terbayar: {formatCurrency(row.totalPaidThisMonth)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-40',
      render: (row: CorporateRow) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/korporat/${row.id}/tagihan`}>
            <Button size="sm" variant="outline" icon={FileText}>
              Tagihan
            </Button>
          </Link>
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => handleEdit(row)} title="Edit" />
          {isAdmin && (
            <Button
              size="sm" variant="ghost" icon={Trash2}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              loading={deleting === row.id}
              onClick={() => handleDelete(row.id)}
              title="Nonaktifkan (admin)"
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Korporat"
          value={summary.totalCorporate.toString()}
          icon={Building2}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatCard
          title="Total Kendaraan"
          value={summary.totalVehicles.toString()}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Piutang Berjalan"
          value={formatCurrency(summary.totalUnpaid)}
          icon={Wallet}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Terbayar Bulan Ini"
          value={formatCurrency(summary.totalPaidThisMonth)}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama, PIC, atau plat nomor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button icon={Plus} onClick={() => { setEditData(null); setModalOpen(true) }}>
          Tambah Korporat
        </Button>
      </div>

      <div className="text-xs text-slate-500 mb-2">
        Menampilkan {filteredData.length} dari {data.length} perusahaan
      </div>

      <Card>
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage={search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada pelanggan korporat. Klik tombol di atas untuk menambahkan.'}
        />
      </Card>

      <CorporateFormModal
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        editData={editData}
      />
    </>
  )
}