import { describe, it, expect } from 'vitest'
import { isMissingColumnError, stripOptionalColumns } from './optional-columns'

describe('optional-columns', () => {
  it('recognises the PostgREST schema-cache error for a missing column', () => {
    expect(isMissingColumnError({ code: 'PGRST204', message: "Could not find the 'board_column' column of 'tasks' in the schema cache" })).toBe(true)
    expect(isMissingColumnError({ code: '42703', message: 'column "completed_at" of relation "tasks" does not exist' })).toBe(true)
    expect(isMissingColumnError({ code: '23505', message: 'duplicate key' })).toBe(false)
    expect(isMissingColumnError(null)).toBe(false)
  })

  it('strips only the optional columns', () => {
    const out = stripOptionalColumns({ title: 'x', board_column: 'todo', completed_at: null, status: 'done' })
    expect(out).toEqual({ title: 'x', status: 'done' })
  })
})
