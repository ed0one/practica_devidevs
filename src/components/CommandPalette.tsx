"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Task } from "@/types/task";
import {
  Search,
  Plus,
  LayoutDashboard,
  UserCircle,
  Download,
  BarChart2,
  LogOut,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  action: () => void;
}

interface CommandPaletteProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onExportCSV: () => void;
  onCreateTask?: () => void;
}

const OPEN_EVENT = "open-command-palette";

export default function CommandPalette({ tasks, onEditTask, onExportCSV, onCreateTask }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // ⌘K / Ctrl+K global + eveniment custom pentru butonul din toolbar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActiveIndex(0);
      }
    };
    const onOpenEvent = () => {
      setOpen(true);
      setQuery("");
      setActiveIndex(0);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  // Autofocus la deschidere
  useEffect(() => {
    if (open) {
      // focus după ce framer-motion montează elementul
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const commands: Command[] = useMemo(
    () => [
      ...(onCreateTask
        ? [{ id: "create", label: "Creează task rapid", hint: "formular", icon: Plus, action: onCreateTask }]
        : []),
      { id: "add", label: "Capturează task-uri cu AI", hint: "/input", icon: Plus, action: () => { window.location.href = "/input"; } },
      { id: "dashboard", label: "Mergi la Dashboard", icon: LayoutDashboard, action: () => { window.location.href = "/dashboard"; } },
      { id: "reports", label: "Rapoarte", icon: BarChart2, action: () => { window.location.href = "/dashboard?view=reports"; } },
      { id: "profile", label: "Profil & setări", icon: UserCircle, action: () => { window.location.href = "/profile"; } },
      { id: "export", label: "Exportă CSV", icon: Download, action: onExportCSV },
      {
        id: "logout",
        label: "Deconectare",
        icon: LogOut,
        action: async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.href = "/";
        },
      },
    ],
    [onExportCSV, onCreateTask]
  );

  const q = query.trim().toLowerCase();

  const filteredCommands = useMemo(
    () => (q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands),
    [commands, q]
  );

  const filteredTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 6);
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.category ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [tasks, q]);

  // Lista plată pentru navigarea cu tastatura: comenzi apoi task-uri
  const flatItems = useMemo(
    () => [
      ...filteredCommands.map((c) => ({ type: "command" as const, command: c })),
      ...filteredTasks.map((t) => ({ type: "task" as const, task: t })),
    ],
    [filteredCommands, filteredTasks]
  );

  const runItem = useCallback(
    (index: number) => {
      const item = flatItems[index];
      if (!item) return;
      close();
      if (item.type === "command") item.command.action();
      else onEditTask(item.task);
    },
    [flatItems, close, onEditTask]
  );

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(activeIndex);
    } else if (e.key === "Escape") {
      close();
    }
  };

  // Ține elementul activ vizibil la navigarea cu săgeți
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const itemCls = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors cursor-pointer ${
      active
        ? "bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30"
        : "text-[#cbd5e1] hover:bg-white/5 border border-transparent"
    }`;

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[15dvh]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label="Paletă de comenzi"
            className="relative w-full max-w-lg rounded-2xl bg-[#141722] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[60dvh] text-white"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 border-b border-white/10 shrink-0">
              <Search className="w-4 h-4 text-[#64748b] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Caută task-uri sau comenzi..."
                aria-label="Caută task-uri sau comenzi"
                className="flex-1 h-12 bg-transparent text-sm text-white placeholder-[#64748b] focus:outline-none"
              />
              <kbd className="hidden sm:block text-[10px] font-semibold text-[#94a3b8] bg-white/10 rounded px-1.5 py-0.5">
                esc
              </kbd>
            </div>

            {/* Rezultate */}
            <div ref={listRef} className="overflow-y-auto p-2 space-y-3">
              {filteredCommands.length > 0 && (
                <div>
                  <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    Comenzi
                  </p>
                  <div className="space-y-0.5">
                    {filteredCommands.map((c) => {
                      flatIndex++;
                      const idx = flatIndex;
                      return (
                        <button
                          key={c.id}
                          data-index={idx}
                          onClick={() => runItem(idx)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={itemCls(activeIndex === idx)}
                        >
                          <c.icon className="w-4 h-4 shrink-0 opacity-70" />
                          <span className="flex-1 truncate">{c.label}</span>
                          {c.hint && (
                            <span className="text-[10px] text-[#64748b] font-mono">{c.hint}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredTasks.length > 0 && (
                <div>
                  <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    Task-uri
                  </p>
                  <div className="space-y-0.5">
                    {filteredTasks.map((t) => {
                      flatIndex++;
                      const idx = flatIndex;
                      const isDone = t.status === "done";
                      return (
                        <button
                          key={t.id}
                          data-index={idx}
                          onClick={() => runItem(idx)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={itemCls(activeIndex === idx)}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 shrink-0 text-[#64748b]" />
                          )}
                          <span className={`flex-1 truncate ${isDone ? "line-through text-[#64748b]" : ""}`}>
                            {t.title}
                          </span>
                          {t.category && (
                            <span className="text-[10px] text-orange-300 bg-orange-500/15 border border-orange-500/25 rounded px-1.5 py-0.5 shrink-0">
                              {t.category}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {flatItems.length === 0 && (
                <p className="px-3 py-8 text-sm text-[#94a3b8] text-center">
                  Niciun rezultat pentru „{query}&rdquo;
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/10 shrink-0">
              <p className="text-[10px] text-[#64748b]">
                ↑↓ navighează · ↵ selectează · esc închide
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
