import { Resend } from 'resend'
import type { Task } from '@/types/task'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')

const FROM = process.env.RESEND_FROM_EMAIL ?? 'TaskCapture <onboarding@resend.dev>'

function formatDeadline(deadline: string | null): string {
  if (!deadline) return '—'
  return new Date(deadline).toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: '🔴 Urgent',
  medium: '🟡 Mediu',
  low: '🟢 Scăzut',
}

function buildHtml(tasks: Task[]): string {
  const rows = tasks
    .map(
      (t) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${t.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${formatDeadline(t.deadline)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${PRIORITY_LABEL[t.priority]}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${t.category ?? '—'}</td>
      </tr>`
    )
    .join('')

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <h2 style="margin-bottom:4px">TaskCapture — task-uri scadente azi</h2>
      <p style="color:#6b7280;margin-top:0">Ai ${tasks.length} task${tasks.length === 1 ? '' : '-uri'} de rezolvat astăzi.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f9fafb;text-align:left">
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Task</th>
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Deadline</th>
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Prioritate</th>
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Categorie</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;color:#9ca3af;font-size:12px">
        Trimis automat de TaskCapture · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? '#'}/dashboard" style="color:#6366f1">Vezi dashboard</a>
      </p>
    </div>`
}

export async function sendNewTasksEmail(to: string, tasks: Task[]) {
  const rows = tasks
    .map(
      (t) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${t.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${formatDeadline(t.deadline)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${PRIORITY_LABEL[t.priority]}</td>
      </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <h2 style="margin-bottom:4px">TaskCapture — task-uri noi adăugate</h2>
      <p style="color:#6b7280;margin-top:0">Ai adăugat ${tasks.length} task${tasks.length === 1 ? '' : '-uri'} noi.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f9fafb;text-align:left">
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Task</th>
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Deadline</th>
            <th style="padding:8px 12px;color:#6b7280;font-weight:600">Prioritate</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;color:#9ca3af;font-size:12px">
        Trimis automat de TaskCapture · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.taskcapture.xyz'}/dashboard" style="color:#6366f1">Vezi dashboard</a>
      </p>
    </div>`

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `TaskCapture: ${tasks.length} task${tasks.length === 1 ? '' : '-uri'} noi adăugate`,
    html,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}

export async function sendReminderEmail(to: string, tasks: Task[]) {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `TaskCapture: ${tasks.length} task${tasks.length === 1 ? '' : '-uri'} scadente azi`,
    html: buildHtml(tasks),
  })

  if (error) throw new Error(`Resend error pentru ${to}: ${error.message}`)
}
