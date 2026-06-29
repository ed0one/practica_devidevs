import OpenAI from 'openai'
import { ParsedTasksResponseSchema } from './schemas'
import type { ParsedTask } from '@/types/task'

const client = new OpenAI({
  apiKey: process.env.NVIDIA_NIM_API_KEY,
  baseURL: process.env.NVIDIA_NIM_BASE_URL,
})

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
      "deadline": "YYYY-MM-DDTHH:mm:ssZ sau null dacă nu e menționat",
      "priority": "low | medium | high",
      "category": "categorie scurtă (ex: sănătate, muncă, personal) sau null"
    }
  ]
}

Reguli:
- Extrage TOATE task-urile distincte din text, chiar dacă sunt mai multe
- Deadline-urile relative ("vineri", "săptămâna asta", "mâine") calculează-le față de data de azi (${today})
- "Săptămâna asta" = ultima zi a săptămânii curente (duminică)
- Dacă nu e menționată ora, pune T23:59:59+03:00
- Prioritatea: high dacă e urgent/important/trebuie neapărat, low dacă e opțional/când am timp, altfel medium
- Titlul să fie un verb la infinitiv: "Suna la doctor", "Trimite CV-ul"

Exemple:

Input: "trebuie să sun la doctor săptămâna asta și să trimit CV-ul până vineri"
Output:
{
  "tasks": [
    {
      "title": "Suna la doctor",
      "deadline": "2024-01-07T23:59:59+03:00",
      "priority": "medium",
      "category": "sănătate"
    },
    {
      "title": "Trimite CV-ul",
      "deadline": "2024-01-05T23:59:59+03:00",
      "priority": "high",
      "category": "muncă"
    }
  ]
}

Input: "vreau să citesc cartea aia când am timp"
Output:
{
  "tasks": [
    {
      "title": "Citește cartea",
      "deadline": null,
      "priority": "low",
      "category": "personal"
    }
  ]
}

Input: "mâine dimineață plătesc factura la curent, urgent"
Output:
{
  "tasks": [
    {
      "title": "Plătește factura la curent",
      "deadline": "${getNextDay()}T09:00:00+03:00",
      "priority": "high",
      "category": "personal"
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
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'user', content: buildPrompt(userText) },
    ],
    temperature: 0.1, // deterministism maxim pentru output structurat
    max_tokens: 1024,
  })

  const raw = response.choices[0]?.message?.content ?? ''

  // extragem JSON-ul chiar dacă modelul pune text în jur
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`Modelul nu a returnat JSON valid. Răspuns brut: ${raw}`)
  }

  const parsed = JSON.parse(jsonMatch[0])
  const validated = ParsedTasksResponseSchema.parse(parsed)
  return validated.tasks
}
