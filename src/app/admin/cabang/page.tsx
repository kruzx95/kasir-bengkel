import Header from '@/components/layout/Header'
import { getBranches } from '@/actions/branch'
import { Building2, MapPin, Phone, CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Cabang',
}

export default async function CabangPage() {
  const branches = await getBranches()

  const branchColors = ['from-emerald-500 to-emerald-600', 'from-blue-500 to-blue-600', 'from-violet-500 to-violet-600']

  return (
    <>
      <Header
        title="Kelola Cabang"
        subtitle="Data cabang bengkel Irian Motor"
      />
      <div className="p-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
            >
              {/* Header gradient */}
              <div className={`h-2 bg-gradient-to-r ${branchColors[index % 3]}`} />

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${branchColors[index % 3]} rounded-xl flex items-center justify-center`}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{branch.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{branch.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-medium text-emerald-700">Aktif</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{branch.address}</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
