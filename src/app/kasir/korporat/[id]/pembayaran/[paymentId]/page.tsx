import { getCorporatePaymentById } from '@/actions/corporate'
import { getSession, canAccessCorporate } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import PaymentReceipt from '@/app/admin/korporat/[id]/pembayaran/[paymentId]/PaymentReceipt'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string; paymentId: string }>
}

export const metadata: Metadata = {
  title: 'Bukti Pembayaran Korporat',
}

export default async function KasirPaymentReceiptPage({ params }: Props) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) redirect('/login')

  const { paymentId } = await params
  const payment = await getCorporatePaymentById(paymentId)
  if (!payment) notFound()

  return <PaymentReceipt payment={payment} />
}
