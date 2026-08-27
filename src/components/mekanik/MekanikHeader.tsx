'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wrench, FileText, PlusCircle, LogOut, Store, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { logout } from '@/actions/auth'

interface MekanikHeaderProps {
  userName: string
  userRole: string
  branchName: string | null
  shopName: string
  isDemo?: boolean
}

export default function MekanikHeader({
  userName,
  userRole,
  branchName,
  shopName,
  isDemo,
}: MekanikHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6">
          <Link href="/mekanik" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200 transition-transform group-hover:scale-105">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  {shopName}
                </span>
                <Badge variant="purple" size="sm" className="hidden sm:inline-flex">
                  Service Advisor
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {branchName || 'Semua Cabang'}
              </p>
            </div>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
            <Link
              href="/mekanik"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                pathname === '/mekanik'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Daftar Memo
            </Link>
            <Link
              href="/mekanik/baru"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                pathname === '/mekanik/baru'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Buat Memo Baru
            </Link>
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {userRole === 'ADMIN' && (
            <Link href="/admin">
              <Button size="sm" variant="ghost" icon={ArrowLeft} className="text-xs">
                Kembali ke Admin
              </Button>
            </Link>
          )}
          {userRole === 'KASIR' && (
            <Link href="/kasir">
              <Button size="sm" variant="ghost" icon={ArrowLeft} className="text-xs">
                Kembali ke Kasir
              </Button>
            </Link>
          )}

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{userName}</p>
            <p className="text-xs text-slate-400 capitalize">{userRole.toLowerCase()}</p>
          </div>

          <form action={logout}>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              icon={LogOut}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
