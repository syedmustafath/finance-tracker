import { parseISODate, toISODate, type Cycle } from './budget'

const currencyFormatter = (() => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BDT', currencyDisplay: 'narrowSymbol' })
  } catch {
    return null
  }
})()

export function money(amount: number): string {
  if (currencyFormatter) return currencyFormatter.format(amount)
  return `৳${amount.toFixed(2)}`
}

export function dayLabel(iso: string, today = new Date()): string {
  if (iso === toISODate(today)) return 'Today'
  const y = new Date(today)
  y.setDate(y.getDate() - 1)
  if (iso === toISODate(y)) return 'Yesterday'
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
}

/** Label for a budget cycle, e.g. "September 2026" for a plain calendar month, or "25 Aug – 24 Sep 2026" otherwise */
export function cycleLabel(cycle: Cycle, cycleStartDay: number): string {
  if (cycleStartDay === 1) {
    return cycle.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }
  const start = cycle.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const end = cycle.end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${start} – ${end}`
}
