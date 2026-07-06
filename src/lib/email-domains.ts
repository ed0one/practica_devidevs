// Domenii de email temporar / disposable, folosite ca UX-hint în pagina de
// register. Enforcement-ul REAL e server-side, în migrarea 010 (Supabase
// „before user created" auth hook) — lista de aici e doar pentru feedback
// instant, ca userul să nu apese signUp și să aștepte degeaba.
//
// Ține sincron, dar nu identic, cu tabelul disposable_email_domains din 010:
// aici e util un subset al celor mai comune. Adăugirile fine se fac în DB.
export const DISPOSABLE_DOMAINS = new Set<string>([
  'dristor.com',
  'divahd.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'sharklasers.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'getnada.com',
  'maildrop.cc',
  'mohmal.com',
  'fakeinbox.com',
  'dispostable.com',
  'mailnesia.com',
  'mintemail.com',
  'tempinbox.com',
  'emailondeck.com',
  'moakt.com',
  'tempr.email',
  'discard.email',
  'inboxkitten.com',
  'mailcatch.com',
  'nada.email',
])

// Partea de după @, normalizată (lowercase, fără spații). '' dacă lipsește.
export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  if (at === -1) return ''
  return email.slice(at + 1).trim().toLowerCase()
}

// True dacă emailul folosește un domeniu disposable cunoscut.
export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email)
  return domain !== '' && DISPOSABLE_DOMAINS.has(domain)
}
