'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  PackagePlus,
  Wrench,
  BarChart3,
  Settings,
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { logout } from '@/actions/auth'

interface SidebarProps {
  role: 'ADMIN' | 'KASIR'
  userName: string
  branchName: string | null
  mobileOpen?: boolean
  onMobileClose?: () => void
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
  { href: '/admin/restock', label: 'Barang Masuk', icon: PackagePlus },
  { href: '/admin/master/mechanics', label: 'Mekanik', icon: Users },
  { href: '/admin/cabang', label: 'Cabang', icon: Building2 },
  { href: '/admin/users', label: 'Pengguna', icon: UserCog },
]

export default function Sidebar({ role, userName, branchName, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const menuItems = role === 'ADMIN' ? adminMenuItems : kasirMenuItems

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/kasir' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          // Base styles
          'fixed left-0 top-0 z-50 h-screen bg-sidebar-bg text-sidebar-text flex flex-col transition-all duration-300',
          // Desktop: always visible
          'lg:z-40',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          // Mobile: off-screen by default, slide in when open
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
          'lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shrink-0">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
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
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    active ? 'text-white' : 'text-slate-400'
                  )}
                />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
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
              collapsed && !mobileOpen && 'justify-center px-0'
            )}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            {(!collapsed || mobileOpen) && (
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
                collapsed && !mobileOpen && 'justify-center'
              )}
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              {(!collapsed || mobileOpen) && <span>Keluar</span>}
            </button>
          </form>

          {/* Collapse Toggle — only show on desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/8 hover:text-white transition-all duration-200',
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
    </>
  )
}
