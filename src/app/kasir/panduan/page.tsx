import Header from '@/components/layout/Header'
import PanduanClient from './PanduanClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buku Panduan Kasir',
}

export default function PanduanKasirPage() {
  return (
    <>
      <Header
        title="Buku Panduan Kasir"
        subtitle="Panduan Lengkap Operasional Transaksi, Inventaris, dan Closing Harian"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <PanduanClient />
      </div>
    </>
  )
}
