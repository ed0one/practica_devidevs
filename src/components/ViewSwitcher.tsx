"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Kanban,
  GitCommitHorizontal,
  LayoutGrid,
  Clock,
  List,
  BarChart2,
} from "lucide-react";
import type { ViewMode } from "@/types/task";

export const VIEW_MODES: ViewMode[] = ["overview", "board", "timeline", "week", "day", "list", "reports"];

export function isViewMode(v: unknown): v is ViewMode {
  return typeof v === "string" && (VIEW_MODES as string[]).includes(v);
}

const PILLS: { mode: ViewMode; icon: typeof Kanban; label: string }[] = [
  { mode: "overview", icon: LayoutDashboard, label: "Panou" },
  { mode: "board", icon: Kanban, label: "Kanban" },
  { mode: "timeline", icon: GitCommitHorizontal, label: "Cronologie" },
  { mode: "week", icon: LayoutGrid, label: "Săptămână" },
  { mode: "day", icon: Clock, label: "Zi" },
  { mode: "list", icon: List, label: "Listă" },
  { mode: "reports", icon: BarChart2, label: "Rapoarte" },
];

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewSwitcher({ viewMode, onChange }: ViewSwitcherProps) {
  return (
    <div
      className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1 overflow-x-auto no-scrollbar max-w-full"
      role="tablist"
      aria-label="Vedere"
    >
      {PILLS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          role="tab"
          onClick={() => onChange(mode)}
          aria-selected={viewMode === mode}
          title={label}
          className={`relative rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 ${
            viewMode === mode ? "text-white shadow-md font-bold" : "text-[#94a3b8] hover:text-white"
          }`}
        >
          {viewMode === mode && (
            <motion.div
              layoutId="viewPillActive"
              className="absolute inset-0 bg-gradient-to-r from-[#f97316] to-[#ea580c] rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
