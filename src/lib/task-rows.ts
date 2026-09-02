import type { ParsedTaskInput } from './schemas'
import type { Priority } from '@/types/task'
import { addDays } from './recurrence'
import { zonedDateString } from './reminder-time'

export interface TaskRow {
  user_id: string
  title: string
  deadline: string | null
  priority: Priority
  category: string | null
  status: 'pending'
  raw_input: string | null
  scheduled_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  description?: string | null
  all_day?: boolean
  location?: string | null
  color?: string | null
  subtasks?: Array<{ id: string; title: string; done: boolean }>
  recurrence?: 'none' | 'daily' | 'weekly'
  reminder_offset_min?: number | null
  board_column?: 'todo' | 'inprogress' | 'review' | 'blocked'
}

// Transformă un task extras de AI într-un rând pentru tabela `tasks`,
// derivând câmpurile de programare din deadline + ore. Pură și testabilă.
export function buildTaskRow(
  t: ParsedTaskInput,
  userId: string,
  rawInput: string,
  today: Date = new Date(),
  tz?: string
): TaskRow {
  // fără deadline → „azi" în fusul userului (dacă îl știm), altfel UTC
  const fallbackDate = tz ? zonedDateString(today, tz) : today.toISOString().substring(0, 10)
  const dateStr = t.deadline ?? fallbackDate
  const hasTime = Boolean(t.start_time || t.end_time)

  // Interval peste noapte (ex: "de la 22:00 la 02:00"): end_time e mai mic decât
  // start_time → sfârșitul cade în ziua următoare. Altfel scheduled_end ar fi
  // înaintea lui scheduled_start și calendarul ar desena un bloc negativ.
  const overnight = Boolean(t.start_time && t.end_time && t.end_time < t.start_time)
  const endDateStr = overnight ? addDays(dateStr, 1) : dateStr

  const row: TaskRow = {
    user_id: userId,
    title: t.title,
    deadline: t.deadline,
    priority: t.priority,
    category: t.category,
    status: 'pending',
    raw_input: rawInput,
    scheduled_date: hasTime ? dateStr : null,
    scheduled_start: t.start_time ? `${dateStr}T${t.start_time}:00` : null,
    scheduled_end: t.end_time ? `${endDateStr}T${t.end_time}:00` : null,
  }

  if (t.description !== undefined) row.description = t.description
  if (t.all_day !== undefined) row.all_day = t.all_day
  if (t.location !== undefined) row.location = t.location
  if (t.color !== undefined) row.color = t.color
  if (t.subtasks !== undefined) row.subtasks = t.subtasks
  if (t.recurrence !== undefined) row.recurrence = t.recurrence
  if (t.reminder_offset_min !== undefined) row.reminder_offset_min = t.reminder_offset_min
  if (t.board_column !== undefined) row.board_column = t.board_column

  return row
}
