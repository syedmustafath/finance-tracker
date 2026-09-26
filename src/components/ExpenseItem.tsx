import { categoryFor, type Expense } from '../budget'
import { money } from '../format'

interface Props {
  expense: Expense
  onClick: () => void
}

export function ExpenseItem({ expense, onClick }: Props) {
  const cat = categoryFor(expense.category)
  return (
    <li>
      <button className="expense-item" onClick={onClick} aria-label={`Edit ${cat.label} expense`}>
        <span className="cat-icon" aria-hidden>
          {cat.emoji}
        </span>
        <span className="expense-text">
          <span className="expense-title">{expense.note || cat.label}</span>
          {expense.note && <span className="expense-sub">{cat.label}</span>}
        </span>
        <span className="expense-amount">{money(expense.amount)}</span>
      </button>
    </li>
  )
}
