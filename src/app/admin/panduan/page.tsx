import Header from '@/components/layout/Header'
import PanduanClient from '@/app/kasir/panduan/PanduanClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buku Panduan Kasir (Admin View)',
}

export default function AdminPanduanPage() {
  return (
    <>
      <Header
        title="Buku Panduan Kasir"
        subtitle="Panduan Operasional Kasir & Standar Prosedur Harian Cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <PanduanClient />
      </div>
    </>
  )
}
