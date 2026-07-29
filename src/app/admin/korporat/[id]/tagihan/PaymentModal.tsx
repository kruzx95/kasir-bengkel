'use client'

import { useState, useMemo } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createCorporatePayment, type CreatePaymentInput, type PaymentResult } from '@/actions/corporate'
import { formatCurrency } from '@/lib/utils'
import { X, Plus, Minus, Wallet } from 'lucide-react'

interface TransactionItem {
  id: string
  invoiceNumber: string
  transactionDate: string | Date
  customerName: string
  plateNumber: string | null
  total: number
  paidAmount: number
  remaining: number
  items: { itemName: string; itemType: string; quantity: number; unitPrice: number; subtotal: number }[]
}

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  corporateCustomerId: string
  corporateName: string
  transactions: TransactionItem[]
  onPaymentSuccess: () => void
}

export default function PaymentModal({
  open,
  onClose,
  corporateCustomerId,
  corporateName,
  transactions,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Payment fields
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH')
  const [notes, setNotes] = useState('')
  const [periodStart, setPeriodStart] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  const [periodEnd, setPeriodEnd] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })

  // Allocations: { transactionId: amount }
  const [allocations, setAllocations] = useState<Record<string, number>>({})

  // Reset state when modal closes
  const handleModalClose = () => {
    setResult(null)
    setError(null)
    setAmount('')
    setNotes('')
    setAllocations({})
    onClose()
  }

  // Auto-calculate total from allocations
  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((acc, v) => acc + (v || 0), 0)
  }, [allocations])

  // Total remaining across all transactions
  const totalRemaining = useMemo(() => {
    return transactions.reduce((acc, t) => acc + t.remaining, 0)
  }, [transactions])

  // Auto-allocate FIFO when amount changes
  const handleAmountChange = (val: string) => {
    setAmount(val)
    // Auto-allocate FIFO
    const numVal = parseFloat(val.replace(/[^0-9]/g, '')) || 0
    if (numVal <= 0) {
      setAllocations({})
      return
    }

    let remaining = numVal
    const newAllocations: Record<string, number> = {}

    // Sort transactions by date (oldest first) for FIFO
    const sorted = [...transactions].sort((a, b) =>
      new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    )

    for (const tx of sorted) {
      if (remaining <= 0) break
      const txRemaining = tx.remaining
      const alloc = Math.min(remaining, txRemaining)
      if (alloc > 0) {
        newAllocations[tx.id] = alloc
        remaining -= alloc
      }
    }

    // If amount exceeds total remaining, cap at total remaining
    if (numVal > totalRemaining && totalRemaining > 0) {
      setAmount(formatCurrencyInput(totalRemaining))
      handleAmountChange(formatCurrencyInput(totalRemaining))
      return
    }

    setAllocations(newAllocations)
  }

  const formatCurrencyInput = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const handleAllocChange = (txId: string, val: string) => {
    const numVal = parseFloat(val.replace(/[^0-9]/g, '')) || 0
    setAllocations(prev => ({
      ...prev,
      [txId]: Math.min(numVal, transactions.find(t => t.id === txId)?.remaining || 0),
    }))
  }

  const handleSubmit = async () => {
    setError(null)
    setResult(null)

    if (totalAllocated <= 0) {
      setError('Nominal pembayaran minimal harus ada')
      return
    }

    const allocList = Object.entries(allocations)
      .filter(([, v]) => v > 0)
      .map(([transactionId, amount]) => ({ transactionId, amount }))

    if (allocList.length === 0) {
      setError('Pilih minimal satu transaksi untuk dialokasikan')
      return
    }

    const input: CreatePaymentInput = {
      corporateCustomerId,
      amount: totalAllocated,
      paymentMethod,
      notes: notes || undefined,
      periodStart,
      periodEnd,
      allocations: allocList,
    }

    setIsSubmitting(true)
    const res = await createCorporatePayment(input)
    setIsSubmitting(false)

    if (res.success) {
      setResult(res)
      setTimeout(() => {
        onClose()
        onPaymentSuccess()
      }, 1500)
    } else {
      setError(res.message || 'Gagal mencatat pembayaran')
    }
  }

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) =>
      new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    )
  }, [transactions])

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      title="Pembayaran Korporat"
      description={`Catat pembayaran untuk ${corporateName}`}
      size="xl"
    >
      {result?.success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <p className="font-semibold">{result.message}</p>
          {result.paymentId && (
            <p className="text-xs mt-1 opacity-70">ID: {result.paymentId}</p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Period */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Periode Mulai"
            type="date"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            required
          />
          <Input
            label="Periode Akhir"
            type="date"
            value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)}
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nominal Pembayaran
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="0"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              className="pl-9 pr-4 font-bold text-lg"
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>Total piutang tersedia: {formatCurrency(totalRemaining)}</span>
            <span>Alokasi: {formatCurrency(totalAllocated)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Metode Pembayaran
          </label>
          <Select
            options={[
              { value: 'CASH', label: 'Tunai' },
              { value: 'TRANSFER', label: 'Transfer Bank' },
              { value: 'QRIS', label: 'QRIS' },
            ]}
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value as 'CASH' | 'TRANSFER' | 'QRIS')}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Catatan (Opsional)
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
            placeholder="Catatan tambahan..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Allocation Table */}
        {sortedTransactions.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-700">Alokasi ke Transaksi</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Alokasi otomatis FIFO (transaksi terlama dulu). Bisa diubah manual.
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Invoice</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Kendaraan</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Total</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Sudah Dibayar</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Sisa</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Alokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-900">{tx.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(tx.transactionDate).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs font-medium text-slate-900">{tx.customerName}</p>
                        {tx.plateNumber && (
                          <p className="text-[10px] text-slate-400 font-mono">{tx.plateNumber}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                        {formatCurrency(tx.total)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-emerald-600">
                        {formatCurrency(tx.paidAmount)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-red-600">
                        {formatCurrency(tx.remaining)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="relative">
                          <input
                            type="text"
                            className="w-28 text-right text-xs border border-slate-300 rounded px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
                            value={allocations[tx.id] ? formatCurrencyInput(allocations[tx.id]) : ''}
                            onChange={e => handleAllocChange(tx.id, e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleModalClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={totalAllocated <= 0}
          icon={result?.success ? undefined : Plus}
        >
          {result?.success ? 'Berhasil!' : isSubmitting ? 'Menyimpan...' : `Bayar ${formatCurrency(totalAllocated)}`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}