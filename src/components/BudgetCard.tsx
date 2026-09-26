import type { BudgetSummary } from '../budget'
import { money } from '../format'

interface Props {
  summary: BudgetSummary
}

function Ring({ fraction, over }: { fraction: number; over: boolean }) {
  const r = 52
  const c = 2 * Math.PI * r
  const f = Math.min(1, Math.max(0, fraction))
  return (
    <svg className="ring" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r={r} className="ring-track" />
      <circle
        cx="60"
        cy="60"
        r={r}
        className={`ring-fill ${over ? 'over' : ''}`}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - f)}
      />
    </svg>
  )
}

export function BudgetCard({ summary: s }: Props) {
  const todayOver = s.remainingToday < 0
  const monthOver = s.remainingThisMonth < 0
  const todayFraction = s.adjustedDailyBudget > 0 ? s.spentToday / s.adjustedDailyBudget : s.spentToday > 0 ? 1 : 0
  const monthFraction = s.monthlyBudget > 0 ? s.spentThisMonth / s.monthlyBudget : 0

  return (
    <section className="card hero">
      <div className="hero-top">
        <div className="ring-wrap">
          <Ring fraction={todayFraction} over={todayOver} />
          <div className="ring-label">
            <span className="muted small">{todayOver ? 'Over today' : 'Left today'}</span>
            <strong className={todayOver ? 'neg' : ''}>{money(Math.abs(s.remainingToday))}</strong>
          </div>
        </div>
        <dl className="hero-stats">
          <div>
            <dt>Spent today</dt>
            <dd>{money(s.spentToday)}</dd>
          </div>
          <div>
            <dt>Daily budget</dt>
            <dd>{money(s.dailyBudget)}</dd>
          </div>
          <div>
            <dt title="What you can spend per day for the rest of the cycle and still finish on budget">
              Adjusted daily
            </dt>
            <dd>{money(s.adjustedDailyBudget)}</dd>
          </div>
        </dl>
      </div>

      <div className="month-bar">
        <div className="month-bar-labels">
          <span>
            <span className="muted">This cycle </span>
            {money(s.spentThisMonth)} <span className="muted">of {money(s.monthlyBudget)}</span>
          </span>
        </div>
        <div className="bar">
          <div
            className={`bar-fill ${monthOver ? 'over' : ''}`}
            style={{ width: `${Math.min(100, monthFraction * 100)}%` }}
          />
        </div>
        <div className="month-bar-labels">
          <span className={monthOver ? 'neg' : 'pos'}>
            {monthOver ? `${money(-s.remainingThisMonth)} over budget` : `${money(s.remainingThisMonth)} remaining`}
          </span>
          <span className="muted">
            {s.daysLeft} day{s.daysLeft === 1 ? '' : 's'} left
          </span>
        </div>
      </div>
    </section>
  )
}
