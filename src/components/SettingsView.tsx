import { useRef, useState } from 'react'
import { daysInMonth, monthKey, round2 } from '../budget'
import { money } from '../format'
import type { Store } from '../store'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'SAR', 'CAD', 'AUD', 'SGD', 'JPY']

interface Props {
  store: Store
  today: Date
  notify: (message: string) => void
}

export function SettingsView({ store, today, notify }: Props) {
  const { settings, setSettings } = store
  const [budget, setBudget] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : '')
  const fileInput = useRef<HTMLInputElement>(null)

  const parsed = Number(budget)
  const budgetValid = budget.trim() !== '' && Number.isFinite(parsed) && parsed >= 0
  const preview = budgetValid ? round2(parsed / daysInMonth(monthKey(today))) : 0

  function saveBudget() {
    if (!budgetValid) return
    setSettings({ ...settings, monthlyBudget: round2(parsed) })
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
        <h2 className="card-title">Monthly budget</h2>
        <form
          className="expense-form"
          onSubmit={(e) => {
            e.preventDefault()
            saveBudget()
          }}
        >
          <input
            className="field"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="e.g. 3000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="Monthly budget"
          />
          {budgetValid && parsed > 0 && (
            <p className="muted small">
              That's about {money(preview, settings.currency)} per day this month.
            </p>
          )}
          <button className="btn primary" type="submit" disabled={!budgetValid}>
            Save budget
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">Currency</h2>
        <select
          className="field"
          value={settings.currency}
          onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          aria-label="Currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
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
