import OpenAI from 'openai'
import { ParsedTasksResponseSchema } from './schemas'
import type { ParsedTask } from '@/types/task'

// Lazy singleton — clientul se construiește la prima cerere, nu la import,
// ca să nu rupem `next build` când cheia lipsește (preview/CI).
let _client: OpenAI | null = null
function getClient(): OpenAI {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) throw new Error('NVIDIA_NIM_API_KEY nu este configurat')
  if (!_client) {
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.NVIDIA_NIM_BASE_URL,
    })
  }
  return _client
}

const MODEL = process.env.NVIDIA_NIM_MODEL ?? 'meta/llama-3.1-8b-instruct'

function buildPrompt(userText: string): string {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const dayName = new Date().toLocaleDateString('ro-RO', { weekday: 'long' })

  return `Ești un asistent care extrage task-uri acționabile din text scris în limbaj natural.
Data de azi este ${today} (${dayName}).

Returnează DOAR un obiect JSON valid, fără explicații, fără markdown, fără text înainte sau după.
Formatul răspunsului:
{
  "tasks": [
    {
      "title": "titlu scurt și clar al task-ului",
      "deadline": "YYYY-MM-DD sau null dacă nu e menționat",
      "priority": "low | medium | high",
      "category": "categorie scurtă (ex: sănătate, muncă, personal) sau null",
      "start_time": "HH:MM sau null dacă nu e menționată ora de start",
      "end_time": "HH:MM sau null dacă nu e menționată ora de sfârșit"
    }
  ]
}

Reguli:
- Extrage TOATE task-urile distincte din text, chiar dacă sunt mai multe
- Deadline-urile relative ("vineri", "săptămâna asta", "mâine") calculează-le față de data de azi (${today})
- "Săptămâna asta" = ultima zi a săptămânii curente (duminică)
- deadline este doar data: "YYYY-MM-DD" (fără ore)
- start_time și end_time sunt doar ora: "HH:MM" în format 24h (ex: "09:00", "15:00")
- Dacă se menționează "de la X la Y", "între X și Y", "de la ora X până la Y" → extrage start_time și end_time
- "dimineața" fără oră exactă → start_time: "09:00"; "după-amiaza" → "13:00"; "seara" → "19:00"
- Prioritatea: high dacă e urgent/important/trebuie neapărat, low dacă e opțional/când am timp, altfel medium
- Titlul să fie un verb la infinitiv: "Suna la doctor", "Trimite CV-ul"

Exemple:

Input: "am muncă de la 9 dimineața până la 3 după-amiaza"
Output:
{
  "tasks": [
    {
      "title": "Muncă",
      "deadline": "${today}",
      "priority": "medium",
      "category": "muncă",
      "start_time": "09:00",
      "end_time": "15:00"
    }
  ]
}

Input: "trebuie să sun la doctor săptămâna asta și să trimit CV-ul până vineri"
Output:
{
  "tasks": [
    {
      "title": "Suna la doctor",
      "deadline": "2024-01-07",
      "priority": "medium",
      "category": "sănătate",
      "start_time": null,
      "end_time": null
    },
    {
      "title": "Trimite CV-ul",
      "deadline": "2024-01-05",
      "priority": "high",
      "category": "muncă",
      "start_time": null,
      "end_time": null
    }
  ]
}

Input: "mâine dimineață plătesc factura la curent, urgent"
Output:
{
  "tasks": [
    {
      "title": "Plătește factura la curent",
      "deadline": "${getNextDay()}",
      "priority": "high",
      "category": "personal",
      "start_time": "09:00",
      "end_time": null
    }
  ]
}

Input: "meeting cu echipa azi de la 14:00 la 15:30"
Output:
{
  "tasks": [
    {
      "title": "Meeting cu echipa",
      "deadline": "${today}",
      "priority": "medium",
      "category": "muncă",
      "start_time": "14:00",
      "end_time": "15:30"
    }
  ]
}

Acum extrage task-urile din acest text:
"${userText}"`
}

// returnează data de mâine în format YYYY-MM-DD (folosit în exemplul din prompt)
function getNextDay(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

export async function parseTasks(userText: string): Promise<ParsedTask[]> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt(userText) }],
    temperature: 0.2,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content ?? ''

  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error(`Modelul nu a returnat JSON valid. Răspuns: ${raw}`)
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1))
  const validated = ParsedTasksResponseSchema.parse(parsed)
  return validated.tasks
}
