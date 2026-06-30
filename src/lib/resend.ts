import { Resend } from 'resend'
import type { Task } from '@/types/task'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')

const FROM = process.env.RESEND_FROM_EMAIL ?? 'TaskCapture <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.taskcapture.xyz'

function formatDate(str: string | null): string {
  if (!str) return '—'
  const [y, m, d] = str.substring(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const PRIORITY_CONFIG: Record<Task['priority'], { label: string; bg: string; color: string; dot: string }> = {
  high:   { label: 'Urgent',  bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  medium: { label: 'Mediu',   bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  low:    { label: 'Scăzut', bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
}

const STATUS_CONFIG: Record<Task['status'], { label: string; bg: string; color: string }> = {
  pending: { label: 'În așteptare', bg: '#f3f4f6', color: '#6b7280' },
  done:    { label: 'Finalizat',    bg: '#f0fdf4', color: '#16a34a' },
}

function taskCard(t: Task): string {
  const p = PRIORITY_CONFIG[t.priority]
  const s = STATUS_CONFIG[t.status]
  const deadline = formatDate(t.deadline)
  const time = t.scheduled_start
    ? t.scheduled_start.substring(11, 16)
    : null

  return `
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:12px;border-left:4px solid ${p.dot}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">
      <p style="margin:0;font-size:15px;font-weight:600;color:#111827;line-height:1.4">${t.title}</p>
      <span style="display:inline-flex;align-items:center;gap:5px;background:${p.bg};color:${p.color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;flex-shrink:0">
        <span style="width:6px;height:6px;border-radius:50%;background:${p.dot};display:inline-block"></span>
        ${p.label}
      </span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      ${deadline !== '—' ? `
      <span style="font-size:12px;color:#6b7280;display:inline-flex;align-items:center;gap:4px">
        <span style="font-size:13px">📅</span> ${deadline}${time ? ` · ${time}` : ''}
      </span>` : ''}
      ${t.category ? `
      <span style="font-size:12px;color:#6366f1;background:#eef2ff;padding:2px 8px;border-radius:6px;font-weight:500">${t.category}</span>` : ''}
      <span style="font-size:12px;color:${s.color};background:${s.bg};padding:2px 8px;border-radius:6px;font-weight:500">${s.label}</span>
    </div>
  </div>`
}

function emailWrapper(title: string, subtitle: string, body: string, ctaLabel: string, ctaHref: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:28px 32px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px">✨</div>
            <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.3px">TaskCapture</span>
          </div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3">${title}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px">${subtitle}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#f8f9ff;padding:24px 32px">
          ${body}
          <div style="text-align:center;margin-top:24px">
            <a href="${ctaHref}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px">${ctaLabel} →</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#9ca3af;font-size:12px">Trimis automat de <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;font-weight:500">TaskCapture</a> · Nicio acțiune necesară</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendNewTasksEmail(to: string, tasks: Task[]) {
  const count = tasks.length
  const cards = tasks.map(taskCard).join('')
  const sectionLabel = `<p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">${count} task${count === 1 ? '' : '-uri'} adăugate</p>`

  const html = emailWrapper(
    'Task-uri noi adăugate',
    `AI-ul a extras și salvat ${count} task${count === 1 ? '' : '-uri'} din textul tău.`,
    sectionLabel + cards,
    'Vezi task-urile pe dashboard',
    `${APP_URL}/dashboard`
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `✨ ${count} task${count === 1 ? ' nou adăugat' : '-uri noi adăugate'} — TaskCapture`,
    html,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}

export async function sendReminderEmail(to: string, tasks: Task[]) {
  const count = tasks.length
  const urgent = tasks.filter(t => t.priority === 'high')
  const cards = tasks
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })
    .map(taskCard)
    .join('')

  const sectionLabel = `<p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">${count} task${count === 1 ? '' : '-uri'} scadente · ${urgent.length > 0 ? `${urgent.length} urgente` : 'niciun urgent'}</p>`

  const html = emailWrapper(
    count === 1 ? 'Ai un task scadent azi' : `Ai ${count} task-uri scadente azi`,
    urgent.length > 0
      ? `${urgent.length} task${urgent.length === 1 ? ' urgent' : '-uri urgente'} necesită atenție imediată.`
      : 'Verifică-ți task-urile pentru ziua de azi.',
    sectionLabel + cards,
    'Deschide dashboard-ul',
    `${APP_URL}/dashboard`
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `📋 ${count} task${count === 1 ? '' : '-uri'} scadente azi${urgent.length > 0 ? ` · ${urgent.length} urgente` : ''} — TaskCapture`,
    html,
  })

  if (error) throw new Error(`Resend error pentru ${to}: ${error.message}`)
}
