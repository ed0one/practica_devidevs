"use client";

import { useSyncExternalStore } from "react";

export type TimeFormat = "24h" | "12h";

const STORAGE_KEY = "tc-time-format";
const EVENT_NAME = "tc-time-format-change";

export function getTimeFormat(): TimeFormat {
  if (typeof window === "undefined") return "24h";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "12h" ? "12h" : "24h";
}

export function setTimeFormat(fmt: TimeFormat) {
  localStorage.setItem(STORAGE_KEY, fmt);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: fmt }));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

// Hook reactiv — toate componentele care afișează ore se actualizează
// instant când userul schimbă setarea din profil.
export function useTimeFormat(): TimeFormat {
  return useSyncExternalStore(subscribe, getTimeFormat, () => "24h");
}

// "HH:MM" → "14:30" sau "2:30 PM"
export function formatClock(hhmm: string, fmt: TimeFormat): string {
  const h = parseInt(hhmm.substring(0, 2), 10);
  const m = hhmm.substring(3, 5);
  if (Number.isNaN(h)) return hhmm;
  if (fmt === "24h") return `${String(h).padStart(2, "0")}:${m}`;
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

// eticheta orei pe axa calendarului: "09:00" sau "9 AM"
export function formatHourLabel(hour: number, fmt: TimeFormat): string {
  if (fmt === "24h") return `${String(hour).padStart(2, "0")}:00`;
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}
