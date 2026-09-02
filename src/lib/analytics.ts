import type { Task, Priority } from '@/types/task'
import { localDateStr, addDaysStr, parseLocalDate, isBeforeToday } from './dates'
import { boardColumnOf } from './board'

export interface VelocityPoint {
  date: string // YYYY-MM-DD local
  label: string // ziua din lună, fără zero în față
  count: number
}

// Câte task-uri au fost finalizate în fiecare din ultimele `days` zile
// (inclusiv azi). Folosește `completed_at` (migrația 011); rândurile mai vechi
// fără completed_at cad pe created_at ca să nu dispară din grafic.
export function velocitySeries(tasks: Task[], now: Date = new Date(), days = 7): VelocityPoint[] {
  const today = localDateStr(now)
  const start = addDaysStr(today, -(days - 1))
  const buckets = new Map<string, number>()
  for (let i = 0; i < days; i++) buckets.set(addDaysStr(start, i), 0)

  for (const t of tasks) {
    if (t.status !== 'done') continue
    const stamp = t.completed_at ?? t.created_at
    if (!stamp) continue
    const day = localDateStr(new Date(stamp))
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1)
  }

  return [...buckets.entries()].map(([date, count]) => ({
    date,
    label: String(parseLocalDate(date).getDate()),
    count,
  }))
}

// Maximul axei: cel puțin 3 și multiplu de 3, ca să avem patru etichete întregi.
export function niceAxisMax(max: number): number {
  return Math.max(3, Math.ceil(max / 3) * 3)
}

export function axisTicks(max: number): number[] {
  const top = niceAxisMax(max)
  const step = top / 3
  return [top, step * 2, step, 0]
}

export interface PriorityBar {
  key: Priority | 'blocked'
  label: string
  count: number
}

// Doar task-urile active contează; „Blocate" = coloana Kanban blocked.
export function priorityBars(tasks: Task[]): PriorityBar[] {
  const pending = tasks.filter((t) => t.status !== 'done')
  const count = (p: Priority) => pending.filter((t) => t.priority === p).length
  return [
    { key: 'high', label: 'Urgente', count: count('high') },
    { key: 'medium', label: 'Medii', count: count('medium') },
    { key: 'low', label: 'Scăzute', count: count('low') },
    { key: 'blocked', label: 'Blocate', count: pending.filter((t) => boardColumnOf(t) === 'blocked').length },
  ]
}

export function completion(tasks: Task[]): { done: number; total: number; pct: number } {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export function overdueCount(tasks: Task[], now: Date = new Date()): number {
  return tasks.filter((t) => t.status !== 'done' && t.deadline && isBeforeToday(t.deadline, now)).length
}
