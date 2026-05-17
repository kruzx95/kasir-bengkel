import { getTransactionDetails } from '@/actions/transaction'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Printer, Receipt, MapPin, Phone, User, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PrintButton from './PrintButton'
import CancelButton from './CancelButton'
import { getSession } from '@/lib/session'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const tx = await getTransactionDetails(resolvedParams.id)
  const session = await getSession()

  if (!tx) {
    notFound()
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SERVICE': return <Badge variant="primary" size="sm">Servis</Badge>
      case 'SPAREPART': return <Badge variant="warning" size="sm">Sparepart</Badge>
      case 'MIXED': return <Badge variant="success" size="sm">Servis & Part</Badge>
      default: return <Badge variant="default" size="sm">{type}</Badge>
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Actions - Hide when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 print:hidden">
        <Link href="/kasir/transaksi">
          <Button variant="ghost" icon={ArrowLeft}>Kembali</Button>
        </Link>
        <div className="flex items-center gap-2">
          {session?.role === 'ADMIN' && tx.status !== 'CANCELLED' && (
            <CancelButton id={tx.id} invoiceNumber={tx.invoiceNumber} />
          )}
          <PrintButton />
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white p-5 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-slate-200 pb-6 sm:pb-8 mb-6 sm:mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Irian Motor</h1>
                <p className="text-sm text-slate-500 font-medium">Cabang {tx.branch.name}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600 space-y-1 mt-4">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {tx.branch.address}</p>
              {tx.branch.phone && (
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {tx.branch.phone}</p>
              )}
            </div>
          </div>
          
          <div className="sm:text-right">
            <div className="flex sm:justify-end gap-2 mb-2">
              {tx.status === 'CANCELLED' && (
                <span className="px-3 py-1 bg-red-100 text-red-600 font-black text-sm rounded-lg tracking-widest border border-red-200 uppercase">
                  Dibatalkan
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-200 uppercase tracking-wider">INVOICE</h2>
            </div>
            <p className="text-lg font-bold text-slate-900 font-mono mb-2">{tx.invoiceNumber}</p>
            <div className="flex items-center sm:justify-end gap-2 text-sm text-slate-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(tx.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <p className="text-sm text-slate-500">
              Kasir: <span className="font-medium text-slate-700">{tx.user.name}</span>
            </p>
            {tx.mechanic && (
              <p className="text-sm text-slate-500 mt-1">
                Mekanik: <span className="font-medium text-slate-700">{tx.mechanic.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ditagihkan Kepada</p>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-slate-400" />
              <p className="text-base font-bold text-slate-900">{tx.customer?.name || 'Pelanggan Umum'}</p>
            </div>
            {tx.customer?.phone && <p className="text-sm text-slate-600 ml-6">{tx.customer.phone}</p>}
          </div>
          
          {tx.customer?.vehicleType && (
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kendaraan</p>
              <p className="text-sm font-medium text-slate-900">{tx.customer.vehicleType}</p>
              {tx.customer.plateNumber && <p className="text-sm text-slate-600 font-mono">{tx.customer.plateNumber}</p>}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6 sm:mb-8">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 text-sm font-semibold text-slate-500 w-1/2">Deskripsi Item</th>
              <th className="text-center py-3 text-sm font-semibold text-slate-500">Qty</th>
              <th className="text-right py-3 text-sm font-semibold text-slate-500">Harga Satuan</th>
              <th className="text-right py-3 text-sm font-semibold text-slate-500">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tx.items.map((item, index) => (
              <tr key={item.id} className="group">
                <td className="py-4">
                  <p className="text-sm font-semibold text-slate-900">{item.itemName}</p>
                  <p className="text-xs text-slate-400">{item.itemType === 'SERVICE' ? 'Jasa Servis' : 'Sparepart'}</p>
                </td>
                <td className="text-center py-4 text-sm text-slate-700">{item.quantity}</td>
                <td className="text-right py-4 text-sm text-slate-700">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right py-4 text-sm font-semibold text-slate-900">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pt-6 border-t border-slate-200 gap-6">
          <div className="sm:w-1/2 sm:pr-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Metode Pembayaran</p>
            <p className="text-sm font-bold text-slate-900 mb-6">{tx.paymentMethod}</p>
            
            {tx.notes && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Catatan</p>
                <p className="text-sm text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 italic">"{tx.notes}"</p>
              </>
            )}
          </div>
          
          <div className="sm:w-1/2 space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(tx.subtotal)}</span>
            </div>
            {tx.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Diskon</span>
                <span>-{formatCurrency(tx.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
              <span className="text-base font-bold text-slate-900">Total Akhir</span>
              <span className="text-2xl font-black text-primary-600">{formatCurrency(tx.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-900 mb-1">Terima kasih atas kunjungan Anda!</p>
          <p className="text-xs text-slate-500">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
        </div>
      </div>
    </div>
  )
}
