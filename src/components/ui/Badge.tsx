import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

const badgeVariants = {
  default: 'bg-slate-100 text-slate-600',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
}

const badgeSizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
