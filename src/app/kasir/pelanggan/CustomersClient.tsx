'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CustomerFormModal from '@/components/kasir/CustomerFormModal'
import CustomerServiceHistoryModal from '@/components/customer/CustomerServiceHistoryModal'
import { exportCustomersAction } from '@/actions/customer'
import { exportProfessionalExcel } from '@/lib/exportExcel'
import { Plus, Pencil, Users, Search, Bike, Wrench, Download } from 'lucide-react'

interface CustomerRow {
  id: string
  name: string
  phone: string | null
  address: string | null
  plateNumber: string | null
  vehicleBrand: string | null
  vehicleType: string | null
  vehicleColor: string | null
  vehicleYear: string | null
  fuelType: string | null
  odometer: number | null
  branchId: string
  corporateCustomerId?: string | null
  branch: {
    id: string
    code: string
    name: string
  }
}

interface CustomersClientProps {
  initialCustomers: CustomerRow[]
  branchId: string
  totalCount: number
  corporateList?: Array<{ value: string; label: string }>
}

export default function CustomersClient({ initialCustomers, branchId, totalCount, corporateList }: CustomersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CustomerRow | null>(null)

  // Service History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<CustomerRow | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  
  const initialSearch = searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  // Simpan searchParams ke ref agar tidak masuk dependency array dan menyebabkan infinite loop
  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString())
        if (searchQuery) {
          params.set('search', searchQuery)
        } else {
          params.delete('search')
        }
        params.set('page', '1')
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router])

  const handleEdit = (customer: CustomerRow) => {
    setEditData(customer)
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const handleBackupExcel = async () => {
    setExportLoading(true)
    try {
      const res = await exportCustomersAction(branchId || null)
      if (res.success && res.data.length > 0) {
        await exportProfessionalExcel({
          filename: `Backup_Data_Pelanggan_${new Date().toISOString().slice(0, 10)}.xlsx`,
          sheetName: 'Pelanggan',
          title: 'BACKUP MASTER DATA PELANGGAN & KENDARAAN',
          period: 'Cabang Kasir',
          shopName: 'Irian Motor',
          columns: [
            { header: 'No', key: 'no', width: 6, align: 'center' },
            { header: 'Nama Pelanggan', key: 'name', width: 25, align: 'left' },
            { header: 'No. HP / WA', key: 'phone', width: 18, align: 'left' },
            { header: 'No. Polisi (Plat)', key: 'plateNumber', width: 16, align: 'center' },
            { header: 'Merk Kendaraan', key: 'vehicleBrand', width: 16, align: 'left' },
            { header: 'Tipe / Model', key: 'vehicleType', width: 20, align: 'left' },
            { header: 'Warna', key: 'vehicleColor', width: 14, align: 'left' },
            { header: 'Tahun', key: 'vehicleYear', width: 10, align: 'center' },
            { header: 'Bahan Bakar', key: 'fuelType', width: 14, align: 'center' },
            { header: 'Odometer Terakhir', key: 'odometer', width: 18, align: 'right' },
            { header: 'Alamat', key: 'address', width: 30, align: 'left' },
            { header: 'Cabang Terdaftar', key: 'branchName', width: 20, align: 'left' },
            { header: 'Tipe Pelanggan', key: 'corporateName', width: 20, align: 'left' },
            { header: 'Riwayat Servis', key: 'totalTransactions', width: 15, align: 'center' },
            { header: 'Tgl Terdaftar', key: 'createdAt', width: 16, align: 'center' },
          ],
          rows: res.data as any,
          summaries: [
            { label: 'Total Pelanggan Terdaftar', value: `${res.data.length} Orang` },
          ],
        })
      } else {
        alert(res.message || 'Tidak ada data pelanggan yang dapat dibackup/diekspor.')
      }
    } catch (err) {
      console.error('Backup Pelanggan Error:', err)
      alert('Terjadi kesalahan saat mengekspor data pelanggan.')
    } finally {
      setExportLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Pelanggan',
      render: (row: CustomerRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            {row.phone && (
              <p className="text-xs text-slate-400">{row.phone}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'plateNumber',
      header: 'Plat Nomor',
      render: (row: CustomerRow) => (
        row.plateNumber ? (
          <Badge variant="default" size="md" className="font-mono">
            {row.plateNumber}
          </Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: 'vehicle',
      header: 'Kendaraan',
      render: (row: CustomerRow) => (
        row.vehicleType || row.vehicleBrand ? (
          <div className="flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-700">
              {[row.vehicleBrand, row.vehicleType].filter(Boolean).join(' ')}
              {row.vehicleYear ? ` (${row.vehicleYear})` : ''}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-36',
      render: (row: CustomerRow) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            icon={Wrench}
            onClick={() => {
              setSelectedHistoryCustomer(row)
              setHistoryModalOpen(true)
            }}
            className="text-xs px-2.5 py-1 text-blue-600 border-blue-200 hover:bg-blue-50 font-medium"
            title="Lihat Riwayat Servis Kendaraan"
          >
            Riwayat
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            onClick={() => handleEdit(row)}
            title="Edit Data Pelanggan"
          />
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, plat nomor, atau no. HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <Button
            icon={Download}
            variant="outline"
            className="w-full sm:w-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-semibold"
            onClick={handleBackupExcel}
            loading={exportLoading}
          >
            {exportLoading ? 'Mengekspor...' : 'Backup Pelanggan (Excel)'}
          </Button>
          <Button
            icon={Plus}
            className="w-full sm:w-auto"
            onClick={() => {
              setEditData(null)
              setModalOpen(true)
            }}
          >
            Tambah Pelanggan
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-slate-500">
          {initialCustomers.length} item dari total {totalCount} pelanggan (halaman ini)
        </p>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          columns={columns}
          data={initialCustomers}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada pelanggan terdaftar."
        />
      </div>

      {/* Modal Edit/Tambah Pelanggan */}
      <CustomerFormModal
        key={modalOpen ? `customer-modal-${editData?.id || 'new'}` : 'customer-modal-closed'}
        open={modalOpen}
        onClose={handleClose}
        branchId={branchId}
        editData={editData}
        corporateList={corporateList}
      />

      {/* Modal Riwayat Servis Kendaraan Pelanggan */}
      <CustomerServiceHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false)
          setSelectedHistoryCustomer(null)
        }}
        customerId={selectedHistoryCustomer?.id || null}
        customerName={selectedHistoryCustomer?.name}
        plateNumber={selectedHistoryCustomer?.plateNumber}
        isAdmin={false}
      />
    </>
  )
}
