'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { updateShopName } from '@/actions/settings'
import { CheckCircle, AlertTriangle, Store } from 'lucide-react'

export default function PengaturanClient({ shopName }: { shopName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(shopName)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const res = await updateShopName(name)
      setMsg({ ok: !!res.success, text: res.message || '' })
      if (res.success) router.refresh()
    })
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Store className="w-4 h-4 text-slate-400" />
          Identitas Toko
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Toko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Bengkel Maju Jaya"
            hint="Ditampilkan di sidebar, halaman login, dan nota transaksi"
            required
          />

          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
              msg.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {msg.ok
                ? <CheckCircle className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />
              }
              {msg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
