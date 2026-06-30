import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              TaskCapture
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Autentificare
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 hover:from-indigo-700 hover:to-violet-700 transition-all"
            >
              Înregistrare
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
            Transformă intențiile în
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">task-uri acționabile</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Scrie ce ai de făcut în limba naturală. AI-ul extrage task-urile, le planifică în calendar și ți le reamintește la timp.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200/50 hover:from-indigo-700 hover:to-violet-700 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Începe acum gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Am deja cont
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Sparkles,
              title: "Extragere AI",
              desc: "Scrie liber — LLM-ul transformă textul în task-uri structurate cu deadline, prioritate și categorie."
            },
            {
              icon: CheckCircle,
              title: "Calendar vizual",
              desc: "Vede task-urile pe săptămâne/luni, marchează-le ca finalizate, programează-le cu drag & drop."
            },
            {
              icon: ArrowRight,
              title: "Remindere automate",
              desc: "Primești email zilnic cu task-urile scadente. Nu ratezi niciun deadline."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl p-6 hover:shadow-2xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          TaskCapture — Practică DeviDevs
        </div>
      </footer>
    </div>
  );
}