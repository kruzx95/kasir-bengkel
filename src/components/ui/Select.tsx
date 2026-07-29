import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 transition-all duration-200 appearance-none',
            'hover:border-slate-300 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none',
            'bg-[url("data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%27http%3a%2f%2fwww.w3.org%2f2000%2fsvg%27%20width%3d%2712%27%20height%3d%2712%27%20viewBox%3d%270%200%2012%2012%27%3e%3cpath%20fill%3d%27%2394a3b8%27%20d%3d%27M2%204l4%204%204-4%27%2f%3e%3c%2fsvg%3e")] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
