import Header from '@/components/layout/Header'
import { getTransactions } from '@/actions/transaction'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Receipt, Eye } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Semua Transaksi',
}

export default async function AdminTransaksiPage() {
  const transactions = await getTransactions()

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SERVICE': return <Badge variant="primary" size="sm">Servis</Badge>
      case 'SPAREPART': return <Badge variant="warning" size="sm">Sparepart</Badge>
      case 'MIXED': return <Badge variant="success" size="sm">Servis & Part</Badge>
      default: return <Badge variant="default" size="sm">{type}</Badge>
    }
  }

  // Define columns since this is a Server Component, we need to map the data manually or use a client component.
  // Actually, Table is a client component, so we can't easily pass functions in `columns` from Server Component.
  // Wait, `Table` in our project is a standard component, is it client or server?
  // Let's create an AdminTransactionsClient just like Kasir.
  
  return (
    <>
      <Header
        title="Semua Transaksi"
        subtitle="Riwayat transaksi dari semua cabang"
      />
      <div className="p-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Transaksi (Hari Ini)</p>
            <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Pendapatan (Hari Ini)</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(transactions.reduce((acc, curr) => acc + curr.total, 0))}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice & Waktu</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabang & Kasir</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Belum ada transaksi hari ini.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 font-mono">{tx.invoiceNumber}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900">{tx.branch.name}</p>
                        <p className="text-xs text-slate-500">{tx.user.name}</p>
                      </td>
                      <td className="p-4">
                        {getTypeBadge(tx.type)}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-900">
                        {formatCurrency(tx.total)}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                          {tx.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
