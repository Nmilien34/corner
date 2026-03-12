import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Topbar from './components/Layout/Topbar';
import LeftPanel, {
  type VersionNode as LeftPanelVersionNode,
  type User as LeftPanelUser,
} from './components/Layout/LeftPanel';
import RightPanel, { type RightPanelSettings } from './components/Layout/RightPanel';
import EmptyState from './components/Canvas/EmptyState';
import ProcessingTimeline from './components/Canvas/ProcessingTimeline';
import DocumentColumn from './components/Canvas/DocumentColumn';
import ChatFloat from './components/Chat/ChatFloat';
import ChatThreadColumn from './components/Chat/ChatThreadColumn';
import DocumentViewer from './components/Canvas/DocumentViewer';
import DocCanvas from './components/Canvas/DocCanvas';
import ESignCanvas from './components/Canvas/ESignCanvas';
import AiWalkthrough from './components/Walkthrough/AiWalkthrough';
import SettingsPage from './pages/SettingsPage';
import FoldersPage from './pages/FoldersPage';
import FolderDetailPage from './pages/FolderDetailPage';
import ConversationListPage from './pages/ConversationListPage';
import OnboardingModal from './components/Onboarding/OnboardingModal';
import { useIntent } from './hooks/useIntent';
import { useVersionHistory } from './hooks/useVersionHistory';
import { useConversations } from './hooks/useConversations';
import { useFolders } from './hooks/useFolders';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/toaster';
import { toast } from './hooks/use-toast';
import type {
  AppMode,
  ChatMessage,
  ParsedIntent,
  ToolResult,
  ProcessingState,
  SignatureField,
  VersionNode,
  ToolName,
  WalkthroughStep,
  ConversationListItem,
} from './types';

/** Map tool name to a short label for history (e.g. "PDF → Word", "Compressed"). */
function toolToFriendlyOperation(tool: ToolName): string {
  const map: Record<string, string> = {
    pdf_to_word: 'PDF → Word',
    pdf_to_excel: 'PDF → Excel',
    pdf_to_pptx: 'PDF → PowerPoint',
    pdf_to_jpg: 'PDF → JPG',
    pdf_to_png: 'PDF → PNG',
    word_to_pdf: 'Word → PDF',
    excel_to_pdf: 'Excel → PDF',
    pptx_to_pdf: 'PowerPoint → PDF',
    jpg_to_pdf: 'Image → PDF',
    png_to_pdf: 'Image → PDF',
    merge_pdf: 'Merged',
    split_pdf: 'Split',
    compress_pdf: 'Compressed',
    rotate_pdf: 'Rotated',
    repair_pdf: 'Repaired',
    add_page_numbers: 'Page numbers',
    password_protect_pdf: 'Password protected',
    remove_pdf_password: 'Password removed',
    add_watermark_pdf: 'Watermarked',
    ocr: 'OCR',
    fill_pdf_form: 'Form filled',
    esign: 'Signed',
    remove_background: 'Background removed',
    resize_image: 'Resized',
    crop_image: 'Cropped',
    flip_rotate_image: 'Flip/rotate',
    add_border_image: 'Border added',
    watermark_image: 'Watermarked',
    image_to_pdf: 'Image → PDF',
    compress_image: 'Compressed',
    convert_image: 'Converted',
    jpg_to_png: 'Converted',
    png_to_jpg: 'Converted',
    webp_to_jpg: 'Converted',
    jpg_to_webp: 'Converted',
    csv_to_excel: 'CSV → Excel',
    excel_to_csv: 'Excel → CSV',
    generate_qr: 'QR code',
    extract_text: 'Text extracted',
    extract_images: 'Images extracted',
    extract_tables: 'Tables extracted',
    summarize_document: 'Summary',
    generate_study_questions: 'Study questions',
    extract_key_terms: 'Key terms',
    generate_citation: 'Citation',
  };
  return map[tool] ?? 'Processed';
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('empty');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const currentFile = currentFiles[0] ?? null;
  const [currentResult, setCurrentResult] = useState<ToolResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [planUnderstanding, setPlanUnderstanding] = useState<string | null>(null);
  const [rightOpen, setRightOpen] = useState(false); // default collapsed; opposite of left panel
  const [panelSettings, setPanelSettings] = useState<RightPanelSettings>({});
  const [lastTool, setLastTool] = useState<ToolName | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true); // default expanded; user can collapse
  const [activeNav, setActiveNav] = useState<'recent' | 'starred' | 'trash'>('recent');
  const [canvasViewMode, setCanvasViewMode] = useState(true); // true = canvas with all frames, false = single doc view
  const [focusedDocumentView, setFocusedDocumentView] = useState(false); // true = full-width doc (State 3), no chat column
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null); // object URL for currentFile preview in split
  const auth = useAuth();
  const leftPanelUser: LeftPanelUser | null = auth.user
    ? { name: auth.user.displayName, email: auth.user.email, plan: auth.user.plan }
    : null;
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[] | null>(null);
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const [currentWalkStep, setCurrentWalkStep] = useState<WalkthroughStep | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isSettingsRoute = location.pathname === '/settings';
  const folderDetailMatch = location.pathname.match(/^\/folders\/([^/]+)$/);
  const folderIdFromPath = folderDetailMatch?.[1] ?? null;
  const isFoldersRoute = location.pathname === '/folders';
  const isFolderDetailRoute = folderIdFromPath != null;
  const isRecentRoute = location.pathname === '/recent';
  const isStarredRoute = location.pathname === '/starred';
  const isTrashRoute = location.pathname === '/trash';

  // E-sign interactive state
  const [esignFields, setEsignFields] = useState<SignatureField[]>([]);
  const [esignPdfUrl, setEsignPdfUrl] = useState('');

  const { nodes, addNode, clearHistory } = useVersionHistory();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const conversations = useConversations({
    isSignedIn: !!auth.user,
    getToken: auth.getToken,
  });
  const conversationIdsInFolder = useCallback(
    (folderId: string) =>
      conversations.list.filter((c) => c.folderId === folderId).map((c) => c.id),
    [conversations.list]
  );
  const foldersApi = useFolders({
    updateConversation: conversations.updateConversation,
    conversationIdsInFolder,
  });
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Object URL for currentFile so left column can preview before processing
  useEffect(() => {
    if (!currentFile) {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(currentFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [currentFile]);

  const showSplit = !!(currentFile || currentResult) && !focusedDocumentView;

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
  const { execute: executeIntent, executeWithOrchestrator, stop: stopProcessing } = useIntent({
    onProcessingChange: setProcessing,
    onPlanUnderstanding: (text) => setPlanUnderstanding(text),
    onResult: (result, tool) => {
      const isStudyTool = ['summarize_document', 'generate_study_questions', 'extract_key_terms'].includes(tool);
      const isAudioTool =
        tool === 'transcribe_audio' ||
        tool === 'extract_audio' ||
        tool === 'remove_silence' ||
        tool === 'convert_audio' ||
        tool === 'audio_to_pdf';
      // Default: keep the original upload visible on the left for *all* tools (except audio),
      // so the user never loses context of what they uploaded.
      const keepSourceDocOnLeft = !isAudioTool;
      const completionMessage = (result as ToolResult & { message?: string }).message ?? "Here's your processed document.";
      const bodyContent = isStudyTool && result.textContent ? result.textContent : completionMessage;

      if (!keepSourceDocOnLeft) {
        setCurrentResult(result);
        setMode('result');
        addNode(result.fileName, undefined, result.downloadUrl, toolToFriendlyOperation(tool));
        setCanvasViewMode(true);
      } else if (!isStudyTool) {
        // For conversions, still add the output to history (without switching the left viewer).
        addNode(result.fileName, undefined, result.downloadUrl, toolToFriendlyOperation(tool));
        setMode('result');
      }
      setLastTool(tool);
      // Keep tools panel closed so the answer and result/export live only in the chat thread

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'corner',
          content: bodyContent,
          timestamp: Date.now(),
          result,
          ...(isStudyTool && { toolName: tool }),
        },
      ]);
      setPlanUnderstanding(null);
      const cid = currentConversationIdRef.current;
      if (cid) {
        conversations.addMessage(cid, {
          role: 'corner',
          content: bodyContent,
          toolCall: {
            toolName: tool,
            resultFileId: result.fileId,
            resultFileName: result.fileName,
            resultMimeType: result.mimeType,
            resultSizeBytes: result.sizeBytes,
          },
        }).catch(() => {});
      }
      if (result.walkthrough && result.walkthrough.length > 0) {
        setWalkthroughSteps(result.walkthrough);
        setWalkthroughActive(true);
        setCurrentWalkStep(result.walkthrough[0]);
      } else {
        setWalkthroughSteps(null);
        setWalkthroughActive(false);
        setCurrentWalkStep(null);
      }
    },
    onMessages: setMessages,
    onClarify: () => setMode('clarifying'),
    onEsignInteractive: handleEsignInteractive,
  });

  // Canvas-wide drop zone — accept multiple files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (!files.length) return;
      if (!auth.user) {
        setOnboardingVisible(true);
        return;
      }
      setCurrentFiles(files);
      const label = files.length === 1
        ? `[${files[0].name}] loaded. What would you like to do with it?`
        : `${files.length} files loaded. What would you like to do with them?`;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: label,
          timestamp: Date.now(),
        },
      ]);
    },
    noClick: true,
    multiple: true,
  });

  const handleSend = useCallback(
    (text: string, files: File[] = []) => {
      if (!auth.user) {
        setOnboardingVisible(true);
        return;
      }
      const allFiles = files.length > 0 ? files : currentFiles;
      const isFirstFile = files.length > 0 && currentFiles.length === 0;
      if (files.length > 0) setCurrentFiles(files);

      setMessages((prev) => {
        const next = [...prev];
        if (isFirstFile && allFiles.length > 0) {
          const label = allFiles.length === 1
            ? `[${allFiles[0].name}] loaded. What would you like to do with it?`
            : `${allFiles.length} files loaded. What would you like to do with them?`;
          next.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: label,
            timestamp: Date.now(),
          });
        }
        next.push({
          id: crypto.randomUUID(),
          role: 'user',
          content: text,
          timestamp: Date.now(),
          attachmentName: allFiles.length > 1 ? `${allFiles.length} files` : allFiles[0]?.name,
        });
        return next;
      });

      (async () => {
        let cid = currentConversationIdRef.current;
        if (!cid) {
          const fileName = (files[0] ?? currentFile)?.name?.trim();
          const title = fileName || text.trim().slice(0, 80) || 'New Conversation';
          cid = await conversations.createConversation(title.slice(0, 200));
          setCurrentConversationId(cid);
          currentConversationIdRef.current = cid;
        }
        await conversations.addMessage(cid, { role: 'user', content: text });
      })().catch(() => {});

      setMode('processing');
      setPlanUnderstanding(null);
      executeWithOrchestrator(text, allFiles);
    },
    [currentFiles, conversations, executeWithOrchestrator]
  );

  // When user stops processing, leave "processing" mode so UI returns to idle
  useEffect(() => {
    if (processing === null && mode === 'processing') {
      // If a file is loaded, keep the workspace in "result" (split view) so the doc doesn't collapse.
      setMode((currentFile || currentResult) ? 'result' : 'empty');
    }
  }, [processing, mode, currentResult]);

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

  function inferFileTypeFromFileName(fileName: string): LeftPanelVersionNode['fileType'] {
    const s = fileName.toLowerCase();
    if (s.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|bmp)$/.test(s)) return 'image';
    if (/\.(docx?|doc)$/.test(s)) return 'word';
    return 'other';
  }

  /** Build left panel list from conversation list (past chats), filtered by activeNav. */
  const versionHistoryForPanel: LeftPanelVersionNode[] = conversations.list
    .filter((c: ConversationListItem) => {
      if (activeNav === 'starred') return c.pinned && !c.archived;
      if (activeNav === 'trash') return c.archived;
      return !c.archived; // 'recent'
    })
    .map((c: ConversationListItem) => ({
      id: c.id,
      fileName: c.latestResultFileName ?? c.title,
      fileType: inferFileTypeFromFileName(c.latestResultFileName ?? c.title),
      operation: c.toolsUsed?.length
        ? toolToFriendlyOperation(c.toolsUsed[c.toolsUsed.length - 1] as ToolName)
        : 'Processed',
      timestamp: c.lastMessageAt,
      isActive: c.id === currentConversationId,
      pinned: c.pinned,
      folderId: c.folderId,
    }));

  const activeNodeId = currentConversationId;

  const handleRestoreConversation = useCallback(
    async (id: string) => {
      try {
        const { messages: loadedMessages, latestResult } = await conversations.getMessages(id);
        const conv = conversations.list.find((c) => c.id === id);
        // Use conversation list metadata when getMessages didn't return a result (e.g. API shape)
        const result =
          latestResult ??
          (conv?.latestResultFileId && conv?.latestResultFileName && conv?.latestResultMimeType
            ? {
                fileId: conv.latestResultFileId,
                downloadUrl: `${conversations.getApiBase?.() ?? ''}/api/file/${conv.latestResultFileId}`,
                fileName: conv.latestResultFileName,
                mimeType: conv.latestResultMimeType,
                sizeBytes: 0,
              }
            : null);
        setMessages(loadedMessages);
        setCurrentResult(result);
        setMode(result ? 'result' : loadedMessages.length ? 'result' : 'empty');
        setCurrentConversationId(id);
        setFocusedDocumentView(false); // ensure split view: doc left, conversation right
        setCanvasViewMode(false); // show doc + chat split, not the PDF cards view
        if (result) {
          const lastTool = conv?.toolsUsed?.length ? (conv.toolsUsed[conv.toolsUsed.length - 1] as ToolName) : undefined;
          addNode(
            result.fileName,
            undefined,
            result.downloadUrl.startsWith('http') ? result.downloadUrl : `${conversations.getApiBase?.() ?? ''}${result.downloadUrl}`,
            lastTool ? toolToFriendlyOperation(lastTool) : undefined
          );
        }
        setWalkthroughSteps(null);
        setWalkthroughActive(false);
        setCurrentWalkStep(null);
      } catch {
        toast({ variant: 'destructive', title: 'Could not load conversation', description: 'Try again.' });
      }
    },
    [conversations, addNode]
  );

  const handleClearHistory = useCallback(() => {
    conversations.clearAll();
    setCurrentConversationId(null);
    setMessages([]);
    setCurrentResult(null);
    setMode('empty');
    clearHistory();
  }, [conversations, clearHistory]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await conversations.deleteConversation(id).catch(() => {});
    if (id === currentConversationId) {
      setCurrentConversationId(null);
      setMessages([]);
      setCurrentResult(null);
      setMode('empty');
    }
  }, [conversations, currentConversationId]);

  const handleStarConversation = useCallback(async (id: string, pinned: boolean) => {
    await conversations.updateConversation(id, { pinned }).catch(() => {});
  }, [conversations]);

  const handleArchiveConversation = useCallback(async (id: string, archived: boolean) => {
    await conversations.updateConversation(id, { archived }).catch(() => {});
    if (archived && id === currentConversationId) {
      setCurrentConversationId(null);
      setMessages([]);
      setCurrentResult(null);
      setMode('empty');
    }
  }, [conversations, currentConversationId]);

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
        addNode(res.data.fileName, undefined, res.data.downloadUrl, 'Signed');
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'corner',
            content: "Here's your signed document.",
            timestamp: Date.now(),
            result: res.data,
          },
        ]);
        let cid = currentConversationIdRef.current;
        if (!cid) {
          cid = await conversations.createConversation(currentFile.name?.trim()?.slice(0, 200) || 'Signed document');
          setCurrentConversationId(cid);
          currentConversationIdRef.current = cid;
        }
        await conversations.addMessage(cid, {
          role: 'corner',
          content: "Here's your signed document.",
          toolCall: {
            toolName: 'esign',
            resultFileId: res.data.fileId,
            resultFileName: res.data.fileName,
            resultMimeType: res.data.mimeType,
            resultSizeBytes: res.data.sizeBytes,
          },
        }).catch(() => {});
        if (res.data.walkthrough && res.data.walkthrough.length > 0) {
          setWalkthroughSteps(res.data.walkthrough);
          setWalkthroughActive(true);
          setCurrentWalkStep(res.data.walkthrough[0]);
        } else {
          setWalkthroughSteps(null);
          setWalkthroughActive(false);
          setCurrentWalkStep(null);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'E-sign failed';
        toast({ variant: 'destructive', title: 'E-sign failed', description: msg });
        setMode('empty');
        setProcessing(null);
      }
    },
    [currentFile, addNode, esignPdfUrl, conversations]
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

  // Keep center workspace view in sync with Preview tab view mode
  useEffect(() => {
    const mode = panelSettings.previewMode;
    if (!mode) return;
    if (mode === 'frames') {
      setCanvasViewMode(true);
    } else if (mode === 'page' || mode === 'text') {
      setCanvasViewMode(false);
    }
  }, [panelSettings.previewMode]);

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
            currentConversationId={currentConversationId}
            currentFolderId={
              currentConversationId
                ? conversations.list.find((c) => c.id === currentConversationId)?.folderId
                : undefined
            }
            folders={foldersApi.folders}
            onAssignToFolder={foldersApi.assignConversationToFolder}
          />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <LeftPanel
              isOpen={leftPanelOpen}
              history={versionHistoryForPanel}
              user={leftPanelUser}
              activeNodeId={activeNodeId}
              onRestoreVersion={handleRestoreConversation}
              onClearHistory={handleClearHistory}
              onSignIn={() => setOnboardingVisible(true)}
              onSignOut={() => auth.logout()}
              onOpenSettings={() => navigate('/settings')}
              onNewFlow={() => {
                navigate('/');
                setCurrentConversationId(null);
                setMessages([]);
                setCurrentFiles([]);
                setCurrentResult(null);
                setMode('empty');
                setProcessing(null);
                setFocusedDocumentView(false);
              }}
              onNavSelect={(item) => {
                setActiveNav(item);
                navigate(`/${item}`);
              }}
              activeNav={activeNav}
              onToggle={() => setLeftPanelOpen((p) => !p)}
              onDeleteConversation={handleDeleteConversation}
              onStarConversation={handleStarConversation}
              onArchiveConversation={handleArchiveConversation}
              onOpenFolders={() => navigate('/folders')}
            />

            {/* Canvas or Settings — surface first, content on top */}
            <main
          className="flex-1 flex flex-col relative overflow-hidden canvas-surface"
        >
          {isFolderDetailRoute && folderIdFromPath ? (
            <FolderDetailPage
              folderName={
                foldersApi.folders.find((f) => f.id === folderIdFromPath)?.name ?? 'Folder'
              }
              conversations={conversations.list.filter((c) => c.folderId === folderIdFromPath)}
              onRestore={handleRestoreConversation}
            />
          ) : isRecentRoute ? (
            <ConversationListPage
              filter="recent"
              conversations={conversations.list.filter((c) => !c.archived)}
              onRestore={handleRestoreConversation}
            />
          ) : isStarredRoute ? (
            <ConversationListPage
              filter="starred"
              conversations={conversations.list.filter((c) => c.pinned && !c.archived)}
              onRestore={handleRestoreConversation}
            />
          ) : isTrashRoute ? (
            <ConversationListPage
              filter="trash"
              conversations={conversations.list.filter((c) => c.archived)}
              onRestore={handleRestoreConversation}
            />
          ) : isFoldersRoute ? (
            <FoldersPage
              folders={foldersApi.folders}
              createFolder={foldersApi.createFolder}
              renameFolder={foldersApi.renameFolder}
              deleteFolder={foldersApi.deleteFolder}
              conversationCountByFolderId={(folderId) =>
                conversations.list.filter((c) => c.folderId === folderId).length
              }
            />
          ) : isSettingsRoute ? (
            <SettingsPage
              settings={panelSettings}
              onSettingsChange={(patch) =>
                setPanelSettings((prev) => ({ ...prev, ...patch }))
              }
            />
          ) : (
          <>
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

          {/* (removed) Multi-step floating label — progress is shown in chat + top thin bar */}

          {/* Canvas content: split (doc | chat), focused doc, or single-column empty/processing/result */}
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* State 2: Two columns — document (left) | conversation (right) */}
            {showSplit && (
              <>
                <DocumentColumn
                  result={currentResult}
                  filePreviewUrl={filePreviewUrl}
                  fileName={currentResult?.fileName ?? currentFile?.name ?? ''}
                  mimeType={currentResult?.mimeType ?? currentFile?.type ?? ''}
                  sizeBytes={currentResult?.sizeBytes ?? currentFile?.size ?? 0}
                  onFocus={() => setFocusedDocumentView(true)}
                  previewMode={panelSettings.previewMode ?? 'page'}
                  zoomPercent={panelSettings.zoom ?? 100}
                />
                <ChatThreadColumn
                  messages={messages}
                  isProcessing={mode === 'processing'}
                  onSend={handleSend}
                  onClearThread={() => setMessages([])}
                  disabled={mode === 'processing'}
                  onStop={() => {
                    setPlanUnderstanding(null);
                    stopProcessing();
                  }}
                  planUnderstanding={planUnderstanding}
                  currentFiles={currentFiles}
                  onClearCurrentFiles={currentFiles.length > 0 ? () => setCurrentFiles([]) : undefined}
                />
              </>
            )}

            {/* State 3: Focused document — full width, back to conversation */}
            {focusedDocumentView && (currentFile || currentResult) && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div
                  className="shrink-0 flex items-center gap-2 px-4 py-2"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--white)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFocusedDocumentView(false)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    ← Conversation
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6">
                  {currentResult && (
                    <DocumentViewer
                      result={currentResult}
                      onUndo={handleUndo}
                      walkthroughStep={currentWalkStep}
                      previewMode={panelSettings.previewMode ?? 'page'}
                      zoomPercent={panelSettings.zoom ?? 100}
                    />
                  )}
                  {!currentResult && filePreviewUrl && currentFile && (
                    <DocumentViewer
                      result={{
                        fileId: 'preview',
                        downloadUrl: filePreviewUrl,
                        fileName: currentFile.name,
                        mimeType: currentFile.type,
                        sizeBytes: currentFile.size,
                      }}
                      previewMode={panelSettings.previewMode ?? 'page'}
                      zoomPercent={panelSettings.zoom ?? 100}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Single column: empty / processing / result / esign (when not split, not focused) */}
            {!showSplit && !focusedDocumentView && (
            <div className="flex-1 flex items-center justify-center overflow-hidden p-6 relative">
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

                {mode === 'processing' && processing && (
                  <div className="flex flex-col items-center gap-3">
                    <ProcessingTimeline
                      label={processing.label}
                      stepCurrent={processing.stepCurrent}
                      stepTotal={processing.stepTotal}
                      toolNames={processing.toolNames}
                    />
                  </div>
                )}

                {mode === 'result' && currentResult && (
                  <div className="flex flex-col items-center w-full max-w-4xl relative">
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
                    <DocumentViewer
                      result={currentResult}
                      onUndo={handleUndo}
                      walkthroughStep={currentWalkStep}
                      previewMode={panelSettings.previewMode ?? 'page'}
                      zoomPercent={panelSettings.zoom ?? 100}
                    />
                    {walkthroughSteps && walkthroughSteps.length > 0 && (
                      <AiWalkthrough
                        steps={walkthroughSteps}
                        active={walkthroughActive}
                        onExit={() => {
                          setWalkthroughActive(false);
                          setCurrentWalkStep(null);
                        }}
                        onStepChange={(step) => setCurrentWalkStep(step)}
                      />
                    )}
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
            )}

          </div>

          {/* Floating chat input only when not in split view */}
          {!showSplit && (
          <ChatFloat
            messages={messages}
            currentFiles={currentFiles}
            onSend={handleSend}
            disabled={mode === 'processing'}
            onStop={() => {
              setPlanUnderstanding(null);
              stopProcessing();
            }}
            floatUp={(mode === 'empty' || mode === 'clarifying') && inputFocused}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onClearCurrentFiles={currentFiles.length > 0 ? () => setCurrentFiles([]) : undefined}
          />
          )}
          </>
          )}
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
            executeIntent(prompt, currentFiles[0] ?? undefined);
          }}
          onOpenOnboarding={() => setOnboardingVisible(true)}
          onSaveTemplate={() => console.log('Save template')}
          settings={panelSettings}
          onSettingsChange={(patch) => setPanelSettings((prev) => ({ ...prev, ...patch }))}
        />
      </div>

      {onboardingVisible && (
        <OnboardingModal
          onComplete={() => {
            setOnboardingVisible(false);
            if (auth.user) {
              toast({ title: `Welcome, ${auth.user.displayName}!` });
            }
          }}
          onRegister={auth.register}
          onLogin={auth.login}
        />
      )}

      <Toaster />
    </div>
  );
}
