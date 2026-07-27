import { cn } from '@/lib/utils'
import { PackageOpen } from 'lucide-react'

interface Column<T> {
  key: string
  header: string | React.ReactNode
  className?: string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  className?: string
  onRowClick?: (row: T) => void
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Tidak ada data',
  emptyIcon,
  className,
  onRowClick,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-slate-400', className)}>
        {emptyIcon || <PackageOpen className="w-12 h-12 mb-3 text-slate-300" />}
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                'transition-colors hover:bg-slate-50/50',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-4 py-3.5 text-slate-700', col.className)}
                >
                  {col.render
                    ? col.render(row)
                    : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
