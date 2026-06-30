"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

const SHORTCUTS: KeyboardShortcut[] = [
  { key: "⌘/Ctrl + N", description: "Task nou (deschide Input)", category: "General" },
  { key: "⌘/Ctrl + K", description: "Caută task-uri (comandă rapidă)", category: "General" },
  { key: "?", description: "Afișează shortcuts", category: "General" },
  { key: "← / →", description: "Navighează săptămână/zi", category: "Calendar" },
  { key: "Enter", description: "Deschide detalii task / Programează", category: "Calendar" },
  { key: "Space", description: "Toggle task done/pending", category: "Calendar" },
  { key: "D", description: "Marchează task selectat ca Done", category: "Calendar" },
  { key: "S", description: "Programează task selectat", category: "Calendar" },
];

interface UseKeyboardShortcutsOptions {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleHelp?: () => void;
  onNavigateWeek?: (direction: "prev" | "next") => void;
  onNavigateDay?: (direction: "prev" | "next") => void;
  onToggleSelected?: () => void;
  onScheduleSelected?: () => void;
  onCompleteSelected?: () => void;
  onRefresh?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    onNewTask,
    onSearch,
    onToggleHelp,
    onNavigateWeek,
    onNavigateDay,
    onToggleSelected,
    onScheduleSelected,
    onCompleteSelected,
    onRefresh,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // ⌘/Ctrl + N - New task
      if (modKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        onNewTask?.();
        return;
      }

      // ⌘/Ctrl + K - Search
      if (modKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // ? - Show help
      if (event.key === "?" && !modKey) {
        event.preventDefault();
        onToggleHelp?.();
        return;
      }

      // Arrow keys - Navigate calendar
      if (!modKey) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onNavigateWeek?.("prev");
          onNavigateDay?.("prev");
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onNavigateWeek?.("next");
          onNavigateDay?.("next");
          return;
        }
      }

      // Enter - Toggle selected
      if (event.key === "Enter" && !modKey) {
        event.preventDefault();
        onToggleSelected?.();
        return;
      }

      // Space - Toggle done
      if (event.key === " " && !modKey) {
        event.preventDefault();
        onCompleteSelected?.();
        return;
      }

      // D - Mark done
      if (event.key.toLowerCase() === "d" && !modKey) {
        event.preventDefault();
        onCompleteSelected?.();
        return;
      }

      // S - Schedule
      if (event.key.toLowerCase() === "s" && !modKey) {
        event.preventDefault();
        onScheduleSelected?.();
        return;
      }

      // R - Refresh
      if (event.key.toLowerCase() === "r" && !modKey) {
        event.preventDefault();
        onRefresh?.();
        return;
      }
    },
    [onNewTask, onSearch, onToggleHelp, onNavigateWeek, onNavigateDay, onToggleSelected, onScheduleSelected, onCompleteSelected, onRefresh]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}