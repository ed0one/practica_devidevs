"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

const SHORTCUTS: KeyboardShortcut[] = [
  { key: "⌘/Ctrl + N", description: "Task nou (deschide Input)", category: "General" },
  { key: "⌘/Ctrl + K", description: "Caută task-uri (comandă rapidă)", category: "General" },
  { key: "?", description: "Afișează scurtăturile", category: "General" },
  { key: "← / →", description: "Navighează săptămână/zi", category: "Calendar" },
  { key: "Enter", description: "Deschide detalii task / Programează", category: "Calendar" },
  { key: "Space", description: "Comută task finalizat/în așteptare", category: "Calendar" },
  { key: "D", description: "Marchează task selectat ca finalizat", category: "Calendar" },
  { key: "S", description: "Programează task selectat", category: "Calendar" },
];

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  const grouped = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-white" />
                  <h2 className="text-white font-bold text-lg">Scurtături Tastatură</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {Object.entries(grouped).map(([category, shortcuts]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, i) => (
                      <motion.div
                        key={shortcut.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100/80 font-mono text-xs font-semibold text-gray-700 min-w-[120px]">
                          {shortcut.key}
                        </div>
                        <span className="text-sm text-gray-600">{shortcut.description}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Apăsați <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">?</kbd> pentru a închide
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}