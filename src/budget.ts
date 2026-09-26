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
  /**
   * Day of the month a budget cycle starts on (1-31). 1 = a plain calendar
   * month. A cycle runs from this day up to (but not including) its next
   * occurrence, e.g. 25 means "25th to 24th". Days beyond the end of a
   * shorter month clamp to that month's last day.
   */
  cycleStartDay: number
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
const DAY_MS = 24 * 60 * 60 * 1000

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

/** Number of calendar days between two dates, inclusive of both ends */
function daysBetweenInclusive(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS) + 1
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysInCalendarMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/** Clamps a target day-of-month to that month's actual last day */
function clampDay(year: number, month0: number, day: number): number {
  return Math.min(day, daysInCalendarMonth(year, month0))
}

export interface Cycle {
  start: Date
  end: Date
  /** Stable identifier for this cycle: its start date, YYYY-MM-DD */
  key: string
}

/** The budget cycle a given date falls in, per the configured start day */
export function cycleFor(date: Date, startDay: number): Cycle {
  const y = date.getFullYear()
  const m = date.getMonth()
  const boundary = clampDay(y, m, startDay)

  let start: Date
  if (date.getDate() >= boundary) {
    start = new Date(y, m, boundary)
  } else {
    const py = m === 0 ? y - 1 : y
    const pm = m === 0 ? 11 : m - 1
    start = new Date(py, pm, clampDay(py, pm, startDay))
  }

  const ny = start.getMonth() === 11 ? start.getFullYear() + 1 : start.getFullYear()
  const nm = start.getMonth() === 11 ? 0 : start.getMonth() + 1
  const end = addDays(new Date(ny, nm, clampDay(ny, nm, startDay)), -1)

  return { start, end, key: toISODate(start) }
}

/** Resolves a cycle from its start-date key (as produced by `cycleFor`/`shiftCycle`) */
export function cycleFromKey(key: string, startDay: number): Cycle {
  return cycleFor(parseISODate(key), startDay)
}

/** The next or previous cycle relative to one identified by its start-date key */
export function shiftCycle(key: string, delta: number, startDay: number): Cycle {
  let cycle = cycleFromKey(key, startDay)
  if (delta >= 0) {
    for (let i = 0; i < delta; i++) cycle = cycleFor(addDays(cycle.end, 1), startDay)
  } else {
    for (let i = 0; i < -delta; i++) cycle = cycleFor(addDays(cycle.start, -1), startDay)
  }
  return cycle
}

export function sum(expenses: Expense[]): number {
  return round2(expenses.reduce((t, e) => t + e.amount, 0))
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface BudgetSummary {
  monthlyBudget: number
  cycle: Cycle
  /** Flat daily budget: cycle budget spread evenly across the cycle's days */
  dailyBudget: number
  spentThisMonth: number
  remainingThisMonth: number
  spentToday: number
  /** Days left in the cycle, including today */
  daysLeft: number
  /**
   * What you can spend per day from today onwards to finish the cycle on budget.
   * Based on what was left at the start of today, so spending today doesn't move it.
   */
  adjustedDailyBudget: number
  remainingToday: number
}

export function summarize(expenses: Expense[], monthlyBudget: number, today: Date, cycleStartDay: number): BudgetSummary {
  const todayISO = toISODate(today)
  const cycle = cycleFor(today, cycleStartDay)
  const startISO = toISODate(cycle.start)
  const endISO = toISODate(cycle.end)
  const totalDays = daysBetweenInclusive(cycle.start, cycle.end)
  const daysLeft = daysBetweenInclusive(today, cycle.end)

  const inCycle = expenses.filter((e) => e.date >= startISO && e.date <= endISO)
  const spentThisMonth = sum(inCycle)
  const spentToday = sum(inCycle.filter((e) => e.date === todayISO))
  const spentBeforeToday = round2(spentThisMonth - spentToday)

  const dailyBudget = round2(monthlyBudget / totalDays)
  const adjustedDailyBudget = round2(Math.max(0, monthlyBudget - spentBeforeToday) / daysLeft)

  return {
    monthlyBudget,
    cycle,
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
