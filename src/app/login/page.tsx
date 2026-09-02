"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles, CheckCircle2, Calendar, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const GITHUB_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const GOOGLE_SVG = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const features = [
  { icon: Sparkles, text: "AI extrage task-uri din text natural" },
  { icon: Calendar, text: "Calendar săptămânal și zilnic" },
  { icon: Bell, text: "Reminder zilnic pe email la 09:00" },
  { icon: CheckCircle2, text: "Progres și statistici live" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  const handleOAuth = async (provider: "github" | "google") => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — nocturne "Capture" */}
      <div className="hidden lg:flex lg:w-[45%] bg-[var(--ink)] flex-col justify-between p-10 relative overflow-hidden capture-grain">
        <div className="capture-aurora absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-[#f97316] opacity-[0.16] blur-[120px] pointer-events-none" />
        <div className="capture-aurora absolute -bottom-32 -right-32 w-[320px] h-[320px] rounded-full bg-[#10b981] opacity-[0.12] blur-[100px] pointer-events-none" style={{ animationDelay: "-8s" }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/30 border border-orange-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white tracking-tight">TaskCapture</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-extrabold text-white leading-[1.05] mb-3">
            Bun venit<br />
            <span className="text-orange-400">înapoi.</span>
          </h2>
          <p className="text-[var(--haze)] text-sm leading-relaxed mb-8 max-w-xs">
            Continuă să îți organizezi ziua din câteva cuvinte.
          </p>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="text-sm text-white/55">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-sm text-white/55 leading-relaxed">
              <span className="text-orange-400">›</span> Trebuie să sun la doctor mâine, să trimit raportul până vineri și să cumpăr pâine azi seară
            </p>
            <p className="font-mono text-xs text-orange-400 mt-2.5">→ 3 task-uri extrase automat</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0e1117]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Acasă
          </Link>

          <div className="bg-[#141721] rounded-2xl border border-white/[0.08] shadow-2xl p-8">
            <div className="mb-7">
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                {forgotMode ? "Resetează parola" : "Intră în cont"}
              </h1>
              <p className="mt-1.5 text-sm text-[#94a3b8]">
                {forgotMode
                  ? "Îți trimitem un link de resetare pe email"
                  : "Bun venit înapoi la TaskCapture"}
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {!forgotMode && (
              <>
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <button type="button" onClick={() => handleOAuth("github")} disabled={loading}
                    className="flex items-center justify-center gap-2 h-10 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-[#cbd5e1] hover:bg-white/[0.08] transition-colors disabled:opacity-50">
                    {GITHUB_SVG} GitHub
                  </button>
                  <button type="button" onClick={() => handleOAuth("google")} disabled={loading}
                    className="flex items-center justify-center gap-2 h-10 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-[#cbd5e1] hover:bg-white/[0.08] transition-colors disabled:opacity-50">
                    {GOOGLE_SVG} Google
                  </button>
                </div>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-[#141721] text-xs text-[#64748b]">sau cu email</span></div>
                </div>
              </>
            )}

            {forgotMode && resetSent ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Email trimis!</p>
                <p className="text-sm text-[#94a3b8] mb-5">
                  Verifică inbox-ul la <span className="font-medium text-[#cbd5e1]">{email}</span> și urmează linkul de resetare.
                </p>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); setError(null); }}
                  className="text-sm text-orange-400 font-semibold hover:underline"
                >
                  Înapoi la login
                </button>
              </div>
            ) : (
              <form onSubmit={forgotMode ? handleForgot : handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full h-11 pl-9 pr-4 rounded-xl border border-white/10 bg-[#161a26] text-white text-sm placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-[#1a1f2c] transition-all"
                      placeholder="tu@email.com" disabled={loading} />
                  </div>
                </div>
                {!forgotMode && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Parolă</label>
                      <button
                        type="button"
                        onClick={() => { setForgotMode(true); setError(null); }}
                        className="text-xs text-orange-400 font-semibold hover:underline"
                      >
                        Ai uitat parola?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full h-11 pl-9 pr-11 rounded-xl border border-white/10 bg-[#161a26] text-white text-sm placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-[#1a1f2c] transition-all"
                        placeholder="••••••••" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={loading || !email || (!forgotMode && !password)}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-sm font-semibold shadow-lg shadow-orange-500/25 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-1">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {forgotMode ? "Se trimite..." : "Se conectează..."}</>
                    : forgotMode ? "Trimite link de resetare" : "Intră în cont"}
                </button>
                {forgotMode && (
                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setError(null); }}
                    className="w-full text-center text-sm text-[#94a3b8] hover:text-white transition-colors"
                  >
                    Înapoi la login
                  </button>
                )}
              </form>
            )}

            {!forgotMode && (
              <p className="mt-5 text-center text-sm text-[#94a3b8]">
                Nu ai cont?{" "}
                <Link href="/register" className="text-orange-400 font-semibold hover:underline">Creează unul gratuit</Link>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
