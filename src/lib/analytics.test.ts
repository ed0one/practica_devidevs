import { describe, it, expect } from 'vitest'
import { velocitySeries, niceAxisMax, axisTicks, priorityBars, completion } from './analytics'
import type { Task } from '@/types/task'

function mk(p: Partial<Task>): Task {
  return {
    id: p.id ?? Math.random().toString(36).slice(2),
    user_id: 'u',
    title: 't',
    deadline: null,
    priority: 'medium',
    category: null,
    status: 'pending',
    raw_input: null,
    created_at: '2026-08-01T10:00:00Z',
    scheduled_date: null,
    scheduled_start: null,
    scheduled_end: null,
    recurrence: 'none',
    ...p,
  }
}

const now = new Date(2026, 8, 3, 12, 0) // 3 sep 2026, local

describe('velocitySeries', () => {
  it('returns one point per day ending today, counting done tasks by completed_at', () => {
    const tasks = [
      mk({ status: 'done', completed_at: '2026-09-03T08:00:00' }),
      mk({ status: 'done', completed_at: '2026-09-03T18:00:00' }),
      mk({ status: 'done', completed_at: '2026-09-01T09:00:00' }),
      mk({ status: 'done', completed_at: '2026-08-20T09:00:00' }), // out of window
      mk({ status: 'pending', completed_at: '2026-09-02T09:00:00' }), // not done
    ]
    const s = velocitySeries(tasks, now, 7)
    expect(s).toHaveLength(7)
    expect(s[0].date).toBe('2026-08-28')
    expect(s[6].date).toBe('2026-09-03')
    expect(s.map((p) => p.count)).toEqual([0, 0, 0, 0, 1, 0, 2])
    expect(s.map((p) => p.label)).toEqual(['28', '29', '30', '31', '1', '2', '3'])
  })

  it('falls back to created_at for done tasks without completed_at (pre-migration rows)', () => {
    const tasks = [mk({ status: 'done', created_at: '2026-09-02T10:00:00' })]
    const s = velocitySeries(tasks, now, 7)
    expect(s[5].count).toBe(1)
  })

  it('is all zeros with no tasks', () => {
    expect(velocitySeries([], now, 7).every((p) => p.count === 0)).toBe(true)
  })
})

describe('axis helpers', () => {
  it('niceAxisMax is at least 3 and a multiple of 3', () => {
    expect(niceAxisMax(0)).toBe(3)
    expect(niceAxisMax(2)).toBe(3)
    expect(niceAxisMax(7)).toBe(9)
    expect(niceAxisMax(30)).toBe(30)
  })
  it('axisTicks yields four descending labels', () => {
    expect(axisTicks(30)).toEqual([30, 20, 10, 0])
    expect(axisTicks(9)).toEqual([9, 6, 3, 0])
  })
})

describe('priorityBars', () => {
  it('counts only pending tasks, blocked by board column', () => {
    const tasks = [
      mk({ priority: 'high' }),
      mk({ priority: 'high', status: 'done' }),
      mk({ priority: 'medium' }),
      mk({ priority: 'low', board_column: 'blocked' }),
      mk({ priority: 'high', board_column: 'blocked' }),
    ]
    const bars = priorityBars(tasks)
    expect(bars.map((b) => b.count)).toEqual([2, 1, 1, 2])
    expect(bars.map((b) => b.key)).toEqual(['high', 'medium', 'low', 'blocked'])
  })
})

describe('completion', () => {
  it('reports real numbers and 0% when empty', () => {
    expect(completion([])).toEqual({ done: 0, total: 0, pct: 0 })
    const tasks = [mk({ status: 'done' }), mk({ status: 'done' }), mk({ status: 'pending' })]
    expect(completion(tasks)).toEqual({ done: 2, total: 3, pct: 67 })
  })
})
