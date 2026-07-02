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

  return {
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
}
