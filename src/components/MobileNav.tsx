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
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden">
      <div className="bg-[#0c0c14]/95 backdrop-blur-xl border-t border-white/[0.08]">
        <div className="flex items-center justify-around px-2 pt-2 pb-5">
          {links.map((link) => {
            const active = pathname === (link.matchHref ?? link.href);
            if (link.primary) {
              return (
                <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff6a3d] to-[#3dd4a7] flex items-center justify-center shadow-lg shadow-[#ff6a3d]/30 -mt-4">
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#ff8a63]">{link.label}</span>
                </Link>
              );
            }
            return (
              <a key={link.href} href={link.href} className="flex flex-col items-center gap-1 px-3 py-1">
                <link.icon className={`w-5 h-5 transition-colors ${active ? "text-[#ff8a63]" : "text-white/30"}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-[#ff8a63]" : "text-white/30"}`}>
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
