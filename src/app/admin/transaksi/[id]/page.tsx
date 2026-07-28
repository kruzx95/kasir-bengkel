import { getTransactionDetails } from '@/actions/transaction'
import { getShopName } from '@/actions/settings'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Receipt, MapPin, Phone, User, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import PrintButton from './PrintButton'
import CancelButton from './CancelButton'
import { getSession } from '@/lib/session'

// Simple WhatsApp icon
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const tx = await getTransactionDetails(resolvedParams.id)
  const session = await getSession()
  const shopName = await getShopName()

  if (!tx) notFound()

  const backHref = session?.role === 'KASIR' ? '/kasir/transaksi' : '/admin/transaksi'

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Actions - Hide when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 print:hidden">
        <Link href={backHref}>
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
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{shopName}</h1>
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
              <span>
                {new Date(tx.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' • '}
                {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
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
        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ditagihkan Kepada</p>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-base font-bold text-slate-900">{tx.customer?.name || 'Pelanggan Umum'}</p>
              </div>
              {tx.customer?.phone && <p className="text-sm text-slate-600 ml-6">{tx.customer.phone}</p>}
            </div>
            
            {tx.customer?.vehicleType && (
              <div className="sm:text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kendaraan</p>
                <p className="text-sm font-medium text-slate-900">{tx.customer.vehicleType}</p>
                {tx.customer.plateNumber && <p className="text-sm text-slate-600 font-mono">{tx.customer.plateNumber}</p>}
              </div>
            )}
          </div>

          {/* Odometer Section */}
          {(tx.odometer || tx.odometerHistory?.length > 0) && (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Riwayat Odometer</p>
              <div className="space-y-2">
                {tx.odometer && (
                  <div className="flex items-center justify-between text-sm bg-primary-50 px-3 py-2 rounded-lg border border-primary-100">
                    <span className="font-semibold text-primary-900">Kunjungan Ini</span>
                    <span className="font-bold text-primary-700">{tx.odometer.toLocaleString('id-ID')} km</span>
                  </div>
                )}
                {tx.odometerHistory?.map((history: { date: Date; odometer: number; invoiceNumber: string }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm text-slate-600 px-3 py-2">
                    <span className="text-xs">
                      {new Date(history.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-mono font-medium">{history.odometer.toLocaleString('id-ID')} km</span>
                  </div>
                ))}
              </div>
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
            {tx.items.map((item) => (
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
                <p className="text-sm text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 italic">&quot;{tx.notes}&quot;</p>
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

          {/* Social Media — only shown if at least one field is filled */}
          {(tx.branch.instagramHandle || tx.branch.facebookPage || tx.branch.whatsappNumber) && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
              {tx.branch.instagramHandle && (
                <a
                  href={`https://instagram.com/${tx.branch.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-pink-600 hover:text-pink-700 transition-colors print:text-slate-600 print:no-underline"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  @{tx.branch.instagramHandle}
                </a>
              )}
              {tx.branch.facebookPage && (
                <a
                  href={`https://facebook.com/${tx.branch.facebookPage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors print:text-slate-600 print:no-underline"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                  {tx.branch.facebookPage}
                </a>
              )}
              {tx.branch.whatsappNumber && (
                <a
                  href={`https://wa.me/${tx.branch.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors print:text-slate-600 print:no-underline"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  {tx.branch.whatsappNumber}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
