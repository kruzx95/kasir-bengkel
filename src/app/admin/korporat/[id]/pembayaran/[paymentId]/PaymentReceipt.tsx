'use client'

import { formatCurrency } from '@/lib/utils'
import { Printer } from 'lucide-react'
import Button from '@/components/ui/Button'

interface PaymentReceiptProps {
  payment: {
    id: string
    amount: number
    paymentMethod: string
    notes: string | null
    paidAt: Date
    periodStart: Date
    periodEnd: Date
    voidedAt: Date | null
    voidReason: string | null
    branch: {
      id: string
      name: string
      address: string | null
      phone: string | null
    }
    corporateCustomer: {
      id: string
      name: string
      contactPerson: string | null
      contactPhone: string | null
    }
    createdBy: {
      id: string
      name: string
    }
    voidedBy: {
      id: string
      name: string
    } | null
    transactionLinks: Array<{
      transactionId: string
      amount: number
      transaction: {
        id: string
        invoiceNumber: string
        transactionDate: Date
        total: number
        paidAmount: number
        status: string
        customer: {
          name: string
          plateNumber: string | null
        } | null
        items: Array<{
          itemName: string
          itemType: string
          quantity: number
          unitPrice: number
          subtotal: number
        }>
      }
    }>
  }
}

export default function PaymentReceipt({ payment }: PaymentReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  const isVoided = payment.voidedAt !== null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Action Button (hidden on print) */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button icon={Printer} onClick={handlePrint}>
          Cetak Bukti
        </Button>
      </div>

      {/* Receipt Content */}
      <div className="bg-white p-8 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase text-center mb-1">Bukti Pembayaran Korporat</h1>
          <p className="text-center text-sm text-slate-500">
            {payment.branch.name}
            {payment.branch.address && <span className="block text-xs mt-0.5">{payment.branch.address}</span>}
            {payment.branch.phone && <span className="block text-xs">Telp: {payment.branch.phone}</span>}
          </p>
        </div>

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">No. Pembayaran</p>
            <p className="font-mono font-bold text-slate-900">{payment.id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tanggal Bayar</p>
            <p className="font-bold text-slate-900">
              {new Date(payment.paidAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Periode</p>
            <p className="font-bold text-slate-900">
              {new Date(payment.periodStart).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} —{' '}
              {new Date(payment.periodEnd).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Metode Bayar</p>
            <p className="font-bold text-slate-900">{payment.paymentMethod}</p>
          </div>
        </div>

        {/* Corporate Info */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Perusahaan</p>
          <p className="font-bold text-lg text-slate-900">{payment.corporateCustomer.name}</p>
          {payment.corporateCustomer.contactPerson && (
            <p className="text-sm text-slate-600">
              PIC: {payment.corporateCustomer.contactPerson}
              {payment.corporateCustomer.contactPhone && ` — ${payment.corporateCustomer.contactPhone}`}
            </p>
          )}
        </div>

        {/* Voided Stamp */}
        {isVoided && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-lg font-bold text-red-600 uppercase">Dibatalkan</p>
            <p className="text-sm text-red-600 mt-1">
              Dibatalkan oleh {payment.voidedBy?.name} — {payment.voidReason}
            </p>
          </div>
        )}

        {/* Transaction Table */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-2 px-2 font-semibold text-slate-600">Invoice</th>
              <th className="text-left py-2 px-2 font-semibold text-slate-600">Kendaraan</th>
              <th className="text-right py-2 px-2 font-semibold text-slate-600">Total Transaksi</th>
              <th className="text-right py-2 px-2 font-semibold text-slate-600">Dialokasikan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payment.transactionLinks.map((link) => (
              <tr key={link.transactionId}>
                <td className="py-2 px-2">
                  <p className="font-mono text-xs font-bold text-slate-900">{link.transaction.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(link.transaction.transactionDate).toLocaleDateString('id-ID')}
                  </p>
                </td>
                <td className="py-2 px-2">
                  <p className="text-xs font-medium text-slate-900">{link.transaction.customer?.name || '—'}</p>
                  {link.transaction.customer?.plateNumber && (
                    <p className="text-[10px] text-slate-400 font-mono">{link.transaction.customer.plateNumber}</p>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-xs font-semibold text-slate-700">
                  {formatCurrency(link.transaction.total)}
                </td>
                <td className="py-2 px-2 text-right text-xs font-bold text-emerald-600">
                  {formatCurrency(link.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">{payment.transactionLinks.length} transaksi dilunasi</p>
            {payment.notes && <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Pembayaran</p>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(payment.amount)}</p>
          </div>
        </div>

        {/* Created By */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <p>Dibuat oleh {payment.createdBy.name}</p>
          <p className="print:hidden">
            {new Date(payment.paidAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Print Button (bottom) */}
      <div className="flex justify-center mt-4 print:hidden">
        <Button icon={Printer} onClick={handlePrint}>
          Cetak Bukti
        </Button>
      </div>
    </div>
  )
}