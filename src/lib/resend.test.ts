import { describe, it, expect } from 'vitest'
import { escapeHtml } from './resend'

describe('escapeHtml', () => {
  it('neutralizes an HTML/phishing payload in a task title', () => {
    const out = escapeHtml('<a href="http://phish.ro">Reset parola</a>')
    expect(out).not.toContain('<a')
    expect(out).toContain('&lt;a href=&quot;http://phish.ro&quot;&gt;')
  })

  it('escapes all five sensitive characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('escapes & first so entities are not double-broken', () => {
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Suna la doctor')).toBe('Suna la doctor')
  })
})
