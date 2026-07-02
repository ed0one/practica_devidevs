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

  it('rolls an overnight interval end to the next day', () => {
    const row = buildTaskRow(
      { ...base, deadline: '2026-07-01', start_time: '22:00', end_time: '02:00' },
      'u',
      ''
    )
    expect(row.scheduled_start).toBe('2026-07-01T22:00:00')
    expect(row.scheduled_end).toBe('2026-07-02T02:00:00') // ziua următoare
  })

  it('keeps end on the same day for a normal interval', () => {
    const row = buildTaskRow(
      { ...base, deadline: '2026-07-01', start_time: '09:00', end_time: '17:00' },
      'u',
      ''
    )
    expect(row.scheduled_end).toBe('2026-07-01T17:00:00')
  })

  it('uses the user timezone for the no-deadline fallback date near midnight', () => {
    // 22:30 UTC == 01:30 ziua următoare în Bucharest (vara, +3)
    const today = new Date('2026-07-01T22:30:00Z')
    const row = buildTaskRow({ ...base, start_time: '09:00' }, 'u', '', today, 'Europe/Bucharest')
    expect(row.scheduled_date).toBe('2026-07-02') // ziua userului, nu UTC (2026-07-01)
    expect(row.scheduled_start).toBe('2026-07-02T09:00:00')
  })

  it('falls back to UTC date when no timezone is provided', () => {
    const today = new Date('2026-07-01T22:30:00Z')
    const row = buildTaskRow({ ...base, start_time: '09:00' }, 'u', '', today)
    expect(row.scheduled_date).toBe('2026-07-01')
  })
})
