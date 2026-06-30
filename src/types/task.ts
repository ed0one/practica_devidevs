export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'done'
export type ViewMode = 'week' | 'day' | 'list' | 'board'

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
