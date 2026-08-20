'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { updateShopName, updateWaReminderTemplate } from '@/actions/settings'
import { DEFAULT_WA_TEMPLATE } from '@/lib/constants'
import {
  CheckCircle,
  AlertTriangle,
  Store,
  MessageSquare,
  Sparkles,
  RotateCcw,
  Smartphone,
  Info,
} from 'lucide-react'

interface PengaturanClientProps {
  shopName: string
  initialWaTemplate: string
}

export default function PengaturanClient({ shopName, initialWaTemplate }: PengaturanClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Shop Name State
  const [name, setName] = useState(shopName)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // WhatsApp Template State
  const [waTemplate, setWaTemplate] = useState(initialWaTemplate)
  const [waMsg, setWaMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleSaveShopName = (e: React.FormEvent) => {
    e.preventDefault()
    setNameMsg(null)
    startTransition(async () => {
      const res = await updateShopName(name)
      setNameMsg({ ok: !!res.success, text: res.message || '' })
      if (res.success) router.refresh()
    })
  }

  const handleSaveWaTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    setWaMsg(null)
    startTransition(async () => {
      const res = await updateWaReminderTemplate(waTemplate)
      setWaMsg({ ok: !!res.success, text: res.message || '' })
      if (res.success) router.refresh()
    })
  }

  const handleInsertTag = (tag: string) => {
    setWaTemplate((prev) => prev + ' ' + tag)
  }

  const handleResetWaDefault = () => {
    if (!confirm('Kembalikan template pesan WhatsApp ke format default bawaan sistem?')) return
    setWaTemplate(DEFAULT_WA_TEMPLATE)
  }

  // Live preview message calculation
  const sampleDateStr = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  
  const livePreviewText = waTemplate
    .replaceAll('{nama_pelanggan}', 'Hendra Wijaya')
    .replaceAll('{nama_toko}', name || 'MULYA LESTARI')
    .replaceAll('{kendaraan}', 'Honda Vario 125 CBS')
    .replaceAll('{plat_nomor}', 'B 4567 XYZ')
    .replaceAll('{tanggal_servis}', sampleDateStr)
    .replaceAll('{bulan_telat}', '3')

  return (
    <div className="max-w-5xl space-y-8">
      {/* 1. Identitas Toko */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
          <Store className="w-5 h-5 text-primary-600" />
          Identitas Toko & Bengkel
        </h2>

        <form onSubmit={handleSaveShopName} className="space-y-4 max-w-xl">
          <Input
            label="Nama Bengkel / Toko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Bengkel Mulya Lestari"
            hint="Ditampilkan di sidebar, halaman login, nota transaksi, kop surat, dan pesan WhatsApp"
            required
          />

          {nameMsg && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
                nameMsg.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {nameMsg.ok ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {nameMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              Simpan Nama Toko
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Template Pesan WhatsApp Reminder */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Template Pesan WhatsApp Reminder Servis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format pesan otomatis yang dikirim ke pelanggan saat tombol &quot;Hubungi via WA&quot; ditekan
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetWaDefault}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Default
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Form Editor */}
          <form onSubmit={handleSaveWaTemplate} className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Format Teks Pesan
              </label>
              <textarea
                rows={9}
                value={waTemplate}
                onChange={(e) => setWaTemplate(e.target.value)}
                placeholder="Ketik template pesan di sini..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-sans leading-relaxed"
                required
              />
            </div>

            {/* Tombol Sisipkan Variabel Tag */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Klik variabel di bawah untuk menyisipkan ke pesan:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{nama_pelanggan}', label: 'Nama Pelanggan' },
                  { tag: '{nama_toko}', label: 'Nama Bengkel' },
                  { tag: '{kendaraan}', label: 'Merek/Tipe Motor' },
                  { tag: '{plat_nomor}', label: 'Plat Nomor' },
                  { tag: '{tanggal_servis}', label: 'Tgl Servis Terakhir' },
                  { tag: '{bulan_telat}', label: 'Jumlah Bulan' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all"
                  >
                    + {item.tag}
                  </button>
                ))}
              </div>
            </div>

            {waMsg && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
                  waMsg.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {waMsg.ok ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {waMsg.text}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                Simpan Template WhatsApp
              </Button>
            </div>
          </form>

          {/* Kolom Kanan: Pratinjau Chat WhatsApp */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-slate-400" />
              Pratinjau Tampilan Chat WhatsApp
            </label>

            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-300/80 shadow-inner flex flex-col justify-between min-h-[280px]">
              {/* WhatsApp Chat Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs text-slate-800 space-y-2 max-w-[95%] border border-slate-100">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {livePreviewText}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-mono">
                  <span>10:30</span>
                  <span className="text-sky-500 font-bold">✓✓</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/80 backdrop-blur-xs p-2 rounded-xl border border-slate-200 mt-4">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Format tebal diapit tanda bintang <strong className="font-mono text-slate-800">*teks*</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
