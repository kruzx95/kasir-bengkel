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
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ClipboardList,
  Briefcase,
  Settings,
  BellRing,
  Store,
  Warehouse,
} from 'lucide-react'
import { useEffect } from 'react'
import { logout } from '@/actions/auth'

interface SidebarProps {
  role: 'ADMIN' | 'KASIR'
  userName: string
  branchName: string | null
  shopName: string
  mobileOpen?: boolean
  onMobileClose?: () => void
  collapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
}

const kasirMenuItems = [
  { href: '/kasir', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kasir/transaksi', label: 'Transaksi', icon: Receipt },
  { href: '/kasir/pelanggan', label: 'Pelanggan', icon: Users },
  { href: '/kasir/laporan', label: 'Laporan', icon: BarChart3 },
  { href: '/kasir/reminder', label: 'Reminder', icon: BellRing },
  { href: '/kasir/jasa-servis', label: 'Jasa Servis', icon: Wrench },
  { href: '/kasir/sparepart', label: 'Sparepart', icon: Package },
  { href: '/kasir/restock', label: 'Barang Masuk', icon: PackagePlus },
  { href: '/kasir/stock-toko', label: 'Stock Toko', icon: Store },
  { href: '/kasir/stock-gudang', label: 'Stock Gudang', icon: Warehouse },
  { href: '/kasir/indent', label: 'Barang Indent', icon: ClipboardList },
  { href: '/kasir/korporat', label: 'Korporat', icon: Briefcase },
  { href: '/kasir/mekanik', label: 'Mekanik', icon: Users },
]

const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/transaksi', label: 'Transaksi', icon: Receipt },
  { href: '/admin/pelanggan', label: 'Pelanggan', icon: Users },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
  { href: '/admin/reminder', label: 'Reminder', icon: BellRing },
  { href: '/admin/master/services', label: 'Jasa Servis', icon: Wrench },
  { href: '/admin/master/spareparts', label: 'Sparepart', icon: Package },
  { href: '/admin/restock', label: 'Barang Masuk', icon: PackagePlus },
  { href: '/admin/stock-toko', label: 'Stock Toko', icon: Store },
  { href: '/admin/stock-gudang', label: 'Stock Gudang', icon: Warehouse },
  { href: '/admin/indent', label: 'Barang Indent', icon: ClipboardList },
  { href: '/admin/korporat', label: 'Korporat', icon: Briefcase },
  { href: '/admin/master/mechanics', label: 'Mekanik', icon: Users },
  { href: '/admin/cabang', label: 'Cabang', icon: Building2 },
  { href: '/admin/users', label: 'Pengguna', icon: UserCog },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar({ role, userName, branchName, shopName, mobileOpen = false, onMobileClose, collapsed = false, onCollapseChange }: SidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = role === 'ADMIN' && !branchName
  const menuItems = role === 'ADMIN'
    ? adminMenuItems.filter(item => {
        if (['Cabang', 'Pengguna', 'Pengaturan'].includes(item.label)) {
          return isSuperAdmin
        }
        return true
      })
    : kasirMenuItems

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileOpen && onMobileClose) {
        onMobileClose()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileOpen, onMobileClose])

  const isActive = (href: string) => {
    if (href === '/kasir' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleCollapseToggle = () => {
    if (onCollapseChange) {
      onCollapseChange(!collapsed)
    }
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
          'fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-sidebar-text flex flex-col transition-all duration-300 shadow-2xl',
          // Desktop: always visible
          'lg:z-40',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          // Mobile: off-screen by default, slide in when open
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
          'lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/5 shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl shrink-0 shadow-lg shadow-blue-500/25">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden animate-fade-in">
                <h1 className="text-sm font-bold text-white truncate">
                  {shopName}
                </h1>
                <p className="text-xs text-blue-400/80 truncate">
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
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/70">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                )}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-transform duration-200',
                    active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400',
                    !active && 'group-hover:scale-110'
                  )}
                />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Collapse */}
        <div className="border-t border-white/5 p-3 space-y-2 shrink-0 bg-slate-950/30">
          {/* User — klik untuk ke halaman profil */}
          <Link
            href="/profil"
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200',
              collapsed && !mobileOpen && 'justify-center px-0'
            )}
            title="Profil & Keamanan"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              {userName.charAt(0).toUpperCase()}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {role === 'ADMIN' ? 'Administrator' : 'Kasir'}
                </p>
              </div>
            )}
          </Link>

          {/* Logout */}
          <form action={logout}>
            <button
              type="submit"
              className={cn(
                'group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200',
                collapsed && !mobileOpen && 'justify-center'
              )}
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" />
              {(!collapsed || mobileOpen) && <span className="font-medium">Keluar</span>}
            </button>
          </form>

          {/* Collapse Toggle — only show on desktop */}
          <button
            onClick={handleCollapseToggle}
            className={cn(
              'hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-800/40 hover:text-slate-300 transition-all duration-200',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4.5 h-4.5" />
            ) : (
              <>
                <ChevronLeft className="w-4.5 h-4.5" />
                <span className="font-medium">Kecilkan</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
