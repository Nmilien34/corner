import { v4 as uuidv4 } from 'uuid';
import { runHeadChef } from './headChefService';
import { runSousChef } from './sousChefService';
import type { FileMetadata, OrchestrateEvent, OrchestrateResult, ToolResult } from '@corner/shared';

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

  // 1. Notify frontend that planning has started
  onEvent({ type: 'planning', sessionId, message: 'Analyzing your request...' });

  // 2. Build file metadata for Head Chef (no actual file bytes)
  const fileMetadata: FileMetadata[] = files.map((f, i) => ({
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
    index: i,
  }));

  // 3. Head Chef produces the plan
  const plan = await runHeadChef(message, fileMetadata);

  // 4. If clarification needed, stop here
  if (plan.clarification && plan.steps.length === 0) {
    onEvent({ type: 'clarification', sessionId, question: plan.clarification });
    return { sessionId, plan, steps: [], finalResult: null, message: plan.clarification };
  }

  // 5. Broadcast plan to frontend
  onEvent({ type: 'plan_ready', sessionId, plan });

  // 6. Sous Chef executes the plan
  const stepResults = await runSousChef({
    plan,
    files,
    userId,
    onEvent: (event) => onEvent({ ...event, sessionId }),
  });

  // 7. Final result = last successful step's output
  const lastSuccess = stepResults.filter((s) => s.success).pop();
  const finalResult: ToolResult | null = lastSuccess?.result ?? null;

  // 8. Signal completion
  onEvent({ type: 'done', sessionId, finalResult, allSteps: stepResults });

  return { sessionId, plan, steps: stepResults, finalResult, message: plan.understanding };
}
