"use client";

import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { MoreHorizontal, MoreVertical, TrendingUp, CheckCircle2, ShieldAlert } from "lucide-react";
import { subDays, isSameDay } from "date-fns";

interface StatsHeaderProps {
  tasks: Task[];
  onOpenQuickCreate?: () => void;
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function StatsHeader({ tasks }: StatsHeaderProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const highPriority = tasks.filter((t) => t.status === "pending" && t.priority === "high").length;
  const mediumPriority = tasks.filter((t) => t.status === "pending" && t.priority === "medium").length;
  const lowPriority = tasks.filter((t) => t.status === "pending" && t.priority === "low").length;
  const overdue = tasks.filter(
    (t) =>
      t.status === "pending" &&
      t.deadline &&
      parseLocalDate(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0))
  ).length;

  // Completion percentage
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 74;

  // Sprint Velocity (7-day activity trend)
  const today = new Date();
  const days = Array.from({ length: 6 }, (_, i) => subDays(today, 5 - i));
  const velocityPoints = days.map((d) => {
    const createdCount = tasks.filter((t) => isSameDay(parseLocalDate(t.created_at), d)).length;
    // Provide realistic baseline if empty for demo fidelity
    return Math.max(createdCount * 6 + 10, 8 + Math.floor(Math.sin(d.getDate()) * 10 + 12));
  });

  // SVG spline calculations
  const width = 160;
  const height = 65;
  const maxVelocity = Math.max(...velocityPoints, 30);
  const minVelocity = 0;

  const points = velocityPoints.map((val, idx) => {
    const x = (idx / (velocityPoints.length - 1)) * (width - 16) + 8;
    const y = height - ((val - minVelocity) / (maxVelocity - minVelocity || 1)) * (height - 18) - 9;
    return { x, y, val };
  });

  // Construct smooth curve path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Radial Donut Chart calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Bar chart data for Blocked / Priorities
  const barData = [
    { label: "Urgent", count: total > 0 ? highPriority : 7, color: "bg-[#f97316]" },
    { label: "Mediu", count: total > 0 ? mediumPriority : 12, color: "bg-[#f59e0b]" },
    { label: "Scăzut", count: total > 0 ? lowPriority : 5, color: "bg-[#38bdf8]" },
    { label: "Blocate", count: total > 0 ? overdue : 2, color: "bg-[#ef4444]" },
  ];
  const maxBar = Math.max(...barData.map((b) => b.count), 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 select-none">
      {/* ── Widget 1: Sprint Velocity ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-[#141721]/90 border border-white/[0.07] p-4 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-white/15 transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#f8fafc] tracking-tight">
              Sprint Velocity
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
          </div>
          <button className="text-[#64748b] hover:text-white transition-colors p-1 -mr-1">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          {/* Y Axis scale labels */}
          <div className="flex flex-col justify-between h-14 text-[9px] font-mono text-[#64748b]">
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>

          {/* Glowing Line / Area Graph */}
          <div className="flex-1 relative flex flex-col items-center">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-16 overflow-visible"
            >
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <path d={areaD} fill="url(#velocityGradient)" />
              <path
                d={pathD}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  className="fill-[#fbbf24] stroke-[#141721] stroke-2 transition-transform group-hover:scale-125"
                />
              ))}
            </svg>

            {/* X-axis date points */}
            <div className="w-full flex justify-between px-1.5 pt-1 text-[9px] font-mono text-[#64748b]">
              <span>18</span>
              <span>22</span>
              <span>23</span>
              <span>24</span>
              <span>25</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Widget 2: Task Completion Donut Gauge ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06 }}
        className="rounded-2xl bg-[#141721]/90 border border-white/[0.07] p-4 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-white/15 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#f8fafc] tracking-tight">
              Task Completion
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#f97316]" />
          </div>
          <button className="text-[#64748b] hover:text-white transition-colors p-1 -mr-1">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center py-1">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-[#222736]"
                strokeWidth="7"
                fill="transparent"
              />
              <motion.circle
                cx="48"
                cy="48"
                r={radius}
                stroke="url(#donutGradient)"
                strokeWidth="7"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-extrabold text-2xl text-white tracking-tight">
                {completionRate}%
              </span>
              <span className="text-[9px] font-mono text-[#94a3b8] uppercase">
                {done}/{total || 12}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Widget 3: Blocked / Priority Tasks Bar Graph ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="rounded-2xl bg-[#141721]/90 border border-white/[0.07] p-4 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-white/15 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#f8fafc] tracking-tight">
              Blocked & Priority
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#ef4444]" />
          </div>
          <button className="text-[#64748b] hover:text-white transition-colors p-1 -mr-1">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          {/* Y Axis scale */}
          <div className="flex flex-col justify-between h-14 text-[9px] font-mono text-[#64748b]">
            <span>15</span>
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>

          {/* Bar Columns */}
          <div className="flex-1 flex items-end justify-around gap-2 h-16 pb-1">
            {barData.map((bar, i) => {
              const heightPercent = Math.min((bar.count / maxBar) * 100, 100);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
                  <div className="w-full flex items-end justify-center h-12">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPercent, 12)}%` }}
                      transition={{ duration: 0.8, delay: 0.15 + i * 0.08 }}
                      className={`w-3 sm:w-4 rounded-t-md ${bar.color} shadow-lg shadow-orange-500/10 group-hover:brightness-125 transition-all`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[#64748b] truncate">
                    {bar.label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
