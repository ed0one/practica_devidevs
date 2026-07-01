import { describe, it, expect } from 'vitest'
import { addDays, nextOccurrence } from './recurrence'
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
    recurrence: 'none',
    ...over,
  }
}

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-07-01', 1)).toBe('2026-07-02')
  })
  it('rolls over month boundaries', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
  })
  it('adds a week', () => {
    expect(addDays('2026-07-01', 7)).toBe('2026-07-08')
  })
  it('works from a full ISO timestamp', () => {
    expect(addDays('2026-02-28T09:00:00+00:00', 1)).toBe('2026-03-01')
  })
})

describe('nextOccurrence', () => {
  it('returns null for non-recurring tasks', () => {
    expect(nextOccurrence(makeTask({ recurrence: 'none' }))).toBeNull()
  })

  it('shifts a daily task deadline by one day', () => {
    const next = nextOccurrence(makeTask({ recurrence: 'daily', deadline: '2026-07-01' }))
    expect(next?.deadline).toBe('2026-07-02')
    expect(next?.status).toBe('pending')
    expect(next?.recurrence).toBe('daily')
  })

  it('shifts a weekly task deadline by seven days', () => {
    const next = nextOccurrence(makeTask({ recurrence: 'weekly', deadline: '2026-07-01' }))
    expect(next?.deadline).toBe('2026-07-08')
  })

  it('shifts scheduled timestamps while preserving the time part', () => {
    const next = nextOccurrence(
      makeTask({
        recurrence: 'daily',
        scheduled_date: '2026-07-01',
        scheduled_start: '2026-07-01T09:00:00',
        scheduled_end: '2026-07-01T10:30:00',
      })
    )
    expect(next?.scheduled_date).toBe('2026-07-02')
    expect(next?.scheduled_start).toBe('2026-07-02T09:00:00')
    expect(next?.scheduled_end).toBe('2026-07-02T10:30:00')
  })

  it('carries over title, priority, category and user', () => {
    const next = nextOccurrence(
      makeTask({ recurrence: 'weekly', title: 'Standup', priority: 'high', category: 'muncă', user_id: 'abc' })
    )
    expect(next).toMatchObject({ title: 'Standup', priority: 'high', category: 'muncă', user_id: 'abc' })
  })

  it('keeps deadline null but still produces a row', () => {
    const next = nextOccurrence(makeTask({ recurrence: 'daily', deadline: null }))
    expect(next).not.toBeNull()
    expect(next?.deadline).toBeNull()
  })
})
