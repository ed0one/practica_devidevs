import { z } from "zod";

/**
 * Forma exactă a unui task pe care îl așteptăm de la LLM.
 * Dacă modelul halucinează (alt câmp, prioritate inventată, etc.)
 * Zod aruncă eroare și o transformăm într-un răspuns clar.
 */
export const llmTaskSchema = z.object({
  title: z.string().min(1, "title gol"),
  // LLM-ul trebuie să întoarcă ISO 8601 sau null dacă nu există deadline.
  deadline: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .or(z.literal("").transform(() => null)),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().nullable().or(z.literal("").transform(() => null)),
});

/** Răspunsul complet al LLM-ului: o listă de task-uri. */
export const llmResponseSchema = z.object({
  tasks: z.array(llmTaskSchema),
});

/** Body pentru POST /api/parse-tasks */
export const parseTasksInputSchema = z.object({
  text: z.string().trim().min(1, "text gol"),
});

/** Body pentru PATCH /api/tasks/[id] */
export const updateTaskInputSchema = z.object({
  status: z.enum(["done", "pending"]),
});
