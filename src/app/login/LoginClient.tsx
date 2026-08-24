'use client'

import { login } from '@/actions/auth'
import { useActionState, useState } from 'react'
import {
  Wrench,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

export default function LoginClient({ shopName }: { shopName: string }) {
  const [state, action, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-slate-50 overflow-hidden font-sans selection:bg-primary-500 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-linear-to-br from-primary-200/40 via-blue-100/30 to-transparent blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-linear-to-tl from-accent-200/40 via-emerald-100/30 to-transparent blur-3xl" />
        <div className="absolute top-[30%] right-[15%] w-[35%] h-[35%] rounded-full bg-primary-100/25 blur-3xl" />

        {/* Decorative Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#1e3a8a 1px, transparent 1px)`,
            backgroundSize: `24px 24px`,
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-primary-600 to-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20 text-white">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-lg block leading-tight">
              {shopName}
            </span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Sistem Informasi Bengkel
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-xs text-xs font-medium text-slate-600 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Akses Terenkripsi & Aman</span>
        </div>
      </header>

      {/* Main Login Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg animate-fade-in space-y-6">
          {/* Card Container */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-300/40 p-6 sm:p-9 transition-all duration-300">
            {/* Header Text inside Card */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang Kembali</h1>
              <p className="text-sm text-slate-500 mt-1">
                Masukkan email dan password akun Anda untuk masuk
              </p>
            </div>

            {/* Error Message Alert */}
            {state?.message && (
              <div className="mb-6 p-4 bg-red-50/90 border border-red-200/80 rounded-2xl text-sm text-red-700 animate-fade-in flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p className="font-medium leading-relaxed">{state.message}</p>
              </div>
            )}

            {/* Standard Login Form */}
            <form action={action} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@bengkel.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/15 outline-none font-medium"
                  />
                </div>
                {state?.errors?.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{state.errors.email[0]}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/15 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {state?.errors?.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{state.errors.password[0]}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={pending}
                className="w-full py-3 px-4 bg-linear-to-r from-primary-600 via-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-primary-600/25 hover:shadow-primary-600/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {pending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Memproses Masuk...
                  </span>
                ) : (
                  <span>Masuk ke Akun</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center">
        <p className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-700">{shopName}</span>. Hak Cipta Dilindungi Undang-Undang.
        </p>
      </footer>
    </div>
  )
}

