"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Zap,
  CheckCircle2,
  Trash2,
  Save,
  Calendar,
  CheckSquare,
} from "lucide-react";
import MobileNav from "@/components/MobileNav";
import type { ParsedTask, Priority } from "@/types/task";

const EXAMPLES = [
  "Trebuie să sun la doctor mâine dimineață",
  "Trimite raportul lunar până vineri urgent",
  "Cumpără pâine și lapte azi seară",
  "Meeting cu echipa joi de la 14:00 la 15:30",
];

const PRIORITY_OPTIONS: { value: Priority; label: string; active: string }[] = [
  { value: "high", label: "Urgent", active: "bg-red-500/20 text-red-300 border-red-500/40" },
  { value: "medium", label: "Mediu", active: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { value: "low", label: "Scăzut", active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
];

export default function InputPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<ParsedTask[] | null>(null);
  const router = useRouter();

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleExtract = async (e: React.FormEvent) => {
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
      if (!data.tasks || data.tasks.length === 0) {
        toast.error("Nu am găsit task-uri. Încearcă să fii mai specific.");
        return;
      }
      setPreview(data.tasks as ParsedTask[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  };

  const updateTask = (i: number, patch: Partial<ParsedTask>) =>
    setPreview((p) => (p ? p.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) : p));

  const removeTask = (i: number) =>
    setPreview((p) => (p ? p.filter((_, idx) => idx !== i) : p));

  const handleSave = async () => {
    if (!preview || preview.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: preview, raw_input: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare la salvare");
      toast.success(`${preview.length} task${preview.length === 1 ? "" : "-uri"} salvate!`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare necunoscută");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0c0e14] text-[#f8fafc] selection:bg-orange-500 selection:text-white">
      <MobileNav />

      {/* Left panel — obsidian branding */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden border-r border-white/[0.06] bg-[#0c0e14]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#f97316]/10 rounded-full blur-[130px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#38bdf8]/10 rounded-full blur-[110px] pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10">
          <a href="/dashboard" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/30 border border-orange-400/30">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-orange-400 transition-colors">
              TaskCapture
            </span>
          </a>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-full px-3.5 py-1 text-xs text-orange-400 mb-5 font-mono">
              <Zap className="w-3.5 h-3.5" /> Powered by NVIDIA NIM Llama 3.1
            </div>
            <h2 className="font-display text-4xl font-extrabold text-white leading-tight mb-3 tracking-tight">
              Scrie natural,<br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                AI organizează în câteva secunde.
              </span>
            </h2>
            <p className="text-[#94a3b8] text-sm leading-relaxed max-w-sm">
              Notează gândurile dezordonat. Llama 3.1 identifică automat prioritățile, datele relative și intervalele orare.
            </p>
          </div>

          {/* Demonstration card */}
          <div className="bg-[#141721] border border-white/[0.08] rounded-2xl p-5 space-y-3.5 shadow-2xl">
            <p className="text-[11px] font-mono text-orange-400/90 uppercase tracking-wider font-semibold">
              Exemplu input
            </p>
            <p className="text-sm text-white/80 leading-relaxed italic bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
              &ldquo;Trebuie să sun la doctor mâine, să trimit raportul până vineri urgent și meeting cu echipa joi de la 14:00&rdquo;
            </p>

            <div className="h-px bg-white/[0.06]" />

            <p className="text-[11px] font-mono text-[#38bdf8] uppercase tracking-wider font-semibold">
              Output Extras
            </p>
            {[
              { title: "Sună la doctor", badge: "Mediu", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", time: "mâine" },
              { title: "Trimite raportul", badge: "Urgent", color: "text-red-400 bg-red-500/10 border-red-500/20", time: "vineri" },
              { title: "Meeting cu echipa", badge: "Mediu", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", time: "joi 14:00" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-xs font-semibold text-white/90 flex-1">{item.title}</span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${item.color}`}>
                  {item.badge}
                </span>
                <span className="text-[10px] font-mono text-[#94a3b8]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs font-mono text-[#64748b]">© 2026 TaskCapture · UTCB Practică Web & AI</p>
        </div>
      </div>

      {/* Right panel — obsidian input workspace */}
      <div className="flex-1 flex flex-col bg-[#0e1117] pb-20 sm:pb-0">
        <header className="lg:hidden border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 bg-[#141721] sticky top-0 z-10">
          <button
            onClick={() => (preview ? setPreview(null) : router.push("/dashboard"))}
            aria-label="Înapoi"
            className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-[#94a3b8] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white">
            {preview ? "Verifică task-urile" : "Adaugă task-uri"}
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-xl">
            <button
              onClick={() => (preview ? setPreview(null) : router.push("/dashboard"))}
              className="hidden lg:inline-flex items-center gap-2 text-xs font-mono text-[#94a3b8] hover:text-orange-400 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {preview ? "Înapoi la text" : "Înapoi la dashboard"}
            </button>

            <AnimatePresence mode="wait">
              {!preview ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                    Ce ai în plan?
                  </h1>
                  <p className="text-[#94a3b8] text-sm mb-6">
                    Scrie în limbaj natural — AI-ul extrage și organizează instant.
                  </p>

                  <form onSubmit={handleExtract} className="space-y-4">
                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ex: Sun la doctor mâine dimineață, trimit raportul până vineri urgent și cumpăr bilete diseară..."
                        rows={7}
                        disabled={loading}
                        className="w-full rounded-2xl border border-white/10 bg-[#141721] p-4 pb-10 text-white text-[15px] leading-relaxed placeholder-[#64748b] shadow-2xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all"
                      />
                      {charCount > 0 && (
                        <div className="absolute bottom-3 right-4 text-xs font-mono text-[#64748b]">
                          {wordCount} cuv · {charCount} car
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-mono font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                        Exemple rapide
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setText((t) => (t ? `${t}\n${ex}` : ex))}
                            className="text-xs bg-white/[0.04] border border-white/10 text-[#cbd5e1] hover:border-orange-400 hover:text-orange-300 rounded-xl px-3 py-1.5 transition-all"
                          >
                            + {ex}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !text.trim()}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white font-bold text-sm shadow-xl shadow-orange-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> AI extrage task-urile...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Extrage cu AI
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <h1 className="font-display text-3xl font-extrabold text-white tracking-tight mb-1">
                    Verifică task-urile
                  </h1>
                  <p className="text-[#94a3b8] text-sm mb-6">
                    {preview.length} task{preview.length === 1 ? "" : "-uri"} extrase — editează sau confirmă salvarea
                  </p>

                  <div className="space-y-3 mb-5">
                    {preview.map((t, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-white/10 bg-[#141721] p-4 shadow-xl space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <input
                            value={t.title}
                            onChange={(e) => updateTask(i, { title: e.target.value })}
                            className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-orange-400 py-1"
                          />
                          <button
                            onClick={() => removeTask(i)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.04]">
                          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg">
                            {PRIORITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateTask(i, { priority: opt.value })}
                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                                  t.priority === opt.value
                                    ? opt.active
                                    : "text-[#94a3b8] hover:text-white"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#cbd5e1]">
                            <Calendar className="w-3.5 h-3.5 text-orange-400" />
                            <input
                              type="date"
                              value={t.deadline ?? ""}
                              onChange={(e) => updateTask(i, { deadline: e.target.value || null })}
                              className="bg-transparent text-xs text-white focus:outline-none"
                            />
                          </label>

                          <input
                            value={t.category ?? ""}
                            onChange={(e) => updateTask(i, { category: e.target.value || null })}
                            placeholder="categorie"
                            className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-orange-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPreview(null)}
                      disabled={saving}
                      className="h-12 px-5 rounded-xl border border-white/10 text-sm font-semibold text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Anulează
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white font-bold text-sm shadow-xl shadow-orange-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Se salvează...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Salvează {preview.length} task-uri
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
