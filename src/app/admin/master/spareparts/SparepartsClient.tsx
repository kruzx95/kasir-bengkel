'use client'

import { useTransition, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SparepartFormModal from '@/components/admin/SparepartFormModal'
import ImportSparepartModal from '@/components/admin/ImportSparepartModal'
import { deleteSparepart } from '@/actions/sparepart'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Package, Upload, Search } from 'lucide-react'
import Select from '@/components/ui/Select'

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
  totalCount: number
}

export default function SparepartsClient({ spareparts, branches, totalCount }: SparepartsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editData, setEditData] = useState<SparepartRow | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const initialSearch = searchParams.get('search') || ''
  const initialBranch = searchParams.get('branch') || ''
  
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [filterBranch, setFilterBranch] = useState(initialBranch)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
          params.set('search', searchQuery)
        } else {
          params.delete('search')
        }
        params.set('page', '1') // reset to page 1 on new search
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router, searchParams])

  // Branch filter change
  const handleBranchChange = (branchId: string) => {
    setFilterBranch(branchId)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (branchId) {
        params.set('branch', branchId)
      } else {
        params.delete('branch')
      }
      params.set('page', '1')
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

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
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, SKU, jenis, atau merk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { label: 'Semua Cabang', value: '' },
              ...branches.map(b => ({ label: b.name, value: b.id })),
            ]}
            value={filterBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-400 shrink-0 flex items-center gap-2">
          <span>{totalCount} total data</span>
          {isPending && <span className="text-primary-500 animate-pulse text-xs">Memuat...</span>}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setImportModalOpen(true)}
          >
            Import Excel
          </Button>
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
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
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

      {/* Import Modal */}
      <ImportSparepartModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        branches={branches}
      />
    </>
  )
}
