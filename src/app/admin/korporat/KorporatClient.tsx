'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CorporateFormModal from './CorporateFormModal'
import { deleteCorporateCustomer } from '@/actions/corporate'
import { Plus, Pencil, Trash2, Building2, Users, FileText } from 'lucide-react'
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
}

interface KorporatClientProps {
  initialData: CorporateRow[]
  branches: { id: string; code: string; name: string }[]
}

const cycleLabel: Record<string, string> = {
  WEEKLY: 'Mingguan',
  BIWEEKLY: 'Dua Mingguan',
  MONTHLY: 'Bulanan',
}

export default function KorporatClient({ initialData, branches }: KorporatClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CorporateRow | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [data, setData] = useState(initialData)

  const handleEdit = (row: CorporateRow) => {
    setEditData(row)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Nonaktifkan pelanggan korporat ini?')) return
    setDeleting(id)
    await deleteCorporateCustomer(id)
    setData(data.filter(d => d.id !== id))
    setDeleting(null)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Perusahaan',
      render: (row: CorporateRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
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
      header: 'Siklus Tagihan',
      render: (row: CorporateRow) => (
        <Badge variant="warning" size="md">{cycleLabel[row.billingCycle] || row.billingCycle}</Badge>
      ),
    },
    {
      key: 'customers',
      header: 'Kendaraan Terdaftar',
      render: (row: CorporateRow) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">{row.customers.length} kendaraan</span>
        </div>
      ),
    },
    {
      key: 'billingTotal',
      header: 'Tagihan Berjalan',
      render: (row: CorporateRow) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{formatCurrency(row.currentMonthTotal)}</span>
          <span className="text-[10px] text-slate-400 uppercase">Bulan Ini</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-36',
      render: (row: CorporateRow) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/admin/korporat/${row.id}/tagihan`}>
            <Button size="sm" variant="outline" icon={FileText}>
              Tagihan
            </Button>
          </Link>
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => handleEdit(row)} />
          <Button
            size="sm" variant="ghost" icon={Trash2}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            loading={deleting === row.id}
            onClick={() => handleDelete(row.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">{data.length} perusahaan terdaftar</p>
        <Button icon={Plus} onClick={() => { setEditData(null); setModalOpen(true) }}>
          Tambah Korporat
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada pelanggan korporat. Klik tombol di atas untuk menambahkan."
        />
      </div>

      <CorporateFormModal
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        editData={editData}
      />
    </>
  )
}
