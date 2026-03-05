# BoltzmanChat Design Port Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port BoltzmanChat-Web's visual design language (shadows, button shapes, motion, chat-input expand pattern, type scale) into Corner's frontend while keeping Corner's warm earthy color palette and Geist font.

**Architecture:** CSS-first via Tailwind v4. New semantic tokens added as CSS custom properties in `index.css`. Each component's inline `onMouseEnter/Leave` style hacks replaced with Tailwind `transition-all duration-200` + CSS. The chat input gets a pill-→-card expand animation. No new dependencies.

**Tech Stack:** React 19, Tailwind v4 (CSS-first), Lucide React icons, inline styles + Tailwind utilities, Geist font.

**Design source reference:** `/Users/roadto1million/Desktop/Programing/Repos/BoltzmanChat-Web/src/`

---

## Running the dev server

```bash
cd /Users/roadto1million/Desktop/Programing/Repos/corner/frontend
npm run dev
```

Open `http://localhost:5173`. Keep it open throughout — verify each task visually.

---

### Task 1: Token layer + animations in `index.css`

**Files:**
- Modify: `frontend/src/index.css`

**What to do:**

Replace the entire contents of `index.css` with the version below. This adds:
- BoltzmanChat's semantic token aliases (bg-white-0, stroke-soft-200, etc.) mapped to Corner's warm colors
- Shadow system (--shadow-xs through --shadow-realistic)
- Updated animations (10px fadeIn replacing 6px fadeInUp, new slideIn)
- Scrollbar utilities
- Updated body `letter-spacing`

```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Dancing+Script:wght@500&display=swap');

@import "tailwindcss";

:root {
  /* ── Corner brand colors (unchanged) ── */
  --bg:            #F2EDE6;
  --canvas:        #FAF7F4;
  --text-primary:  #1A1714;
  --text-muted:    #8B7D6B;
  --accent:        #8B7355;
  --border:        #E4DDD4;
  --white:         #FFFFFF;
  --hover:         #EDE8E1;
  --topbar-height: 48px;

  /* ── Semantic aliases (BoltzmanChat naming → Corner values) ── */
  --bg-white-0:      var(--white);
  --bg-weak-50:      var(--hover);
  --bg-strong-950:   var(--text-primary);

  --text-strong-950: var(--text-primary);
  --text-sub-600:    var(--text-muted);
  --text-soft-400:   #A89880;
  --text-disabled:   #C8BDB0;

  --stroke-soft-200:   var(--border);
  --stroke-strong-950: var(--text-primary);

  /* ── Shadow system ── */
  --shadow-xs:       0 1px 2px 0 rgba(0,0,0,0.06);
  --shadow-sm:       0 2px 4px rgba(0,0,0,0.08);
  --shadow-md:       0 4px 16px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
  --shadow-realistic: 0px 10px 37px 4px rgba(0,0,0,0.04), 0px 1px 5px 0px rgba(0,0,0,0.08);
  --shadow-focus:    0 0 0 2px var(--white), 0 0 0 4px rgba(139,115,85,0.25);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: 0.012em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

button, input, textarea {
  font-family: 'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

.hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* ── Selection ── */
::selection { background: rgba(139,115,85,0.15); }

/* ── Animations ── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Keep old name as alias so no other component breaks */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Step 1: Apply the file**

Replace `frontend/src/index.css` entirely with the code above.

**Step 2: Verify**

Run dev server, open app. Body text should feel slightly tighter (letter-spacing). No visual breakage yet since we haven't touched components.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add BoltzmanChat semantic tokens + shadow system + updated animations"
```

---

### Task 2: Topbar — ghost buttons with CSS transitions

**Files:**
- Modify: `frontend/src/components/Layout/Topbar.tsx`

**What to do:**

Replace the component with the version below. Key changes:
- Background: `var(--canvas)` instead of `var(--bg)` (lighter, cleaner chrome)
- Icon buttons: remove `onMouseEnter/Leave` inline style hacks, use Tailwind `transition-all duration-200 ease-out` + CSS hover via a `.icon-btn` class approach (since Tailwind v4 doesn't need config for arbitrary hover). We'll use inline style with `transition` and a wrapping className that triggers the hover via CSS.

Since Tailwind v4 doesn't support arbitrary `group-hover` without config, we use a small CSS class defined via a `<style>` tag approach — or better: just use `onMouseEnter/Leave` but in a clean reusable helper. Actually the cleanest approach is a thin wrapper component.

```tsx
import { Share2, Download, Settings, type LucideIcon } from 'lucide-react';

function IconBtn({ Icon }: { Icon: LucideIcon }) {
  return (
    <button
      className="flex items-center justify-center transition-all duration-200 ease-out"
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

interface Props {
  fileName?: string;
}

export default function Topbar({ fileName }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
        Corner
      </span>

      <span
        style={{
          fontSize: '13px',
          letterSpacing: '-0.006em',
          color: fileName ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        {fileName || 'untitled'}
      </span>

      <div className="flex items-center gap-1">
        <IconBtn Icon={Share2} />
        <IconBtn Icon={Download} />
        <IconBtn Icon={Settings} />
      </div>
    </header>
  );
}
```

**Step 1: Replace `Topbar.tsx`** with the code above.

**Step 2: Verify**

- Topbar background should be a touch lighter (FAF7F4 vs F2EDE6)
- Icon button hover: smooth shadow appears, rounded-10 corners
- Transition feels 200ms smooth (not instant)

**Step 3: Commit**

```bash
git add frontend/src/components/Layout/Topbar.tsx
git commit -m "feat: topbar — ghost icon buttons with 200ms shadow transition"
```

---

### Task 3: Left Panel — sidebar polish

**Files:**
- Modify: `frontend/src/components/Layout/LeftPanel.tsx`

**What to do:**

Key changes:
- Background: `var(--canvas)`
- Version list items: remove `onMouseEnter/Leave` hacks, use `transition-all duration-200` + inline hover handler (same pattern as Topbar)
- Active version dot: add `box-shadow` glow
- Section header: tighten letter-spacing to `0.08em`, weight 500

```tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VersionNode } from '../../types';

interface Props {
  versions: VersionNode[];
  onVersionRestore: (v: VersionNode) => void;
}

function formatRelative(ts: Date): string {
  const diff = Date.now() - ts.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export default function LeftPanel({ versions, onVersionRestore }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center py-4 shrink-0"
        style={{ width: 48, borderRight: '1px solid var(--border)', background: 'var(--canvas)' }}
      >
        <button
          className="flex items-center justify-center transition-all duration-200 ease-out"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 220,
        borderRight: '1px solid var(--border)',
        background: 'var(--canvas)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >
          History
        </span>
        <button
          className="flex items-center justify-center transition-all duration-200 ease-out"
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1 custom-scrollbar">
        {versions.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '4px' }}>
            No history yet. Upload a file to get started.
          </p>
        )}
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => onVersionRestore(v)}
            className="flex items-start gap-2 text-left w-full rounded-lg px-2 py-1.5 transition-all duration-200 ease-out"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <span
              className="shrink-0 rounded-full mt-1"
              style={{
                width: 7, height: 7,
                display: 'inline-block',
                background: v.isCurrent ? 'var(--accent)' : 'var(--border)',
                border: v.isCurrent ? '1.5px solid var(--accent)' : '1px solid var(--text-muted)',
                boxShadow: v.isCurrent ? '0 0 0 2px rgba(139,115,85,0.2)' : 'none',
              }}
            />
            <div className="flex flex-col min-w-0">
              <span
                className="truncate"
                style={{
                  fontSize: v.isCurrent ? '12px' : '11px',
                  letterSpacing: '-0.006em',
                  color: v.isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: v.isCurrent ? 500 : 400,
                }}
              >
                {v.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0' }}>
                {formatRelative(v.timestamp)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
```

**Step 1: Replace `LeftPanel.tsx`** with the code above.

**Step 2: Verify**

- Sidebar background matches topbar (both `var(--canvas)`)
- Version items: smooth hover transition (no flicker)
- Active dot: faint accent glow visible
- Custom scrollbar visible in the list

**Step 3: Commit**

```bash
git add frontend/src/components/Layout/LeftPanel.tsx
git commit -m "feat: left panel — canvas bg, smooth hover transitions, active dot glow"
```

---

### Task 4: EmptyState — pill-stroke chips + updated animation

**Files:**
- Modify: `frontend/src/components/Canvas/EmptyState.tsx`

**What to do:**

Key changes:
- Quick-action chips: `rounded-full` instead of `rounded-lg`, height 36px, ring-1 stroke border, shadow on hover
- Remove `onMouseEnter/Leave` hacks → keep them but move to shadow-based (Tailwind doesn't handle `ring-inset` hover without config)
- Use `fadeIn` (10px) animation instead of `fadeInUp` (6px)
- Logomark: add `box-shadow: var(--shadow-xs)`

```tsx
import { FileText, Minimize2, PenLine, Image } from 'lucide-react';

const CHIPS = [
  { label: 'PDF → Word', icon: FileText, prompt: 'Convert this PDF to a Word document' },
  { label: 'Compress',   icon: Minimize2, prompt: 'Compress this file' },
  { label: 'E-Sign',     icon: PenLine,  prompt: 'Sign this document' },
  { label: 'Remove BG',  icon: Image,    prompt: 'Remove the background from this image' },
] as const;

interface Props {
  onAction: (prompt: string) => void;
}

export default function EmptyState({ onAction }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 select-none"
      style={{ maxWidth: 480, textAlign: 'center', padding: '0 24px' }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 40, height: 40,
          border: '1.5px solid var(--accent)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--accent)' }}>C</span>
      </div>

      <div className="flex flex-col gap-1">
        <p style={{ fontSize: '14px', letterSpacing: '-0.01em', color: 'var(--text-primary)', fontWeight: 500 }}>
          Drop a file or describe what you need
        </p>
        <p style={{ fontSize: '12px', letterSpacing: '-0.006em', color: 'var(--text-muted)' }}>
          Corner handles PDF, images, signatures, and more.
        </p>
      </div>

      {/* Quick-action chips — pill-stroke style */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {CHIPS.map((chip, i) => (
          <button
            key={chip.label}
            onClick={() => onAction(chip.prompt)}
            className="flex items-center gap-2 transition-all duration-200 ease-out"
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 9999,
              border: '1px solid var(--border)',
              background: 'var(--white)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              letterSpacing: '-0.006em',
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
              animation: `fadeIn 400ms ease forwards`,
              animationDelay: `${i * 80}ms`,
              opacity: 0,
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--white)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <chip.icon size={13} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            {chip.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0' }}>
        These are just examples — you can ask for anything.
      </p>
    </div>
  );
}
```

**Step 1: Replace `EmptyState.tsx`** with the code above.

**Step 2: Verify**

- Chips are now pill-shaped (fully rounded), not squarish
- Staggered fade-in animation works (10px rise)
- Hover: subtle shadow + border disappears + warm beige fill
- Logomark has a faint shadow

**Step 3: Commit**

```bash
git add frontend/src/components/Canvas/EmptyState.tsx
git commit -m "feat: empty state — pill-stroke chips, 10px fadeIn, logomark shadow"
```

---

### Task 5: Chat messages — fadeIn animation + refined role labels

**Files:**
- Modify: `frontend/src/components/Chat/ChatMessage.tsx`

**Step 1: Read the current file first**, then apply these changes:
- Wrap each message in a div with `animation: fadeIn 0.3s ease-out forwards`
- Role label: `font-size: 11px, font-weight: 500, letter-spacing: 0.02em`
- Assistant message bubble: add `box-shadow: var(--shadow-xs)`

Read the file first to see current structure, then apply the minimal diff needed for those three changes.

**Step 2: Verify**

Send a message in the app. Each new message should slide up with a 300ms fadeIn. Role labels look slightly bolder/tighter.

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/ChatMessage.tsx
git commit -m "feat: chat messages — fadeIn animation, refined role label style"
```

---

### Task 6: ResultCard — BoltzmanChat button styles

**Files:**
- Modify: `frontend/src/components/Canvas/ResultCard.tsx`

**What to do:**

Replace inline hover hacks with clean button styles. Key changes:
- All buttons: `height: 36px`, `border-radius: 10px`, `transition: all 200ms ease-out`
- "Undo" / "Edit" → neutral stroke: `border: 1px solid var(--border)`, `box-shadow: var(--shadow-xs)`, hover: bg `var(--hover)`, border transparent, shadow none
- "Download" → neutral filled: `background: var(--text-primary)`, `color: var(--white)`, hover: `opacity: 0.88`
- Card: `box-shadow: var(--shadow-sm)` (upgrade from current faint shadow)

```tsx
import { Download, RotateCcw, Edit3 } from 'lucide-react';
import type { ToolResult } from '../../types';

interface Props {
  result: ToolResult;
  onUndo?: () => void;
}

function formatBytes(b: number): string {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const strokeBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 36, padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'none',
  color: 'var(--text-muted)',
  fontSize: '12px', letterSpacing: '-0.006em',
  cursor: 'pointer',
  fontFamily: 'Geist, sans-serif',
  boxShadow: 'var(--shadow-xs)',
  transition: 'all 200ms ease-out',
};

const filledBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  height: 36, padding: '0 12px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--text-primary)',
  color: 'var(--white)',
  fontSize: '12px', letterSpacing: '-0.006em',
  cursor: 'pointer',
  fontFamily: 'Geist, sans-serif',
  transition: 'all 200ms ease-out',
};

export default function ResultCard({ result, onUndo }: Props) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.downloadUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border w-full"
      style={{
        background: 'var(--white)',
        borderColor: 'var(--border)',
        maxWidth: 680,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-col flex-1 min-w-0">
        <span
          className="truncate"
          style={{ color: 'var(--text-primary)', fontSize: '13px', letterSpacing: '-0.011em', fontWeight: 500 }}
        >
          {result.fileName}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0' }}>
          {formatBytes(result.sizeBytes)}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {onUndo && (
          <button
            style={strokeBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
            }}
            onClick={onUndo}
          >
            <RotateCcw size={13} strokeWidth={1.5} /> Undo
          </button>
        )}

        <button
          style={strokeBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--hover)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
          }}
        >
          <Edit3 size={13} strokeWidth={1.5} /> Edit
        </button>

        <button
          style={filledBtn}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          onClick={handleDownload}
        >
          <Download size={13} strokeWidth={1.5} /> Download
        </button>
      </div>
    </div>
  );
}
```

**Step 1: Replace `ResultCard.tsx`** with the code above.

**Step 2: Verify** (trigger a file conversion to see the ResultCard)

- Buttons are taller (36px), rounder (10px radius)
- Stroke buttons have faint shadow, lose it on hover
- Download button fills dark, dims on hover
- Transition is smooth 200ms

**Step 3: Commit**

```bash
git add frontend/src/components/Canvas/ResultCard.tsx
git commit -m "feat: result card — BoltzmanChat neutral stroke/filled button styles"
```

---

### Task 7: Chat input — pill-expand pattern (biggest task)

**Files:**
- Modify: `frontend/src/components/Chat/ChatFloat.tsx`

**What to do:**

Port BoltzmanChat's `MessageInput` expand-on-type pattern. The container transitions from `border-radius: 9999px` (pill, no text) to `border-radius: 14px` (card, text present). The send button is a circle pill. Attach button is a circle pill on the left.

Key state:
- `isExpanded` = `text.trim().length > 0 || attachedFile !== null`
- Container `border-radius` and `padding` transition based on `isExpanded`

```tsx
import { useRef, useState, KeyboardEvent } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import type { ChatMessage } from '../../types';
import ChatMessageComp from './ChatMessage';

interface Props {
  messages: ChatMessage[];
  currentFile: File | null;
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
}

export default function ChatFloat({ messages, currentFile, onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const recentMessages = messages.slice(-6);
  const canSend = !!(text.trim() || attachedFile || currentFile) && !disabled;
  const isExpanded = text.trim().length > 0 || attachedFile !== null;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), attachedFile ?? undefined);
    setText('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = '24px';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
  };

  const placeholder = disabled
    ? 'working on it...'
    : attachedFile
    ? `${attachedFile.name} — what should I do?`
    : currentFile
    ? `${currentFile.name} ready — ask anything...`
    : 'ask anything or drop a file...';

  const pillBtn: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34, height: 34,
    borderRadius: 9999,
    border: '1px solid var(--border)',
    background: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    boxShadow: 'var(--shadow-xs)',
  };

  const sendBtnStyle: React.CSSProperties = {
    ...pillBtn,
    background: canSend ? 'var(--text-primary)' : 'none',
    color: canSend ? 'var(--white)' : 'var(--text-muted)',
    boxShadow: canSend ? 'none' : 'var(--shadow-xs)',
  };

  return (
    <div
      className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 px-8 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* Recent messages */}
      {recentMessages.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-xl pointer-events-auto">
          {recentMessages.map((msg) => (
            <ChatMessageComp key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {/* Input container */}
      <div
        className="flex flex-col w-full max-w-xl pointer-events-auto"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: isExpanded ? 14 : 9999,
          boxShadow: 'var(--shadow-realistic)',
          padding: isExpanded ? '12px 14px' : '6px 6px 6px 14px',
          transition: 'border-radius 200ms ease-out, padding 200ms ease-out',
        }}
      >
        {/* Main row */}
        <div className="flex items-center gap-2">
          {/* Attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...pillBtn,
              color: attachedFile ? 'var(--accent)' : 'var(--text-muted)',
              borderColor: attachedFile ? 'var(--accent)' : 'var(--border)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            title="Attach file"
          >
            <Paperclip size={15} strokeWidth={1.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.doc,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.svg,.gif"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none custom-scrollbar"
            style={{
              fontFamily: 'Geist, sans-serif',
              fontSize: '13px',
              letterSpacing: '-0.011em',
              color: 'var(--text-primary)',
              height: '24px',
              maxHeight: '120px',
              lineHeight: 1.6,
              border: 'none',
            }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={sendBtnStyle}
            onMouseEnter={(e) => {
              if (!canSend) e.currentTarget.style.background = 'var(--hover)';
            }}
            onMouseLeave={(e) => {
              if (!canSend) e.currentTarget.style.background = 'none';
            }}
          >
            <ArrowUp size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 1: Replace `ChatFloat.tsx`** with the code above.

**Step 2: Verify**

- Empty state: chat input is a full pill (very rounded)
- Type something: border-radius smoothly transitions to card shape (14px)
- Clear text: transitions back to pill
- Attach button: pill-shaped with border, hover fills warm beige
- Send button: dark filled circle when text present, stroke circle when empty
- Shadow is deep/realistic (BoltzmanChat shadow-realistic)

**Step 3: Commit**

```bash
git add frontend/src/components/Chat/ChatFloat.tsx
git commit -m "feat: chat input — pill-expand pattern, realistic shadow, BoltzmanChat motion"
```

---

### Task 8: Final visual pass + cleanup

**What to do:**

1. Open the app and exercise every state:
   - Empty state (chips visible, logomark)
   - Upload a file (chat transitions to card)
   - Run a conversion (ResultCard appears)
   - Check version history sidebar

2. Check for any remaining `onMouseEnter/Leave` hacks in unmodified components that look inconsistent. If `RightPanel.tsx` has any, apply the same pattern (but don't restyle its structure).

3. Commit with a summary commit message.

**Step 1: Read `RightPanel.tsx`**, check for style inconsistencies, apply minor fixes if needed.

**Step 2: Final commit**

```bash
git add -p  # stage any remaining tweaks
git commit -m "feat: visual pass — consistent transitions across all components"
```

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `frontend/src/index.css` | Token layer, shadows, animations, scrollbar utilities |
| `frontend/src/components/Layout/Topbar.tsx` | Canvas bg, ghost icon buttons 200ms |
| `frontend/src/components/Layout/LeftPanel.tsx` | Canvas bg, smooth hover, active dot glow |
| `frontend/src/components/Canvas/EmptyState.tsx` | Pill chips, 10px fadeIn, logomark shadow |
| `frontend/src/components/Chat/ChatMessage.tsx` | fadeIn animation, role label refinement |
| `frontend/src/components/Canvas/ResultCard.tsx` | Neutral stroke/filled buttons, shadow-sm card |
| `frontend/src/components/Chat/ChatFloat.tsx` | Pill-expand pattern, realistic shadow |
