import type { Task, Priority, Status } from '@/types/task'

export interface TaskStats {
  total: number
  byStatus: Record<Status, number>
  byPriority: Record<Priority, number>
  byCategory: Record<string, number>
  overdue: number
  completionRate: number // 0..1
  dueNext7Days: number
  scheduled: number
}

// Compară doar partea de dată (YYYY-MM-DD), local, fără round-trip UTC.
function todayStr(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return todayStr(dt)
}

// Agregări pure peste lista de task-uri. Fără I/O — ușor de testat.
export function computeStats(tasks: Task[], now: Date = new Date()): TaskStats {
  const today = todayStr(now)
  const in7 = addDaysStr(today, 7)

  const stats: TaskStats = {
    total: tasks.length,
    byStatus: { pending: 0, done: 0 },
    byPriority: { low: 0, medium: 0, high: 0 },
    byCategory: {},
    overdue: 0,
    completionRate: 0,
    dueNext7Days: 0,
    scheduled: 0,
  }

  for (const t of tasks) {
    stats.byStatus[t.status] = (stats.byStatus[t.status] ?? 0) + 1
    stats.byPriority[t.priority] = (stats.byPriority[t.priority] ?? 0) + 1
    if (t.category) stats.byCategory[t.category] = (stats.byCategory[t.category] ?? 0) + 1
    if (t.scheduled_start) stats.scheduled += 1

    const dl = t.deadline?.substring(0, 10)
    if (dl && t.status === 'pending') {
      if (dl < today) stats.overdue += 1
      else if (dl <= in7) stats.dueNext7Days += 1
    }
  }

  stats.completionRate = tasks.length > 0 ? stats.byStatus.done / tasks.length : 0
  return stats
}
