import { describe, it, expect } from 'vitest'
import { localDateStr, parseLocalDate, addDaysStr, isBeforeToday } from './dates'

describe('dates', () => {
  it('localDateStr formats local date without UTC shift', () => {
    // 00:30 local time — toISOString() would give the previous day in UTC+ zones
    expect(localDateStr(new Date(2026, 8, 3, 0, 30))).toBe('2026-09-03')
    expect(localDateStr(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01')
  })

  it('parseLocalDate reads YYYY-MM-DD (and longer strings) as local midnight', () => {
    const d = parseLocalDate('2026-09-03T14:00:00')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 8, 3, 0])
  })

  it('addDaysStr rolls over months and years', () => {
    expect(addDaysStr('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDaysStr('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysStr('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('isBeforeToday compares date part only', () => {
    const now = new Date(2026, 8, 3, 10, 0)
    expect(isBeforeToday('2026-09-02', now)).toBe(true)
    expect(isBeforeToday('2026-09-03', now)).toBe(false)
    expect(isBeforeToday('2026-09-04', now)).toBe(false)
  })
})
