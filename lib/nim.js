import { llmResponseSchema } from "@/lib/schemas";

const NIM_URL =
  process.env.NVIDIA_NIM_URL ??
  "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.1-70b-instruct";

function buildPrompt(text) {
  // Data curentă e injectată ca să rezolve deadline-uri relative ("vineri").
  const today = new Date().toISOString();
  return `Ești un asistent care extrage task-uri acționabile dintr-un text scris în limbaj natural.

Data și ora curentă (ISO 8601): ${today}

Reguli:
- Întoarce DOAR JSON valid, fără text în plus, fără markdown.
- Forma exactă: {"tasks": [{"title": string, "deadline": string|null, "priority": "low"|"medium"|"high", "category": string|null}]}
- "deadline" trebuie să fie ISO 8601 cu timezone (ex: 2026-06-30T09:00:00Z) sau null dacă textul nu menționează un termen.
- Rezolvă deadline-urile relative ("vineri", "mâine", "săptămâna asta") față de data curentă de mai sus.
- "priority": deduce din urgența textului; default "medium".
- "category": un cuvânt scurt (ex: "sănătate", "muncă") sau null.
- Dacă nu există niciun task, întoarce {"tasks": []}.

Text:
"""
${text}
"""`;
}

/** Extrage primul obiect JSON dintr-un răspuns care poate conține zgomot. */
function extractJson(raw) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Răspunsul LLM nu conține JSON.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Cheamă NVIDIA NIM, parsează și validează cu Zod.
 * Aruncă eroare dacă modelul halucinează o formă invalidă.
 */
export async function parseTasksWithNim(text) {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_NIM_API_KEY lipsește.");

  const res = await fetch(NIM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildPrompt(text) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`NVIDIA NIM a întors ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Răspuns gol de la NVIDIA NIM.");

  const parsed = llmResponseSchema.parse(extractJson(content));
  return parsed.tasks;
}
