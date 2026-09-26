import { parseISODate, toISODate } from './budget'

const formatters = new Map<string, Intl.NumberFormat>()

export function money(amount: number, currency: string): string {
  let f = formatters.get(currency)
  if (!f) {
    try {
      f = new Intl.NumberFormat(undefined, { style: 'currency', currency })
    } catch {
      f = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    formatters.set(currency, f)
  }
  return f.format(amount)
}

export function dayLabel(iso: string, today = new Date()): string {
  if (iso === toISODate(today)) return 'Today'
  const y = new Date(today)
  y.setDate(y.getDate() - 1)
  if (iso === toISODate(y)) return 'Yesterday'
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
}

export function monthLabel(key: string): string {
  return parseISODate(`${key}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
