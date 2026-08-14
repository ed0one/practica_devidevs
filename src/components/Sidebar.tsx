"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Users,
  BarChart2,
  Settings,
  Plus,
  LogOut,
  ChevronDown,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

interface SidebarProps {
  userEmail?: string | null;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName = userEmail
    ? userEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Sarah Chen";

  const userRole = userEmail ? "Workspace Owner" : "Product Manager";
  const initials = displayName.slice(0, 2).toUpperCase();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard?view=board", icon: FolderKanban, label: "Projects" },
    { href: "/dashboard#calendar-section", icon: Calendar, label: "Calendar" },
    { href: "/dashboard?view=team", icon: Users, label: "Team" },
    { href: "/dashboard?view=stats", icon: BarChart2, label: "Reporting" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 min-h-screen sticky top-0 bg-[#0c0e14] border-r border-white/[0.06] text-[#94a3b8] z-30 select-none">
      {/* Brand Header */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2.5 group">
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

      {/* User Profile Card (matches mockup) */}
      <div className="px-3.5 py-2">
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition-all duration-200 group"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-rose-500/30 border border-white/15 flex items-center justify-center font-semibold text-xs text-white shadow-inner">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#0c0e14]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
              {displayName}
            </p>
            <p className="text-[11px] text-[#64748b] truncate">{userRole}</p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64748b] group-hover:text-white transition-transform ${
              userMenuOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* User drop menu */}
        {userMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 p-1.5 rounded-xl bg-[#141824] border border-white/10 shadow-xl space-y-0.5"
          >
            <Link
              href="/profile"
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
        )}
      </div>

      {/* Quick Add CTA */}
      <div className="px-3.5 pt-2 pb-3">
        <Link
          href="/input"
          className="group relative flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-xs font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>AI Task Capture</span>
          <Sparkles className="w-3.5 h-3.5 opacity-70 group-hover:rotate-12 transition-transform" />
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3.5 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard" && !pathname.includes("profile")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-white/[0.07] text-white font-semibold shadow-inner border border-white/[0.08]"
                  : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
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

      {/* Footer / Settings link */}
      <div className="p-3.5 border-t border-white/[0.06] space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Settings className="w-4 h-4 text-[#64748b]" />
          <span>Settings</span>
        </Link>

        <div className="flex items-center justify-between px-3.5 pt-1.5 text-[11px] text-[#64748b]">
          <span className="font-mono">v1.0 · UTCB</span>
          <ThemeToggle variant="sidebar" className="w-7 h-7" />
        </div>
      </div>
    </aside>
  );
}
