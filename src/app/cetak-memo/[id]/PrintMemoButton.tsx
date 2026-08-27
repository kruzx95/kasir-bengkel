'use client'

import { Printer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function PrintMemoButton() {
  const router = useRouter()

  return (
    <div className="no-print mb-4 flex items-center justify-between max-w-[210mm] mx-auto bg-white p-4 rounded-xl shadow-xs border border-slate-200">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.back()}
        >
          Kembali
        </Button>
        <span className="text-sm font-semibold text-slate-700">
          Preview Cetak Memo Servis (A4)
        </span>
      </div>
      <Button
        variant="primary"
        size="sm"
        icon={Printer}
        onClick={() => window.print()}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        Cetak Sekarang (Print)
      </Button>
    </div>
  )
}
