export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "done";
export type ViewMode = "week" | "day" | "list" | "sumar";

export interface WorklogEntry {
  id: string;
  task_id: string;
  user_id: string;
  time_spent: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  deadline: string | null;
  priority: Priority;
  category: string | null;
  status: Status;
  raw_input: string | null;
  created_at: string;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  worklogs?: WorklogEntry[];
  total_time_spent?: number;
}
