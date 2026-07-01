import { describe, it, expect } from 'vitest'
import { parseDuration } from './sync'

describe('parseDuration', () => {
  it('parses combined hours and minutes', () => {
    expect(parseDuration('2h30m')).toEqual({ hours: 2, minutes: 30 })
  })

  it('parses hours only', () => {
    expect(parseDuration('1h')).toEqual({ hours: 1, minutes: 0 })
  })

  it('parses minutes only', () => {
    expect(parseDuration('45m')).toEqual({ hours: 0, minutes: 45 })
  })

  it('tolerates a space between units', () => {
    expect(parseDuration('2h 15m')).toEqual({ hours: 2, minutes: 15 })
  })
})
