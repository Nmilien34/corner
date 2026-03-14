import { useCallback, useRef } from 'react';
import axios from 'axios';
import type { ParsedIntent, ToolResult, ProcessingState, ChatMessage, ToolName, AnalysisType } from '../types';
import { ANALYSIS_TYPES } from '../types';
import { getFileFormatInfo } from '../lib/fileFormat';
import { api } from '../lib/api';
import { toast } from './use-toast';
import type { OrchestrateEvent } from '@corner/shared';
import type { RightPanelSettings } from '../components/Layout/RightPanel';
import { settingsToToolParams } from '../lib/settingsToToolParams';

interface Options {
  onProcessingChange: (state: ProcessingState | null) => void;
  onResult: (result: ToolResult, tool: ToolName) => void;
  onMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onClarify: (question: string) => void;
  onEsignInteractive: (parsed: ParsedIntent, file: File | undefined) => void;
  onPlanUnderstanding?: (text: string) => void;
}

async function runTool(
  tool: string,
  files: File[],
  params: Record<string, unknown>
): Promise<ToolResult> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('tool', tool);
  formData.append('params', JSON.stringify(params));

  const res = await axios.post<ToolResult>('/api/execute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

function addMessage(
  onMessages: Options['onMessages'],
  role: 'user' | 'corner',
  content: string,
  attachmentName?: string
) {
  onMessages((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      attachmentName,
    },
  ]);
}

export function useIntent({ onProcessingChange, onResult, onMessages, onClarify, onEsignInteractive, onPlanUnderstanding }: Options) {
  const execute = useCallback(
    async (message: string, file?: File) => {
      try {
        // 1. Call parse route
        const formatInfo = file ? getFileFormatInfo(file.name) : null;
        const { data: parsed } = await axios.post<ParsedIntent>('/api/parse', {
          message,
          fileContext: file
            ? { name: file.name, type: file.type, size: file.size }
            : undefined,
          ...(formatInfo ? {
            fileFormat: formatInfo.format,
            fileCategory: formatInfo.category,
            canOCR: formatInfo.canOCR,
            isImage: formatInfo.isImage,
          } : {}),
        });

        // 2. Confidence gate — if low, show clarification and stop
        if (parsed.confidence < 0.7) {
          const question =
            parsed.clarification ?? "Could you clarify what you'd like to do?";
          addMessage(onMessages, 'corner', question);
          onClarify(question);
          onProcessingChange(null);
          return;
        }

        // 3. Intercept esign interactive — hand off to canvas, don't execute yet
        if (parsed.tool === 'esign' && parsed.mode === 'interactive') {
          addMessage(onMessages, 'corner', parsed.intent);
          onProcessingChange(null);
          onEsignInteractive(parsed, file);
          return;
        }

        // 4. Analysis mode — call /analyze, add result to chat as AI message (no file tool)
        if (parsed.mode === 'analysis') {
          const analysisType = parsed.params?.analysisType;
          if (!analysisType || !ANALYSIS_TYPES.includes(analysisType)) {
            addMessage(onMessages, 'corner', parsed.clarification ?? 'Analysis type not recognized. Please try rephrasing.');
            onProcessingChange(null);
            return;
          }
          if (!file) {
            addMessage(onMessages, 'corner', 'Please upload a document to analyze.');
            onProcessingChange(null);
            return;
          }
          addMessage(onMessages, 'corner', parsed.intent);
          onProcessingChange({ progress: 50, label: 'Analyzing...' });
          const data = await api.analyzeDocument(file, analysisType);
          onProcessingChange({ progress: 100, label: 'Done' });
          await new Promise((r) => setTimeout(r, 300));
          onProcessingChange(null);
          onMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'corner',
              type: 'analysis' as const,
              content: data.result,
              analysisType: data.analysisType as AnalysisType,
              exportable: data.exportable,
              timestamp: Date.now(),
            },
          ]);
          return;
        }

        // 5. Confirm action in chat
        addMessage(onMessages, 'corner', parsed.intent);

        // 6. Build step list (single-step or multi-step)
        const steps =
          parsed.steps?.length > 0
            ? parsed.steps
            : [
                {
                  tool: parsed.tool,
                  params: (parsed.params?.options ?? {}) as Record<string, unknown>,
                  description: parsed.intent,
                },
              ];

        let currentFiles = file ? [file] : [];
        let lastResult: ToolResult | null = null;

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (!step.tool) {
            toast({ variant: 'destructive', title: 'Error', description: 'No tool selected for this step.' });
            onProcessingChange(null);
            return;
          }
          onProcessingChange({
            progress: Math.round(((i + 0.5) / steps.length) * 100),
            label: step.description,
            stepCurrent: steps.length > 1 ? i + 1 : undefined,
            stepTotal: steps.length > 1 ? steps.length : undefined,
          });

          lastResult = await runTool(
            step.tool,
            currentFiles,
            step.params as Record<string, unknown>
          );

          // For multi-step workflows: re-fetch output as a File for the next step
          if (i < steps.length - 1 && lastResult) {
            const resp = await fetch(lastResult.downloadUrl);
            const blob = await resp.blob();
            currentFiles = [
              new File([blob], lastResult.fileName, { type: lastResult.mimeType }),
            ];
          }
        }

        // 7. Done
        const lastToolName = steps[steps.length - 1].tool as ToolName;
        onProcessingChange({ progress: 100, label: 'Done' });
        await new Promise((r) => setTimeout(r, 300));
        onProcessingChange(null);

        if (lastResult) {
          onResult(lastResult, lastToolName);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        toast({ variant: 'destructive', title: 'Error', description: msg });
        onProcessingChange(null);
      }
    },
    [onProcessingChange, onResult, onMessages, onClarify, onEsignInteractive]
  );

  const rerunWithSettings = useCallback(
    async (tool: ToolName, file: File, settings: RightPanelSettings) => {
      try {
        onProcessingChange({ progress: 0, label: 'Re-running...' });
        const params = settingsToToolParams(tool, settings);
        const result = await runTool(tool, [file], params);
        onProcessingChange({ progress: 100, label: 'Done' });
        await new Promise((r) => setTimeout(r, 200));
        onProcessingChange(null);
        onResult(result, tool);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Re-run failed';
        toast({ variant: 'destructive', title: 'Re-run failed', description: msg });
        onProcessingChange(null);
      }
    },
    [onProcessingChange, onResult, onMessages]
  );

  const plannedToolNamesRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingMsgIdRef = useRef<string | null>(null);
  const thinkingAccRef = useRef<string>('');

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const executeWithOrchestrator = useCallback(
    async (message: string, files: File[]) => {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      try {
        plannedToolNamesRef.current = [];
        const formData = new FormData();
        formData.append('message', message);
        files.forEach((f) => formData.append('files', f));

        // Reset thinking stream state for this execution
        thinkingMsgIdRef.current = null;
        thinkingAccRef.current = '';

        const response = await fetch('/api/orchestrate', { method: 'POST', body: formData, signal });
        if (!response.body) throw new Error('No response body from orchestrator');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            if (!chunk.startsWith('data: ')) continue;
            const json = chunk.slice(6).trim();
            if (!json) continue;

            let event: OrchestrateEvent;
            try {
              event = JSON.parse(json) as OrchestrateEvent;
            } catch {
              continue; // skip malformed or split chunk
            }

            switch (event.type) {
              case 'thinking_chunk': {
                // Stream Sous Chef reasoning into a live chat bubble
                if (!thinkingMsgIdRef.current) {
                  const id = crypto.randomUUID();
                  thinkingMsgIdRef.current = id;
                  thinkingAccRef.current = '';
                  onMessages((prev) => [
                    ...prev,
                    { id, role: 'corner' as const, content: '', timestamp: Date.now(), streaming: true },
                  ]);
                }
                thinkingAccRef.current += event.chunk ?? '';
                const msgId = thinkingMsgIdRef.current;
                const accumulated = thinkingAccRef.current;
                onMessages((prev) =>
                  prev.map((m) => (m.id === msgId ? { ...m, content: accumulated, streaming: true } : m))
                );
                break;
              }
              case 'planning':
                onProcessingChange({ progress: 5, label: 'Planning...' });
                break;
              case 'plan_ready': {
                const toolNames = event.plan?.steps?.map((s) => s.toolName) ?? [];
                plannedToolNamesRef.current = toolNames;
                if (event.plan?.understanding) {
                  // Keep planner "understanding" out of the main chat; surface via an optional disclosure in the UI.
                  onPlanUnderstanding?.(event.plan.understanding);
                }
                // Intercept esign — hand off to interactive canvas before Sous Chef runs
                if (event.plan?.steps?.some((s) => s.toolName === 'esign')) {
                  onEsignInteractive(
                    { tool: 'esign', mode: 'interactive' } as unknown as ParsedIntent,
                    files[0] as File | undefined
                  );
                  onProcessingChange(null);
                  return;
                }
                if (toolNames.length > 0) {
                  onProcessingChange({
                    progress: 10,
                    label: event.plan?.steps?.[0]?.description ?? 'Starting...',
                    stepCurrent: 1,
                    stepTotal: toolNames.length,
                    toolNames,
                  });
                }
                break;
              }
              case 'clarification':
                addMessage(onMessages, 'corner', event.question ?? 'Could you clarify?');
                onClarify(event.question ?? '');
                onProcessingChange(null);
                return;
              case 'step_start': {
                // Fallback: build tool list from step_start when plan_ready had no steps
                if (event.tool) {
                  if (plannedToolNamesRef.current.length === 0) {
                    plannedToolNamesRef.current = [event.tool];
                  } else if (!plannedToolNamesRef.current.includes(event.tool)) {
                    plannedToolNamesRef.current = [...plannedToolNamesRef.current, event.tool];
                  }
                }
                const total = event.allSteps?.length ?? (event.stepIndex != null ? event.stepIndex + 1 : 1);
                onProcessingChange({
                  progress: Math.round(((event.stepIndex ?? 0) / Math.max(total, 1)) * 85) + 10,
                  label: event.description ?? `Running ${event.tool}`,
                  stepCurrent: (event.stepIndex ?? 0) + 1,
                  stepTotal: total,
                  toolNames: plannedToolNamesRef.current,
                });
                break;
              }
              case 'step_complete':
                // Intermediate step done — step_start for the next step will update progress
                break;
              case 'step_error':
                toast({
                  variant: 'destructive',
                  title: 'Step failed',
                  description: event.error ?? 'unknown error',
                });
                break;
              case 'done': {
                // Stop streaming cursor on thinking bubble, then remove it
                if (thinkingMsgIdRef.current) {
                  const idToRemove = thinkingMsgIdRef.current;
                  onMessages((prev) => prev.map((m) => m.id === idToRemove ? { ...m, streaming: false } : m));
                  await new Promise((r) => setTimeout(r, 80));
                  onMessages((prev) => prev.filter((m) => m.id !== idToRemove));
                  thinkingMsgIdRef.current = null;
                  thinkingAccRef.current = '';
                }
                onProcessingChange({
                  progress: 100,
                  label: 'Done',
                  toolNames: plannedToolNamesRef.current.length > 0 ? plannedToolNamesRef.current : undefined,
                });
                await new Promise((r) => setTimeout(r, 300));
                onProcessingChange(null);
                if (event.finalResult) {
                  const lastStep = event.allSteps?.filter((s) => s.success).pop();
                  onResult(event.finalResult, (lastStep?.toolName ?? 'convert_image') as ToolName);
                }
                break;
              }
              case 'error':
                toast({
                  variant: 'destructive',
                  title: 'Error',
                  description: event.message ?? 'Orchestration failed',
                });
                onProcessingChange(null);
                break;
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          onProcessingChange(null);
          return;
        }
        const msg = err instanceof Error ? err.message : 'Orchestration failed';
        toast({ variant: 'destructive', title: 'Error', description: msg });
        onProcessingChange(null);
      }
    },
    [onProcessingChange, onResult, onMessages, onClarify, onEsignInteractive]
  );

  return { execute, rerunWithSettings, executeWithOrchestrator, stop };
}
