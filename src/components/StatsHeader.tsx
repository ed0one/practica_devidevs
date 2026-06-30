"use client";

import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { CheckCircle2, AlertTriangle, TrendingUp, Flame } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";

interface StatsHeaderProps {
  tasks: Task[];
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function StatsHeader({ tasks }: StatsHeaderProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(
    (t) => t.status === "pending" && t.deadline && parseLocalDate(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const highPriority = tasks.filter((t) => t.status === "pending" && t.priority === "high").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Weekly chart: tasks created per day last 7 days
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const dayData = last7.map((day) => ({
    label: format(day, "EEE", { locale: ro }),
    isToday: isSameDay(day, today),
    created: tasks.filter((t) => isSameDay(parseLocalDate(t.created_at), day)).length,
    done: tasks.filter((t) => t.status === "done" && isSameDay(parseLocalDate(t.created_at), day)).length,
  }));
  const maxVal = Math.max(...dayData.map((d) => d.created), 1);

  const stats = [
    { label: "Total", value: total, icon: TrendingUp, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    { label: "Finalizate", value: done, icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    { label: "Urgente", value: highPriority, icon: Flame, bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
    { label: "Restante", value: overdue, icon: AlertTriangle, bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  ];

  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className={`rounded-2xl border ${stat.border} bg-white p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <motion.p
                  key={stat.value}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black text-gray-900 mt-0.5"
                >
                  {stat.value}
                </motion.p>
              </div>
              <div className={`${stat.bg} p-2.5 rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress + weekly chart */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progres total</span>
              <span className="text-xl font-black text-indigo-600">{completionRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ type: "spring", stiffness: 80, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{done} din {total} task-uri finalizate</p>
          </motion.div>

          {/* Weekly bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ultima săptămână</p>
            <div className="flex items-end justify-between gap-1 h-16">
              {dayData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="relative w-full flex items-end justify-center" style={{ height: 48 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.created / maxVal) * 48}px` }}
                      transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 200 }}
                      className={`w-full rounded-t-md ${d.isToday ? "bg-indigo-500" : "bg-indigo-200"}`}
                      style={{ minHeight: d.created > 0 ? 4 : 0 }}
                    />
                    {d.created > 0 && (
                      <span className="absolute -top-4 text-[9px] font-bold text-gray-500">{d.created}</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold capitalize ${d.isToday ? "text-indigo-600" : "text-gray-400"}`}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
