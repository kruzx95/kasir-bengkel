import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import PrintButton from './PrintButton'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const restock = await prisma.restock.findUnique({ where: { id } })
  if (!restock) return { title: 'Cetak PO' }
  const poNumber = `PO-${restock.date.getFullYear()}${(restock.date.getMonth() + 1).toString().padStart(2, '0')}${restock.date.getDate().toString().padStart(2, '0')}-${restock.id.slice(-5).toUpperCase()}`
  return { title: `Cetak PO - ${poNumber}` }
}

// Force the page to print without layout
export default async function CetakPOPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  const { id } = await params

  const restock = await prisma.restock.findUnique({
    where: { id },
    include: {
      branch: true,
      user: true,
      items: {
        include: {
          sparepart: true
        }
      }
    }
  })

  if (!restock) return notFound()

  // Generate PO Number based on ID or date
  const poNumber = `PO-${restock.date.getFullYear()}${(restock.date.getMonth() + 1).toString().padStart(2, '0')}${restock.date.getDate().toString().padStart(2, '0')}-${restock.id.slice(-5).toUpperCase()}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
        }
        .cetak-page { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; padding: 20px; color: #0f172a; }
        .print-container { 
          width: 210mm; /* A4 Portrait width */
          min-height: 297mm; /* A4 Portrait height */
          background: white; 
          margin: 0 auto; 
          padding: 10mm; 
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); 
        }
          @media print {
            body { padding: 0; background: white; }
            .print-container { box-shadow: none; padding: 0; width: 100%; min-height: auto; }
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 12px; }
          th { background: #f1f5f9; font-weight: 600; text-align: left; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
          h2 { font-size: 14px; font-weight: 600; margin: 0; color: #475569; }
          .header-grid { display: grid; grid-template-columns: 1fr auto; gap: 20px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 12px; }
          .info-block { display: flex; flex-direction: column; gap: 4px; }
          .info-row { display: flex; }
          .info-label { width: 100px; font-weight: 600; color: #475569; }
          .info-value { flex: 1; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; text-align: center; font-size: 12px; }
          .signature-box { display: flex; flex-direction: column; justify-content: space-between; height: 80px; }
          .signature-line { border-top: 1px solid #cbd5e1; width: 160px; margin: 0 auto; padding-top: 4px; font-weight: 600; }
          .status-badge { 
            display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; border: 1px solid currentColor;
          }
          .status-lunas { color: #059669; background: #d1fae5; }
          .status-hutang { color: #e11d48; background: #ffe4e6; }
      `}} />
      
      <div className="cetak-page">
        {/* Floating Print Button for Screen View */}
        <PrintButton />

        <div className="print-container">
          <div className="header-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <h1>{restock.branch.name}</h1>
                  <h2>PURCHASE ORDER (PO)</h2>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 style={{ color: '#0f172a', fontSize: '16px' }}>{poNumber}</h2>
              <div style={{ marginTop: '8px' }}>
                <span className={`status-badge ${restock.paymentStatus === 'LUNAS' ? 'status-lunas' : 'status-hutang'}`}>
                  {restock.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-block">
              <div className="info-row">
                <span className="info-label">Tanggal PO</span>
                <span className="info-value">: {new Date(restock.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Dibuat Oleh</span>
                <span className="info-value">: {restock.user.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Catatan</span>
                <span className="info-value">: {restock.notes || '-'}</span>
              </div>
            </div>
            <div className="info-block">
              <div className="info-row">
                <span className="info-label">Kepada Yth.</span>
                <span className="info-value">: <strong>{restock.supplierName}</strong></span>
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
                <th className="text-right" style={{ width: '120px' }}>Harga Satuan</th>
                <th className="text-right" style={{ width: '120px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {restock.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td>{item.sparepart.name}</td>
                  <td>{item.sparepart.sku || '-'}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.buyPrice)}</td>
                  <td className="text-right font-medium">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="text-right" style={{ fontWeight: 700, padding: '10px' }}>TOTAL KESELURUHAN</td>
                <td className="text-right" style={{ fontWeight: 700, fontSize: '14px', background: '#f8fafc' }}>
                  {formatCurrency(restock.total)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="text-right" style={{ fontWeight: 600, padding: '8px 10px' }}>JUMLAH DIBAYAR (DP)</td>
                <td className="text-right" style={{ fontWeight: 600 }}>
                  {formatCurrency(restock.paidAmount)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="text-right" style={{ fontWeight: 600, padding: '8px 10px', color: restock.paymentStatus === 'HUTANG' ? '#e11d48' : '#0f172a' }}>
                  SISA TAGIHAN / UTANG
                </td>
                <td className="text-right" style={{ fontWeight: 600, color: restock.paymentStatus === 'HUTANG' ? '#e11d48' : '#0f172a' }}>
                  {formatCurrency(Math.max(0, restock.total - restock.paidAmount))}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="signature-section">
            <div className="signature-box">
              <span>Hormat Kami,</span>
              <div className="signature-line">{restock.branch.name}</div>
            </div>
            <div className="signature-box">
              <span>Penerima / Supplier,</span>
              <div className="signature-line">{restock.supplierName}</div>
            </div>
          </div>
        </div>
        
        {/* Helper script to auto-trigger print dialog */}
        <script dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            }
          `
        }} />
      </div>
    </>
  )
}
