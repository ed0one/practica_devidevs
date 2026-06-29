export type Priority = 'low' | 'medium' | 'high'
export type Status = 'pending' | 'done'

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
}

// Ce trimite LLM-ul pentru un singur task (fără id/user_id/created_at)
export interface ParsedTask {
  title: string
  deadline: string | null
  priority: Priority
  category: string | null
}
