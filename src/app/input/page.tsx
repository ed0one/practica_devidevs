"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2, Zap, CheckCircle2, Trash2, Save, Calendar } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import type { ParsedTask, Priority } from "@/types/task";

const EXAMPLES = [
  "Trebuie să sun la doctor mâine dimineață",
  "Trimite raportul lunar până vineri urgent",
  "Cumpără pâine și lapte azi seară",
  "Meeting cu echipa joi de la 14:00 la 15:30",
];

const PRIORITY_OPTIONS: { value: Priority; label: string; active: string }[] = [
  { value: "high", label: "Urgent", active: "bg-red-500 text-white border-red-500" },
  { value: "medium", label: "Mediu", active: "bg-amber-400 text-white border-amber-400" },
  { value: "low", label: "Scăzut", active: "bg-emerald-500 text-white border-emerald-500" },
];

export default function InputPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // null = pasul 1 (input); array = pasul 2 (preview)
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
    <div className="min-h-screen flex bg-[#0c0c14]">
      <MobileNav />

      {/* Left panel — dark branding */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden border-r border-white/[0.06]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#ff6a3d]/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#3dd4a7]/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10">
          <a href="/dashboard" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6a3d] to-[#3dd4a7] flex items-center justify-center shadow-lg shadow-[#ff6a3d]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TaskCapture</span>
          </a>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ff6a3d]/10 border border-[#ff6a3d]/20 rounded-full px-3 py-1 text-xs text-[#ff8a63] mb-5">
              <Zap className="w-3 h-3" /> Powered by Llama 3.1
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              Scrie natural,<br />
              <span className="bg-gradient-to-r from-[#ff8a63] to-[#3dd4a7] bg-clip-text text-transparent">
                AI organizează.
              </span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Nu trebuie format special. Scrie cum gândești — AI-ul extrage task-urile, apoi le poți verifica înainte de salvare.
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
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ff8a63] shrink-0" />
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-[#f5f5f7] dark:bg-[#0a0a0f] pb-20 sm:pb-0">
        <header className="lg:hidden border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-3 bg-white dark:bg-[#16161f] sticky top-0 z-10">
          <button
            onClick={() => (preview ? setPreview(null) : router.push("/dashboard"))}
            aria-label="Înapoi"
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff6a3d] to-[#3dd4a7] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {preview ? "Verifică task-urile" : "Adaugă task-uri"}
            </span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-xl">
            <button
              onClick={() => (preview ? setPreview(null) : router.push("/dashboard"))}
              className="hidden lg:inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              {preview ? "Înapoi la text" : "Înapoi la dashboard"}
            </button>

            <AnimatePresence mode="wait">
              {!preview ? (
                <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">Ce ai de făcut?</h1>
                  <p className="text-gray-400 text-sm mb-6">Scrie în limbaj natural — AI-ul extrage și organizează automat</p>

                  <form onSubmit={handleExtract} className="space-y-4">
                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        aria-label="Text pentru extragerea task-urilor"
                        placeholder="Ex: Trebuie să sun la doctor mâine, să trimit raportul până vineri urgent și să cumpăr pâine azi seară..."
                        rows={7}
                        disabled={loading}
                        className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161f] p-4 pb-10 text-gray-900 dark:text-gray-100 text-[15px] leading-relaxed placeholder-gray-300 dark:placeholder-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/15 focus:border-[#ff8a63] resize-none transition-all"
                      />
                      <AnimatePresence>
                        {charCount > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute bottom-3 right-4 text-xs text-gray-300 dark:text-gray-600 select-none"
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
                            className="text-xs bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-[#ff8a63] hover:text-[#d24d1f] hover:bg-orange-50/50 dark:hover:bg-[#ff6a3d]/10 rounded-lg px-3 py-1.5 transition-all"
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
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff6a3d] to-[#3dd4a7] text-white font-semibold text-sm shadow-lg shadow-orange-200 dark:shadow-none hover:from-[#ff6a3d] hover:to-[#3dd4a7] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> AI procesează...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Extrage task-urile</>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                    Verifică task-urile
                  </h1>
                  <p className="text-gray-400 text-sm mb-6">
                    {preview.length} task{preview.length === 1 ? "" : "-uri"} extrase — editează sau elimină înainte de salvare
                  </p>

                  <div className="space-y-3 mb-5">
                    <AnimatePresence mode="popLayout">
                      {preview.map((t, i) => (
                        <motion.div
                          key={i}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161f] p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-2">
                            <input
                              value={t.title}
                              onChange={(e) => updateTask(i, { title: e.target.value })}
                              aria-label="Titlu task"
                              className="flex-1 min-w-0 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-[#ff8a63] bg-transparent px-2 py-1 text-[15px] font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/15 transition-all"
                            />
                            <button
                              onClick={() => removeTask(i)}
                              aria-label="Elimină task-ul"
                              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 p-0.5">
                              {PRIORITY_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateTask(i, { priority: opt.value })}
                                  aria-pressed={t.priority === opt.value}
                                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                    t.priority === opt.value
                                      ? opt.active
                                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            <label className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="date"
                                value={t.deadline ?? ""}
                                onChange={(e) => updateTask(i, { deadline: e.target.value || null })}
                                aria-label="Deadline"
                                className="bg-transparent text-xs focus:outline-none text-gray-700 dark:text-gray-200"
                              />
                            </label>

                            <input
                              value={t.category ?? ""}
                              onChange={(e) => updateTask(i, { category: e.target.value || null })}
                              placeholder="categorie"
                              aria-label="Categorie"
                              className="w-28 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent px-2 py-1 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/15 focus:border-[#ff8a63] transition-all"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {preview.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">
                      Ai eliminat toate task-urile.{" "}
                      <button onClick={() => setPreview(null)} className="text-[#d24d1f] font-semibold hover:underline">
                        Înapoi la text
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPreview(null)}
                        disabled={saving}
                        className="h-12 px-5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                      >
                        Anulează
                      </button>
                      <motion.button
                        onClick={handleSave}
                        disabled={saving}
                        whileHover={!saving ? { scale: 1.01 } : {}}
                        whileTap={!saving ? { scale: 0.99 } : {}}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#ff6a3d] to-[#3dd4a7] text-white font-semibold text-sm shadow-lg shadow-orange-200 dark:shadow-none hover:from-[#ff6a3d] hover:to-[#3dd4a7] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                      >
                        {saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Se salvează...</>
                        ) : (
                          <><Save className="w-4 h-4" /> Salvează {preview.length} task{preview.length === 1 ? "" : "-uri"}</>
                        )}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
