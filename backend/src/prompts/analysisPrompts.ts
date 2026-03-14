// backend/src/prompts/analysisPrompts.ts
// Used by the /analyze route (body-based: analysisType, fileName, fileText).

export function buildAnalysisPrompt(
  analysisType: string,
  fileName: string,
  fileText: string,
): string {
  const truncated = fileText.slice(0, 12000);

  const prompts: Record<string, string> = {
    summarize: `
Document: "${fileName}"
Content: ${truncated}

Summarize this document. Follow this exact format:

**Summary**
[2-3 sentence overview of what this document is and its purpose]

**Key points**
- [Most important point]
- [Second most important]
- [Third most important]
- [Fourth if relevant]
- [Fifth if relevant — omit if not enough substance]

**Bottom line**
[One sentence: what does the reader need to know or do as a result of this document?]
`,

    study_questions: `
Document: "${fileName}"
Content: ${truncated}

Generate study questions from this document. Follow this exact format:

**Study questions — ${fileName}**

**Recall questions** (test basic memory)
1. [Question]
2. [Question]
3. [Question]
4. [Question]
5. [Question]

**Understanding questions** (test deeper comprehension)
1. [Question that requires connecting concepts]
2. [Question]
3. [Question]

**Application questions** (test ability to use the knowledge)
1. [Question that applies concepts to a scenario]
2. [Question]

**Answers**
[Provide brief answers to all questions above, numbered to match]
`,

    key_terms: `
Document: "${fileName}"
Content: ${truncated}

Extract and define the most important terms, concepts, and vocabulary from this document. Follow this exact format:

**Key terms — ${fileName}**

[Term 1]
[One sentence definition as used in this specific document]

[Term 2]
[Definition]

[Continue for all significant terms — minimum 5, maximum 15]

**Quick reference**
[A one-line glossary format: Term — definition, Term — definition, for all terms above. Useful for flashcards.]
`,

    citation_generator: `
Document: "${fileName}"
Content: ${truncated}

Generate properly formatted citations for this document in multiple styles. Extract all available metadata (author, title, date, publisher, URL if present, page numbers if available).

Follow this exact format:

**Citation — ${fileName}**

**APA 7th edition**
[Full APA citation]

**MLA 9th edition**
[Full MLA citation]

**Chicago 17th edition**
[Full Chicago citation]

**Harvard**
[Full Harvard citation]

**In-text citation examples**
APA: ([Author last name], [year], p. [page if applicable])
MLA: ([Author last name] [page])
Chicago: [footnote format]

**Metadata extracted**
- Author(s): [or "Not identified"]
- Title: [document title]
- Date: [publication/creation date or "Not identified"]
- Publisher/Source: [or "Not identified"]
- Pages: [if available]

[If any metadata is missing, note what would be needed for a complete citation]
`,

    contract_review: `
Document: "${fileName}"
Content: ${truncated}

Review this contract or legal document. Follow this exact format:

**Contract review — ${fileName}**

**Document overview**
[One sentence: what type of contract is this and what is its purpose]
Parties: [list all parties identified]
Effective date: [if present]
Term/Duration: [if present]

**⚠️ Flags — review these carefully**
[List any clauses that are unusual, one-sided, risky, or missing standard protections. If none, say "No significant flags identified."]
- [Flag 1 — describe the clause and why it warrants attention, include section/page if identifiable]
- [Flag 2]
- [Continue for all flags]

**📅 Key dates and deadlines**
- [Date 1 — what it is and what happens]
- [Date 2]
[If none: "No specific dates identified"]

**💰 Financial terms**
- [Payment amounts, schedules, penalties, fees]
[If none: "No financial terms identified"]

**🔒 Key obligations**
What you must do:
- [Obligation 1]
- [Obligation 2]

What the other party must do:
- [Obligation 1]
- [Obligation 2]

**Exit and termination**
[How can this contract be ended? What are the conditions?]

**Missing standard protections**
[List any clauses typically found in this type of contract that appear to be absent — e.g. limitation of liability, dispute resolution, governing law]

**Overall assessment**
[2-3 sentences: is this a standard contract, does it favor one party, what should the reader pay attention to before signing?]

⚠️ This is an AI analysis for informational purposes only. Consult a qualified attorney before signing any legal document.
`,

    action_items: `
Document: "${fileName}"
Content: ${truncated}

Extract every action item, task, commitment, and next step mentioned in this document. Follow this exact format:

**Action items — ${fileName}**

**Tasks requiring action**
[For each item found:]
☐ [Task description]
   Owner: [person/role responsible, or "Unassigned"]
   Due: [deadline if mentioned, or "No deadline specified"]
   Source: [quote or reference the part of the document this came from]

[If no action items found: "No explicit action items identified in this document."]

**Decisions made**
- [Any decisions that were recorded in the document]
[If none: omit this section]

**Follow-up items**
- [Anything that needs follow-up but isn't a concrete task]
[If none: omit this section]

**Export tip**
This list can be exported as a plain text checklist or copied directly into a task manager.
`,

    email_draft: `
Document: "${fileName}"
Content: ${truncated}

Draft a professional email based on this document. Infer the most logical email purpose from the document type and content (e.g. sending a contract for review, following up on an invoice, sharing a report summary, requesting a signature).

Follow this exact format:

**Email draft — based on ${fileName}**

**Subject:** [Clear, specific subject line]

**Body:**
[Professional email body — warm but direct, no filler phrases, 3-5 short paragraphs maximum]

---

**Alternative versions**

**Shorter version:**
[A 2-3 sentence version of the same email for quick sends]

**More formal version:**
[A more formal tone if needed for legal/executive contexts]

---
*Edit any bracketed placeholders before sending. Three versions are provided — use whichever fits your relationship with the recipient.*
`,

    sensitive_data: `
Document: "${fileName}"
Content: ${truncated}

Scan this document for sensitive personal or confidential information. Follow this exact format:

**Sensitive data scan — ${fileName}**

**Findings**

[For each type of sensitive data found:]

🔴 **[Data type]** — High sensitivity
Found: [describe what was found without reproducing the actual sensitive value]
Location: [where in the document — page, section, paragraph]
Recommendation: [redact / remove / mask before sharing]

🟡 **[Data type]** — Medium sensitivity  
Found: [describe]
Location: [where]
Recommendation: [consider redacting depending on recipient]

🟢 **[Data type]** — Low sensitivity
Found: [describe]
Location: [where]
Recommendation: [generally safe to share]

**Summary**
Total sensitive items found: [number]
High sensitivity: [number]
Medium sensitivity: [number]
Safe to share as-is: [Yes / No / With redactions]

**Recommended action**
[One clear recommendation: safe to share, needs redaction, or should not be shared externally]

[If no sensitive data found: "No sensitive personal data detected. This document appears safe to share."]
`,
  };

  return prompts[analysisType] ?? `Analyze this document: ${truncated}`;
}
