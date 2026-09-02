"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Calendar, UserCircle } from "lucide-react";
import type { ViewMode } from "@/types/task";

interface MobileNavProps {
  /** Vederea activă pe /dashboard, ca tab-ul „Calendar" să se aprindă corect. */
  activeView?: ViewMode | null;
}

// Vizibil sub lg (unde Sidebar-ul e ascuns), deci și pe tabletă.
export default function MobileNav({ activeView = null }: MobileNavProps) {
  const pathname = usePathname();
  const calendarActive = pathname === "/dashboard" && (activeView === "week" || activeView === "day");
  const dashboardActive = pathname === "/dashboard" && !calendarActive;

  const links = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", active: dashboardActive },
    { href: "/input", icon: Plus, label: "Adaugă", primary: true, active: pathname === "/input" },
    { href: "/dashboard?view=week", icon: Calendar, label: "Calendar", active: calendarActive },
    { href: "/profile", icon: UserCircle, label: "Profil", active: pathname === "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden" aria-label="Navigație mobilă">
      <div className="bg-[#0c0e14]/95 backdrop-blur-xl border-t border-white/[0.08]">
        <div className="flex items-center justify-around px-2 pt-2 pb-5">
          {links.map((link) => {
            if (link.primary) {
              return (
                <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/30 -mt-4">
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-orange-400">{link.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <link.icon className={`w-5 h-5 transition-colors ${link.active ? "text-orange-400" : "text-white/35"}`} />
                <span className={`text-[10px] font-medium transition-colors ${link.active ? "text-orange-400" : "text-white/35"}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
