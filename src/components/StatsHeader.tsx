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
  const done = tasks.filter(t => t.status === "done").length;
  const overdue = tasks.filter(t =>
    t.status === "pending" && t.deadline && parseLocalDate(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const highPriority = tasks.filter(t => t.status === "pending" && t.priority === "high").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const dayData = last7.map(day => ({
    label: format(day, "EEE", { locale: ro }),
    isToday: isSameDay(day, today),
    count: tasks.filter(t => isSameDay(parseLocalDate(t.created_at), day)).length,
  }));
  const maxVal = Math.max(...dayData.map(d => d.count), 1);

  const stats = [
    { label: "Total",      value: total,        icon: TrendingUp,   gradient: "from-[#ff6a3d] to-[#ff8a63]", bg: "bg-orange-50",  text: "text-[#d24d1f]" },
    { label: "Finalizate", value: done,         icon: CheckCircle2, gradient: "from-emerald-400 to-teal-500",  bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Urgente",    value: highPriority, icon: Flame,        gradient: "from-orange-400 to-red-500",    bg: "bg-orange-50",  text: "text-orange-600" },
    { label: "Restante",   value: overdue,      icon: AlertTriangle,gradient: "from-red-400 to-rose-500",      bg: "bg-red-50",     text: "text-red-600" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, delay: i * 0.07 }}
            className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/70 dark:border-white/10 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <motion.p
                  key={stat.value}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="font-display text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-none"
                >
                  {stat.value}
                </motion.p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/70 dark:border-white/10 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progres total</p>
                <p className="text-sm text-gray-500 mt-0.5">{done} din {total} finalizate</p>
              </div>
              <span className="font-display text-3xl font-extrabold text-[#3dd4a7]">{completionRate}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ type: "spring", stiffness: 60, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-[#ff6a3d] to-[#3dd4a7] rounded-full"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/70 dark:border-white/10 p-5 shadow-sm"
          >
            <p className="font-mono text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Ultimele 7 zile</p>
            <div className="flex items-end justify-between gap-1.5 h-14">
              {dayData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="relative w-full flex items-end justify-center" style={{ height: 40 }}>
                    {d.count > 0 && (
                      <span className="absolute -top-4 text-[9px] font-bold text-gray-400">{d.count}</span>
                    )}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((d.count / maxVal) * 40, d.count > 0 ? 4 : 0)}px` }}
                      transition={{ delay: 0.45 + i * 0.05, type: "spring", stiffness: 200 }}
                      className={`w-full rounded-t-lg ${d.isToday ? "bg-gradient-to-t from-[#ff6a3d] to-[#ff8a63]" : "bg-orange-100 dark:bg-white/10"}`}
                    />
                  </div>
                  <span className={`font-mono text-[9px] font-semibold capitalize ${d.isToday ? "text-[#d24d1f]" : "text-gray-400"}`}>
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
