import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'text-xs font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                changeType === 'up' &&
                  'text-emerald-700 bg-emerald-50',
                changeType === 'down' &&
                  'text-red-700 bg-red-50',
                changeType === 'neutral' &&
                  'text-slate-500 bg-slate-100'
              )}
            >
              {changeType === 'up' && '↑'}
              {changeType === 'down' && '↓'}
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
            iconBg
          )}
        >
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
