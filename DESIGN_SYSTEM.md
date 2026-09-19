# Monarch Worldwide Express — Design System

> **Read this before implementing or modifying any dashboard UI. It is the source of truth for Monarch's visual design.**
>
> Scope: the **authenticated dashboard + auth screens** (everything under the `.monarch-app` wrapper). The public **landing page keeps its own separate identity** — do not apply these tokens there.

## Golden rules

- Establish tokens/primitives first; every page composes them. Do **not** introduce new colors, radii, shadows, type sizes, spacing, or button styles without a clear reason.
- Layered look: **light blue-gray canvas → white cards → navy content.**
- Blue is the brand accent, not decoration on everything. Never pure black text. No heavy shadows, no bright colorful cards, no browser-default inputs.
- Feel: Stripe + Linear + modern logistics SaaS. Premium, clean, spacious, data-dense, soft borders, subtle shadows.

## Tokens (defined on `.monarch-app` in `src/index.css`)

**Brand:** `--primary #2874B2` (hover `#21649C`, ramp 50 `#EFF6FF` → 900 `#102F49`).

**Surfaces:** background `#F6F9FD`, card/surface `#FFFFFF`, surface-hover `#F8FAFC`, surface-active `#EFF6FF`.

**Text:** primary `#13294B`, secondary `#526581`, tertiary `#8291A8`, disabled `#AAB5C4`, link `#2874B2`.

**Borders:** default `#E4EAF1`, light `#EDF1F6`, strong `#D5DDE8`; input `#D5DDE8`; hover `#B9C9DA`; focus `#2874B2`.

**Status (badge bg / text):**
- Draft `#F1F5F9` / `#475569`
- Booked `#EFF6FF` / `#1D4ED8`
- In transit `#FFFBEB` / `#B45309`
- Delivered `#ECFDF5` / `#047857`
- Cancelled `#FEF2F2` / `#B91C1C`
- success `#059669`, warning `#D97706`, error `#DC2626`, info `#3B82F6`

## Typography — **Inter** everywhere

- Page title 28/700 (-0.02em) · Section 18/600 · Card title 15/600 · Body 14/400 · Small 13 · KPI 28/700 (-0.02em).

## Spacing — 8px system

4, 8, 12, 16, 20, 24, 32, 40, 48, 64. No random 13/17/22/27.

## Radius

sm 6 · md 8 · lg 12 · **cards 16** · large containers 16–20 · badges pill (9999). Inputs & buttons 8.

## Shadows (utilities in `index.css`)

- `.shadow-card` — `0 1px 2px rgba(16,24,40,.03), 0 4px 16px rgba(16,24,40,.04)`
- `.shadow-card-hover` — `0 4px 20px rgba(16,24,40,.08)`
- `.shadow-dropdown` — `0 10px 30px rgba(16,24,40,.12)`

## Layout

- Sidebar `224px` (collapsed 72), white, `border-right #E4EAF1`. Logo area 88px. Section labels 11/600 uppercase 0.08em `#8291A8`. Nav item 44px, radius 10, active = `bg #EFF6FF` + `text #21649C` + subtle left indicator bar (not a strong blue rectangle).
- Header `68px` white, `border-bottom #E4EAF1`, with a search field (`bg #F8FAFC`, border default, min-w 360 / max-w 580).
- Main content padding 32, `max-width 1600px`.

## Components

- **Button:** primary `#2874B2` / white, h40, r8, 600, hover `#21649C`. Secondary white + `#2874B2` text + `#D5DDE8` border. Ghost transparent, hover `#F6F9FD`. Destructive only for destructive actions.
- **Input:** h44, border `#D5DDE8`, r8, white, placeholder `#9AA8BA`; focus border `#2874B2` + ring `0 0 0 3px rgba(40,116,178,.10)`; error border `#DC2626`, message 12/`#B91C1C`.
- **Card:** white, border `#E4EAF1`, r16, `.shadow-card`, hover `.shadow-card-hover`.
- **Table:** header `bg #F8FAFC`, 12/600 `#526581`; rows 64px, `border-bottom #EDF1F6`, hover `#F8FAFC`; no vertical column borders.
- **Badge:** h26, px10, pill, 12/600 — use status colors above.
- **Icon container:** 40×40, r10, subtle tinted bg (Bookings `#EFF6FF`, Transit `#FFF7ED`, Delivered `#ECFDF5`, Revenue `#F5F3FF`).
- **Upload:** custom dashed dropzone → filename chip on success. Never the browser default.
- **Modal:** r16, white, overlay `rgba(15,23,42,.35)`, shadow `0 20px 50px rgba(16,24,40,.16)`.
- **Toasts:** top-right. **Skeletons** over spinners. **Empty states** never leave a blank table.

## Page header pattern (every page)

Title (28/700) + one-line secondary description, primary CTA on the right.

## Motion

Subtle: button 150ms ease-out, card hover 200ms, sidebar 200ms, modal 200ms. Don't animate everything.

## Icons

Lucide only. 16 table/action · 18 nav · 20 buttons · 24 cards.

## Data

When an endpoint doesn't exist yet (dashboard chart, KPI trend %), use clearly-labelled mock data behind the same component API so it's trivial to wire later.
