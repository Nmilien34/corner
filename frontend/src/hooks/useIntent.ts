import { useCallback } from 'react';
import axios from 'axios';
import type { ParsedIntent, ToolResult, ProcessingState, ChatMessage, ToolName } from '../types';
import type { RightPanelSettings } from '../components/Layout/RightPanel';
import { settingsToToolParams } from '../lib/settingsToToolParams';

interface Options {
  onProcessingChange: (state: ProcessingState | null) => void;
  onResult: (result: ToolResult, tool: ToolName) => void;
  onMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onClarify: (question: string) => void;
  onEsignInteractive: (parsed: ParsedIntent, file: File | undefined) => void;
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

export function useIntent({ onProcessingChange, onResult, onMessages, onClarify, onEsignInteractive }: Options) {
  const execute = useCallback(
    async (message: string, file?: File) => {
      try {
        // 1. Call parse route
        const { data: parsed } = await axios.post<ParsedIntent>('/api/parse', {
          message,
          fileContext: file
            ? { name: file.name, type: file.type, size: file.size }
            : undefined,
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

        // 4. Confirm action in chat
        addMessage(onMessages, 'corner', parsed.intent);

        // 5. Build step list (single-step or multi-step)
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

        // 6. Done
        onProcessingChange({ progress: 100, label: 'Done' });
        await new Promise((r) => setTimeout(r, 300));
        onProcessingChange(null);

        if (lastResult) onResult(lastResult, steps[steps.length - 1].tool as ToolName);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        addMessage(onMessages, 'corner', `Error: ${msg}`);
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
        addMessage(onMessages, 'corner', `Error: ${msg}`);
        onProcessingChange(null);
      }
    },
    [onProcessingChange, onResult, onMessages]
  );

  return { execute, rerunWithSettings };
}
