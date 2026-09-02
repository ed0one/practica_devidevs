// Helpers de dată în fusul LOCAL al browserului/serverului, fără round-trip
// prin UTC. `toISOString()` pe un Date de la miezul nopții local cade pe ziua
// precedentă în orice fus cu offset pozitiv (România = UTC+2/+3), de aceea
// toate conversiile de mai jos lucrează pe componentele locale.

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// "YYYY-MM-DD" (sau orice string care începe așa) → Date la miezul nopții local.
export function parseLocalDate(str: string): Date {
  const [y, m, d] = str.substring(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysStr(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

// Compară doar partea de dată: "2026-09-02" < "2026-09-03" lexicografic.
export function isBeforeToday(dateStr: string, now: Date = new Date()): boolean {
  return dateStr.substring(0, 10) < localDateStr(now)
}
