'use client'

import { useState, useTransition } from 'react'
import { logout } from '@/actions/auth'
import { Eye, LogOut, Loader2, ShieldCheck } from 'lucide-react'

interface DemoBannerProps {
  role?: 'ADMIN' | 'KASIR' | 'MEKANIK'
}

export default function DemoBanner({ role = 'KASIR' }: DemoBannerProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-primary-500/10 border border-emerald-300/80 p-3 sm:p-3.5 shadow-xs backdrop-blur-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-600/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mode Demo Kasir (Read-Only)
              </span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Data Simulasi Dummy
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Anda sedang menjelajahi antarmuka kasir bengkel. Sistem dalam mode <strong>Hanya Baca</strong> (pembuatan & pengubahan data dinonaktifkan demi keamanan).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Keluar dari akun demo"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Keluar Demo</span>
          </button>
        </div>
      </div>
    </div>
  )
}
