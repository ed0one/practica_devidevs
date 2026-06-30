"use client";

import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Flame } from "lucide-react";

interface StatsHeaderProps {
  tasks: Task[];
}

export default function StatsHeader({ tasks }: StatsHeaderProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const overdue = tasks.filter(
    (t) =>
      t.status === "pending" &&
      t.deadline &&
      new Date(t.deadline) < new Date()
  ).length;
  const highPriority = tasks.filter(
    (t) => t.status === "pending" && t.priority === "high"
  ).length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = [
    {
      label: "Total",
      value: total,
      icon: TrendingUp,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    {
      label: "Finalizate",
      value: done,
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Urgente",
      value: highPriority,
      icon: Flame,
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
    {
      label: "Scadente",
      value: overdue,
      icon: AlertTriangle,
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: i * 0.08,
            }}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <motion.p
                  key={stat.value}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-bold text-gray-900 mt-0.5"
                >
                  {stat.value}
                </motion.p>
              </div>
              <div className={`${stat.bg} p-2 rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Progres
            </span>
            <span className="text-sm font-bold text-indigo-600">
              {completionRate}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
