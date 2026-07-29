import { getCorporatePaymentById } from '@/actions/corporate'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import PaymentReceipt from './PaymentReceipt'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string; paymentId: string }>
}

export const metadata: Metadata = {
  title: 'Bukti Pembayaran Korporat',
}

export default async function PaymentReceiptPage({ params }: Props) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  const { paymentId } = await params
  const payment = await getCorporatePaymentById(paymentId)
  if (!payment) notFound()

  return <PaymentReceipt payment={payment} />
}