'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import MechanicFormModal from './MechanicFormModal'
import { Plus, Edit2, Trash2, Search, Wrench } from 'lucide-react'
import { deleteMechanic } from '@/actions/mechanic'

interface Mechanic {
  id: string
  name: string
  phone: string | null
  isActive: boolean
  branchId: string
  branch: { name: string }
}

interface MechanicsClientProps {
  initialData: Mechanic[]
  branches: { id: string; name: string }[]
}

export default function MechanicsClient({ initialData, branches }: MechanicsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)

  const filteredData = initialData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.phone && item.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleEdit = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedMechanic(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mekanik "${name}"?`)) {
      const res = await deleteMechanic(id)
      if (!res.success) alert(res.message)
      if (res.message && res.success) alert(res.message) // Handle soft delete alert
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Nama Mekanik',
      render: (row: Mechanic) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.phone || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: Mechanic) => (
        <span className="text-sm font-medium text-slate-700">{row.branch.name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Mechanic) => (
        <Badge variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: Mechanic) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleEdit(row)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(row.id, row.name)} className="text-red-500 hover:text-red-600 hover:bg-red-50" />
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mekanik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <Button onClick={handleAdd} icon={Plus}>Tambah Mekanik</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada data mekanik yang sesuai dengan pencarian Anda."
        />
      </div>

      <MechanicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mechanic={selectedMechanic}
        branches={branches}
      />
    </>
  )
}
