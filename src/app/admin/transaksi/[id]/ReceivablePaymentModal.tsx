'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { payTransactionReceivable } from '@/actions/transaction'
import { CreditCard, Banknote, QrCode, AlertCircle, CheckCircle2, Clock, Handshake } from 'lucide-react'

interface ReceivablePaymentModalProps {
  transactionId: string
  invoiceNumber: string
  total: number
  paidAmount: number
  customerName?: string
}

export default function ReceivablePaymentModal({
  transactionId,
  invoiceNumber,
  total,
  paidAmount,
  customerName,
}: ReceivablePaymentModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const remainingDebt = Math.max(0, total - paidAmount)

  const [amount, setAmount] = useState<number | ''>(remainingDebt)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleOpen = () => {
    setAmount(remainingDebt)
    setPaymentMethod('CASH')
    setNotes('')
    setError(null)
    setSuccessMsg(null)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const payNum = typeof amount === 'number' ? amount : 0
    if (payNum <= 0) {
      setError('Nominal pembayaran harus lebih besar dari Rp 0.')
      return
    }

    if (payNum > remainingDebt) {
      setError(`Nominal pembayaran (${formatCurrency(payNum)}) tidak boleh melebihi sisa piutang (${formatCurrency(remainingDebt)}).`)
      return
    }

    startTransition(async () => {
      const res = await payTransactionReceivable(transactionId, payNum, paymentMethod, notes)
      if (res.success) {
        setSuccessMsg(res.message)
        setTimeout(() => {
          setOpen(false)
          router.refresh()
        }, 1200)
      } else {
        setError(res.message || 'Gagal memproses pembayaran piutang.')
      }
    })
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        icon={Handshake}
        className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-semibold"
      >
        Bayar / Lunasi Piutang
      </Button>

      <Modal
        open={open}
        onClose={() => !isPending && setOpen(false)}
        title="Pembayaran / Pelunasan Piutang"
        description={`Pencatatan pembayaran piutang untuk nota ${invoiceNumber}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Info Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>No. Invoice:</span>
              <span className="font-mono font-bold text-slate-800">{invoiceNumber}</span>
            </div>
            {customerName && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Pelanggan:</span>
                <span className="font-semibold text-slate-800">{customerName}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-500">
              <span>Total Transaksi:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Sudah Dibayar:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold">
              <span className="text-amber-800 flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-600" /> Sisa Piutang:
              </span>
              <span className="text-amber-600 font-black">{formatCurrency(remainingDebt)}</span>
            </div>
          </div>

          {/* Input Nominal Pembayaran */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Nominal Pembayaran (Rp) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(remainingDebt)}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline"
              >
                Bayar Lunas ({formatCurrency(remainingDebt)})
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={remainingDebt}
              placeholder="Masukkan nominal bayar..."
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />

            {/* Tombol Cepat Nominal */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[50000, 100000, 200000, 500000]
                .filter((v) => v < remainingDebt)
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    Rp {v.toLocaleString('id-ID')}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => setAmount(remainingDebt)}
                className="text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
              >
                Lunas ({formatCurrency(remainingDebt)})
              </button>
            </div>
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'CASH', label: 'Tunai', icon: Banknote },
                { key: 'TRANSFER', label: 'Transfer Bank', icon: CreditCard },
                { key: 'QRIS', label: 'QRIS', icon: QrCode },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaymentMethod(key as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === key
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-600" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Catatan Pembayaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Catatan Pembayaran (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Cicilan ke-2, titip lewat sopir, dll"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Kalkulasi Akhir Box */}
          {typeof amount === 'number' && amount > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex justify-between items-center font-medium text-amber-900">
              <span>Sisa Piutang Setelah Pembayaran:</span>
              <span className="font-bold text-sm">
                {amount >= remainingDebt ? (
                  <span className="text-emerald-700 font-black uppercase">Lunas (Rp 0)</span>
                ) : (
                  formatCurrency(remainingDebt - amount)
                )}
              </span>
            </div>
          )}

          <ModalFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={typeof amount !== 'number' || amount <= 0 || amount > remainingDebt}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Simpan Pembayaran
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
