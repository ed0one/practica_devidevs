"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2, Zap, CheckCircle2 } from "lucide-react";
import MobileNav from "@/components/MobileNav";

const EXAMPLES = [
  "Trebuie să sun la doctor mâine dimineață",
  "Trimite raportul lunar până vineri urgent",
  "Cumpără pâine și lapte azi seară",
  "Meeting cu echipa joi de la 14:00 la 15:30",
];

export default function InputPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/parse-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare la procesare");
      if (data.tasks?.length === 0) {
        toast.error("Nu am găsit task-uri. Încearcă să fii mai specific.");
        return;
      }
      toast.success(`${data.tasks.length} task${data.tasks.length === 1 ? "" : "-uri"} adăugate!`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0c0c14]">
      <MobileNav />

      {/* Left panel — dark branding */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden border-r border-white/[0.06]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10">
          <a href="/dashboard" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TaskCapture</span>
          </a>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs text-indigo-300 mb-5">
              <Zap className="w-3 h-3" /> Powered by Llama 3.1
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              Scrie natural,<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                AI organizează.
              </span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Nu trebuie format special. Scrie cum gândești — AI-ul extrage task-urile, deadline-urile și prioritățile.
            </p>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Exemplu input</p>
            <p className="text-sm text-white/60 leading-relaxed italic">
              &ldquo;Trebuie să sun la doctor mâine, să trimit raportul până vineri urgent și meeting cu echipa joi de la 14:00&rdquo;
            </p>
            <div className="h-px bg-white/[0.06]" />
            <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Output AI</p>
            {[
              { title: "Suna la doctor", badge: "Mediu", color: "text-amber-400", time: "mâine" },
              { title: "Trimite raportul", badge: "Urgent", color: "text-red-400", time: "vineri" },
              { title: "Meeting cu echipa", badge: "Mediu", color: "text-amber-400", time: "joi 14:00" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-sm text-white/70 flex-1">{item.title}</span>
                <span className={`text-[10px] font-semibold ${item.color}`}>{item.badge}</span>
                <span className="text-[10px] text-white/30">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/20">© 2026 TaskCapture · UTCB Practică</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-[#f5f5f7] pb-20 sm:pb-0">
        <header className="lg:hidden border-b border-gray-200 px-4 py-3 flex items-center gap-3 bg-white sticky top-0 z-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Adaugă task-uri</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-xl">
            <a
              href="/dashboard"
              className="hidden lg:inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Înapoi la dashboard
            </a>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Ce ai de făcut?</h1>
              <p className="text-gray-400 text-sm mb-6">Scrie în limbaj natural — AI-ul extrage și organizează automat</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Ex: Trebuie să sun la doctor mâine, să trimit raportul până vineri urgent și să cumpăr pâine azi seară..."
                    rows={7}
                    disabled={loading}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 pb-10 text-gray-900 text-[15px] leading-relaxed placeholder-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 resize-none transition-all"
                  />
                  <AnimatePresence>
                    {charCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute bottom-3 right-4 text-xs text-gray-300 select-none"
                      >
                        {wordCount} cuv · {charCount} car
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Exemple rapide</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setText(t => t ? `${t}\n${ex}` : ex)}
                        className="text-xs bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg px-3 py-1.5 transition-all"
                      >
                        + {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !text.trim()}
                  whileHover={!loading && text.trim() ? { scale: 1.01 } : {}}
                  whileTap={!loading && text.trim() ? { scale: 0.99 } : {}}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> AI procesează...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Extrage task-urile</>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
