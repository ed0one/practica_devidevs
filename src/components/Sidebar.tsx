"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Plus, LogOut, Sparkles, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/input", icon: Plus, label: "Adaugă task-uri", primary: true },
];

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

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 min-h-screen bg-white border-r border-gray-100 sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15 }}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200/50"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <span className="font-bold text-gray-900 text-[15px]">TaskCapture</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.primary
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50 hover:from-indigo-500 hover:to-violet-500"
                  : active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-2 pb-1">
          <div className="h-px bg-gray-100 mx-1" />
        </div>

        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/dashboard" && false /* calendar tab future */
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          Calendar
        </Link>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        {userEmail && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}
