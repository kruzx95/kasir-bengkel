'use client'

import { useState, useTransition } from 'react'
import { getCustomers } from '@/actions/customer'
import { getServices } from '@/actions/service'
import { getSpareparts } from '@/actions/sparepart'
import { getMechanics } from '@/actions/mechanic'
import { getCorporateCustomers } from '@/actions/corporate'
import NewTransactionClient from '@/app/kasir/transaksi/baru/NewTransactionClient'
import Select from '@/components/ui/Select'
import { Building2 } from 'lucide-react'

interface AdminNewTransactionClientProps {
  branches: { id: string; name: string }[]
  preloadedData?: {
    customers: Customers
    services: Services
    spareparts: Spareparts
    mechanics: Mechanics
    corporates: Corporates
    branchId: string
  }
}

type Customers = Awaited<ReturnType<typeof getCustomers>>
type Services = Awaited<ReturnType<typeof getServices>>
type Spareparts = Awaited<ReturnType<typeof getSpareparts>>
type Mechanics = Awaited<ReturnType<typeof getMechanics>>
type Corporates = Awaited<ReturnType<typeof getCorporateCustomers>>

export default function AdminNewTransactionClient({ branches, preloadedData }: AdminNewTransactionClientProps) {
  const [selectedBranchId, setSelectedBranchId] = useState(preloadedData?.branchId || '')
  const [isPending, startTransition] = useTransition()
  
  const [data, setData] = useState<{
    customers: Customers
    services: Services
    spareparts: Spareparts
    mechanics: Mechanics
    corporates: Corporates
  } | null>(preloadedData || null)

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value
    setSelectedBranchId(branchId)
    setData(null)

    if (branchId) {
      startTransition(async () => {
        const [c, s, sp, m, corp] = await Promise.all([
          getCustomers(branchId),
          getServices(branchId),
          getSpareparts(branchId),
          getMechanics(branchId),
          getCorporateCustomers(branchId),
        ])
        setData({ customers: c, services: s, spareparts: sp, mechanics: m, corporates: corp })
      })
    }
  }

  return (
    <div className="space-y-6">
      {!preloadedData && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-500" /> Pilih Cabang Transaksi
          </h2>
          <Select
            id="branch"
            name="branch"
            label="Cabang"
            options={[
              { label: 'Pilih cabang...', value: '' },
              ...branches.map(b => ({ label: b.name, value: b.id }))
            ]}
            value={selectedBranchId}
            onChange={handleBranchChange}
          />
          {isPending && <p className="text-sm text-slate-500">Memuat data master cabang...</p>}
        </div>
      )}

      {data && selectedBranchId && !isPending && (
        <NewTransactionClient
          customers={data.customers.map(c => ({ 
            id: c.id, 
            name: c.name, 
            plateNumber: c.plateNumber, 
            corporateCustomerId: c.corporateCustomerId ?? null,
            odometer: c.odometer ?? null
          }))}
          services={data.services.filter(s => s.isActive).map(s => ({ 
            id: s.id, 
            name: s.name, 
            price: s.price 
          }))}
          spareparts={data.spareparts.filter(sp => sp.isActive).map(sp => ({ 
            id: sp.id, 
            name: sp.name, 
            sellPrice: sp.sellPrice, 
            stock: sp.stock,
            sku: sp.sku
          }))}
          mechanics={data.mechanics.filter(m => m.isActive).map(m => ({ 
            id: m.id, 
            name: m.name 
          }))}
          corporates={data.corporates.map(c => ({ id: c.id, name: c.name }))}
          basePath="/admin/transaksi"
          branchId={selectedBranchId}
        />
      )}
    </div>
  )
}
