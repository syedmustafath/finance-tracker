import { describe, expect, it } from 'vitest'
import { cycleFor, groupByDay, shiftCycle, summarize, toISODate, type Expense } from './budget'

let n = 0
const exp = (date: string, amount: number): Expense => ({
  id: String(++n),
  date,
  amount,
  category: 'food',
  note: '',
  createdAt: n,
})

describe('cycleFor', () => {
  it('behaves like a plain calendar month when startDay is 1', () => {
    const c = cycleFor(new Date(2026, 8, 11), 1)
    expect(toISODate(c.start)).toBe('2026-09-01')
    expect(toISODate(c.end)).toBe('2026-09-30')
  })

  it('puts an early-month date in the previous cycle when startDay is 25', () => {
    const c = cycleFor(new Date(2026, 8, 11), 25) // 11 Sep
    expect(toISODate(c.start)).toBe('2026-08-25')
    expect(toISODate(c.end)).toBe('2026-09-24')
  })

  it('puts a date on/after startDay in the new cycle', () => {
    const c = cycleFor(new Date(2026, 8, 25), 25) // 25 Sep
    expect(toISODate(c.start)).toBe('2026-09-25')
    expect(toISODate(c.end)).toBe('2026-10-24')
  })

  it('clamps a start day beyond a short month', () => {
    // startDay 31 in a 30-day September: cycle boundary clamps to Sep 30
    const c = cycleFor(new Date(2026, 8, 30), 31)
    expect(toISODate(c.start)).toBe('2026-09-30')
    // next boundary clamps to Oct 31
    expect(toISODate(c.end)).toBe('2026-10-30')
  })
})

describe('shiftCycle', () => {
  it('moves to the next and previous cycle', () => {
    const c = cycleFor(new Date(2026, 8, 11), 25)
    expect(shiftCycle(c.key, 1, 25).key).toBe('2026-09-25')
    expect(shiftCycle(c.key, -1, 25).key).toBe('2026-07-25')
    expect(shiftCycle(c.key, 2, 25).key).toBe('2026-10-25')
  })
})

describe('summarize', () => {
  const today = new Date(2026, 8, 11) // 11 Sep 2026 -> cycle 25 Aug to 24 Sep (31 days) when startDay=25

  it('computes flat and adjusted daily budgets over a custom cycle', () => {
    const s = summarize(
      [exp('2026-08-26', 100), exp('2026-09-10', 50), exp('2026-09-11', 20), exp('2026-07-30', 999)],
      3100,
      today,
      25,
    )
    expect(toISODate(s.cycle.start)).toBe('2026-08-25')
    expect(toISODate(s.cycle.end)).toBe('2026-09-24')
    expect(s.dailyBudget).toBe(100) // 3100 / 31 days
    expect(s.spentThisMonth).toBe(170)
    expect(s.remainingThisMonth).toBe(2930)
    expect(s.spentToday).toBe(20)
    expect(s.daysLeft).toBe(14) // 11 Sep .. 24 Sep inclusive
    // (3100 - 150 spent before today) / 14 days left
    expect(s.adjustedDailyBudget).toBe(210.71)
    expect(s.remainingToday).toBe(190.71)
  })

  it('falls back to a plain calendar month when cycleStartDay is 1', () => {
    const s = summarize([exp('2026-09-01', 100)], 3000, today, 1)
    expect(toISODate(s.cycle.start)).toBe('2026-09-01')
    expect(toISODate(s.cycle.end)).toBe('2026-09-30')
    expect(s.dailyBudget).toBe(100)
  })

  it('never goes negative on the adjusted daily budget', () => {
    const s = summarize([exp('2026-08-26', 5000)], 3000, today, 25)
    expect(s.adjustedDailyBudget).toBe(0)
    expect(s.remainingThisMonth).toBe(-2000)
  })

  it('avoids floating point drift', () => {
    const s = summarize([exp('2026-09-11', 0.1), exp('2026-09-11', 0.2)], 300, today, 25)
    expect(s.spentToday).toBe(0.3)
  })
})

describe('groupByDay', () => {
  it('groups newest day first with totals', () => {
    const groups = groupByDay([exp('2026-09-01', 10), exp('2026-09-03', 5), exp('2026-09-01', 2.5)])
    expect(groups.map((g) => g.date)).toEqual(['2026-09-03', '2026-09-01'])
    expect(groups[1].total).toBe(12.5)
    expect(groups[1].expenses[0].amount).toBe(2.5)
  })
})
