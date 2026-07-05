import type { Task } from '@/types/task'

// Escape conform RFC 5545: virgulă, punct-virgulă, backslash și newline.
function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// "2026-07-04T09:00:00" → "20260704T090000" (fără Z: timp local, floating).
function toIcsLocal(dt: string): string {
  return dt.replace(/[-:]/g, '').substring(0, 15)
}

// "2026-07-04" → "20260704" (VALUE=DATE, pentru evenimente all-day).
function toIcsDate(dateStr: string): string {
  return dateStr.substring(0, 10).replace(/-/g, '')
}

function addDayIcsDate(dateStr: string): string {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number)
  const dt = new Date(y, m - 1, d + 1)
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`
}

// Împachetează liniile lungi la 75 de octeți (RFC 5545 line folding).
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.substring(0, 75))
  rest = rest.substring(75)
  while (rest.length > 74) {
    parts.push(' ' + rest.substring(0, 74))
    rest = rest.substring(74)
  }
  if (rest.length) parts.push(' ' + rest)
  return parts.join('\r\n')
}

function veventFor(task: Task, now: string): string[] {
  const lines: string[] = ['BEGIN:VEVENT', `UID:${task.id}@taskcapture.xyz`, `DTSTAMP:${now}`]

  if (task.all_day && (task.scheduled_date || task.deadline)) {
    const day = (task.scheduled_date || task.deadline)!.substring(0, 10)
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(day)}`)
    lines.push(`DTEND;VALUE=DATE:${addDayIcsDate(day)}`) // DTEND e exclusiv
  } else if (task.scheduled_start) {
    lines.push(`DTSTART:${toIcsLocal(task.scheduled_start)}`)
    if (task.scheduled_end) lines.push(`DTEND:${toIcsLocal(task.scheduled_end)}`)
  } else if (task.deadline) {
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(task.deadline)}`)
  } else {
    return [] // fără nicio dată nu putem plasa evenimentul
  }

  lines.push(`SUMMARY:${escapeIcs(task.title)}`)
  if (task.description) lines.push(`DESCRIPTION:${escapeIcs(task.description)}`)
  if (task.location) lines.push(`LOCATION:${escapeIcs(task.location)}`)
  lines.push(`STATUS:${task.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`)
  lines.push('END:VEVENT')
  return lines.map(fold)
}

// Serializează task-urile într-un calendar iCalendar (RFC 5545), abonabil în
// Google/iOS Calendar. Pură și testabilă.
export function tasksToIcs(tasks: Task[], now: Date = new Date()): string {
  const stamp = toIcsLocal(now.toISOString().replace(/\..*/, '')) + 'Z'
  const head = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskCapture//RO//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TaskCapture',
  ]
  const body = tasks.flatMap((t) => veventFor(t, stamp))
  return [...head, ...body, 'END:VCALENDAR'].join('\r\n')
}
