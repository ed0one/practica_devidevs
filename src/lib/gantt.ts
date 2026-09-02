import type { Task } from '@/types/task'
import { localDateStr, addDaysStr, parseLocalDate } from './dates'

export interface GanttRange {
  start: string
  end: string
  days: string[] // YYYY-MM-DD, consecutive
}

// Intervalul afișat: `weeks` săptămâni începând cu lunea săptămânii ancorei.
export function ganttRange(anchor: Date, weeks = 4): GanttRange {
  const dow = anchor.getDay() // 0 = duminică
  const offsetToMonday = (dow + 6) % 7
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offsetToMonday)
  const start = localDateStr(monday)
  const total = weeks * 7
  const days = Array.from({ length: total }, (_, i) => addDaysStr(start, i))
  return { start, end: days[total - 1], days }
}

export interface GanttRow {
  task: Task
  startIdx: number
  endIdx: number
  milestone: boolean
  clippedStart: boolean
  clippedEnd: boolean
}

function taskSpan(t: Task): { start: string; end: string } | null {
  const deadline = t.deadline?.substring(0, 10) ?? null
  const scheduled = t.scheduled_date?.substring(0, 10) ?? null
  if (!deadline && !scheduled) return null
  const created = localDateStr(new Date(t.created_at))
  // Începutul: ziua programată dacă există; altfel ziua creării (dar nu după deadline).
  let start = scheduled ?? (deadline && created < deadline ? created : deadline!)
  let end = deadline ?? scheduled!
  if (end < start) [start, end] = [end, start]
  return { start, end }
}

// Rândurile din Gantt: task-urile ale căror intervale ating fereastra,
// tăiate la marginile ei, sortate după început.
export function ganttRows(tasks: Task[], range: GanttRange): GanttRow[] {
  const rows: GanttRow[] = []
  for (const task of tasks) {
    const span = taskSpan(task)
    if (!span) continue
    if (span.end < range.start || span.start > range.end) continue
    const clippedStart = span.start < range.start
    const clippedEnd = span.end > range.end
    const startIdx = clippedStart ? 0 : range.days.indexOf(span.start)
    const endIdx = clippedEnd ? range.days.length - 1 : range.days.indexOf(span.end)
    rows.push({
      task,
      startIdx,
      endIdx,
      milestone: span.start === span.end,
      clippedStart,
      clippedEnd,
    })
  }
  return rows.sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx)
}

// Indexul zilei de azi în interval, sau -1 dacă e în afara lui.
export function todayIndex(range: GanttRange, now: Date = new Date()): number {
  return range.days.indexOf(localDateStr(now))
}

export function isWeekend(dateStr: string): boolean {
  const d = parseLocalDate(dateStr).getDay()
  return d === 0 || d === 6
}
