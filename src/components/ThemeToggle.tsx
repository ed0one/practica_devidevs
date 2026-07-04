"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  return "light";
}

interface ThemeToggleProps {
  /** "sidebar" = dark surface (light text); "bar" = neutral surface. */
  variant?: "sidebar" | "bar";
  className?: string;
}

export default function ThemeToggle({ variant = "sidebar", className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Citim tema reală din DOM abia după montare (setată de scriptul no-FOUC),
    // ca să evităm mismatch SSR/CSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getInitial());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  };

  const base =
    variant === "sidebar"
      ? "text-white/55 hover:text-white/90 hover:bg-white/[0.06]"
      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10";

  const isDark = theme === "dark";
  // Înainte de montare arătăm o iconiță neutră ca să evităm mismatch-ul SSR.
  const label = !mounted ? "Comută tema" : isDark ? "Comută pe tema deschisă" : "Comută pe tema întunecată";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] ${base} ${className}`}
    >
      {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
