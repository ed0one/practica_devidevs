// Coloanele adăugate de migrația 011. Dacă migrația nu a fost rulată încă,
// PostgREST răspunde cu „column not found in schema cache" la INSERT/UPDATE;
// rutele reîncearcă fără aceste câmpuri ca aplicația să meargă în continuare.
export const OPTIONAL_TASK_COLUMNS = ['board_column', 'completed_at'] as const

type OptionalColumn = (typeof OPTIONAL_TASK_COLUMNS)[number]

export function isMissingColumnError(
  err: { code?: string; message?: string } | null | undefined
): boolean {
  if (!err) return false
  if (err.code === 'PGRST204' || err.code === '42703') return true
  const m = err.message?.toLowerCase() ?? ''
  return m.includes('column') && (m.includes('schema cache') || m.includes('does not exist'))
}

export function stripOptionalColumns<T extends object>(row: T): Omit<T, OptionalColumn> {
  const copy = { ...row } as Record<string, unknown>
  for (const c of OPTIONAL_TASK_COLUMNS) delete copy[c]
  return copy as Omit<T, OptionalColumn>
}

export function hasOptionalColumns(row: object): boolean {
  return OPTIONAL_TASK_COLUMNS.some((c) => c in row)
}

// Mesaj unic pentru UI când o operație depinde strict de migrația 011.
export const MIGRATION_011_MESSAGE =
  'Rulează migrația 011_board_column.sql în Supabase ca să salvezi coloana Kanban.'
