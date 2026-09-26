import { useEffect } from 'react'
import type { Expense } from '../budget'
import { ExpenseForm } from './ExpenseForm'

interface Props {
  expense: Expense
  currency: string
  onSave: (patch: Omit<Expense, 'id' | 'createdAt'>) => void
  onDelete: () => void
  onClose: () => void
}

export function EditSheet({ expense, currency, onSave, onDelete, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Edit expense"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>Edit expense</h2>
          <button className="btn ghost small" onClick={onClose}>
            Cancel
          </button>
        </div>
        <ExpenseForm initial={expense} currency={currency} submitLabel="Save changes" onSubmit={onSave} />
        <button className="btn danger" onClick={onDelete}>
          Delete expense
        </button>
      </div>
    </div>
  )
}
