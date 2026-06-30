import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Sparkles, CheckCircle2, Calendar, Bell, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

const HERO_IMAGE = "https://d8j0ntlcm91z4.cloudfront.net/user_3Fs5lwoxPOgInyA7iQ9Mit0nExj/hf_20260630_203148_184ac31e-18c3-47d3-9d6a-cced3aeb1a7c.png"

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            TaskCapture
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            Autentificare
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-1.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20">
            Începe gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url('${HERO_IMAGE}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/0 via-[#0a0a0f]/40 to-[#0a0a0f]" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Powered by NVIDIA NIM AI
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Transformă{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              gândurile
            </span>
            {" "}în task-uri
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Scrie ce ai de făcut în limbaj natural. AI-ul extrage automat task-urile,
            le prioritizează și le organizează în calendarul tău.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-2xl shadow-indigo-500/30 hover:-translate-y-0.5">
              Începe gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all">
              Intră în cont
            </Link>
          </div>

          <div className="mt-10 inline-flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left max-w-md mx-auto">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                &ldquo;Trebuie să sun la doctor mâine, să trimit raportul până vineri și să cumpăr pâine azi seară&rdquo;
              </p>
              <p className="text-xs text-indigo-400 mt-2 font-medium">→ 3 task-uri extrase automat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tot ce ai nevoie</h2>
            <p className="text-gray-400 text-lg">Un singur loc pentru toate task-urile tale</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Sparkles, color: "from-indigo-500 to-violet-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", title: "AI din text natural", desc: "Scrie orice, AI-ul extrage task-urile, deadline-urile și prioritățile automat din limbaj natural." },
              { icon: Calendar, color: "from-violet-500 to-purple-500", bg: "bg-violet-500/10", border: "border-violet-500/20", title: "Calendar inteligent", desc: "Vizualizare săptămânală, zilnică și listă. Programează ore de start și sfârșit pentru fiecare task." },
              { icon: Bell, color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10", border: "border-purple-500/20", title: "Reminder zilnic pe email", desc: "Primești automat la 09:00 o listă cu task-urile scadente azi. Și confirmare la fiecare adăugare." },
              { icon: CheckCircle2, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", title: "Progres vizual", desc: "Statistici live: total, finalizate, urgente, scadente. Bară de progres animată." },
              { icon: Shield, color: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10", border: "border-blue-500/20", title: "Cont securizat", desc: "Autentificare cu email/parolă sau OAuth Google și GitHub. Datele tale sunt private." },
              { icon: Clock, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", border: "border-amber-500/20", title: "Prioritizare automată", desc: "AI-ul decide prioritatea (ridicată/medie/scăzută) și categoria fiecărui task din context." },
            ].map((f) => (
              <div key={f.title} className={`${f.bg} border ${f.border} rounded-2xl p-6 hover:scale-[1.02] transition-transform`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-900/50 to-violet-900/50 border border-indigo-500/20 rounded-3xl p-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Gata să fii mai productiv?</h2>
            <p className="text-gray-400 mb-8">Crează-ți cont în 30 de secunde. Fără card de credit.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-2xl shadow-indigo-500/30">
              Creează cont gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-sm text-gray-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-gray-400 font-medium">TaskCapture</span>
        </div>
        <p>Proiect de practică UTCB — Web + AI, Grupa A, 2026</p>
      </footer>
    </div>
  )
}
