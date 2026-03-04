import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the intent parser for Corner, a document workspace tool.
Given a user message and optional file context, return ONLY valid JSON — no explanation, no markdown fences.

Schema:
{
  "intent": string,
  "tool": string,
  "mode": "silent" | "interactive",
  "confidence": number,
  "clarification": string | null,
  "params": { "input_type": string, "output_type": string, "options": {} },
  "steps": [{ "tool": string, "params": {}, "description": string }]
}

Tool Registry:
- pdf_to_word: converts PDF to DOCX. mode: silent
- pdf_to_ppt: converts PDF to PPTX. mode: silent
- pdf_to_excel: converts PDF to XLSX. mode: silent
- word_to_pdf: converts DOCX/DOC to PDF. mode: silent
- compress_pdf: reduces PDF file size. mode: silent
- merge_pdf: combines multiple PDFs. mode: silent
- split_pdf: splits PDF into pages. mode: silent
- compress_image: reduces image file size. mode: silent
- convert_image: converts between JPG/PNG/WEBP/AVIF. mode: silent
- remove_background: removes image background. mode: silent
- resize_image: resizes image to dimensions. mode: silent
- ocr: extracts text from image or scanned PDF. mode: silent
- generate_qr: generates QR code from URL or text. mode: silent
- esign: adds signature to document. mode: interactive if multiple signers or no saved signature, otherwise silent
- fill_form: fills PDF form fields. mode: interactive
- annotate_pdf: adds text/drawings to PDF. mode: interactive
- password_protect: adds password to PDF. mode: silent

Rules:
- If confidence < 0.7, set clarification question and keep tool/mode as best guess
- If confidence >= 0.7, execute without asking for confirmation
- Always populate the steps array (single item for single-step tasks)
- Multi-step example: user says "sign and compress" -> steps has 2 entries, first tool = esign, second = compress_pdf
- The primary "tool" field must equal the first step's tool`;

export const parseRoute = Router();

parseRoute.post('/', async (req: Request, res: Response) => {
  try {
    const { message, fileContext } = req.body as {
      message: string;
      fileContext?: { name: string; type: string; size: number };
    };

    if (!message?.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const userContent = fileContext
      ? `User message: "${message}"\nFile uploaded: ${fileContext.name} (${fileContext.type}, ${Math.round(fileContext.size / 1024)}KB)`
      : `User message: "${message}"`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\n?|\n?```$/gm, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);
  } catch (err) {
    console.error('[parse]', err);
    res.status(500).json({ error: 'Failed to parse intent' });
  }
});
