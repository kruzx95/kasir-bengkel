'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ServiceFormModal from '@/components/admin/ServiceFormModal'
import { deleteService } from '@/actions/service'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react'

interface Branch {
  id: string
  code: string
  name: string
}

interface ServiceRow {
  id: string
  name: string
  price: number
  category: string | null
  branchId: string
  branch: Branch
}

interface ServicesClientProps {
  services: ServiceRow[]
  branches: Branch[]
}

export default function ServicesClient({ services, branches }: ServicesClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<ServiceRow | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleEdit = (service: ServiceRow) => {
    setEditData(service)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jasa servis ini?')) return
    setDeleting(id)
    await deleteService(id)
    setDeleting(null)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Nama Servis',
      render: (row: ServiceRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            {row.category && (
              <p className="text-xs text-slate-400">{row.category}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Harga',
      render: (row: ServiceRow) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatCurrency(row.price)}
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: ServiceRow) => (
        <Badge variant="primary" size="md">
          {row.branch.name}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-24',
      render: (row: ServiceRow) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            onClick={() => handleEdit(row)}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
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
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {services.length} jasa servis terdaftar
        </p>
        <Button
          icon={Plus}
          onClick={() => {
            setEditData(null)
            setModalOpen(true)
          }}
        >
          Tambah Servis
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <Table
          columns={columns}
          data={services}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada jasa servis. Klik tombol di atas untuk menambahkan."
        />
      </div>

      {/* Modal */}
      <ServiceFormModal
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        editData={editData}
      />
    </>
  )
}
