export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'done'
export type ViewMode = 'week' | 'day' | 'list' | 'board'
export type Recurrence = 'none' | 'daily' | 'weekly'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  user_id: string
  title: string
  deadline: string | null
  priority: Priority
  category: string | null
  status: Status
  raw_input: string | null
  created_at: string
  scheduled_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  recurrence: Recurrence
  jira_issue_key?: string | null
  reminder_offset_min?: number | null
  reminder_sent_at?: string | null
  description?: string | null
  all_day?: boolean
  location?: string | null
  color?: string | null
  subtasks?: Subtask[]
}

export interface UserPrefs {
  timezone: string
  reminder_hour: number
  email_daily: boolean
  email_new_tasks: boolean
  email_task_updates: boolean
  ics_token?: string | null
}

// Ce trimite LLM-ul pentru un singur task (fără id/user_id/created_at)
export interface ParsedTask {
  title: string
  deadline: string | null
  priority: Priority
  category: string | null
  start_time?: string | null
  end_time?: string | null
}
