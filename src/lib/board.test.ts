import { describe, it, expect } from 'vitest'
import { BOARD_COLUMNS, boardColumnOf, groupByColumn, isBoardColumn } from './board'
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
    created_at: '2026-09-01T10:00:00Z',
    scheduled_date: null,
    scheduled_start: null,
    scheduled_end: null,
    recurrence: 'none',
    ...p,
  }
}

describe('board', () => {
  it('exposes the four mockup columns in order', () => {
    expect(BOARD_COLUMNS.map((c) => c.id)).toEqual(['todo', 'inprogress', 'review', 'blocked'])
  })

  it('boardColumnOf defaults to todo when the column is missing or invalid', () => {
    expect(boardColumnOf(mk({}))).toBe('todo')
    expect(boardColumnOf(mk({ board_column: null }))).toBe('todo')
    expect(boardColumnOf(mk({ board_column: 'review' }))).toBe('review')
    expect(isBoardColumn('blocked')).toBe(true)
    expect(isBoardColumn('done')).toBe(false)
  })

  it('groupByColumn puts pending first, done last, each sorted by deadline (nulls last)', () => {
    const tasks = [
      mk({ id: 'a', board_column: 'todo', deadline: '2026-09-10' }),
      mk({ id: 'b', board_column: 'todo', deadline: null }),
      mk({ id: 'c', board_column: 'todo', deadline: '2026-09-05', status: 'done' }),
      mk({ id: 'd', board_column: 'todo', deadline: '2026-09-01' }),
      mk({ id: 'e', board_column: 'blocked' }),
    ]
    const g = groupByColumn(tasks)
    expect(g.todo.map((t) => t.id)).toEqual(['d', 'a', 'b', 'c'])
    expect(g.blocked.map((t) => t.id)).toEqual(['e'])
    expect(g.inprogress).toEqual([])
    expect(g.review).toEqual([])
  })
})
