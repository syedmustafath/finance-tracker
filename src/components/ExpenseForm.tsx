import { useState, type FormEvent } from 'react'
import { CATEGORIES, toISODate, type Expense } from '../budget'

type Draft = Omit<Expense, 'id' | 'createdAt'>

interface Props {
  initial?: Draft
  submitLabel: string
  onSubmit: (draft: Draft) => void
  /** Reset fields after submit (used by the quick-add form) */
  resetOnSubmit?: boolean
  autoFocus?: boolean
}

export function ExpenseForm({ initial, submitLabel, onSubmit, resetOnSubmit, autoFocus }: Props) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? 'food')
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? toISODate(new Date()))

  const value = Number(amount)
  const valid = amount.trim() !== '' && Number.isFinite(value) && value > 0 && date !== ''

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    onSubmit({ amount: Math.round(value * 100) / 100, category, note: note.trim(), date })
    if (resetOnSubmit) {
      setAmount('')
      setNote('')
      setDate(toISODate(new Date()))
    }
  }

  return (
    <form className="expense-form" onSubmit={submit}>
      <label className="amount-field">
        <span className="currency">৳</span>
        <input
          inputMode="decimal"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          autoFocus={autoFocus}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount"
        />
      </label>

      <div className="chips" role="radiogroup" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            role="radio"
            aria-checked={category === c.id}
            className={`chip ${category === c.id ? 'active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            <span aria-hidden>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      <div className="row">
        <input
          className="field grow"
          placeholder="Note (optional)"
          value={note}
          maxLength={80}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Note"
        />
        <input
          className="field"
          type="date"
          value={date}
          max={toISODate(new Date())}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
        />
      </div>

      <button className="btn primary" type="submit" disabled={!valid}>
        {submitLabel}
      </button>
    </form>
  )
}
