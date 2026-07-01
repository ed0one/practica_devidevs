import { describe, it, expect } from 'vitest'
import { buildTaskRow } from './task-rows'
import type { ParsedTaskInput } from './schemas'

const base: ParsedTaskInput = {
  title: 'Task',
  deadline: null,
  priority: 'medium',
  category: null,
  start_time: null,
  end_time: null,
}

describe('buildTaskRow', () => {
  it('sets core fields and pending status', () => {
    const row = buildTaskRow(base, 'user-1', 'raw text')
    expect(row).toMatchObject({
      user_id: 'user-1',
      title: 'Task',
      status: 'pending',
      raw_input: 'raw text',
    })
  })

  it('leaves scheduling null when no times are given', () => {
    const row = buildTaskRow(base, 'u', '')
    expect(row.scheduled_date).toBeNull()
    expect(row.scheduled_start).toBeNull()
    expect(row.scheduled_end).toBeNull()
  })

  it('builds scheduled timestamps from deadline + times', () => {
    const row = buildTaskRow(
      { ...base, deadline: '2026-07-01', start_time: '09:00', end_time: '10:30' },
      'u',
      ''
    )
    expect(row.scheduled_date).toBe('2026-07-01')
    expect(row.scheduled_start).toBe('2026-07-01T09:00:00')
    expect(row.scheduled_end).toBe('2026-07-01T10:30:00')
  })

  it('falls back to today when there is a time but no deadline', () => {
    const today = new Date('2026-03-15T12:00:00Z')
    const row = buildTaskRow({ ...base, start_time: '08:00' }, 'u', '', today)
    expect(row.scheduled_date).toBe('2026-03-15')
    expect(row.scheduled_start).toBe('2026-03-15T08:00:00')
    expect(row.scheduled_end).toBeNull()
  })
})
