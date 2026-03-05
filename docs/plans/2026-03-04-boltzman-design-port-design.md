# Design Doc: Port BoltzmanChat Design Language to Corner

**Date:** 2026-03-04
**Status:** Approved
**Scope:** Frontend only — `frontend/src/`

---

## Goal

Transplant BoltzmanChat-Web's visual design language (typography scale, button styles, shadow system, motion, chat input pattern) into Corner's frontend — keeping Corner's warm earthy color palette (`--bg`, `--accent`, etc.) and Geist font, replacing everything else: spacing rhythm, border radii, shadow depth, transition timing, button shapes, and the chat input's expand-to-card behavior.

---

## Source of Truth

- **Design source:** `/Users/roadto1million/Desktop/Programing/Repos/BoltzmanChat-Web/src/`
  - `index.css` — full token system
  - `tailwind.config.ts` — type scale, shadow system, animation keyframes
  - `components/ui/pill-button.tsx` — pill button / stroke / filled patterns
  - `components/ui/button.tsx` — rounded button variants
  - `components/ui/input.tsx` — input ring-inset focus style
  - `features/conversations/components/messagesUI/MessageInput.tsx` — expand-on-type chat pattern
- **Target:** `/Users/roadto1million/Desktop/Programing/Repos/corner/frontend/src/`

---

## Approach

CSS-first via Tailwind v4. No `tailwind.config.js`. All new design tokens added as CSS custom properties in `index.css`. Components updated with Tailwind utility classes + inline styles using the new vars. No external component library introduced.

---

## 1. Token Layer — `index.css`

### Keep (Corner's color identity)
```css
--bg, --canvas, --text-primary, --text-muted, --accent, --border, --white, --hover
```

### Add (semantic aliases matching BoltzmanChat's naming)
```css
/* Background tiers */
--bg-white-0:      var(--white);
--bg-weak-50:      var(--hover);
--bg-strong-950:   var(--text-primary);

/* Text tiers */
--text-strong-950: var(--text-primary);
--text-sub-600:    var(--text-muted);
--text-soft-400:   #A89880;
--text-disabled:   #C8BDB0;

/* Stroke tiers */
--stroke-soft-200:   var(--border);
--stroke-strong-950: var(--text-primary);

/* Shadow system */
--shadow-xs: 0 1px 2px 0 rgba(0,0,0,0.06);
--shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
--shadow-md: 0 4px 16px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
--shadow-realistic: 0px 10px 37px 4px rgba(0,0,0,0.04), 0px 1px 5px 0px rgba(0,0,0,0.08);
--shadow-focus: 0 0 0 2px var(--white), 0 0 0 4px rgba(139,115,85,0.25);
```

### Update animations
Replace the existing `fadeInUp` (6px) with BoltzmanChat's more expressive variants:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes accordionDown {
  from { height: 0; opacity: 0; }
  to   { height: var(--content-height); opacity: 1; }
}
```

### Update body typography
```css
body {
  letter-spacing: 0.012em;  /* add — BoltzmanChat body tracking */
}
```

### Add scrollbar utility
```css
.custom-scrollbar { /* thin 6px scrollbar, transparent track, rounded thumb */ }
.hide-scrollbar   { scrollbar-width: none; }
```

---

## 2. Typography

Font stays Geist. Apply BoltzmanChat's type ramp via inline styles across components:

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| wordmark / label | 15px | 500 | -0.01em |
| body copy | 13px | 400 | -0.011em |
| secondary / muted | 12px | 400 | -0.006em |
| micro / timestamps | 11px | 400 | 0 |
| section headers | 10px | 500 | 0.08em uppercase |
| subheading-2xs | 11px | 500 | 0.02em |

---

## 3. Topbar (`Layout/Topbar.tsx`)

- Background: `var(--canvas)` (was `var(--bg)`) — slightly lighter, cleaner chrome
- Icon buttons: remove `onMouseEnter/Leave` inline style hacks
  - Add `transition-all duration-200 ease-out` class
  - Hover: `rounded-[10px]` background `var(--hover)`, `box-shadow: var(--shadow-xs)`
  - Size stays `32×32`

---

## 4. Left Panel (`Layout/LeftPanel.tsx`)

- Background: `var(--canvas)` (slightly lighter than current `var(--bg)`)
- Section header "HISTORY": add `letter-spacing: 0.08em`, `font-weight: 500`, `font-size: 10px` — already close, tighten
- Version list items:
  - Remove `onMouseEnter/Leave` hacks → use CSS `transition-all duration-200`
  - Hover bg: `var(--hover)` with `border-radius: 8px`
  - Active dot: add `box-shadow: 0 0 0 2px rgba(139,115,85,0.2)` glow
- Collapse/expand buttons: ghost style, `transition-all duration-200`

---

## 5. Chat Input (`Chat/ChatFloat.tsx`) — biggest change

Port BoltzmanChat's `MessageInput` pill-expand pattern:

### Container
```
bg: var(--white)
border: 1px solid var(--stroke-soft-200)
box-shadow: var(--shadow-realistic)
border-radius: 9999px when collapsed, 12px when expanded
transition: border-radius 200ms ease-out
```

### Collapsed state (no text)
- Single row: `[attach icon] [textarea] [send icon]`
- Attach: `rounded-full w-9 h-9 ring-1 ring-inset ring-[var(--border)]`, ghost on hover
- Textarea: transparent bg, 13px, single line, no border/outline
- Send: `rounded-full w-9 h-9`, filled `var(--text-primary)` when text present, stroke when empty

### Expanded state (text entered or file attached)
- Border-radius transitions from `9999px` → `12px`
- Bottom toolbar fades in (`h-8 opacity-100`): currently placeholder for future actions
- Send button moves to bottom-right of toolbar

### Transition
```css
transition: all 200ms ease-out
```

### Chat messages
- Each message: `animation: fadeIn 0.3s ease-out forwards`
- Role label "CORNER" / "YOU": `font-size: 11px, font-weight: 500, letter-spacing: 0.02em`
- Assistant message bubble: `box-shadow: var(--shadow-xs)`

---

## 6. EmptyState (`Canvas/EmptyState.tsx`)

- Quick-action chips → pill-stroke style:
  - `border-radius: 9999px` (fully rounded)
  - `height: 36px`
  - `padding: 0 12px`
  - `ring-1 ring-inset ring-[var(--border)]`
  - `gap: 8px`
  - `transition: all 200ms ease-out`
  - Hover: `background: var(--hover)` + `box-shadow: var(--shadow-xs)`
  - Remove `onMouseEnter/Leave` hacks → CSS transition
- Stagger animation: use new `fadeIn` keyframe (10px), same 80ms delays
- Logomark: add `box-shadow: var(--shadow-xs)`

---

## 7. ResultCard (`Canvas/ResultCard.tsx`)

Remove all `onMouseEnter/Leave` inline style hacks. Replace with:

### Undo / Edit buttons — neutral stroke style
```
height: 36px
padding: 0 12px
border-radius: 10px
ring: 1px inset var(--border)
box-shadow: var(--shadow-xs)
color: var(--text-muted)
transition: all 200ms ease-out
hover: background var(--hover), ring-color transparent, shadow none
```

### Download button — neutral filled style
```
height: 36px
padding: 0 12px
border-radius: 10px
background: var(--text-primary)
color: var(--white)
transition: all 200ms ease-out
hover: opacity 0.88
```

### Card container
```
box-shadow: var(--shadow-sm)  (upgrade from current 0 1px 3px)
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/index.css` | Add semantic tokens, shadow vars, update animations, add scrollbar utilities |
| `frontend/src/components/Layout/Topbar.tsx` | CSS transitions on icon buttons, `var(--canvas)` bg |
| `frontend/src/components/Layout/LeftPanel.tsx` | CSS transitions, active dot glow, `var(--canvas)` bg |
| `frontend/src/components/Chat/ChatFloat.tsx` | Full pill-expand pattern, shadow, smooth transitions |
| `frontend/src/components/Chat/ChatMessage.tsx` | `fadeIn` animation, role label style |
| `frontend/src/components/Canvas/EmptyState.tsx` | Pill-stroke chips, new fadeIn animation, logomark shadow |
| `frontend/src/components/Canvas/ResultCard.tsx` | BoltzmanChat button styles, remove all inline hover hacks |

---

## What Is NOT Changing

- Corner's color palette (warm beige, brown accent) — untouched
- Geist font — stays
- Layout structure (topbar + panels + canvas + chat) — untouched
- All logic, state, API calls — untouched
- RightPanel — minimal chrome, low priority, skip
- ESignCanvas, DocumentViewer — functional UI, not restyled in this pass
- OnboardingModal / SignatureCapture — separate concern, skip
