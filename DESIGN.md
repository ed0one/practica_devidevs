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

1. **Top Project Bar**:
   - Project title ("Project Alpha") with status badge (`🟢 Jira Synced: 2 min ago`).
   - Action controls: `+ Create Task` prominent button with glow, `Filter ∨`, and quick `Search` pill.
2. **Analytics Trio**:
   - **Sprint Velocity**: SVG smooth spline curve with glowing vertex nodes and area gradient.
   - **Task Completion Donut Gauge**: 74% circular progress ring with amber-orange stroke.
   - **Blocked / Priority Bar Graph**: Vertical bars highlighting Urgent, Normal, Low, and Blocked task volumes.
3. **Workspace Views**:
   - **Kanban Board (`BoardView.tsx`)**: 4-column layout (`To Do`, `In Progress`, `Under Review`, `Blocked`), category badges, assignee avatars, and drag-and-drop elevation.
   - **Project Timeline (`CalendarView.tsx`)**: Gantt-style schedule with date range picker ("Oct 18 – Nov 12"), duration gradient bars, milestone markers, and dependency connectors.
   - **Week & Day Timelines**: Full 00–24h schedule with time blocks and quick-scheduling overlays.
4. **Natural Language Capture (`/input`)**:
   - Deep obsidian focus workspace with live typewriter demonstration and interactive task verification cards.

## Micro-Interactions & Motion

- Spring-based entrance animations using Framer Motion (`stiffness: 400, damping: 30`).
- Tactile button presses (`active:scale-[0.98]`).
- Glowing shadow effects (`shadow-orange-500/25`).
- Full accessibility support with `prefers-reduced-motion` compliance.
