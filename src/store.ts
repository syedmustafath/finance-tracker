import { useCallback, useEffect, useState } from 'react'
import type { Expense, Settings } from './budget'

const EXPENSES_KEY = 'spendwise.expenses.v1'
const SETTINGS_KEY = 'spendwise.settings.v1'

export const DEFAULT_SETTINGS: Settings = { monthlyBudget: 0, currency: 'USD' }

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function usePersistent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback))
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable; keep working in memory
    }
  }, [key, value])
  return [value, setValue] as const
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function useStore() {
  const [expenses, setExpenses] = usePersistent<Expense[]>(EXPENSES_KEY, [])
  const [settings, setSettings] = usePersistent<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS)

  const addExpense = useCallback(
    (e: Omit<Expense, 'id' | 'createdAt'>) =>
      setExpenses((list) => [...list, { ...e, id: newId(), createdAt: Date.now() }]),
    [setExpenses],
  )

  const updateExpense = useCallback(
    (id: string, patch: Partial<Omit<Expense, 'id'>>) =>
      setExpenses((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [setExpenses],
  )

  const deleteExpense = useCallback(
    (id: string) => setExpenses((list) => list.filter((e) => e.id !== id)),
    [setExpenses],
  )

  const restoreExpense = useCallback(
    (e: Expense) => setExpenses((list) => (list.some((x) => x.id === e.id) ? list : [...list, e])),
    [setExpenses],
  )

  const exportData = useCallback(
    () => JSON.stringify({ version: 1, settings, expenses }, null, 2),
    [settings, expenses],
  )

  const importData = useCallback(
    (json: string) => {
      const data = JSON.parse(json)
      if (!Array.isArray(data?.expenses)) throw new Error('No expenses found in file')
      const valid = (data.expenses as Expense[]).filter(
        (e) => typeof e.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(e.amount),
      )
      setExpenses(valid)
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
      return valid.length
    },
    [setExpenses, setSettings],
  )

  return {
    expenses,
    settings,
    setSettings,
    addExpense,
    updateExpense,
    deleteExpense,
    restoreExpense,
    exportData,
    importData,
  }
}

export type Store = ReturnType<typeof useStore>
