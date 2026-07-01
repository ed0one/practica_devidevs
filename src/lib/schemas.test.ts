import { describe, it, expect } from 'vitest'
import { ParsedTaskSchema, ParsedTasksResponseSchema, TaskUpdateSchema } from './schemas'

describe('ParsedTaskSchema', () => {
  it('accepts a fully-specified valid task', () => {
    const t = ParsedTaskSchema.parse({
      title: 'Suna la doctor',
      deadline: '2026-07-01',
      priority: 'high',
      category: 'sănătate',
      start_time: '09:00',
      end_time: '10:30',
    })
    expect(t).toMatchObject({
      title: 'Suna la doctor',
      deadline: '2026-07-01',
      priority: 'high',
      start_time: '09:00',
      end_time: '10:30',
    })
  })

  it('normalizes a malformed deadline ("vineri") to null instead of throwing', () => {
    const t = ParsedTaskSchema.parse({
      title: 'Trimite CV',
      deadline: 'vineri',
      priority: 'medium',
      category: null,
    })
    expect(t.deadline).toBeNull()
  })

  it('normalizes an invalid time to null', () => {
    const t = ParsedTaskSchema.parse({
      title: 'X',
      deadline: null,
      priority: 'low',
      category: null,
      start_time: '25:99',
      end_time: 'seara',
    })
    expect(t.start_time).toBeNull()
    expect(t.end_time).toBeNull()
  })

  it('falls back to medium for an unknown priority', () => {
    const t = ParsedTaskSchema.parse({
      title: 'X',
      deadline: null,
      priority: 'URGENT!!!',
      category: null,
    })
    expect(t.priority).toBe('medium')
  })

  it('trims and caps title / category length', () => {
    const t = ParsedTaskSchema.parse({
      title: '  Task  ',
      deadline: null,
      priority: 'low',
      category: '  ' + 'x'.repeat(200),
    })
    expect(t.title).toBe('Task')
    expect(t.category?.length).toBe(100)
  })

  it('rejects an empty title', () => {
    expect(() =>
      ParsedTaskSchema.parse({ title: '   ', deadline: null, priority: 'low', category: null })
    ).toThrow()
  })

  it('defaults missing optional fields to null', () => {
    const t = ParsedTaskSchema.parse({ title: 'X', priority: 'low' })
    expect(t.deadline).toBeNull()
    expect(t.category).toBeNull()
    expect(t.start_time).toBeNull()
  })
})

describe('ParsedTasksResponseSchema', () => {
  it('parses an array of tasks', () => {
    const r = ParsedTasksResponseSchema.parse({
      tasks: [
        { title: 'A', deadline: null, priority: 'low', category: null },
        { title: 'B', deadline: '2026-01-01', priority: 'high', category: 'muncă' },
      ],
    })
    expect(r.tasks).toHaveLength(2)
  })
})

describe('TaskUpdateSchema', () => {
  it('accepts a partial valid update', () => {
    const r = TaskUpdateSchema.safeParse({ status: 'done' })
    expect(r.success).toBe(true)
  })

  it('accepts an empty object (caller guards against it)', () => {
    const r = TaskUpdateSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it('rejects an invalid status', () => {
    const r = TaskUpdateSchema.safeParse({ status: 'archived' })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid priority', () => {
    const r = TaskUpdateSchema.safeParse({ priority: 'critical' })
    expect(r.success).toBe(false)
  })

  it('rejects a malformed deadline', () => {
    const r = TaskUpdateSchema.safeParse({ deadline: 'tomorrow' })
    expect(r.success).toBe(false)
  })

  it('rejects an empty title', () => {
    const r = TaskUpdateSchema.safeParse({ title: '   ' })
    expect(r.success).toBe(false)
  })

  it('rejects unknown fields (strict) — e.g. attempts to overwrite user_id', () => {
    const r = TaskUpdateSchema.safeParse({ user_id: 'attacker', status: 'done' })
    expect(r.success).toBe(false)
  })

  it('accepts a null deadline (clearing it)', () => {
    const r = TaskUpdateSchema.safeParse({ deadline: null })
    expect(r.success).toBe(true)
  })

  it('accepts scheduled timestamps', () => {
    const r = TaskUpdateSchema.safeParse({
      scheduled_date: '2026-07-01',
      scheduled_start: '2026-07-01T09:00:00',
      scheduled_end: '2026-07-01T10:00:00',
    })
    expect(r.success).toBe(true)
  })
})
