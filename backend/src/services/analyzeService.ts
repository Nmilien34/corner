import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import { env } from '../config/env';
import { extractDocumentText } from '../lib/extractDocumentText';
import type { AnalysisType } from '@corner/shared';
import { ANALYSIS_TYPES } from '@corner/shared';
import { buildAnalysisPrompt } from '../prompts/analysisPrompts';
import { CORNER_SYSTEM_PROMPT } from '../prompts/documentIntelligence';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export function isValidAnalysisType(value: unknown): value is AnalysisType {
  return typeof value === 'string' && ANALYSIS_TYPES.includes(value as AnalysisType);
}

export async function runAnalysis(
  filePath: string,
  originalName: string,
  analysisType: AnalysisType,
): Promise<{ content: string }> {
  const text = await extractDocumentText(filePath, originalName);
  if (!text || text.length < 50) {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}
    throw new Error(
      'Document has too little extractable text. Try a different file or run OCR on a scanned PDF first.',
    );
  }

  const userContent = buildAnalysisPrompt(analysisType, originalName, text);

  const response = await client.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 2000,
    system: CORNER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = response.content[0];
  const content = block.type === 'text' ? block.text : '';

  try {
    fs.unlinkSync(filePath);
  } catch (_) {}

  return { content };
}
