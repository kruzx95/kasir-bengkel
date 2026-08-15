import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function parsePrice(value: unknown): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }
  if (!value) return 0

  let str = String(value).trim()
  // Remove currency prefix/suffix like "Rp", "RP", "rp", spaces
  str = str.replace(/rp/gi, '').trim()

  // Handle k / rb / ribu shorthand (e.g. 25k, 25rb, 25 ribu)
  if (/^[0-9.]+\s*(k|rb|ribu)$/i.test(str)) {
    const numPart = parseFloat(str.replace(/[^0-9.]/g, ''))
    return isNaN(numPart) ? 0 : numPart * 1000
  }

  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Indonesian format 25.000,00 -> 25000.00
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // US format 25,000.00 -> 25000.00
      str = str.replace(/,/g, '')
    }
  } else if (str.includes('.')) {
    const parts = str.split('.')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '')
    }
  } else if (str.includes(',')) {
    const parts = str.split(',')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/,/g, '')
    } else {
      str = str.replace(',', '.')
    }
  }

  const cleaned = str.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

