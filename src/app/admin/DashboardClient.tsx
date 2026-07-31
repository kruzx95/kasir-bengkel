'use client'

import { formatCurrency } from '@/lib/utils'
import {
  LineChart, Line, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Wallet, Wrench, Package, ArrowUpRight, CalendarClock, User, Building2, Clock, Coins } from 'lucide-react'

interface DashboardClientProps {
  metrics: {
    dailyRevenue: number
    monthlyRevenue: number
    dailyBreakdown?: {
      regularRevenue: number
      regularCount: number
      corporateRevenue: number
      corporateCount: number
      corporatePending: number
      pendingCount: number
    }
    monthlyBreakdown?: {
      regularRevenue: number
      regularCount: number
      corporateRevenue: number
      corporateCount: number
      corporatePending: number
      pendingCount: number
    }
    trendData: { date: string, revenue: number }[]
    branchRevenueData: { name: string, revenue: number }[]
    topServices: { name: string, qty: number, revenue: number }[]
    topSpareparts: { name: string, qty: number, revenue: number }[]
    lowStockItems: { name: string, stock: number, branch: { name: string } }[]
    prevMonth: {
      name: string
      revenue: number
      topServices: { name: string, qty: number, revenue: number }[]
      topSpareparts: { name: string, qty: number, revenue: number }[]
    }
  }
}

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7']

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-emerald-400 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function DashboardClient({ metrics }: DashboardClientProps) {
  const mb = metrics.monthlyBreakdown || { regularRevenue: 0, regularCount: 0, corporateRevenue: 0, corporateCount: 0, corporatePending: 0, pendingCount: 0 }
  const db = metrics.dailyBreakdown || { regularRevenue: 0, regularCount: 0, corporateRevenue: 0, corporateCount: 0, corporatePending: 0, pendingCount: 0 }

  const totalMonthVolume = mb.regularRevenue + mb.corporateRevenue + mb.corporatePending
  const regPercent = totalMonthVolume > 0 ? Math.round((mb.regularRevenue / totalMonthVolume) * 100) : 0
  const corpPercent = totalMonthVolume > 0 ? Math.round((mb.corporateRevenue / totalMonthVolume) * 100) : 0
  const pendingPercent = totalMonthVolume > 0 ? Math.round((mb.corporatePending / totalMonthVolume) * 100) : 0

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4 sm:space-y-6">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pendapatan Hari Ini</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.dailyRevenue)}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Reguler: <strong className="text-slate-700">{formatCurrency(db.regularRevenue)}</strong></span>
              <span>Korporat: <strong className="text-blue-600">{formatCurrency(db.corporateRevenue)}</strong></span>
            </div>
          </div>
        </div>

        {/* Month's Revenue Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pendapatan Bulan Ini</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.monthlyRevenue)}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Reguler: <strong className="text-slate-700">{formatCurrency(mb.regularRevenue)}</strong></span>
              <span>Korporat Lunas: <strong className="text-emerald-600">{formatCurrency(mb.corporateRevenue)}</strong></span>
            </div>
          </div>
        </div>

        {/* Business Performance Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group col-span-1 md:col-span-2">
           <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-slate-50 to-transparent" />
           <div className="relative z-10 flex justify-between items-center h-full">
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-1">Performa Bisnis</h3>
               <p className="text-sm text-slate-500 max-w-xs">Pantau terus pergerakan omset reguler harian & transaksi korporat di semua cabang.</p>
             </div>
             <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white rotate-3 shadow-lg shadow-slate-900/20">
               <ArrowUpRight className="w-8 h-8" />
             </div>
           </div>
        </div>
      </div>

      {/* ===== RINCIAN PENDAPATAN: REGULER VS KORPORAT ===== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Rincian Pendapatan (Reguler vs Korporat)</h3>
              <p className="text-xs text-slate-500">Breakdown transaksi harian reguler vs piutang & omset perusahaan korporat bulan ini</p>
            </div>
          </div>
        </div>

        {/* Visual Progress Ratio Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
            <span>Komposisi Omset Bulan Ini</span>
            <span>{formatCurrency(totalMonthVolume)}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div style={{ width: `${regPercent}%` }} className="bg-blue-500 transition-all duration-500" title={`Reguler: ${regPercent}%`} />
            <div style={{ width: `${corpPercent}%` }} className="bg-emerald-500 transition-all duration-500" title={`Korporat Lunas: ${corpPercent}%`} />
            <div style={{ width: `${pendingPercent}%` }} className="bg-amber-500 transition-all duration-500" title={`Korporat Pending: ${pendingPercent}%`} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600 font-medium">Reguler: {regPercent}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Korporat Lunas: {corpPercent}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 font-medium">Piutang Korporat Pending: {pendingPercent}%</span>
            </div>
          </div>
        </div>

        {/* 3 Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Regular */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Transaksi Reguler</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(mb.regularRevenue)}</p>
              <p className="text-xs text-slate-500 mt-1">{mb.regularCount} transaksi pelanggan harian</p>
            </div>
          </div>

          {/* Card 2: Corporate Settled */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Korporat (Lunas)</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(mb.corporateRevenue)}</p>
              <p className="text-xs text-slate-500 mt-1">{mb.corporateCount} transaksi armada lunas</p>
            </div>
          </div>

          {/* Card 3: Corporate Pending */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Piutang Korporat Pending</p>
              <p className="text-xl font-black text-amber-900 mt-0.5">{formatCurrency(mb.corporatePending)}</p>
              <p className="text-xs text-slate-500 mt-1">{mb.pendingCount} nota armada belum dibayar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: 7 Days Trend */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm ${metrics.branchRevenueData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-base font-bold text-slate-900 mb-6">Tren Pendapatan (7 Hari Terakhir)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `Rp ${value / 1000}k`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0ea5e9" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Revenue by Branch (Admin Only) */}
        {metrics.branchRevenueData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">Kontribusi Cabang (Bulan Ini)</h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.branchRevenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {metrics.branchRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm font-medium text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Services */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Jasa Servis Terlaris</h3>
          </div>
          <div className="space-y-4">
            {metrics.topServices.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data bulan ini.</p>
            ) : (
              metrics.topServices.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.qty} kali servis</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(item.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Spareparts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center text-warning-600">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Sparepart Terlaris</h3>
          </div>
          <div className="space-y-4">
            {metrics.topSpareparts.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data bulan ini.</p>
            ) : (
              metrics.topSpareparts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.qty} terjual</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(item.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Peringatan Stok Menipis</h3>
              <p className="text-xs text-slate-500">Sparepart dengan sisa stok di bawah 5 pcs</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.lowStockItems.length === 0 ? (
              <p className="text-sm text-slate-500 col-span-full">Semua stok sparepart aman.</p>
            ) : (
              metrics.lowStockItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50/30">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.branch.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-red-600">{item.stock}</span>
                    <span className="text-xs text-red-400 ml-1">pcs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Previous Month Summary */}
      {metrics.prevMonth.revenue > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 capitalize">Ringkasan {metrics.prevMonth.name}</h3>
              <p className="text-xs text-slate-500">Data bulan sebelumnya</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prev Month Revenue Card */}
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-6 rounded-2xl shadow-lg shadow-violet-500/20 text-white relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-violet-100 mb-1 capitalize">Total Pendapatan {metrics.prevMonth.name}</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.prevMonth.revenue)}</p>
              </div>
            </div>

            {/* Prev Month Top Services */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  <Wrench className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Jasa Servis Terlaris</h4>
              </div>
              <div className="space-y-3">
                {metrics.prevMonth.topServices.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada data.</p>
                ) : (
                  metrics.prevMonth.topServices.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-3">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.qty} kali</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Prev Month Top Spareparts */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center text-warning-600">
                  <Package className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Sparepart Terlaris</h4>
              </div>
              <div className="space-y-3">
                {metrics.prevMonth.topSpareparts.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada data.</p>
                ) : (
                  metrics.prevMonth.topSpareparts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-3">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.qty} terjual</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
