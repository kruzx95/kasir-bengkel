import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { getShopName } from '@/actions/settings'
import PrintMemoButton from './PrintMemoButton'
import { TUNE_UP_ITEMS, BRAKES_ITEMS, SUSPENSION_ITEMS } from '@/lib/memo-constants'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const memo = await prisma.serviceMemo.findUnique({ where: { id } })
  if (!memo) return { title: 'Cetak Memo Servis' }
  return { title: `Cetak Memo - ${memo.memoNumber} (${memo.vehiclePlate})` }
}

export default async function CetakMemoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const memo = await prisma.serviceMemo.findUnique({
    where: { id },
    include: {
      services: true,
      spareparts: true,
      mechanic: true,
      branch: true,
    },
  })

  if (!memo) return notFound()

  const shopName = await getShopName()
  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(memo.createdAt)

  // Checklist states from JSON
  const tuneUp = (memo.checklistTuneUp as Record<string, boolean>) || {}
  const brakes = (memo.checklistBrakes as Record<string, boolean>) || {}
  const suspension = (memo.checklistSuspension as Record<string, boolean>) || {}

  // Kolom Kiri: Khusus Keluhan & Diagnosa
  interface LeftItem {
    name: string
    isBold?: boolean
  }

  const leftItems: LeftItem[] = []

  if (memo.complaints && memo.complaints.trim()) {
    const lines = memo.complaints.split('\n').map((l) => l.trim()).filter(Boolean)
    lines.forEach((line, idx) => {
      leftItems.push({
        name: idx === 0 ? `Keluhan: ${line}` : `  ${line}`,
        isBold: idx === 0,
      })
    })
  }

  if (memo.initialDiagnosis && memo.initialDiagnosis.trim()) {
    const lines = memo.initialDiagnosis.split('\n').map((l) => l.trim()).filter(Boolean)
    lines.forEach((line, idx) => {
      leftItems.push({
        name: idx === 0 ? `Diagnosa: ${line}` : `  ${line}`,
        isBold: idx === 0,
      })
    })
  }

  // Kolom Kanan: Kebutuhan Sparepart (+ Jasa Pekerjaan)
  interface RightItem {
    name: string
    qtyUnit?: string
    estimatedPrice?: number
  }

  const rightItems: RightItem[] = []

  // Spareparts
  memo.spareparts.forEach((sp) => {
    rightItems.push({
      name: sp.name,
      qtyUnit: `${sp.quantity} ${sp.unit}`,
      estimatedPrice: sp.estimatedPrice || undefined,
    })
  })

  // Jasa / Services
  memo.services.forEach((s) => {
    rightItems.push({
      name: s.name,
      qtyUnit: undefined,
      estimatedPrice: s.estimatedPrice || undefined,
    })
  })

  // Fill up to minimum 10 rows for tables so lines match
  const maxRows = Math.max(10, leftItems.length, rightItems.length)
  const leftRows = Array.from({ length: maxRows }, (_, i) => leftItems[i] || null)
  const rightRows = Array.from({ length: maxRows }, (_, i) => rightItems[i] || null)

  return (
    <div className="cetak-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 4mm; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important; 
            padding: 0 !important; 
            font-size: 8.5pt !important; 
            color: #000 !important;
          }
          .no-print { display: none !important; }
          .print-container { 
            box-shadow: none !important; 
            padding: 0 !important; 
            width: 100% !important; 
            min-height: auto !important; 
            margin: 0 !important; 
          }
          * { break-inside: avoid !important; }
        }
        .cetak-page { font-family: 'Arial', sans-serif; background: #f8fafc; min-height: 100vh; padding: 12px; color: #000; }
        .print-container { 
          width: 210mm;
          min-height: 290mm;
          background: white; 
          margin: 0 auto; 
          padding: 6mm 8mm; 
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 2px 4px; font-size: 8.5pt; }
      `,
        }}
      />

      <PrintMemoButton />

      <div className="print-container text-black">
        {/* Header Bengkel */}
        <div className="border-b-2 border-black pb-2 mb-2">
          <div className="bg-neutral-900 text-white px-4 py-2 flex items-center justify-between rounded-sm">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-black italic tracking-wide text-yellow-400">
                  {shopName}
                </h1>
                <div className="h-0.5 w-full bg-red-600 my-0.5" />
                <p className="text-[9px] text-neutral-300 font-sans">
                  {memo.branch.name} • {memo.branch.address} • Telp: {memo.branch.phone || '-'}
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-xs tracking-wider">
                MEMO SERVICE
              </span>
              <p className="text-xs font-bold text-yellow-300 mt-1">{memo.memoNumber}</p>
            </div>
          </div>
        </div>

        {/* Data Pelanggan & Kendaraan */}
        <div className="grid grid-cols-2 gap-x-6 text-[10.5pt] font-semibold mb-2">
          {/* Kolom Kiri */}
          <div className="space-y-0.5">
            <div className="flex">
              <span className="w-24">NO. POLISI</span>
              <span className="w-3">:</span>
              <span className="flex-1 font-bold font-mono text-[11.5pt] tracking-wider">
                {memo.vehiclePlate}
              </span>
            </div>
            <div className="flex">
              <span className="w-24">NAMA</span>
              <span className="w-3">:</span>
              <span className="flex-1 uppercase">{memo.customerName}</span>
            </div>
            <div className="flex">
              <span className="w-24">ALAMAT</span>
              <span className="w-3">:</span>
              <span className="flex-1 text-[9.5pt] font-normal leading-tight">
                {memo.customerAddress || '-'}
              </span>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-0.5">
            <div className="flex">
              <span className="w-24">MERK/TYPE</span>
              <span className="w-3">:</span>
              <span className="flex-1 font-normal">{memo.vehicleModel || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-24">Tlp / HP</span>
              <span className="w-3">:</span>
              <span className="flex-1 font-mono font-normal">
                {memo.customerPhone || '-'}
              </span>
            </div>
            <div className="flex">
              <span className="w-24">TANGGAL</span>
              <span className="w-3">:</span>
              <span className="flex-1 font-mono font-normal">{dateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Tabel 1: Keluhan & Diagnosa (Kiri) & Tabel 2: Jenis Sparepart + Jasa (Kanan) Side-by-Side */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Tabel Kiri: Keluhan & Diagnosa */}
          <div>
            <table>
              <thead>
                <tr className="bg-neutral-200">
                  <th className="w-7 text-center font-bold text-[9pt]">NO</th>
                  <th className="text-center font-bold text-[9pt]">
                    JENIS PEKERJAAN <span className="text-[7.5pt] font-normal text-neutral-600">(Keluhan & Diagnosa)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leftRows.map((row, idx) => (
                  <tr key={idx} className="h-5">
                    <td className="text-center font-mono text-[8.5pt] font-bold">{idx + 1}</td>
                    <td className="text-[8.5pt] pl-1.5 font-medium">
                      {row ? (
                        <span className={row.isBold ? 'font-semibold text-neutral-900' : ''}>
                          {row.name}
                        </span>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tabel Kanan: Jenis Sparepart & Jasa */}
          <div>
            <table>
              <thead>
                <tr className="bg-neutral-200">
                  <th className="w-7 text-center font-bold text-[9pt]">NO</th>
                  <th className="text-center font-bold text-[9pt]">
                    JENIS SPAREPART <span className="text-[7.5pt] font-normal text-neutral-600">(+ Jasa)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rightRows.map((row, idx) => (
                  <tr key={idx} className="h-5">
                    <td className="text-center font-mono text-[8.5pt] font-bold">{idx + 1}</td>
                    <td className="text-[8.5pt] pl-1.5 font-medium">
                      {row ? (
                        <div className="flex justify-between items-center">
                          <span>
                            {row.name} {row.qtyUnit ? `(${row.qtyUnit})` : ''}
                          </span>
                          {row.estimatedPrice && row.estimatedPrice > 0 ? (
                            <span className="font-mono text-[7.5pt] text-neutral-600">
                              Rp {row.estimatedPrice.toLocaleString('id-ID')}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: KOMPONEN YANG DIKERJAKAN */}
        <div className="border border-black mb-2">
          <div className="bg-white border-b border-black text-center py-0.5 font-bold text-[9pt] tracking-wider">
            KOMPONEN YANG DIKERJAKAN
          </div>

          <div className="grid grid-cols-2 divide-x divide-black text-[8pt]">
            {/* Kolom Kiri: TUNE UP (16 Poin) */}
            <div className="p-1">
              <div className="font-bold text-center border-b border-black pb-0.5 mb-1 text-[8.5pt]">
                TUNE UP
              </div>
              <div className="space-y-0.5">
                {TUNE_UP_ITEMS.map((item, idx) => {
                  const isChecked = !!tuneUp[item.key]
                  return (
                    <div key={item.key} className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 font-mono font-bold text-neutral-700">
                          {idx + 1}
                        </span>
                        <span className="uppercase text-[7.5pt]">{item.label}</span>
                      </div>
                      <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold font-mono text-[8pt] leading-none shrink-0">
                        {isChecked ? '✓' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Kolom Kanan: SERVICE REM & KAKI-KAKI */}
            <div className="p-1 flex flex-col justify-between">
              {/* SERVICE REM */}
              <div>
                <div className="font-bold text-center border-b border-black pb-0.5 mb-1 text-[8.5pt]">
                  SERVICE REM
                </div>
                <div className="space-y-0.5 mb-2">
                  {BRAKES_ITEMS.map((item, idx) => {
                    const isChecked = !!brakes[item.key]
                    return (
                      <div key={item.key} className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 font-mono font-bold text-neutral-700">
                            {idx + 1}
                          </span>
                          <span className="uppercase text-[7.5pt]">{item.label}</span>
                        </div>
                        <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold font-mono text-[8pt] leading-none shrink-0">
                          {isChecked ? '✓' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* PEMERIKSAAN KAKI-KAKI */}
              <div className="border-t border-black pt-1">
                <div className="font-bold text-center border-b border-black pb-0.5 mb-1 text-[8.5pt]">
                  PEMERIKSAAN KAKI-KAKI
                </div>
                <div className="space-y-0.5">
                  {SUSPENSION_ITEMS.map((item, idx) => {
                    const isChecked = !!suspension[item.key]
                    return (
                      <div key={item.key} className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 font-mono font-bold text-neutral-700">
                            {idx + 1}
                          </span>
                          <span className="uppercase text-[7.5pt]">{item.label}</span>
                        </div>
                        <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold font-mono text-[8pt] leading-none shrink-0">
                          {isChecked ? '✓' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: No Antrian, Odometer, Nama Teknisi, Kotak Catatan */}
        <div className="grid grid-cols-12 gap-3 text-[9pt] pt-1">
          {/* Kolom 1: Antrian & Odometer */}
          <div className="col-span-3 space-y-2">
            <div>
              <span className="font-bold text-[8pt] block">NO ANTRIAN :</span>
              <span className="font-mono text-base font-black px-2 py-0.5 border border-black inline-block rounded-xs">
                {memo.queueNumber || '-'}
              </span>
            </div>
            <div>
              <span className="font-bold text-[8pt] block">ODOMETER :</span>
              <span className="font-mono font-bold text-sm">
                {memo.odometer ? `${memo.odometer.toLocaleString('id-ID')} KM` : '-'}
              </span>
            </div>
          </div>

          {/* Kolom 2: Teknisi & Tanda Tangan */}
          <div className="col-span-4 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[8pt] block">NAMA TEKNISI :</span>
              <span className="font-bold text-sm uppercase underline">
                {memo.mechanic?.name || '____________________'}
              </span>
            </div>
            <div className="text-[7.5pt] text-neutral-500 font-sans italic">
              * Tanda tangan setelah selesai pemeriksaan fisik
            </div>
          </div>

          {/* Kolom 3: Kotak Catatan Tambahan */}
          <div className="col-span-5 border border-black p-1.5 rounded-xs min-h-[50px]">
            <span className="font-bold text-[8pt] block mb-0.5">CATATAN :</span>
            <p className="text-[8pt] leading-tight font-sans whitespace-pre-line text-neutral-800">
              {memo.notes || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
