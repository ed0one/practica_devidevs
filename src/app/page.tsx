import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Sparkles, Calendar, Bell, ArrowRight, Shield, Repeat, BarChart3, Wand2 } from 'lucide-react'
import CaptureDemo from '@/components/landing/CaptureDemo'

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  const cta = user
    ? { href: '/dashboard', label: 'Mergi la dashboard' }
    : { href: '/register', label: 'Începe gratuit' }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ink)] text-white capture-grain">
      {/* ── Ambient: drifting aurora, warm→cool ─────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="capture-aurora absolute -left-[10%] -top-[15%] h-[55vh] w-[55vh] rounded-full bg-[#ff6a3d] opacity-[0.16] blur-[120px]" />
        <div className="capture-aurora absolute right-[-8%] top-[18%] h-[45vh] w-[45vh] rounded-full bg-[#3dd4a7] opacity-[0.12] blur-[130px]" style={{ animationDelay: '-8s' }} />
        <div className="capture-aurora absolute bottom-[-15%] left-[25%] h-[50vh] w-[50vh] rounded-full bg-[#7c5cff] opacity-[0.10] blur-[140px]" style={{ animationDelay: '-14s' }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[var(--ink)]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6a3d] shadow-lg shadow-[#ff6a3d]/30">
              <Sparkles className="h-4 w-4 text-black/80" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">TaskCapture</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden font-mono text-xs text-[var(--haze)] sm:block">{user.email?.split('@')[0]}</span>
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff6a3d] px-4 py-1.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-[var(--haze)] transition-colors hover:bg-white/5 hover:text-white">
                  Autentificare
                </Link>
                <Link href="/register" className="rounded-lg bg-[#ff6a3d] px-4 py-1.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5">
                  Începe gratuit
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero: thesis = the parse ────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-36 sm:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          {/* copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--haze)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3dd4a7]" />
              NVIDIA NIM · Llama 3.1
            </div>

            <h1 className="font-display text-[2.7rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Scrii un{' '}
              <span className="text-[#ff8a63]">gând</span>.
              <br />
              Primești o zi{' '}
              <span className="text-[#3dd4a7]">organizată</span>.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--haze)]">
              Notează în română, dezordonat, cum îți vine. AI-ul separă task-urile,
              prinde deadline-urile relative — <span className="text-white/80">„mâine”</span>,{' '}
              <span className="text-white/80">„până vineri”</span> — și ți le așază în calendar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={cta.href}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#ff6a3d] px-7 py-3.5 text-base font-semibold text-black transition-transform hover:-translate-y-0.5"
              >
                <span className="capture-sheen absolute inset-y-0 left-0 w-1/3 bg-white/40 blur-md" />
                <span className="relative">{cta.label}</span>
                <ArrowRight className="relative h-4 w-4" />
              </Link>
              {!user && (
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-white/[0.06]">
                  Intră în cont
                </Link>
              )}
            </div>

            <p className="mt-6 font-mono text-xs text-white/30">
              fără card · 30 de secunde · date private prin RLS
            </p>
          </div>

          {/* signature */}
          <div className="relative">
            <CaptureDemo />
          </div>
        </div>
      </section>

      {/* ── Ticker rail ─────────────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden border-y border-white/5 py-4">
        <div className="capture-marquee flex w-max gap-3 whitespace-nowrap font-mono text-xs uppercase tracking-[0.15em] text-white/25">
          {Array.from({ length: 2 }).map((_, r) => (
            <span key={r} className="flex gap-3">
              {['din text natural', 'deadline-uri relative', 'prioritizare AI', 'reminder pe email', 'calendar săptămânal', 'sync Jira', 'recurență', 'export CSV'].map((t) => (
                <span key={t} className="flex items-center gap-3">
                  <span className="text-[#ff6a3d]/50">✦</span> {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>

      {/* ── Bento features ──────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 max-w-xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#ff6a3d]">ce primești</p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Un instrument, nu încă un to-do list
          </h2>
        </div>

        <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* hero feature — spans 2×2 */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#ff6a3d]/[0.12] to-transparent p-8 sm:col-span-2 lg:row-span-2">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6a3d] text-black">
              <Wand2 className="h-5 w-5" />
            </div>
            <h3 className="font-display text-2xl font-bold">AI din text natural</h3>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--haze)]">
              Scrie o frază, o listă, un vraf de gânduri. Llama 3.1 extrage fiecare
              task, deadline-ul și prioritatea — fără format special, fără butoane.
            </p>
            <div className="mt-7 space-y-2 font-mono text-[13px]">
              <p className="text-white/40">› „revizuiesc PR-ul lui Ana până joi”</p>
              <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#ff6a3d]" />
                <span className="text-white/85">Revizuiește PR-ul lui Ana</span>
                <span className="ml-auto text-[#3dd4a7]">joi</span>
              </div>
            </div>
          </div>

          {[
            { icon: Calendar, title: 'Calendar inteligent', desc: 'Vederi săptămână, zi și listă. Ore de start și sfârșit, drag & drop.' },
            { icon: Bell, title: 'Reminder pe email', desc: 'La 09:00 primești task-urile scadente azi. Plus confirmare la fiecare adăugare.' },
            { icon: BarChart3, title: 'Progres vizual', desc: 'Total, finalizate, urgente, scadente — live, cu bară animată.' },
            { icon: Shield, title: 'Cont securizat', desc: 'Email/parolă sau Google & GitHub. Datele tale, izolate prin RLS.' },
            { icon: Repeat, title: 'Task-uri recurente', desc: 'Zilnic sau săptămânal — la finalizare, următoarea apariție se creează singură.' },
          ].map((f) => (
            <div key={f.title} className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#3dd4a7] transition-colors group-hover:text-[#ff8a63]">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--haze)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works: a real 3-step sequence ────────────────── */}
      <section className="relative z-10 border-t border-white/5 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 max-w-xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#3dd4a7]">fluxul</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">De la gând la calendar, în trei pași</h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-3">
            {[
              { n: '01', title: 'Scrii în română', desc: 'Orice text — fraze, liste, gânduri. Fără format, fără reguli.' },
              { n: '02', title: 'AI procesează', desc: 'Llama 3.1 separă task-urile, rezolvă deadline-urile relative, alege prioritatea.' },
              { n: '03', title: 'Organizezi', desc: 'Apar în dashboard cu calendar, filtre și reminder zilnic pe email.' },
            ].map((s) => (
              <div key={s.n} className="bg-[var(--ink-2)] p-8">
                <span className="font-mono text-sm text-[#ff6a3d]">{s.n}</span>
                <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--haze)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#ff6a3d]/[0.14] via-transparent to-[#3dd4a7]/[0.10] p-12 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Golește-ți capul.<br />Restul se organizează singur.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--haze)]">
            Cont în 30 de secunde. Fără card de credit.
          </p>
          <Link
            href={cta.href}
            className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-xl bg-[#ff6a3d] px-8 py-4 text-base font-semibold text-black transition-transform hover:-translate-y-0.5"
          >
            <span className="capture-sheen absolute inset-y-0 left-0 w-1/3 bg-white/40 blur-md" />
            <span className="relative">{cta.label}</span>
            <ArrowRight className="relative h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#ff6a3d]" />
          <span className="font-display text-sm font-semibold">TaskCapture</span>
        </div>
        <p className="font-mono text-xs text-white/30">Proiect de practică UTCB · Web + AI · Grupa A · 2026</p>
      </footer>
    </div>
  )
}
