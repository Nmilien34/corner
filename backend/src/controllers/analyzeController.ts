import type { Request, Response, NextFunction } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { AnalysisType } from '@corner/shared';
import { runAnalysis, isValidAnalysisType } from '../services/analyzeService';
import { createError } from '../middleware/errorHandler';
import { CORNER_SYSTEM_PROMPT } from '../prompts/documentIntelligence';
import { buildAnalysisPrompt } from '../prompts/analysisPrompts';

const EXPORTABLE = ['summarize', 'study_questions', 'key_terms', 'action_items', 'contract_review'] as const;

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function handleAnalyze(req: Request, res: Response, next: NextFunction): Promise<void> {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const analysisTypeRaw = (req.body?.analysisType ?? req.body?.analysis_type) as string | undefined;

  if (!analysisTypeRaw?.trim()) {
    next(createError(400, 'analysisType is required'));
    return;
  }

  if (!isValidAnalysisType(analysisTypeRaw)) {
    next(
      createError(
        400,
        `Invalid analysisType. Must be one of: summarize, study_questions, key_terms, citation_generator, contract_review, action_items, email_draft, sensitive_data`,
      ),
    );
    return;
  }

  if (!files.length) {
    next(createError(400, 'At least one file is required'));
    return;
  }

  const file = files[0];
  const analysisType = analysisTypeRaw.trim() as AnalysisType;

  try {
    const { content } = await runAnalysis(file.path, file.originalname, analysisType);
    res.json({
      success: true,
      analysisType,
      result: content,
      exportable: EXPORTABLE.includes(analysisType as (typeof EXPORTABLE)[number]),
    });
  } catch (err) {
    console.error('[analyze]', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    next(createError(500, message));
  }
}

/** Body-based analyze: analysisType, fileName, fileText, conversationHistory (JSON). Returns { success, analysisType, result, exportable }. */
export async function handleAnalyzeFromBody(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { analysisType: analysisTypeRaw, fileName, fileText, conversationHistory = [] } = req.body as {
    analysisType?: string;
    fileName?: string;
    fileText?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  };

  if (!analysisTypeRaw || !fileText) {
    res.status(400).json({ error: 'analysisType and fileText required' });
    return;
  }

  if (!isValidAnalysisType(analysisTypeRaw)) {
    res.status(400).json({
      error: `Invalid analysisType. Must be one of: summarize, study_questions, key_terms, citation_generator, contract_review, action_items, email_draft, sensitive_data`,
    });
    return;
  }

  const analysisType = analysisTypeRaw.trim() as AnalysisType;

  try {
    const prompt = buildAnalysisPrompt(analysisType, fileName ?? '', fileText);
    const systemPrompt = CORNER_SYSTEM_PROMPT;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.filter(
        (m): m is { role: 'user' | 'assistant'; content: string } =>
          (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
      ),
      { role: 'user' as const, content: prompt },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    res.json({
      success: true,
      analysisType,
      result: text,
      exportable: EXPORTABLE.includes(analysisType as (typeof EXPORTABLE)[number]),
    });
  } catch (err) {
    console.error('[analyze]', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    next(createError(500, message));
  }
}
