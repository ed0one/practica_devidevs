import { z } from 'zod'

export const ParsedTaskSchema = z.object({
  title: z.string().min(1),
  deadline: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().nullable(),
  start_time: z.string().nullable().optional(), // "HH:MM" format, e.g. "09:00"
  end_time: z.string().nullable().optional(),   // "HH:MM" format, e.g. "15:00"
})

export const ParsedTasksResponseSchema = z.object({
  tasks: z.array(ParsedTaskSchema),
})

export type ParsedTaskInput = z.infer<typeof ParsedTaskSchema>
