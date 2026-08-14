# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are busy individuals, students, engineers, and professionals who think fast in natural language (Romanian and English) and need their stream of thoughts, deadlines, and commitments effortlessly translated into organized, scheduled tasks without friction.

## Product Purpose

TaskCapture transforms raw, unstructured natural-language input into structured actionable tasks (with title, priority, deadline, category, time blocks, and subtasks), schedules them visually on a timeline/calendar or kanban board, and sends timely automated email digests and reminders.

## Positioning

Unlike traditional manual task management tools with burdensome form fields, TaskCapture uses fast LLM parsing (NVIDIA NIM Llama 3.1) with real-time typewriter preview, multi-view organization (Timeline/Calendar, Kanban Board, Task List), iCal feed export, and automated daily digest notifications.

## Operating Context

- Web application (desktop and mobile responsive).
- Fast capture from any device.
- Dark mode first with rich modern visual hierarchy, tactile feedback, micro-interactions, and keyboard shortcuts (Command Palette ⌘K).

## Capabilities and Constraints

- **Auth & DB**: Supabase (PostgreSQL with RLS, SSR authentication).
- **LLM**: NVIDIA NIM (`meta/llama-3.1-8b-instruct`) with zero-latency streaming/preview, prompt defense, and Zod v4 validation.
- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, Framer Motion, dnd-kit, Lucide icons.
- **Email & Schedule**: Resend v6, Upstash Redis rate limiting, Supabase pg_cron + Vercel Cron daily digest.

## Brand Commitments

- Name: **TaskCapture** (Live at `taskcapture.xyz`).
- Voice: Fast, intelligent, calm, premium, precise.
- Tone: High craft, smooth motion, dark aesthetic with warm vibrant accents.

## Product Principles

1. **Zero-friction capture**: Going from a raw thought to a structured task should take seconds without mandatory manual form editing.
2. **Instant clarity**: Visual scheduling (timeline/calendar, board, list) must immediately show what matters today and what is coming next.
3. **Rock-solid reliability**: Fail-open rate limits, defensive prompt sanitization, idempotent cron reminders, and RLS security.
4. **Impeccable craft**: Out-of-distribution visual polish, responsive ergonomics, delightful micro-animations, and fluid layout hierarchy.

## Accessibility & Inclusion

- WCAG AA contrast standards.
- Full keyboard navigability (⌘K command palette, accessible modal dialogs, tab orders).
- `prefers-reduced-motion` respected across typewriter demos and animations.
