import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../analysisPrompts';

describe('buildAnalysisPrompt', () => {
  it('returns a non-empty string for summarize with fileName and content', () => {
    const result = buildAnalysisPrompt('summarize', 'doc.pdf', 'Some document content for testing.');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('doc.pdf');
    expect(result).toContain('Some document content for testing.');
    expect(result).toContain('**Summary**');
    expect(result).toContain('**Key points**');
    expect(result).toContain('**Bottom line**');
  });

  it('truncates fileText to 12000 characters', () => {
    const longText = 'x'.repeat(15000);
    const result = buildAnalysisPrompt('summarize', 'long.pdf', longText);
    expect(result).toContain('long.pdf');
    const xCount = (result.match(/x/g) ?? []).length;
    expect(xCount).toBeGreaterThanOrEqual(12000);
    expect(xCount).toBeLessThanOrEqual(12001);
  });

  it('returns fallback for unknown analysisType', () => {
    const text = 'sample content';
    const result = buildAnalysisPrompt('unknown_type', 'x', text);
    expect(result).toContain('Analyze this document:');
    expect(result).toContain(text);
  });

  it('includes format sections for study_questions', () => {
    const result = buildAnalysisPrompt('study_questions', 'notes.pdf', 'Lecture notes here.');
    expect(result).toContain('notes.pdf');
    expect(result).toContain('Study questions');
    expect(result).toContain('**Recall questions**');
    expect(result).toContain('**Answers**');
  });

  it('includes format sections for key_terms', () => {
    const result = buildAnalysisPrompt('key_terms', 'glossary.pdf', 'Technical document.');
    expect(result).toContain('Key terms');
    expect(result).toContain('**Quick reference**');
  });
});
