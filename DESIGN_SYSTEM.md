# Monarch Worldwide Express — Design System

> **Read this before implementing or modifying any dashboard UI. It is the source of truth for Monarch's visual design.**
>
> Scope: everything under the `.monarch-app` wrapper — customer dashboard, auth screens and the admin panel. The public **landing page keeps its own separate identity**; do not apply these tokens there.

## Intent

A premium global-logistics SaaS: premium, trustworthy, calm, international, spacious, slightly editorial. Blue is a **brand accent, not a background** — the product must not read as "a blue dashboard".

Avoid: generic/neon SaaS blue, heavy gradients, glassmorphism, heavy shadows, over-rounding, many colours, filled/3D/emoji icons.

Rough colour ratio: white ~60% · blue-white ~20% · deep blue ~10% · navy ~5% · green ~3% · red/amber ~2%.

## Where things live

- **`src/theme/tokens.css`** — every token (OKLCH colour, type, spacing, radius, shadow, sizes, icons), the shadcn mapping that all `ui/` primitives read, and the Tailwind names (`bg-blue-50`, `text-subtle`, `bg-success-soft`, `border-border-subtle` …).
- `src/index.css` — imports tokens, keeps the landing page's own `:root` palette, and defines the `shadow-*` utilities from the shadow tokens.

**Never make component-level colour decisions.** No hex or ad-hoc `oklch()` in components; use a token or its Tailwind name. If something is missing, add a token.

## Colour (OKLCH only)

| Role | Token | Value |
| --- | --- | --- |
| Page | `--background` | `oklch(98.5% 0.006 255)` (cool blue-white) |
| Card | `--surface` | white |
| Primary / hover / deep CTA / dark | `--blue-600` / `-700` / `-700→800` / `-800` | `45% .125 255` · `37% .115 255` · … |
| Soft / very soft | `--blue-100` / `--blue-50` | `94% .025 255` / `97% .012 255` |
| Navy (tooltips) | `--blue-900` | `23% .065 255` |
| Text | `--text-primary` / `-secondary` / `-muted` | `21%` · `45%` · `60%` (chroma ≈ .02–.03, hue 255) |
| Borders | `--border` / `--border-subtle` | `91% .014` / `94% .010` |
| Success | `--success` / `-soft` / `-ink` | green — success only |
| Warning | `--warning` / `-soft` / `-ink` | amber — warning only |
| Danger | `--danger` / `-soft` / `-ink` | red — destructive/error only |

`*-ink` is a darker shade of the status colour for **small text on the matching `-soft` background** (the base colour is for fills, dots, sparklines — it fails contrast at 12px).

**Status badges:** Booked = success · In transit / info = blue-100/blue-700 · Pending / warning = warning · Cancelled = danger · Draft = neutral slate. Use the `Badge` variants (`booked`, `transit`/`info`, `pending`, `cancelled`, `draft`); use `info` — not `booked` — for non-status blue chips (GST, roles).

## Typography

Inter. Page title 28/700 · hero 32/700 · section 18/600 · card title 15/600 · body 14 · small 13 · KPI 28/700. Letter-spacing −0.02em on display sizes.
**Micro labels** (`.micro-label`: 11px, 600, uppercase, +0.08em, muted) for eyebrows and meta: `WELCOME BACK`, `LAST 9 MONTHS`, `VS LAST MONTH`, table headers.

## Spacing, radius, shadow

- 4/8 scale: 4 8 12 16 20 24 32 40 48 64. Card padding 20–24 · grid gap 24 · section gap 32 · page padding 32–40.
- Radius: cards 16 · buttons/inputs/nav 10 · icon containers 12 · badges pill. Don't pill-ify everything.
- Shadows (barely visible): `shadow-card`, `shadow-card-hover`, `shadow-cta`, `shadow-dropdown`. Thin 1px borders everywhere.

## Layout

- Sidebar fixed **224px** on desktop, `--sidebar` (white with a faint blue tint), `border-right`. Nav item 44px; hover `blue-50`/`blue-700`; active `blue-100`/`blue-700` + 3px left indicator.
- Header **64px**, white; search = `blue-50` fill + `--border`, never a blue box.
- Content max **1440px**, page padding 32–40px.

## Icons

**Lucide only**, outline, stroke 1.75 (set once in tokens via `.monarch-app .lucide`), 16 table/action · 18 nav · 20 buttons/cards. No filled, 3D, emoji or other libraries.
Mapping: Dashboard `LayoutDashboard` · Bookings `Package` · New booking `PlusCircle` · Payments `WalletCards` · Profile `UserRound` · Total `Layers3` · Drafts `FilePenLine` · Booked `PackageCheck` · Cancelled `CircleX`.

## Components

- **Button:** `default` (blue-600 → 700), `deep` (blue-700 → 800 + CTA shadow; hero/lead actions), `outline`, `secondary`, `ghost`, `destructive` (only for destructive actions). Height 40, radius 10.
- **Input:** h44, radius 10, focus = blue-500 border + soft ring, error = danger.
- **Card:** white, `--border`, radius 16, `shadow-card`.
- **Table:** micro-label headers, no header fill, rows 64px with horizontal `--border-subtle` separators only, hover `blue-50/60`.
- **StatCard:** `blue-50` icon container (blue-600 icon), sparkline (blue = neutral, green = positive, red = cancelled), trend + `VS LAST MONTH`. Trend colour follows `favorable` (a drop in cancellations is green).
- **ShipmentChart:** blue-600 line, blue-100 area, `--border-subtle` grid, muted labels, navy hover tooltip (value + % vs previous point).
- **QuickAction:** lead action deep blue, others `blue-50`; 2px `translateX` on hover.
- **DashboardHero / RouteArt:** eyebrow + title + CTA, with a subtle dotted grid (`.dotted-grid`) and dotted flight-path ornament.
- Also: Sidebar/Header live in `DashboardLayout`; `StatusBadge`, `PageHeader`, `Avatar`, `Dropdown`, `EmptyState`, `Skeleton` in `components/`.

## Motion

Subtle: button 150ms, card hover 200ms, quick-action nudge 150ms, modal 200ms. Don't animate everything.

## Data

When an endpoint doesn't exist yet (dashboard chart, KPI trend %), use clearly-labelled mock data (`src/lib/mockDashboard.ts`) behind the same component API so it's trivial to wire later.
