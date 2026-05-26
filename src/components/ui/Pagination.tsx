'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Button from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
}

export default function Pagination({ currentPage, totalPages, totalCount }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1 && totalCount === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        Menampilkan halaman <span className="font-semibold text-slate-900">{currentPage}</span> dari <span className="font-semibold text-slate-900">{Math.max(1, totalPages)}</span> (Total: {totalCount} data)
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          icon={ChevronLeft}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Selanjutnya <ChevronRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
