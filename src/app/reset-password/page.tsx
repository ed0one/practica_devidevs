"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";

type PageState = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [state, setState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Linkul din email trece prin /auth/callback care face code exchange și
    // setează sesiunea. Dacă nu există sesiune, linkul e expirat/invalid.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setState(data.user ? "ready" : "invalid");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere.");
      return;
    }
    if (password !== confirm) {
      setError("Parolele nu coincid.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(
        updateError.message.includes("different from the old")
          ? "Parola nouă trebuie să difere de cea veche."
          : updateError.message
      );
      return;
    }
    setState("done");
  };

  const inputCls =
    "w-full h-11 pl-9 pr-11 rounded-xl border border-white/10 bg-[#161a26] text-white text-sm placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-[#1a1f2c] transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e1117] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center shadow-lg shadow-[#f97316]/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">TaskCapture</span>
        </div>

        <div className="bg-[#141721] rounded-2xl border border-white/[0.08] shadow-2xl p-8">
          {state === "checking" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
              <p className="text-sm text-[#94a3b8]">Se verifică linkul...</p>
            </div>
          )}

          {state === "invalid" && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h1 className="font-display text-lg font-bold text-white mb-2">Link expirat sau invalid</h1>
              <p className="text-sm text-[#94a3b8] mb-6">
                Linkul de resetare a expirat. Cere unul nou din pagina de login.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#f97316] text-black text-sm font-semibold hover:brightness-110 hover:-translate-y-0.5 transition-all"
              >
                Înapoi la login
              </Link>
            </div>
          )}

          {state === "done" && (
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </motion.div>
              <h1 className="font-display text-lg font-bold text-white mb-2">Parolă schimbată!</h1>
              <p className="text-sm text-[#94a3b8] mb-6">
                Poți folosi noua parolă de acum înainte.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-[#f97316] text-black text-sm font-semibold hover:brightness-110 hover:-translate-y-0.5 transition-all"
              >
                Mergi la dashboard
              </Link>
            </div>
          )}

          {state === "ready" && (
            <>
              <div className="mb-6">
                <h1 className="font-display text-xl font-bold text-white tracking-tight">Setează parola nouă</h1>
                <p className="mt-1 text-sm text-[#94a3b8]">Minim 8 caractere</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                    Parolă nouă
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                      placeholder="••••••••"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors"
                      aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                    Confirmă parola
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputCls}
                      placeholder="••••••••"
                      disabled={saving}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !password || !confirm}
                  className="w-full h-11 rounded-xl bg-[#f97316] text-black text-sm font-semibold shadow-lg shadow-orange-200/60 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Se salvează...
                    </>
                  ) : (
                    "Salvează parola"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
