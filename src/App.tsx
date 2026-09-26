import { useCallback, useEffect, useRef, useState } from 'react'
import { toISODate, type Expense } from './budget'
import { money } from './format'
import { applyUpdate, SW_UPDATE_EVENT } from './registerSW'
import { useStore } from './store'
import { EditSheet } from './components/EditSheet'
import { HistoryView } from './components/HistoryView'
import { SettingsView } from './components/SettingsView'
import { TodayView } from './components/TodayView'

type Tab = 'today' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { id: 'history', label: 'History', icon: 'M12 7v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' },
  {
    id: 'settings',
    label: 'Budget',
    icon: 'M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4',
  },
]

/** Current date that rolls over at midnight without a reload */
function useToday() {
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const tick = () =>
      setToday((prev) => {
        const now = new Date()
        return toISODate(now) === toISODate(prev) ? prev : now
      })
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}

interface Toast {
  message: string
  action?: { label: string; onClick: () => void }
  /** Sticky toasts (e.g. the update prompt) don't auto-dismiss */
  sticky?: boolean
}

export default function App() {
  const store = useStore()
  const today = useToday()
  const [tab, setTab] = useState<Tab>('today')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const notify = useCallback((message: string, undo?: () => void) => {
    window.clearTimeout(toastTimer.current)
    setToast({ message, action: undo && { label: 'Undo', onClick: undo } })
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }, [])

  useEffect(() => {
    const onUpdateReady = (e: Event) => {
      const reg = (e as CustomEvent<ServiceWorkerRegistration>).detail
      window.clearTimeout(toastTimer.current)
      setToast({
        message: 'A new version of Spendwise is ready',
        action: { label: 'Reload', onClick: () => applyUpdate(reg) },
        sticky: true,
      })
    }
    window.addEventListener(SW_UPDATE_EVENT, onUpdateReady)
    return () => window.removeEventListener(SW_UPDATE_EVENT, onUpdateReady)
  }, [])

  const closeSheet = useCallback(() => setEditing(null), [])

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="muted small">
            {today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1>{TABS.find((t) => t.id === tab)!.label}</h1>
        </div>
      </header>

      <main className="content">
        {tab === 'today' && (
          <TodayView
            store={store}
            today={today}
            onEdit={setEditing}
            onAdded={notify}
            onOpenSettings={() => setTab('settings')}
          />
        )}
        {tab === 'history' && <HistoryView store={store} today={today} onEdit={setEditing} />}
        {tab === 'settings' && <SettingsView store={store} today={today} notify={notify} />}
      </main>

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={t.icon} />
            </svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {editing && (
        <EditSheet
          key={editing.id}
          expense={editing}
          currency={store.settings.currency}
          onClose={closeSheet}
          onSave={(patch) => {
            store.updateExpense(editing.id, patch)
            setEditing(null)
            notify('Expense updated')
          }}
          onDelete={() => {
            const removed = editing
            store.deleteExpense(removed.id)
            setEditing(null)
            notify(`Deleted ${money(removed.amount, store.settings.currency)}`, () => store.restoreExpense(removed))
          }}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              className="toast-action"
              onClick={() => {
                toast.action!.onClick()
                setToast(null)
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
