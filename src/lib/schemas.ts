import { z } from 'zod'

// Formate acceptate de la LLM
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/        // YYYY-MM-DD
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/  // HH:MM (24h)

// Modelul poate greși formatul (ex: "vineri" în loc de dată). În loc să
// aruncăm și să dăm 500, normalizăm valorile invalide la null — task-ul se
// salvează oricum, doar fără dată/oră. `preprocess` prinde și string gol.
const dateField = z
  .preprocess(
    (v) => (typeof v === 'string' && DATE_RE.test(v.trim()) ? v.trim() : null),
    z.string().nullable()
  )
  .default(null)

const timeField = z
  .preprocess(
    (v) => (typeof v === 'string' && TIME_RE.test(v.trim()) ? v.trim() : null),
    z.string().nullable()
  )
  .default(null)

export const ParsedTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  deadline: dateField,
  priority: z.enum(['low', 'medium', 'high']).catch('medium'),
  category: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null),
      z.string().nullable()
    )
    .default(null),
  start_time: timeField, // "HH:MM", e.g. "09:00"
  end_time: timeField,   // "HH:MM", e.g. "15:00"
})

export const ParsedTasksResponseSchema = z.object({
  tasks: z.array(ParsedTaskSchema),
})

export type ParsedTaskInput = z.infer<typeof ParsedTaskSchema>

// ─── Validare pentru PATCH /api/tasks/[id] ───────────────────────────────────
// Toate câmpurile opționale; se validează doar cele trimise.
export const TaskUpdateSchema = z
  .object({
    title: z.string().trim().min(1, 'Titlul nu poate fi gol').max(500),
    status: z.enum(['pending', 'done']),
    priority: z.enum(['low', 'medium', 'high']),
    category: z.string().trim().max(100).nullable(),
    deadline: z.string().regex(DATE_RE, 'Dată invalidă (YYYY-MM-DD)').nullable(),
    scheduled_date: z.string().regex(DATE_RE, 'Dată invalidă').nullable(),
    scheduled_start: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)).nullable(),
    scheduled_end: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)).nullable(),
  })
  .partial()
  .strict()
