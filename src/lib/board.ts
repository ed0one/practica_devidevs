import type { Task, BoardColumn } from '@/types/task'

// Cele patru coloane din mockup, în ordinea afișării.
export const BOARD_COLUMNS: { id: BoardColumn; label: string; dot: string; badge: string }[] = [
  { id: 'todo', label: 'De făcut', dot: 'bg-[#94a3b8]', badge: 'bg-white/10 text-white/80' },
  { id: 'inprogress', label: 'În lucru', dot: 'bg-[#f97316]', badge: 'bg-orange-500/20 text-orange-400' },
  { id: 'review', label: 'În verificare', dot: 'bg-[#38bdf8]', badge: 'bg-sky-500/20 text-sky-400' },
  { id: 'blocked', label: 'Blocate', dot: 'bg-[#ef4444]', badge: 'bg-red-500/20 text-red-400' },
]

export const BOARD_COLUMN_IDS = BOARD_COLUMNS.map((c) => c.id)

export function isBoardColumn(v: unknown): v is BoardColumn {
  return typeof v === 'string' && (BOARD_COLUMN_IDS as string[]).includes(v)
}

export function boardColumnLabel(col: BoardColumn): string {
  return BOARD_COLUMNS.find((c) => c.id === col)?.label ?? col
}

// Rândurile create înainte de migrația 011 nu au coloana → intră în „De făcut".
export function boardColumnOf(task: Pick<Task, 'board_column'>): BoardColumn {
  return isBoardColumn(task.board_column) ? task.board_column : 'todo'
}

function byDeadline(a: Task, b: Task): number {
  const da = a.deadline?.substring(0, 10) ?? '9999-99-99'
  const db = b.deadline?.substring(0, 10) ?? '9999-99-99'
  if (da !== db) return da < db ? -1 : 1
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
}

// Grupează pe coloane: active întâi (după deadline, fără deadline la coadă),
// apoi cele finalizate, ca să rămână vizibile dar să nu ocupe capul coloanei.
export function groupByColumn(tasks: Task[]): Record<BoardColumn, Task[]> {
  const groups: Record<BoardColumn, Task[]> = { todo: [], inprogress: [], review: [], blocked: [] }
  for (const t of tasks) groups[boardColumnOf(t)].push(t)
  for (const col of BOARD_COLUMN_IDS) {
    const pending = groups[col].filter((t) => t.status !== 'done').sort(byDeadline)
    const done = groups[col].filter((t) => t.status === 'done').sort(byDeadline)
    groups[col] = [...pending, ...done]
  }
  return groups
}
