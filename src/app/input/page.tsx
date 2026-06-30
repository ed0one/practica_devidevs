"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import MobileNav from "@/components/MobileNav";

export default function InputPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

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
      const msg = err instanceof Error ? err.message : "Eroare necunoscută";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col pb-20 sm:pb-0">
      <MobileNav />
      <header className="mx-auto w-full max-w-2xl px-4 py-6 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/dashboard")}
          className="rounded-xl border border-gray-200 bg-white/80 p-2 text-gray-500 hover:bg-gray-50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            TaskCapture
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ce ai de făcut?</h2>
            <p className="mt-2 text-gray-500">
              Scrie în limbaj natural — AI-ul extrage task-urile automat
            </p>
          </div>

          {/* Exemple rapide */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              "Trebuie să sun la doctor mâine",
              "Trimite raportul până vineri urgent",
              "Cumpără pâine și lapte azi seară",
            ].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setText((t) => t ? t + "\n" + ex : ex)}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                + {ex}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Trebuie să sun la doctor mâine, să trimit raportul până vineri și să cumpăr pâine azi seară..."
              rows={6}
              disabled={loading}
              className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
            />

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !text.trim()}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Se procesează...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extrage task-urile
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
