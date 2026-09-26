export interface Expense {
  id: string
  /** Local calendar date, YYYY-MM-DD */
  date: string
  amount: number
  category: string
  note: string
  createdAt: number
}

export interface Settings {
  monthlyBudget: number
  currency: string
}

export const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'transport', label: 'Transport', emoji: '🚗' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'bills', label: 'Bills', emoji: '💡' },
  { id: 'health', label: 'Health', emoji: '💊' },
  { id: 'fun', label: 'Fun', emoji: '🎬' },
  { id: 'other', label: 'Other', emoji: '📦' },
] as const

export function categoryFor(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** YYYY-MM key for a date string or Date */
export function monthKey(d: string | Date): string {
  return typeof d === 'string' ? d.slice(0, 7) : toISODate(d).slice(0, 7)
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export function sum(expenses: Expense[]): number {
  return round2(expenses.reduce((t, e) => t + e.amount, 0))
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface BudgetSummary {
  monthlyBudget: number
  /** Flat daily budget: monthly budget spread evenly across the month */
  dailyBudget: number
  spentThisMonth: number
  remainingThisMonth: number
  spentToday: number
  /** Days left in the month, including today */
  daysLeft: number
  /**
   * What you can spend per day from today onwards to finish the month on budget.
   * Based on what was left at the start of today, so spending today doesn't move it.
   */
  adjustedDailyBudget: number
  remainingToday: number
}

export function summarize(expenses: Expense[], monthlyBudget: number, today: Date): BudgetSummary {
  const todayISO = toISODate(today)
  const month = monthKey(today)
  const totalDays = daysInMonth(month)
  const daysLeft = totalDays - today.getDate() + 1

  const inMonth = expenses.filter((e) => monthKey(e.date) === month)
  const spentThisMonth = sum(inMonth)
  const spentToday = sum(inMonth.filter((e) => e.date === todayISO))
  const spentBeforeToday = round2(spentThisMonth - spentToday)

  const dailyBudget = round2(monthlyBudget / totalDays)
  const adjustedDailyBudget = round2(Math.max(0, monthlyBudget - spentBeforeToday) / daysLeft)

  return {
    monthlyBudget,
    dailyBudget,
    spentThisMonth,
    remainingThisMonth: round2(monthlyBudget - spentThisMonth),
    spentToday,
    daysLeft,
    adjustedDailyBudget,
    remainingToday: round2(adjustedDailyBudget - spentToday),
  }
}

export interface DayGroup {
  date: string
  total: number
  expenses: Expense[]
}

/** Groups expenses by day, newest day first, newest entry first within a day */
export function groupByDay(expenses: Expense[]): DayGroup[] {
  const map = new Map<string, Expense[]>()
  for (const e of expenses) {
    const list = map.get(e.date)
    if (list) list.push(e)
    else map.set(e.date, [e])
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, list]) => ({
      date,
      total: sum(list),
      expenses: list.sort((a, b) => b.createdAt - a.createdAt),
    }))
}
