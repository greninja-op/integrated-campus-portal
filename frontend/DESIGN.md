# DESIGN.md — Integrated Campus Portal

Source of truth for the visual system. Style: **Glassmorphism** over a calm academic aurora
mesh. Every component should read from these tokens — nothing hardcoded.

## Personality
Calm, focused, trustworthy, quietly premium — a "control center" for campus life, not a toy.
Glass surfaces float above a slow aurora mesh; one disciplined accent; generous radii; soft,
tinted, layered shadows (never the flat `0 2px 4px` default).

## Background (the thing that makes glass read as glass)
A multi-stop radial **aurora mesh**, applied globally and fixed behind scroll.
- Light: indigo / violet / cyan / rose blooms on a near-white indigo base.
- Dark: deep indigo-navy base with muted indigo / violet / cyan blooms (no pure black).
Tempered and slow (18s drift) — an aurora, not the loud purple hero-gradient cliché.

## Color tokens
| Token | Light | Dark | Job |
|---|---|---|---|
| accent (primary) | `#6d5efc` iris | `#8b7cff` | ONE primary action per screen |
| accent-strong | `#5b4ef0` | `#6d5efc` | hover/pressed primary |
| success | `#14b8a6` teal | `#2dd4bf` | success / paid / present |
| danger | `#f43f5e` | `#fb7185` | errors / destructive / absent |
| warning | `#f59e0b` | `#fbbf24` | pending / due |
| text | `#1e293b` | `#e2e8f0` | primary text |
| text-muted | `#64748b` | `#94a3b8` | secondary text |

Reserve **iris** for the primary action only. Teal/amber/rose are *semantic* (status), not decoration.

## Glass surface tokens (CSS vars in `index.css`)
`--glass-bg`, `--glass-bg-strong`, `--glass-bg-hover`, `--glass-border`, `--glass-highlight`,
`--glass-blur` (18px / 28px heavy), `--glass-shadow`, `--glass-shadow-lg`. Swapped under `.dark`.
Every glass surface = translucent fill + `backdrop-filter: blur()` (+ `-webkit-`) + light rgba
border + inset top/left highlight + soft tinted shadow. `@supports` fallback for no-backdrop.

## Typography
- Display/headings: **Sora** (`font-display`) — geometric, a little character.
- Body/UI: **Inter** (`font-sans`) — paired with intent, not as a lazy default.
- Scale: display 2.5–3rem/1.1 · h1 2rem · h2 1.5rem · body 1rem/1.6 · label .875rem · caption .75rem/1.3.

## Spacing & radius
4pt base: 4·8·12·16·24·32·48·64. Group tighter than you separate (bigger gaps between sections).
Radius: chips `8px` · inputs/buttons `12px` · cards `16–20px` · modals `24px` · pills `full`.
Concentric radius on nested elements (outer = inner + padding).

## Elevation (soft, tinted, layered — see depth)
`shadow-glass` (cards) → `shadow-glass-lg` (hover/dropdown) → modal uses `0 24px 64px`. Tinted
with indigo in light, black in dark. No pure-black `0 2px 4px`.

## Motion (tokens in `index.css`, exposed as Tailwind too)
- Easings: `--ease-out` cubic-bezier(.16,1,.3,1) · `--ease-in` (.4,0,1,1) · `--ease-spring` (.34,1.56,.64,1).
- Durations: fast 150ms · normal 250ms · slow 400ms.
- Entrances use ease-out; exits ease-in; interactive uses transitions (interruptible).
- Buttons scale to .96 on press. `prefers-reduced-motion` disables the mesh + transforms.

## Reusable glass classes (`@layer components` in `index.css`)
`.glass` · `.glass-card` (interactive lift) · `.glass-panel` (static) · `.glass-nav` ·
`.glass-input` · `.btn-primary` (opaque iris) · `.btn-glass` (translucent) ·
`.glass-modal` + `.glass-backdrop` · `.glass-text` / `.glass-text-muted`.
Use these instead of re-deriving glass per component.

## Old → new mapping (used during the sweep)
| Old | New |
|---|---|
| `bg-blue-500` / `bg-[#137fec]` (primary action) | `.btn-primary` / `bg-primary` |
| `text-blue-*` links/accents | `text-primary` |
| `bg-white` / `bg-white/80` card | `.glass-card` or `.glass-panel` |
| `shadow-lg` / `shadow-xl` on cards | `shadow-glass` / `shadow-glass-lg` |
| gray input + border | `.glass-input` |
| `bg-white/25 backdrop-blur-xl` (login) | `.glass-panel` (strong) |
| teal `#14b8a6` (was accent) | keep only as `success` |

## Conversion status (manifest) — COMPLETE
- [x] Foundation: fonts, `tailwind.config`, `index.css` (mesh bg + glass layer + controls)
- [x] `DESIGN.md`
- [x] Shared chrome: Navigation (glass-nav)
- [x] Primitives: ThemeToggle, CustomAlert, ConfirmDialog, CustomSelect, all 4 date pickers, SemesterMarksForm, ImageCropper, PageTransition
- [x] Pages: Login, Dashboard, AdminDashboard + all 28 pages (student/teacher/admin)
- [x] Verified: production build passes (0 errors); grep sweep — `#137fec` gone, glass classes adopted across every file; only semantic/categorical status colors intentionally retained
- [ ] NOT visually verified — no browser MCP installed. Static audit + build only. Recommend adding Playwright MCP (mcp.example.json) to render-check at 375/768/1440px.
