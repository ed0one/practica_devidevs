import { describe, it, expect } from 'vitest'
import { csvCell, tasksToCsv } from './csv'
import type { Task } from '@/types/task'

function makeTask(over: Partial<Task>): Task {
  return {
    id: '1',
    user_id: 'u',
    title: 'Task',
    deadline: null,
    priority: 'medium',
    category: null,
    status: 'pending',
    raw_input: null,
    created_at: '2026-07-01T08:00:00Z',
    scheduled_date: null,
    scheduled_start: null,
    scheduled_end: null,
    ...over,
  }
}

describe('csvCell', () => {
  it('wraps values in quotes', () => {
    expect(csvCell('hello')).toBe('"hello"')
  })

  it('escapes embedded quotes', () => {
    expect(csvCell('a "b" c')).toBe('"a ""b"" c"')
  })

  it('keeps commas safely inside quotes', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
  })

  it('neutralizes formula injection (=)', () => {
    expect(csvCell('=1+1')).toBe(`"'=1+1"`)
  })

  it('neutralizes formula injection (+, -, @)', () => {
    expect(csvCell('+x')).toBe(`"'+x"`)
    expect(csvCell('-x')).toBe(`"'-x"`)
    expect(csvCell('@x')).toBe(`"'@x"`)
  })

  it('handles null/undefined as empty string', () => {
    expect(csvCell(null)).toBe('""')
    expect(csvCell(undefined)).toBe('""')
  })
})

describe('tasksToCsv', () => {
  it('produces a header row plus one row per task', () => {
    const csv = tasksToCsv([makeTask({ title: 'A' }), makeTask({ title: 'B' })])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('Titlu')
    expect(lines[1]).toContain('"A"')
  })

  it('truncates dates to YYYY-MM-DD', () => {
    const csv = tasksToCsv([makeTask({ deadline: '2026-12-31T23:00:00Z' })])
    expect(csv).toContain('"2026-12-31"')
  })

  it('does not let a malicious title break out of its cell', () => {
    const csv = tasksToCsv([makeTask({ title: '=cmd|"/C calc"!A1' })])
    // Prefixed with apostrophe and fully quoted → stays a single field.
    expect(csv).toContain(`"'=cmd`)
  })
})
