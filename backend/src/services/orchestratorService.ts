import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { runHeadChef } from './headChefService';
import { runSousChef } from './sousChefService';
import { quickClassify } from './quickClassifyService';
import { runAnalysis } from './analyzeService';
import { executeTool, isKnownTool } from './toolService';
import { saveFileRecord } from './fileService';
import type { FileMetadata, OrchestrateEvent, OrchestrateResult, ToolResult, StepResult, StudyToolName } from '@corner/shared';

const STUDY_TOOLS = new Set(['summarize_document', 'generate_study_questions', 'extract_key_terms']);

export interface OrchestrateOptions {
  message: string;
  files: Express.Multer.File[];
  sessionId?: string;
  userId?: string;
  onEvent: (event: OrchestrateEvent) => void;
}

export async function orchestrate(opts: OrchestrateOptions): Promise<OrchestrateResult> {
  const { message, files, userId, onEvent } = opts;
  const sessionId = opts.sessionId ?? uuidv4();

  onEvent({ type: 'planning', sessionId, message: 'Analyzing your request...' });

  const fileMetadata: FileMetadata[] = files.map((f, i) => ({
    name: f.originalname, type: f.mimetype, size: f.size, index: i,
  }));

  // ── Fast-path: cheap Haiku classifier (~200 ms) before spinning up Opus ──
  const cls = await quickClassify(message, fileMetadata);

  // ── Analysis-only path: prompt-based, returns text in chat (no file output) ──
  if (cls.type === 'analysis' && files.length > 0) {
    const analysisType = cls.analysisType;
    const understanding = `We'll ${analysisType === 'summarize' ? 'summarize' : analysisType === 'study_questions' ? 'generate study questions from' : analysisType === 'key_terms' ? 'extract key terms from' : analysisType === 'citation_generator' ? 'generate a citation for' : analysisType === 'contract_review' ? 'review' : analysisType === 'action_items' ? 'extract action items from' : analysisType === 'email_draft' ? 'draft an email from' : 'scan'} your document.`;
    const fastPlan = {
      understanding,
      clarification: null,
      confidence: 0.95,
      steps: [{ toolName: analysisType, params: {}, description: understanding, reasoning: 'Analysis', requiresPreviousOutput: false }],
    };
    onEvent({ type: 'plan_ready', sessionId, plan: fastPlan });
    onEvent({ type: 'step_start', sessionId, stepIndex: 0, tool: analysisType, description: understanding });
    try {
      const { content } = await runAnalysis(files[0].path, files[0].originalname, analysisType);
      const finalResult: ToolResult = {
        fileId: '',
        downloadUrl: '',
        fileName: '',
        mimeType: 'text/plain',
        sizeBytes: 0,
        textContent: content,
        studyTool: analysisType,
      };
      const stepResult: StepResult = { stepIndex: 0, toolName: analysisType, success: true, result: finalResult };
      onEvent({ type: 'step_complete', sessionId, stepIndex: 0, tool: analysisType, result: finalResult });
      onEvent({ type: 'done', sessionId, finalResult, allSteps: [stepResult] });
      return { sessionId, plan: fastPlan, steps: [stepResult], finalResult, message: understanding };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      const stepResult: StepResult = { stepIndex: 0, toolName: analysisType, success: false, error: errorMsg };
      onEvent({ type: 'step_error', sessionId, stepIndex: 0, tool: analysisType, error: errorMsg });
      onEvent({ type: 'error', sessionId, message: errorMsg });
      return { sessionId, plan: fastPlan, steps: [stepResult], finalResult: null, message: errorMsg };
    }
  }

  if (cls.type === 'direct' && isKnownTool(cls.toolName)) {
    const toolName = cls.toolName;
    const params = cls.params;

    const fastPlan = {
      understanding: message,
      clarification: null,
      confidence: 0.95,
      steps: [{
        toolName, params,
        description: `Running ${toolName}`,
        reasoning: 'Fast-path classification',
        requiresPreviousOutput: false,
      }],
    };

    onEvent({ type: 'plan_ready', sessionId, plan: fastPlan });
    onEvent({ type: 'step_start', sessionId, stepIndex: 0, tool: toolName, description: fastPlan.steps[0].description });

    try {
      const rawResult = await executeTool(toolName, files, params);
      if (rawResult.isStub) throw new Error(`Tool '${toolName}' is not yet implemented`);

      const fileId = await saveFileRecord({
        filePath: rawResult.filePath,
        fileName: rawResult.fileName,
        toolName,
        params,
        mimeType: rawResult.mimeType,
        sizeBytes: rawResult.sizeBytes,
        userId,
      });

      const finalResult: ToolResult = {
        fileId,
        downloadUrl: `/api/file/${fileId}`,
        fileName: rawResult.fileName,
        mimeType: rawResult.mimeType,
        sizeBytes: rawResult.sizeBytes,
      };

      if (STUDY_TOOLS.has(toolName)) {
        try {
          finalResult.textContent = fs.readFileSync(rawResult.filePath, 'utf-8');
          finalResult.studyTool = toolName as StudyToolName;
        } catch (_) { /* non-critical */ }
      }

      if (rawResult.transcriptionResult) {
        finalResult.transcriptionResult = rawResult.transcriptionResult;
        finalResult.formattedTranscript = rawResult.formattedTranscript;
        finalResult.durationLabel = rawResult.durationLabel;
      }

      const stepResult: StepResult = { stepIndex: 0, toolName, success: true, result: finalResult };
      onEvent({ type: 'step_complete', sessionId, stepIndex: 0, tool: toolName, result: finalResult });
      onEvent({ type: 'done', sessionId, finalResult, allSteps: [stepResult] });

      return { sessionId, plan: fastPlan, steps: [stepResult], finalResult, message: fastPlan.understanding };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Tool failed';
      const stepResult: StepResult = { stepIndex: 0, toolName, success: false, error: errorMsg };
      onEvent({ type: 'step_error', sessionId, stepIndex: 0, tool: toolName, error: errorMsg });
      onEvent({ type: 'error', sessionId, message: errorMsg });
      return { sessionId, plan: fastPlan, steps: [stepResult], finalResult: null, message: errorMsg };
    }
  }

  // ── Full orchestration for complex / multi-step / ambiguous requests ──
  const plan = await runHeadChef(message, fileMetadata);

  if (plan.clarification && plan.steps.length === 0) {
    onEvent({ type: 'clarification', sessionId, question: plan.clarification });
    return { sessionId, plan, steps: [], finalResult: null, message: plan.clarification };
  }

  onEvent({ type: 'plan_ready', sessionId, plan });

  const stepResults = await runSousChef({
    plan,
    files,
    userId,
    onEvent: (event) => onEvent({ ...event, sessionId }),
  });

  const lastSuccess = stepResults.filter((s) => s.success).pop();
  const finalResult: ToolResult | null = lastSuccess?.result ?? null;

  onEvent({ type: 'done', sessionId, finalResult, allSteps: stepResults });

  return { sessionId, plan, steps: stepResults, finalResult, message: plan.understanding };
}
