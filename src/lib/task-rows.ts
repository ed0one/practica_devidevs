import type { ParsedTaskInput } from './schemas'
import type { Priority } from '@/types/task'

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
  today: Date = new Date()
): TaskRow {
  const dateStr = t.deadline ?? today.toISOString().substring(0, 10)
  const hasTime = Boolean(t.start_time || t.end_time)
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
    scheduled_end: t.end_time ? `${dateStr}T${t.end_time}:00` : null,
  }
}
