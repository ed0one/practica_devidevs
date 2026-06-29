"use client";

import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface JiraSyncStatusProps {
  task: Task;
  onSync?: () => void;
  isSyncing?: boolean;
}

const statusConfig = {
  synced: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", label: "Sincronizat" },
  pending: { icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50", label: "În așteptare" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", label: "Eroare" },
  none: { icon: ExternalLink, color: "text-gray-400", bg: "bg-gray-50", label: "Nesincronizat" },
};

function getSyncStatus(task: Task): keyof typeof statusConfig {
  const key = (task as any).jira_issue_key;
  const error = (task as any).jira_sync_error;
  if (error) return "error";
  if (key) return "synced";
  return "none";
}

export default function JiraSyncStatus({ task, onSync, isSyncing }: JiraSyncStatusProps) {
  const status = getSyncStatus(task);
  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === "none" && !onSync) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color} border ${config.color}/20`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {status === "synced" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
      {onSync && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSync}
          disabled={isSyncing}
          className="ml-1 p-0.5 rounded text-gray-400 hover:text-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`wName={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        </motion.button>
      )}
    </motion.div>
  );
}