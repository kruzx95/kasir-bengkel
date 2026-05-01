'use client'

import { useTransition } from 'react'
import Button from '@/components/ui/Button'
import { cancelTransaction } from '@/actions/transaction'
import { XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CancelButton({ id, invoiceNumber }: { id: string; invoiceNumber: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCancel = () => {
    if (confirm(`Peringatan: Anda akan MEMBATALKAN transaksi ${invoiceNumber}.\nStok sparepart akan otomatis dikembalikan.\n\nApakah Anda yakin?`)) {
      startTransition(async () => {
        const res = await cancelTransaction(id)
        if (res.success) {
          alert('Transaksi berhasil dibatalkan.')
          router.refresh()
        } else {
          alert(res.message)
        }
      })
    }
  }

  return (
    <Button 
      variant="danger" 
      icon={XCircle} 
      onClick={handleCancel} 
      loading={isPending}
    >
      Batalkan Transaksi
    </Button>
  )
}
