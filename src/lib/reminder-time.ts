// Interpretare corectă a orelor local-naive ("YYYY-MM-DDTHH:MM:SS", fără `Z`)
// în timezone-ul IANA al userului. Fără librării externe.
//
// De ce există: task-urile stochează scheduled_start/deadline ca oră de perete
// în fusul userului. `new Date(naiv)` le-ar interpreta în fusul SERVERULUI (UTC
// pe Vercel), deci reminderul ar fi calculat cu 2-3 ore greșit. Aici derivăm
// epoch-ul real folosind offset-ul fusului chiar la momentul țintă.

const NAIVE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/

// Offset-ul (ms) al unui timezone IANA la un instant `date` dat.
function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23', // miezul nopții = "00", nu "24"
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, number> = {}
  for (const { type, value } of dtf.formatToParts(date)) {
    if (type !== 'literal') p[type] = Number(value)
  }
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUTC - date.getTime()
}

// Interpretează un string local-naiv ca oră de perete în `tz` → epoch ms.
// Al doilea pas de corecție elimină eroarea de la limita de DST (offset-ul
// evaluat la momentul țintă real, nu la un guess fix).
export function zonedNaiveToEpoch(naive: string, tz: string): number {
  const m = NAIVE_RE.exec(naive)
  if (!m) return NaN
  const [, y, mo, d, h, mi, s] = m
  const wallUTC = Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0)
  let offset = tzOffsetMs(new Date(wallUTC), tz)
  offset = tzOffsetMs(new Date(wallUTC - offset), tz)
  return wallUTC - offset
}

// Data locală (YYYY-MM-DD) a unui instant într-un timezone IANA. Folosită la
// crearea task-urilor fără deadline: „azi" trebuie să fie ziua userului, nu a
// serverului (UTC pe Vercel), altfel lângă miezul nopții cade pe ziua greșită.
export function zonedDateString(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export interface ReminderInput {
  scheduled_start: string | null
  deadline: string | null
  reminder_offset_min?: number | null
}

// Momentul (epoch ms) la care trebuie trimis reminderul, în fusul userului,
// sau null dacă task-ul n-are ancoră temporală. Ancoră: scheduled_start,
// altfel deadline la 09:00 local naive.
export function reminderFireAt(task: ReminderInput, tz: string): number | null {
  const anchor =
    task.scheduled_start ??
    (task.deadline ? `${task.deadline.substring(0, 10)}T09:00:00` : null)
  if (!anchor) return null

  const dueMs = zonedNaiveToEpoch(anchor, tz)
  if (Number.isNaN(dueMs)) return null

  return dueMs - (task.reminder_offset_min ?? 0) * 60_000
}
