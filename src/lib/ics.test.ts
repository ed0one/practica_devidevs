import { describe, it, expect } from 'vitest'
import { tasksToIcs } from './ics'
import type { Task } from '@/types/task'

function makeTask(over: Partial<Task>): Task {
  return {
    id: 't1',
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

const NOW = new Date('2026-07-05T12:00:00Z')

describe('tasksToIcs', () => {
  it('wraps events in a VCALENDAR envelope', () => {
    const ics = tasksToIcs([makeTask({ deadline: '2026-07-10' })], NOW)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
  })

  it('uses CRLF line endings (RFC 5545)', () => {
    const ics = tasksToIcs([makeTask({ deadline: '2026-07-10' })], NOW)
    expect(ics).toContain('\r\n')
  })

  it('emits a timed event as UTC anchored in the given timezone', () => {
    // 09:00 wall time în Europe/Bucharest (vara = UTC+3) → 06:00Z.
    const ics = tasksToIcs(
      [makeTask({ scheduled_start: '2026-07-06T09:00:00', scheduled_end: '2026-07-06T10:30:00' })],
      NOW,
      'Europe/Bucharest'
    )
    expect(ics).toContain('DTSTART:20260706T060000Z')
    expect(ics).toContain('DTEND:20260706T073000Z')
  })

  it('respects a non-default timezone for timed events', () => {
    // 09:00 wall time la New York (vara = UTC-4) → 13:00Z.
    const ics = tasksToIcs(
      [makeTask({ scheduled_start: '2026-07-06T09:00:00' })],
      NOW,
      'America/New_York'
    )
    expect(ics).toContain('DTSTART:20260706T130000Z')
  })

  it('emits an all-day event with an exclusive DTEND (next day)', () => {
    const ics = tasksToIcs(
      [makeTask({ all_day: true, scheduled_date: '2026-07-06' })],
      NOW
    )
    expect(ics).toContain('DTSTART;VALUE=DATE:20260706')
    expect(ics).toContain('DTEND;VALUE=DATE:20260707')
  })

  it('falls back to deadline as an all-day DTSTART', () => {
    const ics = tasksToIcs([makeTask({ deadline: '2026-07-10' })], NOW)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260710')
  })

  it('skips tasks with no date', () => {
    const ics = tasksToIcs([makeTask({})], NOW)
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('escapes special characters in summary/description', () => {
    const ics = tasksToIcs(
      [makeTask({ deadline: '2026-07-10', title: 'a,b;c', description: 'line1\nline2' })],
      NOW
    )
    expect(ics).toContain('SUMMARY:a\\,b\\;c')
    expect(ics).toContain('DESCRIPTION:line1\\nline2')
  })

  it('marks done tasks COMPLETED', () => {
    const ics = tasksToIcs([makeTask({ deadline: '2026-07-10', status: 'done' })], NOW)
    expect(ics).toContain('STATUS:COMPLETED')
  })
})
