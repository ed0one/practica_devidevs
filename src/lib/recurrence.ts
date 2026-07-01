import type { Task, Recurrence } from '@/types/task'

// Adaugă n zile la o dată "YYYY-MM-DD..." și întoarce partea de dată "YYYY-MM-DD".
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().substring(0, 10)
}

// Deplasează doar partea de dată a unui timestamp, păstrând ora/offset-ul.
function shiftTimestamp(ts: string, n: number): string {
  return addDays(ts, n) + ts.substring(10)
}

export interface NextOccurrenceRow {
  user_id: string
  title: string
  deadline: string | null
  priority: Task['priority']
  category: string | null
  status: 'pending'
  raw_input: string | null
  scheduled_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  recurrence: Recurrence
}

// Calculează rândul următoarei apariții a unui task recurent, sau null dacă
// nu e recurent. Pură — deplasarea e cu 1 zi (daily) sau 7 zile (weekly).
export function nextOccurrence(task: Task): NextOccurrenceRow | null {
  const rec: Recurrence = task.recurrence ?? 'none'
  if (rec === 'none') return null
  const delta = rec === 'daily' ? 1 : 7

  return {
    user_id: task.user_id,
    title: task.title,
    deadline: task.deadline ? addDays(task.deadline, delta) : null,
    priority: task.priority,
    category: task.category,
    status: 'pending',
    raw_input: task.raw_input,
    scheduled_date: task.scheduled_date ? addDays(task.scheduled_date, delta) : null,
    scheduled_start: task.scheduled_start ? shiftTimestamp(task.scheduled_start, delta) : null,
    scheduled_end: task.scheduled_end ? shiftTimestamp(task.scheduled_end, delta) : null,
    recurrence: rec,
  }
}
