import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import PrintButton from './PrintButton'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const indent = await prisma.indentOrder.findUnique({ where: { id } })
  if (!indent) return { title: 'Cetak Struk Indent' }
  const title = indent.type === 'RESTOCK' ? 'PO Restock' : 'Struk Indent'
  const indentNumber = `IDT-${indent.orderDate.getFullYear()}${(indent.orderDate.getMonth() + 1).toString().padStart(2, '0')}${indent.orderDate.getDate().toString().padStart(2, '0')}-${indent.id.slice(-5).toUpperCase()}`
  return { title: `${title} - ${indentNumber}` }
}

export default async function CetakIndentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  const indent = await prisma.indentOrder.findUnique({
    where: { id },
    include: {
      branch: true,
      user: true,
      customer: true,
      items: {
        include: {
          sparepart: { select: { name: true, sku: true } }
        }
      }
    }
  })

  if (!indent) return notFound()

  const indentNumber = `IDT-${indent.orderDate.getFullYear()}${(indent.orderDate.getMonth() + 1).toString().padStart(2, '0')}${indent.orderDate.getDate().toString().padStart(2, '0')}-${indent.id.slice(-5).toUpperCase()}`

  const estimatedTotal = indent.items.reduce((acc, item) => acc + item.quantity * item.estimatedPrice, 0)

  const statusLabel: Record<string, string> = {
    PENDING: 'MENUNGGU',
    PARTIAL: 'SEBAGIAN DITERIMA',
    RECEIVED: 'DITERIMA',
  }

  const statusColor: Record<string, string> = {
    PENDING: '#f59e0b',
    PARTIAL: '#3b82f6',
    RECEIVED: '#059669',
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; padding: 0 !important; font-size: 10pt !important; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; padding: 0 !important; width: 100% !important; min-height: auto !important; margin: 0 !important; }
          tr, table, .print-container { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
        .cetak-page { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; padding: 16px; color: #0f172a; }
        .print-container { 
          width: 210mm;
          background: white; 
          margin: 0 auto; 
          padding: 8mm 10mm; 
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; }
        th { background: #f1f5f9; font-weight: 600; text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        h1 { font-size: 16px; font-weight: 700; margin: 0 0 2px 0; }
        h2 { font-size: 13px; font-weight: 600; margin: 0; color: #475569; }
        .header-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; font-size: 11px; }
        .info-block { display: flex; flex-direction: column; gap: 3px; }
        .info-row { display: flex; }
        .info-label { width: 110px; font-weight: 600; color: #475569; }
        .info-value { flex: 1; }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px; text-align: center; font-size: 11px; }
        .signature-box { display: flex; flex-direction: column; justify-content: space-between; height: 50px; }
        .signature-line { border-top: 1px solid #cbd5e1; width: 140px; margin: 0 auto; padding-top: 2px; font-weight: 600; }
        .status-badge { 
          display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .customer-notice {
          background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; margin-top: 12px; font-size: 10.5px; color: #1e40af;
        }
      `}} />
      
      <div className="cetak-page">
        <PrintButton />

        <div className="print-container">
          <div className="header-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <h1>{indent.branch.name}</h1>
                  <h2>{indent.type === 'RESTOCK' ? 'PURCHASE ORDER (PO)' : 'STRUK PESANAN INDENT'}</h2>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 style={{ color: '#0f172a', fontSize: '16px' }}>{indentNumber}</h2>
              <div style={{ marginTop: '8px' }}>
                <span className="status-badge" style={{ color: statusColor[indent.status] || '#475569', background: `${statusColor[indent.status] || '#475569'}15`, border: `1px solid ${statusColor[indent.status] || '#475569'}` }}>
                  {statusLabel[indent.status] || indent.status}
                </span>
              </div>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-block">
              <div className="info-row">
                <span className="info-label">Tanggal Pesan</span>
                <span className="info-value">: {new Date(indent.orderDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              {indent.expectedDate && (
                <div className="info-row">
                  <span className="info-label">Estimasi Tiba</span>
                  <span className="info-value">: {new Date(indent.expectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Dibuat Oleh</span>
                <span className="info-value">: {indent.user.name}</span>
              </div>
              {indent.notes && (
                <div className="info-row">
                  <span className="info-label">Catatan</span>
                  <span className="info-value">: {indent.notes}</span>
                </div>
              )}
            </div>
            <div className="info-block">
              {indent.customer && (
                <div className="info-row">
                  <span className="info-label">Pelanggan</span>
                  <span className="info-value">: <strong>{indent.customer.name}</strong> {indent.customer.phone ? `(${indent.customer.phone})` : ''}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Supplier</span>
                <span className="info-value">: <strong>{indent.supplierName}</strong></span>
              </div>
              <div className="info-row">
                <span className="info-label">Cabang</span>
                <span className="info-value">: {indent.branch.name}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                <th>Nama Barang</th>
                <th>SKU</th>
                <th className="text-center" style={{ width: '80px' }}>Qty</th>
                <th className="text-center" style={{ width: '80px' }}>Diterima</th>
                <th className="text-right" style={{ width: '120px' }}>Harga Estimasi</th>
                <th className="text-right" style={{ width: '120px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {indent.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td>{item.sparepart.name}</td>
                  <td>{item.sparepart.sku || '-'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-center" style={{ color: item.receivedQty >= item.quantity ? '#059669' : item.receivedQty > 0 ? '#3b82f6' : '#94a3b8', fontWeight: 600 }}>
                    {item.receivedQty}/{item.quantity}
                  </td>
                  <td className="text-right">{formatCurrency(item.estimatedPrice)}</td>
                  <td className="text-right" style={{ fontWeight: 500 }}>{formatCurrency(item.quantity * item.estimatedPrice)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="text-right" style={{ fontWeight: 700, padding: '10px', background: '#f8fafc' }}>ESTIMASI TOTAL KESELURUHAN</td>
                <td className="text-right" style={{ fontWeight: 700, fontSize: '14px', background: '#f8fafc' }}>
                  {formatCurrency(estimatedTotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="text-right" style={{ fontWeight: 600, padding: '8px 10px' }}>JUMLAH DP (DIBAYAR)</td>
                <td className="text-right" style={{ fontWeight: 600 }}>
                  {formatCurrency(indent.dpAmount || 0)}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="text-right" style={{ fontWeight: 600, padding: '8px 10px', color: estimatedTotal > (indent.dpAmount || 0) ? '#e11d48' : '#0f172a' }}>
                  ESTIMASI SISA TAGIHAN
                </td>
                <td className="text-right" style={{ fontWeight: 600, color: estimatedTotal > (indent.dpAmount || 0) ? '#e11d48' : '#0f172a' }}>
                  {formatCurrency(Math.max(0, estimatedTotal - (indent.dpAmount || 0)))}
                </td>
              </tr>
            </tbody>
          </table>

          {indent.type === 'CUSTOMER' && (
            <div className="customer-notice">
              <strong>Informasi untuk Pelanggan:</strong> Barang yang dipesan akan dikirim sesuai estimasi tanggal tiba. Harap konfirmasi kembali ke bengkel untuk pengambilan barang. Harga yang tertera adalah estimasi dan dapat berubah saat barang diterima.
            </div>
          )}

          <div className="signature-section">
            <div className="signature-box">
              <span>{indent.type === 'RESTOCK' ? 'Dibuat Oleh,' : 'Pemesan / Bengkel,'}</span>
              <div className="signature-line">{indent.type === 'RESTOCK' ? indent.user.name : indent.branch.name}</div>
            </div>
            {indent.type === 'CUSTOMER' ? (
              <div className="signature-box">
                <span>Pelanggan,</span>
                <div className="signature-line">{indent.customer ? indent.customer.name : '(...............................)'}</div>
              </div>
            ) : (
              <div className="signature-box">
                <span>Mengetahui,</span>
                <div className="signature-line">(...............................)</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
