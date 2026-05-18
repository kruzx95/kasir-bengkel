'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SparepartFormModal from '@/components/admin/SparepartFormModal'
import { deleteSparepart } from '@/actions/sparepart'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'

interface Branch {
  id: string
  code: string
  name: string
}

interface SparepartRow {
  id: string
  name: string
  sku: string | null
  sparepartType: string | null
  sparepartBrand: string | null
  sparepartSize: string | null
  buyPrice: number
  sellPrice: number
  stock: number
  unit: string
  branchId: string
  branch: Branch
}

interface SparepartsClientProps {
  spareparts: SparepartRow[]
  branches: Branch[]
}

export default function SparepartsClient({ spareparts, branches }: SparepartsClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<SparepartRow | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleEdit = (sp: SparepartRow) => {
    setEditData(sp)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus sparepart ini?')) return
    setDeleting(id)
    await deleteSparepart(id)
    setDeleting(null)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="danger" size="md">Habis</Badge>
    if (stock <= 5) return <Badge variant="warning" size="md">{stock}</Badge>
    return <Badge variant="success" size="md">{stock}</Badge>
  }

  const columns = [
    {
      key: 'name',
      header: 'Sparepart',
      render: (row: SparepartRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {row.sku && (
                <p className="text-xs text-slate-400 font-mono">{row.sku}</p>
              )}
              {row.sparepartSize && (
                <p className="text-xs text-slate-400">{row.sparepartSize}</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'sparepartType',
      header: 'Jenis / Merk',
      render: (row: SparepartRow) => (
        <div>
          {row.sparepartType && (
            <p className="text-sm text-slate-700">{row.sparepartType}</p>
          )}
          {row.sparepartBrand && (
            <p className="text-xs text-slate-400">{row.sparepartBrand}</p>
          )}
          {!row.sparepartType && !row.sparepartBrand && (
            <span className="text-xs text-slate-300">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'buyPrice',
      header: 'Harga Beli',
      render: (row: SparepartRow) => (
        <span className="text-sm text-slate-600">
          {formatCurrency(row.buyPrice)}
        </span>
      ),
    },
    {
      key: 'sellPrice',
      header: 'Harga Jual',
      render: (row: SparepartRow) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatCurrency(row.sellPrice)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stok',
      render: (row: SparepartRow) => (
        <div className="flex items-center gap-1.5">
          {getStockBadge(row.stock)}
          <span className="text-xs text-slate-400">{row.unit}</span>
        </div>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (row: SparepartRow) => {
        const margin = row.sellPrice - row.buyPrice
        const pct = row.buyPrice > 0 ? Math.round((margin / row.buyPrice) * 100) : 0
        return (
          <div>
            <p className="text-sm font-medium text-emerald-600">
              {formatCurrency(margin)}
            </p>
            <p className="text-xs text-slate-400">{pct}%</p>
          </div>
        )
      },
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: SparepartRow) => (
        <Badge variant="primary" size="md">
          {row.branch.name}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-24',
      render: (row: SparepartRow) => (
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
          {spareparts.length} sparepart terdaftar
        </p>
        <Button
          icon={Plus}
          onClick={() => {
            setEditData(null)
            setModalOpen(true)
          }}
        >
          Tambah Sparepart
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <Table
          columns={columns}
          data={spareparts}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada sparepart. Klik tombol di atas untuk menambahkan."
        />
      </div>

      {/* Modal */}
      <SparepartFormModal
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        editData={editData}
      />
    </>
  )
}
