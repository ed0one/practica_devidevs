import { describe, it, expect } from 'vitest'
import { ganttRange, ganttRows } from './gantt'
import type { Task } from '@/types/task'

function mk(p: Partial<Task>): Task {
  return {
    id: p.id ?? Math.random().toString(36).slice(2),
    user_id: 'u',
    title: p.title ?? 't',
    deadline: null,
    priority: 'medium',
    category: null,
    status: 'pending',
    raw_input: null,
    created_at: '2026-09-01T10:00:00',
    scheduled_date: null,
    scheduled_start: null,
    scheduled_end: null,
    recurrence: 'none',
    ...p,
  }
}

describe('ganttRange', () => {
  it('starts on the Monday of the anchor week and spans 4 weeks', () => {
    const r = ganttRange(new Date(2026, 8, 3)) // Thursday 3 sep 2026
    expect(r.start).toBe('2026-08-31')
    expect(r.days).toHaveLength(28)
    expect(r.end).toBe('2026-09-27')
    expect(r.days[0]).toBe('2026-08-31')
    expect(r.days[27]).toBe('2026-09-27')
  })
  it('keeps a Monday anchor as start', () => {
    expect(ganttRange(new Date(2026, 7, 31)).start).toBe('2026-08-31')
  })
})

describe('ganttRows', () => {
  const range = ganttRange(new Date(2026, 8, 3))

  it('builds a bar from created date to deadline, clipped to the range', () => {
    const rows = ganttRows(
      [mk({ id: 'a', created_at: '2026-08-20T10:00:00', deadline: '2026-09-05' })],
      range
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].startIdx).toBe(0)
    expect(rows[0].clippedStart).toBe(true)
    expect(rows[0].endIdx).toBe(5) // 5 sep = index 5
    expect(rows[0].milestone).toBe(false)
  })

  it('prefers scheduled_date as the start and marks single-day items as milestones', () => {
    const rows = ganttRows(
      [mk({ id: 'm', scheduled_date: '2026-09-10', deadline: '2026-09-10' })],
      range
    )
    expect(rows[0].startIdx).toBe(10)
    expect(rows[0].endIdx).toBe(10)
    expect(rows[0].milestone).toBe(true)
  })

  it('excludes tasks with no dates or entirely outside the range, and sorts by start', () => {
    const rows = ganttRows(
      [
        mk({ id: 'none' }),
        mk({ id: 'past', created_at: '2026-07-01T00:00:00', deadline: '2026-07-10' }),
        mk({ id: 'late', scheduled_date: '2026-09-15', deadline: '2026-09-20' }),
        mk({ id: 'early', scheduled_date: '2026-09-02', deadline: '2026-09-04' }),
      ],
      range
    )
    expect(rows.map((r) => r.task.id)).toEqual(['early', 'late'])
  })

  it('a task with only a scheduled_date spans that single day', () => {
    const rows = ganttRows([mk({ id: 's', scheduled_date: '2026-09-12' })], range)
    expect(rows[0].startIdx).toBe(12)
    expect(rows[0].endIdx).toBe(12)
  })
})
