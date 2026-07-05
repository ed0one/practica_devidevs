import { describe, it, expect } from 'vitest'
import { computeStats } from './stats'
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

const NOW = new Date(2026, 6, 5) // 2026-07-05, local

describe('computeStats', () => {
  it('returns zeroed stats for an empty list', () => {
    const s = computeStats([], NOW)
    expect(s.total).toBe(0)
    expect(s.completionRate).toBe(0)
    expect(s.byStatus).toEqual({ pending: 0, done: 0 })
  })

  it('counts by status and computes completion rate', () => {
    const s = computeStats(
      [
        makeTask({ status: 'done' }),
        makeTask({ status: 'done' }),
        makeTask({ status: 'pending' }),
        makeTask({ status: 'pending' }),
      ],
      NOW
    )
    expect(s.total).toBe(4)
    expect(s.byStatus).toEqual({ pending: 2, done: 2 })
    expect(s.completionRate).toBe(0.5)
  })

  it('counts by priority and category', () => {
    const s = computeStats(
      [
        makeTask({ priority: 'high', category: 'work' }),
        makeTask({ priority: 'high', category: 'work' }),
        makeTask({ priority: 'low', category: 'home' }),
        makeTask({ priority: 'medium', category: null }),
      ],
      NOW
    )
    expect(s.byPriority).toEqual({ low: 1, medium: 1, high: 2 })
    expect(s.byCategory).toEqual({ work: 2, home: 1 })
  })

  it('flags overdue only for pending tasks past deadline', () => {
    const s = computeStats(
      [
        makeTask({ deadline: '2026-07-01', status: 'pending' }), // overdue
        makeTask({ deadline: '2026-07-01', status: 'done' }), // not counted
        makeTask({ deadline: '2026-07-05', status: 'pending' }), // today, not overdue
      ],
      NOW
    )
    expect(s.overdue).toBe(1)
  })

  it('counts tasks due in the next 7 days (inclusive), excluding overdue', () => {
    const s = computeStats(
      [
        makeTask({ deadline: '2026-07-05' }), // today
        makeTask({ deadline: '2026-07-12' }), // +7
        makeTask({ deadline: '2026-07-13' }), // +8 → outside
        makeTask({ deadline: '2026-07-01' }), // overdue → not counted here
      ],
      NOW
    )
    expect(s.dueNext7Days).toBe(2)
  })

  it('counts scheduled tasks', () => {
    const s = computeStats(
      [
        makeTask({ scheduled_start: '2026-07-06T10:00:00' }),
        makeTask({ scheduled_start: null }),
      ],
      NOW
    )
    expect(s.scheduled).toBe(1)
  })
})
