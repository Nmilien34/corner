import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Topbar from './components/Layout/Topbar';
import LeftPanel, { type VersionNode as LeftPanelVersionNode } from './components/Layout/LeftPanel';
import RightPanel, { type RightPanelSettings } from './components/Layout/RightPanel';
import EmptyState from './components/Canvas/EmptyState';
import ChatFloat from './components/Chat/ChatFloat';
import DocumentViewer from './components/Canvas/DocumentViewer';
import DocCanvas from './components/Canvas/DocCanvas';
import ESignCanvas from './components/Canvas/ESignCanvas';
import OnboardingModal from './components/Onboarding/OnboardingModal';
import { useIntent } from './hooks/useIntent';
import { useVersionHistory } from './hooks/useVersionHistory';
import type {
  AppMode,
  ChatMessage,
  ParsedIntent,
  ToolResult,
  ProcessingState,
  SignatureField,
  VersionNode,
  ToolName,
} from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('empty');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentResult, setCurrentResult] = useState<ToolResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [rightOpen, setRightOpen] = useState(false); // default collapsed; opposite of left panel
  const [panelSettings, setPanelSettings] = useState<RightPanelSettings>({});
  const [lastTool, setLastTool] = useState<ToolName | null>(null);
  const [showOnboarding] = useState(
    () => !localStorage.getItem('corner:onboarding-complete')
  );
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding);
  const [inputFocused, setInputFocused] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true); // default expanded; user can collapse
  const [activeNav, setActiveNav] = useState<'recent' | 'starred' | 'trash'>('recent');
  const [canvasViewMode, setCanvasViewMode] = useState(true); // true = canvas with all frames, false = single doc view

  // E-sign interactive state
  const [esignFields, setEsignFields] = useState<SignatureField[]>([]);
  const [esignPdfUrl, setEsignPdfUrl] = useState('');

  const { nodes, addNode, clearHistory } = useVersionHistory();

  const handleEsignInteractive = useCallback(
    (_parsed: ParsedIntent, file: File | undefined) => {
      if (!file) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'corner',
            content: 'Please attach a PDF first, then ask me to sign it.',
            timestamp: Date.now(),
          },
        ]);
        setMode('empty');
        return;
      }
      const url = URL.createObjectURL(file);
      setEsignPdfUrl(url);
      setEsignFields([
        { page: 1, x: 10, y: 82, width: 35, height: 8, label: 'Signature', placed: true },
      ]);
      setMode('esign');
    },
    []
  );

  // Intent hook wires parse → execute → result
  const { execute: executeIntent, rerunWithSettings } = useIntent({
    onProcessingChange: setProcessing,
    onResult: (result, tool) => {
      setCurrentResult(result);
      setLastTool(tool);
      setMode('result');
      setRightOpen(true);
      addNode(result.fileName, undefined, result.downloadUrl);
      setCanvasViewMode(true); // show canvas with all docs when new result arrives
    },
    onMessages: setMessages,
    onClarify: () => setMode('clarifying'),
    onEsignInteractive: handleEsignInteractive,
  });

  // Canvas-wide drop zone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (!files.length) return;
      const file = files[0];
      setCurrentFile(file);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'corner',
          content: `I see you uploaded ${file.name}. What would you like to do with it?`,
          timestamp: Date.now(),
          attachmentName: file.name,
        },
      ]);
    },
    noClick: true,
    multiple: true,
  });

  const handleSend = useCallback(
    (text: string, file?: File) => {
      const attachedFile = file ?? currentFile;
      if (file) setCurrentFile(file);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: text,
          timestamp: Date.now(),
          attachmentName: attachedFile?.name,
        },
      ]);

      setMode('processing');
      executeIntent(text, attachedFile ?? undefined);
    },
    [currentFile, executeIntent]
  );

  const handleVersionRestore = useCallback((v: VersionNode) => {
    setCurrentResult({
      fileId: v.id,
      fileName: v.label,
      mimeType: v.downloadUrl?.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      sizeBytes: 0,
      downloadUrl: v.downloadUrl ?? '',
    });
    setMode('result');
  }, []);

  function inferFileType(node: VersionNode): LeftPanelVersionNode['fileType'] {
    const s = (node.downloadUrl ?? node.label ?? '').toLowerCase();
    if (s.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|bmp)$/.test(s)) return 'image';
    if (/\.(docx?|doc)$/.test(s)) return 'word';
    return 'other';
  }

  const versionHistoryForPanel: LeftPanelVersionNode[] = nodes.map((n) => ({
    id: n.id,
    fileName: n.label,
    fileType: inferFileType(n),
    operation: 'Processed',
    timestamp: n.timestamp,
    isActive: n.isCurrent,
  }));

  const activeNodeId = nodes.find((n) => n.isCurrent)?.id ?? null;

  const handleESignConfirm = useCallback(
    async (placedFields: SignatureField[]) => {
      if (!currentFile) return;
      setMode('processing');
      setProcessing({ progress: 50, label: 'Applying signatures...' });

      try {
        const sigRaw = localStorage.getItem('corner:signature');
        if (!sigRaw) throw new Error('No signature found. Please complete onboarding.');
        const sig = JSON.parse(sigRaw);

        const fd = new FormData();
        fd.append('files', currentFile);
        fd.append('tool', 'esign');
        fd.append(
          'params',
          JSON.stringify({
            signatureDataUrl: sig.dataUrl,
            initialsDataUrl: sig.initialsDataUrl,
            fields: placedFields,
          })
        );

        const res = await axios.post<ToolResult>('/api/execute', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setProcessing({ progress: 100, label: 'Signed' });
        await new Promise((r) => setTimeout(r, 400));
        setProcessing(null);
        URL.revokeObjectURL(esignPdfUrl);
        setEsignPdfUrl('');
        setCurrentResult(res.data);
        setLastTool('esign');
        setMode('result');
        addNode(res.data.fileName, undefined, res.data.downloadUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'E-sign failed';
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'corner',
            content: msg,
            timestamp: Date.now(),
          },
        ]);
        setMode('empty');
        setProcessing(null);
      }
    },
    [currentFile, addNode, esignPdfUrl]
  );

  const handleUndo = useCallback(() => {
    // nodes is newest-last; undo goes to second-to-last
    if (nodes.length > 1) {
      handleVersionRestore(nodes[nodes.length - 2]);
    } else {
      setMode('empty');
      setCurrentResult(null);
    }
  }, [nodes, handleVersionRestore]);

  return (
    <div
      {...getRootProps()}
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <input {...getInputProps()} />

      {/* Global drop overlay */}
      {isDragActive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(139, 115, 85, 0.06)',
            border: '2px dashed var(--accent)',
          }}
        >
          <p style={{ color: 'var(--accent)', fontSize: '15px', fontWeight: 500 }}>
            Drop your files here
          </p>
        </div>
      )}

      {/* Top bar only over left + canvas so right panel collapse is never hidden */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar
            fileName={currentResult?.fileName}
            showOpenLeftPanel={!leftPanelOpen}
            onOpenLeftPanel={() => setLeftPanelOpen(true)}
          />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <LeftPanel
              isOpen={leftPanelOpen}
              history={versionHistoryForPanel}
              user={null}
              activeNodeId={activeNodeId}
              onRestoreVersion={(id) => {
                const v = nodes.find((n) => n.id === id);
                if (v) handleVersionRestore(v);
              }}
              onClearHistory={() => {
                clearHistory();
                console.log('Clear history');
              }}
              onSignIn={() => console.log('Sign in')}
              onSignOut={() => console.log('Sign out')}
              onOpenSettings={() => console.log('Open settings')}
              onNavSelect={(item) => {
                setActiveNav(item);
                console.log('Nav select', item);
              }}
              activeNav={activeNav}
              onToggle={() => setLeftPanelOpen((p) => !p)}
            />

            {/* Canvas — surface first, content on top */}
            <main
          className="flex-1 flex flex-col relative overflow-hidden canvas-surface"
        >
          {/* Thin progress line at top */}
          {processing && (
            <div
              className="absolute top-0 left-0 h-0.5 z-10"
              style={{
                background: 'var(--accent)',
                width: `${processing.progress}%`,
                transition: 'width 300ms ease',
              }}
            />
          )}

          {/* Multi-step intent label */}
          {processing?.stepTotal && (
            <div
              className="absolute z-10 flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                bottom: 88,
                left: 32,
                right: 32,
                background: 'var(--white)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ background: 'var(--accent)' }}
              />
              Step {processing.stepCurrent} of {processing.stepTotal}: {processing.label}
            </div>
          )}

          {/* Canvas content — centered for empty/processing/doc; full-bleed only for multi-doc canvas */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-6 relative">
            {/* Figma-style canvas: full-bleed when showing all docs */}
            {mode === 'result' && nodes.length > 0 && canvasViewMode && (
              <div className="absolute inset-0 p-6">
                <DocCanvas
                  nodes={nodes.map((n) => ({ id: n.id, label: n.label, downloadUrl: n.downloadUrl }))}
                  selectedId={currentResult?.fileId ?? nodes.find((n) => n.isCurrent)?.id ?? null}
                  onSelectFrame={(id) => {
                    const v = nodes.find((n) => n.id === id);
                    if (v) {
                      handleVersionRestore(v);
                      setCanvasViewMode(false);
                    }
                  }}
                />
              </div>
            )}

            {/* Centered: empty state, processing, single doc, esign */}
            {!(mode === 'result' && nodes.length > 0 && canvasViewMode) && (
              <>
                {(mode === 'empty' || mode === 'clarifying') && !processing && (
                  <EmptyState onAction={handleSend} />
                )}

                {mode === 'processing' && processing && !processing.stepTotal && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="canvas-spinner" />
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{processing.label}</p>
                  </div>
                )}

                {mode === 'result' && currentResult && (
                  <div className="flex flex-col items-center w-full max-w-4xl">
                    {nodes.length >= 1 && (
                      <button
                        type="button"
                        onClick={() => setCanvasViewMode(true)}
                        style={{
                          alignSelf: 'flex-start',
                          marginBottom: 8,
                          padding: '4px 8px',
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ← All documents
                      </button>
                    )}
                    <DocumentViewer result={currentResult} onUndo={handleUndo} />
                  </div>
                )}

                {mode === 'esign' && esignPdfUrl && (
                  <ESignCanvas
                    pdfUrl={esignPdfUrl}
                    detectedFields={esignFields}
                    onConfirm={handleESignConfirm}
                    onCancel={() => {
                      URL.revokeObjectURL(esignPdfUrl);
                      setEsignPdfUrl('');
                      setMode(currentResult ? 'result' : 'empty');
                    }}
                  />
                )}
              </>
            )}
          </div>

          <ChatFloat
            messages={messages}
            currentFile={currentFile}
            onSend={handleSend}
            disabled={mode === 'processing'}
            floatUp={(mode === 'empty' || mode === 'clarifying') && inputFocused}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </main>
          </div>
        </div>

        <RightPanel
          isOpen={rightOpen}
          result={currentResult}
          lastTool={lastTool}
          onToggle={() => setRightOpen((p) => !p)}
          onToolSelect={(tool, settings) => {
            setMode('processing');
            const prompt = settings && Object.keys(settings).length > 0
              ? `use the ${tool} tool with settings: ${JSON.stringify(settings)}`
              : `use the ${tool} tool`;
            executeIntent(prompt, currentFile ?? undefined);
          }}
          onOpenOnboarding={() => setOnboardingVisible(true)}
          onSaveTemplate={() => console.log('Save template')}
          settings={panelSettings}
          onSettingsChange={(patch) => setPanelSettings((prev) => ({ ...prev, ...patch }))}
        />
      </div>

      {onboardingVisible && (
        <OnboardingModal onComplete={() => setOnboardingVisible(false)} />
      )}
    </div>
  );
}
