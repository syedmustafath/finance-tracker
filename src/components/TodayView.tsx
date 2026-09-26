import { useMemo } from 'react'
import { summarize, toISODate, type Expense } from '../budget'
import { money } from '../format'
import type { Store } from '../store'
import { BudgetCard } from './BudgetCard'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseItem } from './ExpenseItem'

interface Props {
  store: Store
  today: Date
  onEdit: (e: Expense) => void
  onAdded: (message: string) => void
  onOpenSettings: () => void
}

export function TodayView({ store, today, onEdit, onAdded, onOpenSettings }: Props) {
  const { expenses, settings } = store
  const summary = useMemo(
    () => summarize(expenses, settings.monthlyBudget, today, settings.cycleStartDay),
    [expenses, settings, today],
  )
  const todayISO = toISODate(today)
  const todays = useMemo(
    () => expenses.filter((e) => e.date === todayISO).sort((a, b) => b.createdAt - a.createdAt),
    [expenses, todayISO],
  )

  return (
    <>
      {settings.monthlyBudget > 0 ? (
        <BudgetCard summary={summary} />
      ) : (
        <section className="card empty-budget">
          <h2>Set your budget</h2>
          <p className="muted">We'll work out your daily budget and track what's left for the cycle.</p>
          <button className="btn primary" onClick={onOpenSettings}>
            Set budget
          </button>
        </section>
      )}

      <section className="card">
        <h2 className="card-title">Add expense</h2>
        <ExpenseForm
          submitLabel="Add expense"
          resetOnSubmit
          onSubmit={(draft) => {
            store.addExpense(draft)
            onAdded(`Added ${money(draft.amount)}`)
          }}
        />
      </section>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">Today</h2>
          <span className="total">{money(summary.spentToday)}</span>
        </div>
        {todays.length === 0 ? (
          <p className="muted empty">No expenses yet today. Nice.</p>
        ) : (
          <ul className="expense-list">
            {todays.map((e) => (
              <ExpenseItem key={e.id} expense={e} onClick={() => onEdit(e)} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
