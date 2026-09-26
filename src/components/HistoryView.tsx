import { useMemo, useState } from 'react'
import { daysInMonth, groupByDay, monthKey, round2, shiftMonth, sum, type Expense } from '../budget'
import { dayLabel, money, monthLabel } from '../format'
import type { Store } from '../store'
import { ExpenseItem } from './ExpenseItem'

interface Props {
  store: Store
  today: Date
  onEdit: (e: Expense) => void
}

export function HistoryView({ store, today, onEdit }: Props) {
  const { expenses, settings } = store
  const currentMonth = monthKey(today)
  const [month, setMonth] = useState(currentMonth)

  const inMonth = useMemo(() => expenses.filter((e) => monthKey(e.date) === month), [expenses, month])
  const days = useMemo(() => groupByDay(inMonth), [inMonth])
  const total = sum(inMonth)
  const dailyBudget = settings.monthlyBudget > 0 ? round2(settings.monthlyBudget / daysInMonth(month)) : 0

  return (
    <>
      <section className="card month-nav">
        <button className="btn ghost icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          ‹
        </button>
        <div className="month-nav-center">
          <h2>{monthLabel(month)}</h2>
          <span className="muted small">
            {money(total, settings.currency)} spent
            {settings.monthlyBudget > 0 && ` of ${money(settings.monthlyBudget, settings.currency)}`}
          </span>
        </div>
        <button
          className="btn ghost icon"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={month >= currentMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </section>

      {days.length === 0 && (
        <section className="card">
          <p className="muted empty">No expenses recorded in {monthLabel(month)}.</p>
        </section>
      )}

      {days.map((day) => {
        const over = dailyBudget > 0 && day.total > dailyBudget
        return (
          <section className="card day" key={day.date}>
            <div className="card-title-row">
              <h3 className="card-title">{dayLabel(day.date, today)}</h3>
              <span className={`total ${over ? 'neg' : ''}`}>{money(day.total, settings.currency)}</span>
            </div>
            {dailyBudget > 0 && (
              <div className="bar thin" title={`Daily budget ${money(dailyBudget, settings.currency)}`}>
                <div
                  className={`bar-fill ${over ? 'over' : ''}`}
                  style={{ width: `${Math.min(100, (day.total / dailyBudget) * 100)}%` }}
                />
              </div>
            )}
            <ul className="expense-list">
              {day.expenses.map((e) => (
                <ExpenseItem key={e.id} expense={e} currency={settings.currency} onClick={() => onEdit(e)} />
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
