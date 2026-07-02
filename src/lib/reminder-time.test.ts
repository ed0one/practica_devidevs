import { describe, it, expect } from 'vitest'
import { zonedNaiveToEpoch, reminderFireAt } from './reminder-time'

// Bucharest: EEST (+3) vara, EET (+2) iarna. Verificăm că ora de perete e
// interpretată în fusul userului, nu în UTC-ul serverului.
describe('zonedNaiveToEpoch', () => {
  it('interprets summer wall-time in Europe/Bucharest as UTC+3', () => {
    // 09:00 local vara == 06:00 UTC
    expect(zonedNaiveToEpoch('2026-07-02T09:00:00', 'Europe/Bucharest')).toBe(
      Date.UTC(2026, 6, 2, 6, 0, 0)
    )
  })

  it('interprets winter wall-time in Europe/Bucharest as UTC+2', () => {
    // 09:00 local iarna == 07:00 UTC
    expect(zonedNaiveToEpoch('2026-01-15T09:00:00', 'Europe/Bucharest')).toBe(
      Date.UTC(2026, 0, 15, 7, 0, 0)
    )
  })

  it('treats a UTC-zone naive string as UTC', () => {
    expect(zonedNaiveToEpoch('2026-07-02T09:00:00', 'UTC')).toBe(
      Date.UTC(2026, 6, 2, 9, 0, 0)
    )
  })

  it('handles midnight without rolling to hour 24', () => {
    expect(zonedNaiveToEpoch('2026-07-02T00:00:00', 'UTC')).toBe(
      Date.UTC(2026, 6, 2, 0, 0, 0)
    )
  })

  it('accepts a naive string without seconds', () => {
    expect(zonedNaiveToEpoch('2026-07-02T09:00', 'UTC')).toBe(
      Date.UTC(2026, 6, 2, 9, 0, 0)
    )
  })

  it('returns NaN for a non-parseable string', () => {
    expect(Number.isNaN(zonedNaiveToEpoch('vineri', 'UTC'))).toBe(true)
  })
})

describe('reminderFireAt', () => {
  const tz = 'Europe/Bucharest'

  it('fires offset minutes before scheduled_start, in the user tz', () => {
    // start 09:00 Bucharest (== 06:00 UTC), 30 min înainte
    const fire = reminderFireAt(
      { scheduled_start: '2026-07-02T09:00:00', deadline: null, reminder_offset_min: 30 },
      tz
    )
    expect(fire).toBe(Date.UTC(2026, 6, 2, 6, 0, 0) - 30 * 60_000)
  })

  it('falls back to deadline at 09:00 local when no scheduled_start', () => {
    const fire = reminderFireAt(
      { scheduled_start: null, deadline: '2026-07-02', reminder_offset_min: 0 },
      tz
    )
    expect(fire).toBe(Date.UTC(2026, 6, 2, 6, 0, 0))
  })

  it('treats a null offset as zero', () => {
    const fire = reminderFireAt(
      { scheduled_start: '2026-07-02T09:00:00', deadline: null, reminder_offset_min: null },
      tz
    )
    expect(fire).toBe(Date.UTC(2026, 6, 2, 6, 0, 0))
  })

  it('returns null when the task has no time anchor', () => {
    expect(
      reminderFireAt({ scheduled_start: null, deadline: null, reminder_offset_min: 30 }, tz)
    ).toBeNull()
  })

  it('does NOT match a naive UTC interpretation (regression: the old bug)', () => {
    // Vechea logică `new Date("2026-07-02T09:00:00")` pe server UTC ar fi dat
    // 09:00 UTC. Corect e 06:00 UTC vara. Cele două trebuie să difere.
    const correct = reminderFireAt(
      { scheduled_start: '2026-07-02T09:00:00', deadline: null, reminder_offset_min: 0 },
      tz
    )
    expect(correct).not.toBe(Date.UTC(2026, 6, 2, 9, 0, 0))
  })
})
