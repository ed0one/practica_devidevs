"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Plus, Calendar, UserCircle, LogOut, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  userEmail?: string | null;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/profile", icon: UserCircle, label: "Profil" },
  ];

  const initials = (userEmail ?? "?").split("@")[0].slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen sticky top-0 bg-[var(--ink)] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.05 }}
            className="w-8 h-8 rounded-lg bg-[#ff6a3d] flex items-center justify-center shadow-lg shadow-[#ff6a3d]/25"
          >
            <Sparkles className="w-4 h-4 text-black/80" />
          </motion.div>
          <span className="font-display font-bold text-white text-[15px] tracking-tight">TaskCapture</span>
        </div>
      </div>

      {/* Add tasks button */}
      <div className="px-3 pb-2">
        <Link
          href="/input"
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-[#ff6a3d] text-black text-sm font-semibold shadow-lg shadow-[#ff6a3d]/20 hover:bg-[#ff5a28] transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Adaugă task-uri
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 my-2 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white/80 hover:bg-white/[0.06]"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute inset-0 rounded-xl bg-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}

        <a
          href="/dashboard#calendar-section"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-white/80 hover:bg-white/[0.06] transition-all"
        >
          <Calendar className="w-4 h-4 shrink-0" />
          Calendar
        </a>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff6a3d]/40 to-[#3dd4a7]/30 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white/80 shrink-0">
            {initials}
          </div>
          <p className="text-xs text-white/50 truncate flex-1">{userEmail}</p>
          <ThemeToggle variant="sidebar" className="w-8 h-8 shrink-0" />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}
