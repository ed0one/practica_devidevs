import type { Task } from '@/types/task'

// Escapează un câmp CSV: dublează ghilimelele, învelește în ghilimele și
// neutralizează formula injection (=, +, -, @, tab, CR la început) prefixând
// cu apostrof — convenția prin care Excel/Sheets tratează celula ca text.
export function csvCell(value: string | null | undefined): string {
  let v = value ?? ''
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

export const CSV_HEADER = ['Titlu', 'Prioritate', 'Status', 'Deadline', 'Categorie', 'Creat la']

// Construiește conținutul CSV (fără BOM) din lista de task-uri.
export function tasksToCsv(tasks: Task[]): string {
  const rows = tasks.map((t) => [
    t.title,
    t.priority,
    t.status,
    t.deadline ? t.deadline.substring(0, 10) : '',
    t.category ?? '',
    t.created_at.substring(0, 10),
  ])
  return [CSV_HEADER, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}
