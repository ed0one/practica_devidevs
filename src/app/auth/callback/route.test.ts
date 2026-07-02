import { describe, it, expect } from 'vitest'
import { safeNextPath } from './route'

// Fluxul de recuperare parolă depinde de ăsta: linkul din email trece prin
// /auth/callback?next=/reset-password. `next` trebuie păstrat dacă e o cale
// internă și respins dacă e un redirect extern (open redirect).
describe('safeNextPath', () => {
  it('keeps the reset-password path (the recovery flow)', () => {
    expect(safeNextPath('/reset-password')).toBe('/reset-password')
  })

  it('keeps other internal paths', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard')
    expect(safeNextPath('/profile')).toBe('/profile')
  })

  it('defaults to /dashboard when next is missing', () => {
    expect(safeNextPath(null)).toBe('/dashboard')
  })

  it('rejects protocol-relative URLs (//evil.com)', () => {
    expect(safeNextPath('//evil.com')).toBe('/dashboard')
  })

  it('rejects absolute URLs', () => {
    expect(safeNextPath('https://evil.com')).toBe('/dashboard')
    expect(safeNextPath('http://evil.com')).toBe('/dashboard')
  })

  it('rejects a path that does not start with a slash', () => {
    expect(safeNextPath('evil.com')).toBe('/dashboard')
  })
})
