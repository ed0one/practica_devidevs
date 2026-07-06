import { describe, it, expect } from 'vitest'
import { emailDomain, isDisposableEmail } from './email-domains'

describe('emailDomain', () => {
  it('extracts the domain, lowercased', () => {
    expect(emailDomain('User@Gmail.COM')).toBe('gmail.com')
  })

  it('uses the last @ (handles quoted local parts)', () => {
    expect(emailDomain('a@b@dristor.com')).toBe('dristor.com')
  })

  it('returns empty string when no @', () => {
    expect(emailDomain('notanemail')).toBe('')
  })
})

describe('isDisposableEmail', () => {
  it('flags known disposable domains', () => {
    expect(isDisposableEmail('muiecalincirlea@dristor.com')).toBe(true)
    expect(isDisposableEmail('x@divahd.com')).toBe(true)
    expect(isDisposableEmail('spam@MAILINATOR.com')).toBe(true)
  })

  it('allows real providers', () => {
    expect(isDisposableEmail('edi2004george@gmail.com')).toBe(false)
    expect(isDisposableEmail('user@company.ro')).toBe(false)
  })

  it('is false for malformed input', () => {
    expect(isDisposableEmail('nope')).toBe(false)
    expect(isDisposableEmail('')).toBe(false)
  })
})
