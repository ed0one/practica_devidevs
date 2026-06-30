"use client";

import { motion } from "framer-motion";
import { Task, WorklogEntry } from "@/types/task";
import {
  Clock,
  CheckCircle2,
  BarChart2,
  TrendingUp,
  Target,
  Calendar,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { ro } from "date-fns/locale";

interface WeeklySummaryProps {
  tasks: Task[];
  worklogs: WorklogEntry[];
}

function getWeekRange(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

function isInWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const date = new Date(dateStr);
  return date >= weekStart && date <= weekEnd;
}

function computeWeeklyStats(tasks: Task[], worklogs: WorklogEntry[]) {
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter worklogs for this week
  const weekWorklogs = worklogs.filter((w) => isInWeek(w.date, weekStart, weekEnd));

  // Total hours this week
  const totalMinutes = weekWorklogs.reduce((sum, w) => sum + w.time_spent, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Tasks completed this week
  const completedThisWeek = tasks.filter(
    (t) => t.status === "done" && t.created_at && isInWeek(t.created_at, weekStart, weekEnd)
  ).length;

  // Tasks planned this week (scheduled or with deadline in week)
  const plannedThisWeek = tasks.filter(
    (t) =>
      (t.scheduled_date && isInWeek(t.scheduled_date, weekStart, weekEnd)) ||
      (t.deadline && isInWeek(t.deadline, weekStart, weekEnd))
  ).length;

  // Time by category
  const timeByCategory: Record<string, number> = {};
  weekWorklogs.forEach((wl) => {
    const task = tasks.find((t) => t.id === wl.task_id);
    const cat = task?.category || "Fără categorie";
    timeByCategory[cat] = (timeByCategory[cat] || 0) + wl.time_spent;
  });

  // Time by priority
  const timeByPriority: Record<string, number> = { high: 0, medium: 0, low: 0 };
  weekWorklogs.forEach((wl) => {
    const task = tasks.find((t) => t.id === wl.task_id);
    if (task) timeByPriority[task.priority] += wl.time_spent;
  });

  // Daily breakdown
  const dailyData = days.map((day) => {
    const dayWorklogs = weekWorklogs.filter((w) => isSameDay(new Date(w.date), day));
    const minutes = dayWorklogs.reduce((sum, w) => sum + w.time_spent, 0);
    return {
      day: format(day, "EEE", { locale: ro }),
      date: format(day, "d MMM", { locale: ro }),
      minutes,
      hours: Math.floor(minutes / 60),
      mins: minutes % 60,
      fullDate: format(day, "yyyy-MM-dd"),
    };
  });

  function isSameDay(d1: Date, d2: Date): boolean {
    return d1.toDateString() === d2.toDateString();
  }

  // Completion rate
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Average session length
  const avgSession = weekWorklogs.length > 0
    ? Math.round(totalMinutes / weekWorklogs.length)
    : 0;

  // Most productive day
  const bestDay = dailyData.reduce((max, d) => (d.minutes > max.minutes ? d : max), dailyData[0]);

  return {
    weekStart,
    weekEnd,
    totalHours,
    totalMins,
    totalMinutes,
    completedThisWeek,
    plannedThisWeek,
    timeByCategory,
    timeByPriority,
    dailyData,
    completionRate,
    avgSession,
    bestDay,
    worklogCount: weekWorklogs.length,
  };
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function BarChart({ data, max, color = "indigo", height = 100, showValue = true }: {
  data: { label: string; value: number; fullDate?: string }[];
  max: number;
  color?: string;
  height?: number;
  showValue?: boolean;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-gradient-to-top from-indigo-500 to-indigo-400",
    emerald: "bg-gradient-to-top from-emerald-500 to-emerald-400",
    amber: "bg-gradient-to-top from-amber-500 to-amber-400",
    red: "bg-gradient-to-top from-red-500 to-red-400",
    blue: "bg-gradient-to-top from-blue-500 to-blue-400",
    violet: "bg-gradient-to-top from-violet-500 to-violet-400",
  };

  const bgClass = colorMap[color] || colorMap.indigo;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-[{height}px]" style={{ height }}>
        {data.map((item, i) => (
          <motion.div
            key={item.fullDate || item.label}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.08 }}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ minWidth: 32 }}
          >
            <div
              className={`w-full rounded-t ${bgClass}`}
              style={{
                height: max > 0 ? `${(item.value / max) * 100}%` : "0%",
                minHeight: item.value > 0 ? "4px" : "0",
              }}
            />
            {showValue && item.value > 0 && (
              <span className="text-[9px] font-semibold text-gray-700 whitespace-nowrap">
                {formatMinutes(item.value)}
              </span>
            )}
            <span className="text-[9px] text-gray-400 font-medium">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, colors }: {
  data: { label: string; value: number; color: string }[];
  colors?: string[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-center text-gray-400 py-8">Nici o dată</div>;

  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const prevPercentage = data.slice(0, i).reduce((sum, s) => sum + (s.value / total) * 100, 0);
    return { ...d, percentage, start: prevPercentage };
  });

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((seg, i) => (
          <circle
            key={seg.label}
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
            strokeDashoffset={seg.start}
            strokeLinecap="round"
            className="transition-all duration-1000"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatMinutes(total)}</div>
          <div className="text-[10px] text-gray-500">Total</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[10px] text-gray-600">
              {d.label} {total > 0 ? `(${Math.round((d.value / total) * 100)}%)` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: {
  label: string;
  value: string | number;
  icon: typeof Clock;
  color: string;
  bg: string;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 ${bg} -translate-y-6 translate-x-6`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <motion.p
            key={value}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-gray-900 mt-1"
          >
            {value}
          </motion.p>
        </div>
        <div className={`${bg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">{trend}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function WeeklySummary({ tasks, worklogs }: WeeklySummaryProps) {
  const stats = computeWeeklyStats(tasks, worklogs);

  const categoryColors = [
    { label: "high", color: "#ef4444" },
    { label: "medium", color: "#f59e0b" },
    { label: "low", color: "#22c55e" },
  ];

  const priorityData = Object.entries(stats.timeByPriority).map(([label, value], i) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: categoryColors[i]?.color || "#6366f1",
  }));

  const categoryData = Object.entries(stats.timeByCategory).map(([label, value], i) => ({
    label,
    value,
    color: `hsl(${i * 60}, 65%, 50%)`,
  }));

  const dailyMax = Math.max(...stats.dailyData.map((d) => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Sumar Săptămânal
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(stats.weekStart, "d MMM", { locale: ro })} –{" "}
            {format(stats.weekEnd, "d MMM yyyy", { locale: ro })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{stats.worklogCount} sesiuni înregistrate</span>
        </div>
      </motion.div>

      {/* Key Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Ore"
          value={`${stats.totalHours}h ${stats.totalMins}m`}
          icon={Clock}
          color="text-indigo-600"
          bg="bg-indigo-50"
          trend={`${stats.worklogCount} intrări`}
        />
        <StatCard
          label="Finalizate"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          trend={`${stats.completionRate}% rată completare`}
        />
        <StatCard
          label="Planificate"
          value={stats.plannedThisWeek}
          icon={Target}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          label="Ziua Top"
          value={`${stats.bestDay.day}: ${formatMinutes(stats.bestDay.minutes)}`}
          icon={BarChart2}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Ore pe Zi
            </h3>
          </div>
          <BarChart
            data={stats.dailyData.map((d) => ({
              label: d.day,
              value: d.minutes,
              fullDate: d.fullDate,
            }))}
            max={dailyMax}
            color="indigo"
            height={120}
          />
        </motion.div>

        {/* Time by Priority Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-600" />
            Timp după Prioritate
          </h3>
          <DonutChart data={priorityData} />
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.timeByCategory).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-600" />
            Timp după Categorie
          </h3>
          <DonutChart data={categoryData} />
        </motion.div>
      )}

      {/* Session Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          Detalii Sesiuni
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Sesiuni</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.worklogCount}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Media/Sesiune</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatMinutes(stats.avgSession)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Task-uri Finalizate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedThisWeek}</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Rată Completare</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completionRate}%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}