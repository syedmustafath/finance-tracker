import { describe, expect, it } from 'vitest'
import { daysInMonth, groupByDay, shiftMonth, summarize, type Expense } from './budget'

let n = 0
const exp = (date: string, amount: number): Expense => ({
  id: String(++n),
  date,
  amount,
  category: 'food',
  note: '',
  createdAt: n,
})

describe('summarize', () => {
  const today = new Date(2026, 8, 11) // 11 Sep 2026, 30-day month

  it('computes flat and adjusted daily budgets', () => {
    const s = summarize(
      [exp('2026-09-01', 100), exp('2026-09-10', 50), exp('2026-09-11', 20), exp('2026-08-31', 999)],
      3000,
      today,
    )
    expect(s.dailyBudget).toBe(100)
    expect(s.spentThisMonth).toBe(170)
    expect(s.remainingThisMonth).toBe(2830)
    expect(s.spentToday).toBe(20)
    expect(s.daysLeft).toBe(20)
    // (3000 - 150 spent before today) / 20 days left
    expect(s.adjustedDailyBudget).toBe(142.5)
    expect(s.remainingToday).toBe(122.5)
  })

  it('never goes negative on the adjusted daily budget', () => {
    const s = summarize([exp('2026-09-01', 5000)], 3000, today)
    expect(s.adjustedDailyBudget).toBe(0)
    expect(s.remainingThisMonth).toBe(-2000)
  })

  it('avoids floating point drift', () => {
    const s = summarize([exp('2026-09-11', 0.1), exp('2026-09-11', 0.2)], 300, today)
    expect(s.spentToday).toBe(0.3)
  })
})

describe('date helpers', () => {
  it('handles month lengths and shifting across years', () => {
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
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
