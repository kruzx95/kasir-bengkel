'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { updateOwnProfile, changeOwnPassword } from '@/actions/user'
import { User, Lock, CheckCircle, AlertTriangle, Shield, Store } from 'lucide-react'

interface ProfilClientProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    branch: { name: string } | null
  }
}

export default function ProfilClient({ user }: ProfilClientProps) {
  const router = useRouter()
  const [isPendingProfile, startProfile] = useTransition()
  const [isPendingPassword, startPassword] = useTransition()

  // Profile form
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    startProfile(async () => {
      const res = await updateOwnProfile({ name, email })
      setProfileMsg({ ok: !!res.success, text: res.message || (res.success ? 'Berhasil' : 'Gagal') })
      if (res.success) router.refresh()
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: 'Password baru minimal 6 karakter' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Konfirmasi password tidak cocok' })
      return
    }

    startPassword(async () => {
      const res = await changeOwnPassword({ currentPassword, newPassword })
      setPasswordMsg({ ok: !!res.success, text: res.message || (res.success ? 'Berhasil' : 'Gagal') })
      if (res.success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    })
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Info Akun */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
            user.role === 'ADMIN'
              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
              : 'bg-gradient-to-br from-primary-400 to-primary-600'
          }`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {user.role === 'ADMIN'
                ? <><Shield className="w-3.5 h-3.5 text-amber-500" /><span className="text-xs text-amber-600 font-medium">Administrator</span></>
                : <><Store className="w-3.5 h-3.5 text-primary-500" /><span className="text-xs text-primary-600 font-medium">Kasir — {user.branch?.name}</span></>
              }
            </div>
          </div>
        </div>

        {/* Edit Profil */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-slate-400" /> Informasi Akun
          </h3>

          <Input
            label="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email Login"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {profileMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
              profileMsg.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {profileMsg.ok
                ? <CheckCircle className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />
              }
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={isPendingProfile}>
              Simpan Profil
            </Button>
          </div>
        </form>
      </div>

      {/* Ganti Password */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-slate-400" /> Ganti Password
          </h3>

          <Input
            label="Password Saat Ini"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Masukkan password yang sekarang"
          />
          <Input
            label="Password Baru"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Minimal 6 karakter"
            hint="Minimal 6 karakter"
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Ulangi password baru"
          />

          {passwordMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
              passwordMsg.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {passwordMsg.ok
                ? <CheckCircle className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />
              }
              {passwordMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={isPendingPassword} icon={Lock}>
              Ganti Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
