import { useRef, useState } from 'react'
import { cycleFor, round2 } from '../budget'
import { money } from '../format'
import type { Store } from '../store'

interface Props {
  store: Store
  today: Date
  notify: (message: string) => void
}

export function SettingsView({ store, today, notify }: Props) {
  const { settings, setSettings } = store
  const [budget, setBudget] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : '')
  const [cycleDay, setCycleDay] = useState(String(settings.cycleStartDay))
  const fileInput = useRef<HTMLInputElement>(null)

  const parsedBudget = Number(budget)
  const budgetValid = budget.trim() !== '' && Number.isFinite(parsedBudget) && parsedBudget >= 0

  const parsedCycleDay = Math.round(Number(cycleDay))
  const cycleDayValid = cycleDay.trim() !== '' && Number.isFinite(parsedCycleDay) && parsedCycleDay >= 1 && parsedCycleDay <= 31

  const previewCycle = cycleDayValid ? cycleFor(today, parsedCycleDay) : null
  const previewDays = previewCycle
    ? Math.round((previewCycle.end.getTime() - previewCycle.start.getTime()) / 86_400_000) + 1
    : 0
  const preview = budgetValid && previewDays > 0 ? round2(parsedBudget / previewDays) : 0

  function save() {
    if (!budgetValid || !cycleDayValid) return
    setSettings({ ...settings, monthlyBudget: round2(parsedBudget), cycleStartDay: parsedCycleDay })
    notify('Budget saved')
  }

  function exportFile() {
    const blob = new Blob([store.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spendwise-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file: File) {
    try {
      const count = store.importData(await file.text())
      notify(`Imported ${count} expenses`)
    } catch (err) {
      notify(`Import failed: ${(err as Error).message}`)
    }
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Budget cycle</h2>
        <form
          className="expense-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <label className="field-label">
            Budget per cycle
            <input
              className="field"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="e.g. 30000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              aria-label="Budget per cycle"
            />
          </label>

          <label className="field-label">
            Cycle starts on day
            <input
              className="field"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={cycleDay}
              onChange={(e) => setCycleDay(e.target.value)}
              aria-label="Cycle start day"
            />
          </label>
          <p className="muted small">
            Your salary usually lands around the 25th (a little earlier if that's a Friday or a holiday) — set the
            day your budget cycle should restart. Use 1 for a plain calendar month.
          </p>

          {budgetValid && cycleDayValid && parsedBudget > 0 && previewCycle && (
            <p className="muted small">
              That's {money(preview)} per day, over {previewDays} days
              {parsedCycleDay !== 1 &&
                ` (${previewCycle.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${previewCycle.end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })})`}
              .
            </p>
          )}

          <button className="btn primary" type="submit" disabled={!budgetValid || !cycleDayValid}>
            Save
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">Your data</h2>
        <p className="muted small">
          Everything is stored on this device only. Export a backup to move it to another device.
        </p>
        <div className="row">
          <button className="btn secondary grow" onClick={exportFile}>
            Export backup
          </button>
          <button className="btn secondary grow" onClick={() => fileInput.current?.click()}>
            Import backup
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && confirm('Importing replaces all current expenses. Continue?')) importFile(f)
            e.target.value = ''
          }}
        />
      </section>
    </>
  )
}
