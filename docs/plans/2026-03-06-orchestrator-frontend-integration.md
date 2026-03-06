# Orchestrator Frontend Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the two-LLM orchestrator (Head Chef + Sous Chef) into the frontend so the chat input drives the orchestrator, right-panel tools keep the direct execute path, and multi-file attachments are supported.

**Architecture:** Chat messages route through `executeWithOrchestrator` (SSE stream from `/api/orchestrate`); right-panel tool clicks stay on `executeIntent` (direct `/api/parse` + `/api/execute`). The esign interactive flow is intercepted at `plan_ready` before the Sous Chef runs. `ChatFloat` accepts multiple files and passes them as `File[]`.

**Tech Stack:** React, TypeScript, Lucide icons, existing `useIntent` hook, shared types from `@corner/shared`.

---

## Task 1: Fix `ToolName` type to include orchestrator tool names

**Files:**
- Modify: `frontend/src/types/index.ts`

The orchestrator returns snake_case tool names that don't exist in the current `ToolName` union (e.g. `add_border_image` vs `add_border`, `password_protect_pdf` vs `password_protect`). `setLastTool` must accept them, otherwise TypeScript will complain and the RightPanel won't know which settings to show.

**Step 1: Update the ToolName union**

Replace the existing `ToolName` type in `frontend/src/types/index.ts` with the expanded version that includes all orchestrator names:

```typescript
export type ToolName =
  // PDF conversions
  | 'pdf_to_word' | 'pdf_to_excel' | 'pdf_to_pptx' | 'pdf_to_jpg' | 'pdf_to_png'
  | 'word_to_pdf' | 'excel_to_pdf' | 'pptx_to_pdf' | 'jpg_to_pdf' | 'png_to_pdf'
  // PDF utilities
  | 'merge_pdf' | 'split_pdf' | 'compress_pdf' | 'rotate_pdf' | 'repair_pdf'
  | 'add_page_numbers' | 'password_protect_pdf' | 'remove_pdf_password'
  | 'add_watermark_pdf' | 'ocr' | 'html_to_pdf' | 'url_to_pdf'
  | 'fill_pdf_form' | 'esign'
  // legacy frontend aliases (kept for RightPanel compatibility)
  | 'pdf_to_powerpoint' | 'crop_pdf' | 'redact_pdf' | 'page_setup'
  | 'document_properties' | 'headers_footers' | 'typography_defaults' | 'export_options'
  | 'password_protect' | 'remove_password' | 'redact_content' | 'add_watermark'
  // Image tools
  | 'remove_background' | 'resize_image' | 'crop_image' | 'flip_rotate_image'
  | 'add_border_image' | 'watermark_image' | 'image_to_pdf' | 'compress_image'
  | 'convert_image' | 'jpg_to_png' | 'png_to_jpg' | 'webp_to_jpg' | 'jpg_to_webp'
  // legacy image aliases
  | 'add_border' | 'upscale_image'
  // Office utilities
  | 'add_page_numbers_word' | 'track_changes_word' | 'csv_to_excel' | 'excel_to_csv'
  // E-sign
  | 'request_signatures' | 'place_fields' | 'bulk_send' | 'in_person_signing'
  | 'templates' | 'identity_verification' | 'audit_trail'
  | 'certificate_of_completion' | 'tamper_detection'
  | 'annotate_pdf' | 'add_signature_line' | 'stamp_document' | 'decline_void'
  // Misc
  | 'generate_qr' | 'barcode' | 'invoice_pdf' | 'certificate_pdf'
  | 'extract_text' | 'extract_images' | 'extract_tables'
```

**Step 2: Verify TypeScript still compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 0 errors (or only pre-existing errors unrelated to ToolName).

**Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "fix: expand ToolName union to include all orchestrator tool names"
```

---

## Task 2: Multi-file support in `ChatFloat`

**Files:**
- Modify: `frontend/src/components/Chat/ChatFloat.tsx`

Current: single `File | null` state, single-file input, filename shown in placeholder.
Target: `File[]` state, `multiple` file input, chips showing each attached file with remove button.

**Step 1: Update props interface**

Change the `onSend` signature:
```typescript
// Before:
onSend: (text: string, file?: File) => void;

// After:
onSend: (text: string, files: File[]) => void;
```

**Step 2: Update internal state and send logic**

```typescript
// Before:
const [attachedFile, setAttachedFile] = useState<File | null>(null);
// canSend used attachedFile

// After:
const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
```

`handleSend` becomes:
```typescript
const handleSend = () => {
  if (!canSend) return;
  onSend(text.trim(), attachedFiles);
  setText('');
  setAttachedFiles([]);
  if (textareaRef.current) textareaRef.current.style.height = 'auto';
};
```

`canSend`:
```typescript
const canSend = !!(text.trim() || attachedFiles.length > 0 || currentFile) && !disabled;
```

**Step 3: Update file input handler**

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  }
};
```

Add `multiple` to the input element:
```tsx
<input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} multiple
  accept=".pdf,.docx,.doc,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.svg,.gif" />
```

**Step 4: Replace placeholder with file chips UI**

Remove the old placeholder logic that embedded file name. Instead, render chips above the input bar when `attachedFiles.length > 0`:

```tsx
{/* File chips — above input bar */}
{attachedFiles.length > 0 && (
  <div className="flex flex-wrap gap-1 w-full max-w-xl mb-1 pointer-events-auto">
    {attachedFiles.map((f, i) => (
      <div
        key={i}
        className="flex items-center gap-1 px-2 py-0.5 rounded"
        style={{ background: 'var(--hover)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}
      >
        <Paperclip size={9} strokeWidth={1.5} />
        <span className="truncate" style={{ maxWidth: 120 }}>{f.name}</span>
        <button
          onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}
        >×</button>
      </div>
    ))}
  </div>
)}
```

Placeholder logic (only depends on text now, not attached files):
```typescript
const placeholder = disabled
  ? 'working on it...'
  : currentFile && attachedFiles.length === 0
  ? `${currentFile.name} ready — ask anything...`
  : 'ask anything or drop a file...';
```

**Step 5: Verify TypeScript**
```bash
cd frontend && npx tsc --noEmit
```

**Step 6: Commit**
```bash
git add frontend/src/components/Chat/ChatFloat.tsx
git commit -m "feat: multi-file attachment support in ChatFloat"
```

---

## Task 3: Wire `executeWithOrchestrator` — update `handleSend` in `App.tsx`

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Destructure `executeWithOrchestrator` from useIntent**

```typescript
// Before:
const { execute: executeIntent, rerunWithSettings } = useIntent({ ... });

// After:
const { execute: executeIntent, rerunWithSettings, executeWithOrchestrator } = useIntent({ ... });
```

**Step 2: Update `handleSend` signature and body**

```typescript
// Before:
const handleSend = useCallback(
  (text: string, file?: File) => {
    const attachedFile = file ?? currentFile;
    if (file) setCurrentFile(file);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now(), attachmentName: attachedFile?.name }]);
    setMode('processing');
    executeIntent(text, attachedFile ?? undefined);
  },
  [currentFile, executeIntent]
);

// After:
const handleSend = useCallback(
  (text: string, files: File[] = []) => {
    // Merge freshly attached files with the in-canvas file
    const allFiles = files.length > 0 ? files : currentFile ? [currentFile] : [];
    if (files.length > 0) setCurrentFile(files[0]);

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
        attachmentName: allFiles.length > 1
          ? `${allFiles.length} files`
          : allFiles[0]?.name,
      },
    ]);

    setMode('processing');
    executeWithOrchestrator(text, allFiles);
  },
  [currentFile, executeWithOrchestrator]
);
```

**Step 3: Update `ChatFloat` call-site** — already correct since `onSend={handleSend}` passes through.

**Step 4: Keep right-panel `onToolSelect` using `executeIntent`** — no change needed, it already calls `executeIntent(prompt, currentFile)`.

**Step 5: Update `EmptyState` call-site** — `onAction={handleSend}` still works since `handleSend(text, [])` is valid with the new signature.

**Step 6: Verify TypeScript**
```bash
cd frontend && npx tsc --noEmit
```

**Step 7: Commit**
```bash
git add frontend/src/App.tsx
git commit -m "feat: route chat messages through executeWithOrchestrator"
```

---

## Task 4: Esign intercept + `step_complete` in `useIntent.executeWithOrchestrator`

**Files:**
- Modify: `frontend/src/hooks/useIntent.ts`

**Step 1: Add esign intercept after `plan_ready`**

In the `executeWithOrchestrator` switch statement, update the `plan_ready` case:

```typescript
case 'plan_ready':
  if (event.plan?.understanding) {
    addMessage(onMessages, 'corner', event.plan.understanding);
  }
  // Intercept esign — hand off to interactive canvas before Sous Chef runs
  if (event.plan?.steps?.some((s) => s.toolName === 'esign')) {
    const firstFile = files[0] as File | undefined;
    onEsignInteractive({ tool: 'esign', mode: 'interactive' } as unknown as ParsedIntent, firstFile);
    onProcessingChange(null);
    return;
  }
  break;
```

**Step 2: Add `step_complete` handler**

In the switch, after `step_start`:

```typescript
case 'step_complete':
  // Update processing label to show step finished; step_start for next step
  // will update again. Just a heartbeat — no UI action needed beyond label.
  onProcessingChange({
    progress: Math.round(((event.stepIndex ?? 0) + 1) / Math.max(event.allSteps?.length ?? 1, 1) * 85) + 10,
    label: `${event.tool ?? 'Step'} complete`,
    stepCurrent: (event.stepIndex ?? 0) + 1,
    stepTotal: event.allSteps?.length,
  });
  break;
```

Note: `step_complete` carries `event.result` (intermediate ToolResult). We intentionally skip showing it mid-stream — only the final `done.finalResult` is shown. This keeps UX clean.

**Step 3: Update `executeWithOrchestrator` signature to accept `File[]`**

```typescript
// Before:
const executeWithOrchestrator = useCallback(
  async (message: string, files: File[]) => {

// No change needed — signature is already File[]. Just make sure the
// esign intercept has access to `files` (it does, it's in the closure).
```

**Step 4: Verify TypeScript**
```bash
cd frontend && npx tsc --noEmit
```

**Step 5: Commit**
```bash
git add frontend/src/hooks/useIntent.ts
git commit -m "feat: esign intercept in orchestrator flow, step_complete handling"
```

---

## Task 5: Backend — emit `allSteps` on `step_complete` for accurate progress

**Files:**
- Modify: `backend/src/services/sousChefService.ts`

The frontend `step_complete` handler tries to read `event.allSteps?.length` to calculate progress. But currently `sousChefService` emits `step_complete` without `allSteps`. Fix it:

```typescript
// In the step success block, change:
onEvent({ type: 'step_complete', stepIndex, tool: toolName, result: clientResult });

// To:
onEvent({ type: 'step_complete', stepIndex, tool: toolName, result: clientResult, allSteps: completedSteps });
```

Note: `completedSteps` at this point includes the current step just pushed. For total step count we use `plan.steps.length`.

Actually simpler — pass total from plan:
```typescript
onEvent({
  type: 'step_complete',
  stepIndex,
  tool: toolName,
  result: clientResult,
  allSteps: Array.from({ length: plan.steps.length }, (_, i) => completedSteps[i] ?? { stepIndex: i, toolName: plan.steps[i].toolName, success: false }),
});
```

Even simpler — just pass `description` so the frontend can show a useful label without needing allSteps for count. The `step_start` already sets `stepTotal` from `event.allSteps?.length ?? (stepIndex + 1)`. The frontend `step_complete` handler can reuse the stepTotal from the last `step_start` state.

**Revised approach for `step_complete` frontend handler** (simpler — no allSteps needed):

```typescript
case 'step_complete':
  // step_start already set stepTotal; just nudge progress forward
  onProcessingChange((prev) => prev
    ? { ...prev, progress: Math.min(prev.progress + 10, 90), label: `${event.tool ?? 'Step'} done` }
    : { progress: 50, label: 'Processing...' }
  );
  break;
```

But `onProcessingChange` takes `ProcessingState | null`, not an updater. So just:
```typescript
case 'step_complete':
  // Nudge the label — step_start already set stepCurrent/stepTotal
  // We'll just let the next step_start update things; nothing to do here
  break;
```

Skip the sousChefService change — `step_complete` is a no-op on the frontend for now.

**Step 1: Verify TypeScript on backend**
```bash
cd backend && npx tsc --noEmit
```

**Step 2: Commit**
```bash
git commit -m "chore: step_complete is handled silently in frontend (no-op)"
# Nothing to commit — this task resulted in no code change
```

---

## Task 6: End-to-end smoke test

**Step 1: Start backend**
```bash
npm run dev --prefix backend
```
Expected: `[db] MongoDB connected` + `Corner API running on :3001`

**Step 2: Start frontend**
```bash
npm run dev --prefix frontend
```
Expected: Vite running on `http://localhost:5173`

**Step 3: Test chat → orchestrator flow**
1. Open `http://localhost:5173`
2. Type "compress a pdf" in the chat input, attach a PDF
3. Observe: `planning` spinner → `plan_ready` message in chat → step progress bar → `done`

**Step 4: Test right-panel tool keeps old path**
1. After getting a result, open the right panel
2. Click a tool (e.g. "Compress")
3. Observe: goes through `/api/parse` + `/api/execute` (not orchestrator)

**Step 5: Test multi-file attach**
1. Click the paperclip icon
2. Select 2 files
3. Verify both chips appear above the input bar
4. Type "merge these" and send
5. Observe orchestrator receives both files and plans `merge_pdf`

**Step 6: Test esign intercept**
1. Attach a PDF
2. Type "sign this document"
3. Observe: `plan_ready` → esign canvas appears (not Sous Chef running)
