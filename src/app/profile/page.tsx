"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Task, UserPrefs } from "@/types/task";
import { useTimeFormat, setTimeFormat, formatHourLabel, type TimeFormat } from "@/lib/time-format";
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  Clock,
  Flame,
  Tag,
  Save,
  LogOut,
  Bell,
  Globe,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<{
    email: string;
    full_name: string;
    created_at: string;
    provider: string;
  } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const timeFmt = useTimeFormat();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) { window.location.href = "/login"; return; }
      const name = (u.user_metadata?.full_name as string) ?? u.email?.split("@")[0] ?? "";
      setUser({
        email: u.email ?? "",
        full_name: name,
        created_at: u.created_at,
        provider: u.app_metadata?.provider as string ?? "email",
      });
      setDisplayName(name);
    });
    fetch("/api/tasks").then(r => r.json()).then(d => setTasks(d.tasks ?? []));

    // Preferințe notificări + sincronizare automată a timezone-ului detectat
    fetch("/api/prefs")
      .then(r => r.json())
      .then(d => {
        const p: UserPrefs | undefined = d.prefs;
        if (!p) return;
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTz && browserTz !== p.timezone) {
          // userul e în alt fus decât cel salvat — actualizăm silențios
          fetch("/api/prefs", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timezone: browserTz }),
          })
            .then(r => r.json())
            .then(d2 => setPrefs(d2.prefs ?? { ...p, timezone: browserTz }))
            .catch(() => setPrefs(p));
        } else {
          setPrefs(p);
        }
      })
      .catch(() => {});
  }, []);

  const updatePrefs = async (updates: Partial<UserPrefs>) => {
    const prev = prefs;
    setPrefs(p => p ? { ...p, ...updates } : p);
    try {
      const res = await fetch("/api/prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPrefs(d.prefs);
    } catch {
      setPrefs(prev ?? null);
      toast.error("Nu s-au putut salva preferințele.");
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });
      if (error) throw error;
      setUser(u => u ? { ...u, full_name: displayName.trim() } : u);
      toast.success("Nume actualizat.");
    } catch {
      toast.error("Nu s-a putut salva.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Email trimis! Verifică inbox-ul.");
    } catch {
      toast.error("Eroare la trimiterea emailului.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Stats
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const urgent = tasks.filter(t => t.priority === "high" && t.status === "pending").length;
  const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))].length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const initials = (user?.full_name || user?.email || "?")
    .split(/[\s@]/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? "")
    .join("");

  const stats = [
    { icon: CheckCircle2, label: "Finalizate", value: done, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100" },
    { icon: Clock,        label: "În așteptare", value: total - done, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-100" },
    { icon: Flame,        label: "Urgente active", value: urgent, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100" },
    { icon: Tag,          label: "Categorii", value: categories, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-100" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0f] flex">
      <Sidebar userEmail={user?.email} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#0c0c14]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </a>
            <span className="font-bold text-white text-sm">Profil</span>
          </div>
          <ThemeToggle variant="sidebar" className="w-8 h-8" />
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 max-w-3xl w-full mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Profilul meu</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestionează contul și preferințele tale</p>
          </motion.div>

          <div className="space-y-5">
            {/* Avatar + identitate */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
            >
              <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
              <div className="px-6 pb-6">
                <div className="-mt-10 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg border-4 border-white dark:border-[#16161f]">
                    {initials}
                  </div>
                </div>
                <div className="min-w-0 mb-5">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{user?.full_name || "—"}</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-1.5 min-w-0 mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-500 dark:text-gray-400">
                    <User className="w-3 h-3 shrink-0" /> Activ din {joinDate}
                  </span>
                  <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-1.5 text-indigo-600 dark:text-indigo-400 font-medium capitalize">
                    {user?.provider === "email" ? "🔑 Email & parolă" : `🔗 ${user?.provider}`}
                  </span>
                  <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    {pct}% completat
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {stats.map(({ icon: Icon, label, value, color, bg, border }) => (
                <div key={label} className={`bg-white dark:bg-[#16161f] rounded-2xl border ${border} dark:border-white/10 shadow-sm p-4 flex flex-col gap-2`}>
                  <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
              className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progres general</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{done}/{total} task-uri</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{pct}% din task-uri finalizate</p>
            </motion.div>

            {/* Editare nume */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-5"
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Informații cont
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nume afișat
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSaveName()}
                      placeholder="Numele tău"
                      className="flex-1 min-w-0 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName || displayName.trim() === user?.full_name}
                      className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {savingName ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvează
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <div className="h-10 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 flex items-center text-sm text-gray-400 select-none">
                    {user?.email}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Preferințe */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-5"
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Preferințe
              </h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Format oră</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cum se afișează orele în calendar și task-uri
                  </p>
                </div>
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-white/10 p-0.5 shrink-0">
                  {([
                    ["24h", "24h"],
                    ["12h", "AM/PM"],
                  ] as [TimeFormat, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTimeFormat(value)}
                      aria-pressed={timeFmt === value}
                      className={`px-3.5 h-8 rounded-lg text-xs font-semibold transition-all ${
                        timeFmt === value
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Notificări */}
            {prefs && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-5"
              >
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  Notificări pe email
                </h3>
                <div className="space-y-4">
                  {/* Digest zilnic */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rezumat zilnic</p>
                      <p className="text-xs text-gray-400 mt-0.5">Task-urile scadente în ziua respectivă</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={prefs.email_daily}
                      onClick={() => updatePrefs({ email_daily: !prefs.email_daily })}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${prefs.email_daily ? "bg-indigo-600" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefs.email_daily ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>

                  {/* Ora rezumatului */}
                  {prefs.email_daily && (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ora rezumatului</p>
                        <p className="text-xs text-gray-400 mt-0.5">Pe fusul tău orar</p>
                      </div>
                      <select
                        value={prefs.reminder_hour}
                        onChange={(e) => updatePrefs({ reminder_hour: Number(e.target.value) })}
                        className="h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shrink-0"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>{formatHourLabel(h, timeFmt)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Email la task-uri noi */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmare task-uri noi</p>
                      <p className="text-xs text-gray-400 mt-0.5">Email la fiecare adăugare de task-uri</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={prefs.email_new_tasks}
                      onClick={() => updatePrefs({ email_new_tasks: !prefs.email_new_tasks })}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${prefs.email_new_tasks ? "bg-indigo-600" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefs.email_new_tasks ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fus orar</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{prefs.timezone}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1 shrink-0">
                      detectat automat
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Securitate */}
            {user?.provider === "email" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
                className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm p-5"
              >
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  Securitate
                </h3>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Schimbă parola</p>
                    <p className="text-xs text-gray-400 mt-0.5">Vei primi un link de resetare pe email</p>
                  </div>
                  {resetSent ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Email trimis
                    </span>
                  ) : (
                    <button
                      onClick={handlePasswordReset}
                      disabled={sendingReset}
                      className="h-9 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition shrink-0"
                    >
                      {sendingReset ? "Se trimite..." : "Resetează parola"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Logout */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="bg-white dark:bg-[#16161f] rounded-2xl border border-red-100 dark:border-red-500/20 shadow-sm p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Deconectare</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ieși din cont pe acest dispozitiv</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="h-9 px-4 rounded-xl border border-red-200 dark:border-red-500/30 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  Deconectare
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
