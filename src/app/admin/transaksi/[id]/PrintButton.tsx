'use client'

import Button from '@/components/ui/Button'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <Button icon={Printer} onClick={() => window.print()}>
      Cetak Struk
    </Button>
  )
}
