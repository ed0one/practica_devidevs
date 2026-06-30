"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2, Lightbulb } from "lucide-react";
import MobileNav from "@/components/MobileNav";

const EXAMPLES = [
  "Trebuie să sun la doctor mâine dimineață",
  "Trimite raportul lunar până vineri urgent",
  "Cumpără pâine și lapte azi seară",
  "Pregătește prezentarea pentru luni",
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
    <div className="min-h-screen bg-white flex flex-col pb-20 sm:pb-0">
      <MobileNav />

      {/* Top bar */}
      <header className="border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
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
          <span className="text-sm font-semibold text-gray-900">Adaugă task-uri</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Ce ai de făcut?
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Scrie în limbaj natural — AI-ul extrage și organizează task-urile automat
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col"
        >
          {/* Textarea */}
          <div className="relative flex-1 mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Trebuie să sun la doctor mâine, să trimit raportul până vineri și să cumpăr pâine azi seară..."
              rows={8}
              disabled={loading}
              className="w-full h-full min-h-[180px] rounded-2xl border border-gray-200 bg-gray-50 p-4 pb-10 text-gray-900 text-[15px] leading-relaxed placeholder-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 focus:bg-white resize-none transition-all"
            />
            {/* char/word count */}
            <AnimatePresence>
              {charCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-3 right-4 text-xs text-gray-300 select-none"
                >
                  {wordCount} cuv · {charCount} car
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick examples */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exemple rapide</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText((t) => t ? `${t}\n${ex}` : ex)}
                  className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg px-3 py-1.5 transition-all"
                >
                  + {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || !text.trim()}
            whileHover={!loading && text.trim() ? { scale: 1.01 } : {}}
            whileTap={!loading && text.trim() ? { scale: 0.99 } : {}}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI procesează...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extrage task-urile
              </>
            )}
          </motion.button>

          <p className="mt-3 text-center text-xs text-gray-300">
            Powered by NVIDIA NIM · Llama 3.1
          </p>
        </motion.form>
      </main>
    </div>
  );
}
