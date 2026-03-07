# Audit: Document Intelligence Implementation

**Scope:** `backend/src/prompts/documentIntelligence.ts`, parse flow (intentService, parseController), execute controller (tool confirmation message), frontend onResult message.

---

## 1. Prompts file (`backend/src/prompts/documentIntelligence.ts`)

| Item | Status | Notes |
|------|--------|------|
| CORNER_SYSTEM_PROMPT exported | ✅ | Full system prompt: two-phase (understand doc, respond), response format, tone/style, document classification, signature detection, workflow rules, multi-step rules. |
| buildDocumentAnalysisPrompt(userMessage, fileName, fileType, pageCount?) | ✅ | Returns prompt with uploaded file info and page count when provided. Optional pageCount appends ", N pages". |
| buildToolConfirmationMessage(toolName, params) | ✅ | Returns short confirmation strings for 12 tools; fallback `Running ${toolName}` for others. |
| Tool keys in buildToolConfirmationMessage | ✅ | compress_pdf, pdf_to_word, pdf_to_pptx, merge_pdf, split_pdf, esign, compress_image, convert_image, resize_image, remove_background, ocr, generate_qr. |
| Type safety | ✅ | params cast where needed (e.g. params.quality as number/string). Optional chaining for optional params. |

**Minor:** merge_pdf uses `(params.fileCount as number) ?? 'multiple'` so when fileCount is missing the message is "Merging multiple PDFs". Correct.

---

## 2. Parse flow

### intentService.ts

| Item | Status | Notes |
|------|--------|------|
| Imports CORNER_SYSTEM_PROMPT, buildDocumentAnalysisPrompt | ✅ | From `../prompts/documentIntelligence`. |
| System prompt | ✅ | CORNER_SYSTEM_PROMPT + INTENT_PARSING_ADDENDUM (JSON schema + tool list). |
| User content | ✅ | buildDocumentAnalysisPrompt(message, fileContext.name, fileContext.type, fileContext.pageCount) when fileContext present; otherwise buildDocumentAnalysisPrompt(message, '', 'none'). |
| pageCount in fileContext | ✅ | parseIntent(message, fileContext?) with fileContext.pageCount optional. |
| extractLastJson | ✅ | Finds last `}` then matching `{` (backward) so the extracted object is the last top-level JSON object, not a nested brace. |
| JSON.parse + normalization | ✅ | try/catch with safe fallback ParsedIntent. Defaults: confidence 0.5, steps [], params {}, intent '', tool null, mode 'silent'. |
| max_tokens | ✅ | 2048 (increased from 1024 for longer document-intelligence response). |

### parseController.ts

| Item | Status | Notes |
|------|--------|------|
| fileContext type | ✅ | `{ name: string; type: string; size: number; pageCount?: number }`. |
| Pass-through to parseIntent | ✅ | parseIntent(message, fileContext). |

**Frontend:** useIntent sends `fileContext: file ? { name, type, size } : undefined`. It does not send pageCount yet. Backend accepts and forwards pageCount when the frontend adds it (e.g. after client-side PDF page count).

---

## 3. Execute flow

### executeController.ts

| Item | Status | Notes |
|------|--------|------|
| Import buildToolConfirmationMessage | ✅ | From `../prompts/documentIntelligence`. |
| message on response | ✅ | clientResult.message = buildToolConfirmationMessage(tool, parsedParams). |
| Response type | ✅ | ToolResult & { walkthrough?, message? }. Frontend can read result.message. |

**Note:** Only the direct execute path (POST /api/execute) returns message. The orchestrator path (runSousChef) does not add message to step results; frontend fallback "Here's your processed document." is used for orchestrator completion. Acceptable unless we add message to the done event.

---

## 4. Frontend

### App.tsx onResult

| Item | Status | Notes |
|------|--------|------|
| Use result.message when present | ✅ | completionMessage = (result as ToolResult & { message?: string }).message ?? "Here's your processed document.". |
| ToolResult already imported | ✅ | No new imports. |

---

## 5. Edge cases and robustness

| Case | Handling |
|------|----------|
| Parse response has no valid JSON | try/catch in intentService; return safe fallback with clarification and tool null. |
| Parse response has prose + JSON | extractLastJson takes the last top-level object (by last `}` then matching `{`). |
| Parse response has nested JSON | Last `}` matches the outer intent object; backward search finds its `{`. |
| Incomplete ParsedIntent from model | Normalize confidence, steps, params, intent, tool, mode. |
| Execute: unknown tool | buildToolConfirmationMessage falls back to "Running ${toolName}". |
| No fileContext (message only) | buildDocumentAnalysisPrompt(message, '', 'none') — prompt shows '"" (none)' for file; intent still parsed. |

---

## 6. Summary

| Area | Status |
|------|--------|
| documentIntelligence.ts | ✅ Exports and helpers correct. |
| Parse flow (intentService + parseController) | ✅ Uses new prompts, pageCount, extractLastJson (fixed), defensive parsing. |
| Execute controller | ✅ Adds message via buildToolConfirmationMessage. |
| Frontend onResult | ✅ Uses result.message when present. |

**Conclusion:** Implementation matches the spec. Fixes applied during audit: (1) extractLastJson now finds the last top-level JSON object (search from last `}`) so nested braces are not mistaken for the intent object; (2) defensive normalization and try/catch for parseIntent so malformed or incomplete JSON does not crash the server.
