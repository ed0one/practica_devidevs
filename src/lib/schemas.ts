import { z } from 'zod'

export const ParsedTaskSchema = z.object({
  title: z.string().min(1),
  deadline: z.string().datetime({ offset: true }).nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().nullable(),
})

export const ParsedTasksResponseSchema = z.object({
  tasks: z.array(ParsedTaskSchema),
})

export type ParsedTaskInput = z.infer<typeof ParsedTaskSchema>
