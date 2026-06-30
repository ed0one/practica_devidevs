"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Calendar, UserCircle } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/input", icon: Plus, label: "Adaugă", primary: true },
    { href: "/dashboard#calendar-section", icon: Calendar, label: "Calendar", matchHref: "/dashboard" },
    { href: "/profile", icon: UserCircle, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-white/90 backdrop-blur-xl border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around px-2 pt-2 pb-4">
        {links.map((link) => {
          const active = pathname === (link.matchHref ?? link.href);
          if (link.primary) {
            return (
              <Link key={link.href} href={link.href} className="flex flex-col items-center gap-0.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-300/50 -mt-5">
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-indigo-600">{link.label}</span>
              </Link>
            );
          }
          return (
            <a key={link.href} href={link.href} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <link.icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-gray-400"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-indigo-600" : "text-gray-400"}`}>
                {link.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
