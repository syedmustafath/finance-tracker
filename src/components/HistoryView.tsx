import { useEffect, useMemo, useState } from 'react'
import { cycleFor, cycleFromKey, groupByDay, round2, shiftCycle, sum, toISODate, type Expense } from '../budget'
import { cycleLabel, dayLabel, money } from '../format'
import type { Store } from '../store'
import { ExpenseItem } from './ExpenseItem'

interface Props {
  store: Store
  today: Date
  onEdit: (e: Expense) => void
}

export function HistoryView({ store, today, onEdit }: Props) {
  const { expenses, settings } = store
  const currentCycle = useMemo(() => cycleFor(today, settings.cycleStartDay), [today, settings.cycleStartDay])
  const [cycleKey, setCycleKey] = useState(currentCycle.key)
  // Jump back to the current cycle if the cycle-start-day setting changes underneath us.
  useEffect(() => setCycleKey(currentCycle.key), [settings.cycleStartDay])
  const cycle = useMemo(
    () => (cycleKey === currentCycle.key ? currentCycle : cycleFromKey(cycleKey, settings.cycleStartDay)),
    [cycleKey, currentCycle, settings.cycleStartDay],
  )

  const startISO = toISODate(cycle.start)
  const endISO = toISODate(cycle.end)
  const inCycle = useMemo(
    () => expenses.filter((e) => e.date >= startISO && e.date <= endISO),
    [expenses, startISO, endISO],
  )
  const days = useMemo(() => groupByDay(inCycle), [inCycle])
  const total = sum(inCycle)
  const totalDays = Math.round((cycle.end.getTime() - cycle.start.getTime()) / 86_400_000) + 1
  const dailyBudget = settings.monthlyBudget > 0 ? round2(settings.monthlyBudget / totalDays) : 0

  return (
    <>
      <section className="card month-nav">
        <button
          className="btn ghost icon"
          onClick={() => setCycleKey(shiftCycle(cycleKey, -1, settings.cycleStartDay).key)}
          aria-label="Previous cycle"
        >
          ‹
        </button>
        <div className="month-nav-center">
          <h2>{cycleLabel(cycle, settings.cycleStartDay)}</h2>
          <span className="muted small">
            {money(total)} spent
            {settings.monthlyBudget > 0 && ` of ${money(settings.monthlyBudget)}`}
          </span>
        </div>
        <button
          className="btn ghost icon"
          onClick={() => setCycleKey(shiftCycle(cycleKey, 1, settings.cycleStartDay).key)}
          disabled={cycleKey >= currentCycle.key}
          aria-label="Next cycle"
        >
          ›
        </button>
      </section>

      {days.length === 0 && (
        <section className="card">
          <p className="muted empty">No expenses recorded in this cycle.</p>
        </section>
      )}

      {days.map((day) => {
        const over = dailyBudget > 0 && day.total > dailyBudget
        return (
          <section className="card day" key={day.date}>
            <div className="card-title-row">
              <h3 className="card-title">{dayLabel(day.date, today)}</h3>
              <span className={`total ${over ? 'neg' : ''}`}>{money(day.total)}</span>
            </div>
            {dailyBudget > 0 && (
              <div className="bar thin" title={`Daily budget ${money(dailyBudget)}`}>
                <div
                  className={`bar-fill ${over ? 'over' : ''}`}
                  style={{ width: `${Math.min(100, (day.total / dailyBudget) * 100)}%` }}
                />
              </div>
            )}
            <ul className="expense-list">
              {day.expenses.map((e) => (
                <ExpenseItem key={e.id} expense={e} onClick={() => onEdit(e)} />
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
