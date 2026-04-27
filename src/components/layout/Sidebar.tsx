'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  Wrench,
  BarChart3,
  Settings,
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { logout } from '@/actions/auth'

interface SidebarProps {
  role: 'ADMIN' | 'KASIR'
  userName: string
  branchName: string | null
}

const kasirMenuItems = [
  { href: '/kasir', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kasir/transaksi', label: 'Transaksi', icon: Receipt },
  { href: '/kasir/pelanggan', label: 'Pelanggan', icon: Users },
  { href: '/kasir/sparepart', label: 'Stok Sparepart', icon: Package },
]

const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/transaksi', label: 'Transaksi', icon: Receipt },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
  { href: '/admin/master/services', label: 'Jasa Servis', icon: Wrench },
  { href: '/admin/master/spareparts', label: 'Sparepart', icon: Package },
  { href: '/admin/cabang', label: 'Cabang', icon: Building2 },
  { href: '/admin/users', label: 'Pengguna', icon: UserCog },
]

export default function Sidebar({ role, userName, branchName }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const menuItems = role === 'ADMIN' ? adminMenuItems : kasirMenuItems

  const isActive = (href: string) => {
    if (href === '/kasir' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar-bg text-sidebar-text transition-all duration-300 flex flex-col',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shrink-0">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-fade-in">
            <h1 className="text-sm font-bold text-white truncate">
              Irian Motor
            </h1>
            <p className="text-xs text-slate-400 truncate">
              {branchName ?? 'Semua Cabang'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  active ? 'text-white' : 'text-slate-400'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Collapse */}
      <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
        {/* User */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">
                {userName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {role === 'ADMIN' ? 'Administrator' : 'Kasir'}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200',
              collapsed && 'justify-center'
            )}
            title="Keluar"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </form>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/8 hover:text-white transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4.5 h-4.5" />
          ) : (
            <>
              <ChevronLeft className="w-4.5 h-4.5" />
              <span>Kecilkan</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
