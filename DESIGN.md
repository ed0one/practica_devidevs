# Design System: TaskCapture Obsidian & Amber-Orange

<!-- impeccable:design-schema 1 -->

## Visual World

A high-craft, precision dark workspace designed for deep focus and immediate cognitive clarity. Deep obsidian and charcoal backdrops (`#0e1117`, `#141721`, `#1c202d`) are layered with subtle micro-borders (`rgba(255, 255, 255, 0.08)`) and illuminated with vibrant, warm amber-orange focal points (`#f97316`, `#ea580c`, `#fb923c`, `#f59e0b`).

## Color Strategy

- **Strategy**: Committed Obsidian & Saturated Amber Accents.
- **Base Surfaces**:
  - Main Canvas: `#0e1117`
  - Sidebar: `#0c0e14`
  - Cards & Containers: `#141721` / `#151821`
  - Elevated Elements / Active Drops: `#1c202d` / `#222736`
  - Borders: `rgba(255, 255, 255, 0.08)`
- **Primary Accents**:
  - Amber Primary: `#f97316` (CTA buttons, active indicators, high-contrast highlights)
  - Amber Deep Glow: `#ea580c`
  - Amber Soft / Highlight: `#fb923c`
  - Golden Amber: `#f59e0b` (Sprint Velocity curve, milestone badges)
- **Functional Semantics**:
  - Jira / Sync Blue: `#38bdf8`
  - Success / Done Mint: `#10b981` / `#34d399`
  - Blocked / Urgent Rose: `#ef4444` / `#f43f5e`
  - Text Primary: `#f8fafc`
  - Text Muted: `#94a3b8`
  - Text Dim / Captions: `#64748b`

## Typography

- **Sans / UI Font**: Inter (`--font-inter`, sans-serif).
- **Display / Heading Font**: Bricolage Grotesque (`--font-bricolage`, high personality, tight tracking).
- **Mono Font**: JetBrains Mono (`--font-jetbrains`, monospace) for dates, metrics, percentages, and sync tags.

## Layout & Components

1. **Top Project Bar** (copy is Romanian, layout follows the mockup):
   - Title = current filter context ("Toate task-urile" or the selected category) + Jira pill showing how many tasks carry a `jira_issue_key`.
   - Action controls: `+ Creează task` prominent button with glow, `Filtru ∨`, quick `Caută` pill, ⌘K, CSV export.
2. **Analytics Trio** (`StatsHeader.tsx`, all values computed from real tasks — zero when empty):
   - **Viteză sprint**: tasks completed per day over the last 7 days (`completed_at`), SVG spline with glowing nodes and area gradient; axis ticks derived from the data.
   - **Task-uri finalizate**: donut gauge with the real completion ratio.
   - **Priorități / Blocate**: vertical bars for active Urgent / Medium / Low tasks and the Blocked column, plus an overdue caption.
3. **Workspace Views** (`/dashboard?view=…`):
   - **Panou** (default): Kanban left, analytics trio + Gantt right — the mockup layout.
   - **Kanban (`BoardView.tsx`)**: 4 columns from `board_column` (`De făcut`, `În lucru`, `În verificare`, `Blocate`), category/priority chips, owner initials avatar, drag-and-drop by handle with pointer-based drop detection; done cards stay in their column, faded.
   - **Cronologie (`GanttView.tsx`)**: 4-week window from the current Monday, navigable; bars from `scheduled_date`/creation to `deadline`, milestone chips for single-day items, today line, interval progress.
   - **Săptămână / Zi (`CalendarView.tsx`)**: week grid and 00–24h day timeline with overlapping blocks laid side by side and a now-line.
   - **Listă / Rapoarte**: sortable list with bulk actions; reports from `computeStats` (tiles, categories, priorities).
4. **Natural Language Capture (`/input`)**:
   - Deep obsidian focus workspace with live typewriter demonstration and interactive task verification cards.

## Micro-Interactions & Motion

- Spring-based entrance animations using Framer Motion (`stiffness: 400, damping: 30`).
- Tactile button presses (`active:scale-[0.98]`).
- Glowing shadow effects (`shadow-orange-500/25`).
- Full accessibility support with `prefers-reduced-motion` compliance.
