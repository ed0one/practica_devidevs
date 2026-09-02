"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  GitCommitHorizontal,
  BarChart2,
  Settings,
  Plus,
  LogOut,
  ChevronDown,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import type { ViewMode } from "@/types/task";

interface SidebarProps {
  userEmail?: string | null;
  displayName?: string | null;
  /** Vederea activă pe /dashboard (din ?view=); null = panoul general. */
  activeView?: ViewMode | null;
  /** Cât timp userul încă se încarcă, arătăm un schelet în loc de un nume fals. */
  loading?: boolean;
}

// Fiecare intrare duce la o vedere reală a dashboard-ului (citită din ?view=).
const NAV: { view: ViewMode; href: string; icon: typeof LayoutDashboard; label: string; matches: ViewMode[] }[] = [
  { view: "overview", href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", matches: ["overview"] },
  { view: "board", href: "/dashboard?view=board", icon: FolderKanban, label: "Kanban", matches: ["board"] },
  { view: "week", href: "/dashboard?view=week", icon: Calendar, label: "Calendar", matches: ["week", "day"] },
  { view: "timeline", href: "/dashboard?view=timeline", icon: GitCommitHorizontal, label: "Cronologie", matches: ["timeline"] },
  { view: "reports", href: "/dashboard?view=reports", icon: BarChart2, label: "Rapoarte", matches: ["reports", "list"] },
];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function Sidebar({ userEmail, displayName, activeView = null, loading = false }: SidebarProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const name = displayName?.trim() || (userEmail ? nameFromEmail(userEmail) : "");
  const initials = name ? initialsOf(name) : "?";
  const onDashboard = pathname === "/dashboard";
  const onProfile = pathname === "/profile";
  const current: ViewMode = activeView ?? "overview";

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 self-start overflow-y-auto no-scrollbar bg-[#0c0e14] border-r border-white/[0.06] text-[#94a3b8] z-30 select-none">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" prefetch={false} className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/30"
          >
            <CheckSquare className="w-5 h-5 text-white stroke-[2.4]" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-white text-[17px] tracking-tight group-hover:text-orange-400 transition-colors">
              TaskCapture
            </span>
            <span className="text-[10px] font-mono text-[#f97316] tracking-wider uppercase -mt-0.5">
              Workspace AI
            </span>
          </div>
        </Link>
      </div>

      {/* Card utilizator */}
      <div className="px-3.5 py-2 relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-expanded={userMenuOpen}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition-all duration-200 group text-left"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-rose-500/30 border border-white/15 flex items-center justify-center font-semibold text-xs text-white shadow-inner">
              {loading ? "" : initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#0c0e14]" />
          </div>
          <div className="flex-1 min-w-0">
            {loading || !userEmail ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-2.5 w-32 rounded bg-white/5" />
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                  {name}
                </p>
                <p className="text-[11px] text-[#64748b] truncate">{userEmail}</p>
              </>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64748b] group-hover:text-white transition-transform ${
              userMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {userMenuOpen && (
          <>
            {/* Strat invizibil: click oriunde în afară închide meniul. */}
            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-3.5 right-3.5 mt-1.5 p-1.5 rounded-xl bg-[#141824] border border-white/10 shadow-xl space-y-0.5 z-20"
            >
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-white/10 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-orange-400" />
                Setări cont & iCal
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Deconectare
              </button>
            </motion.div>
          </>
        )}
      </div>

      {/* CTA capturare AI */}
      <div className="px-3.5 pt-2 pb-3">
        <Link
          href="/input"
          className="group relative flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-xs font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Capturează cu AI</span>
          <Sparkles className="w-3.5 h-3.5 opacity-70 group-hover:rotate-12 transition-transform" />
        </Link>
      </div>

      {/* Navigație */}
      <nav className="flex-1 px-3.5 py-2 space-y-1" aria-label="Navigație principală">
        {NAV.map((item) => {
          const isActive = onDashboard && item.matches.includes(current);
          return (
            <Link
              key={item.view}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-white/[0.07] text-white font-semibold shadow-inner border border-white/[0.08]"
                  : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-5 rounded-r-full bg-[#f97316]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-[#f97316]" : "text-[#64748b] group-hover:text-white"
                }`}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Setări */}
      <div className="p-3.5 border-t border-white/[0.06] space-y-1">
        <Link
          href="/profile"
          aria-current={onProfile ? "page" : undefined}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
            onProfile
              ? "bg-white/[0.07] text-white font-semibold border border-white/[0.08]"
              : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <Settings className={`w-4 h-4 ${onProfile ? "text-[#f97316]" : "text-[#64748b]"}`} />
          <span>Setări</span>
        </Link>
        <div className="px-3.5 pt-1.5 text-[11px] text-[#64748b] font-mono">v1.0 · UTCB</div>
      </div>
    </aside>
  );
}
