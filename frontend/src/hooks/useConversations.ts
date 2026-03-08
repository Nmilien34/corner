import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import type {
  ConversationListItem,
  AddMessagePayload,
  LoadedConversation,
  ChatMessage,
  ToolResult,
} from '../types';

const LS_CONVERSATIONS_KEY = 'corner:conversations';
const LS_MESSAGES_PREFIX = 'corner:conversation:';
const LS_MESSAGES_SUFFIX = ':messages';
const MAX_CONVERSATIONS = 50;

function getApiBase(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Stored conversation list item in localStorage (lastMessageAt as ISO string). */
interface StoredConversation {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  toolsUsed: string[];
  latestResultFileId?: string;
  latestResultFileName?: string;
  latestResultMimeType?: string;
}

/** Stored message in localStorage. */
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachmentName?: string;
  toolCall?: {
    toolName: string;
    resultFileId?: string;
    resultFileName?: string;
    resultMimeType?: string;
    resultSizeBytes?: number;
  };
}

function loadConversationsFromLS(): ConversationListItem[] {
  try {
    const raw = localStorage.getItem(LS_CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredConversation[];
    return parsed
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .slice(0, MAX_CONVERSATIONS)
      .map((c) => ({
        id: c.id,
        title: c.title,
        lastMessageAt: new Date(c.lastMessageAt),
        messageCount: c.messageCount,
        toolsUsed: c.toolsUsed ?? [],
        latestResultFileId: c.latestResultFileId,
        latestResultFileName: c.latestResultFileName,
        latestResultMimeType: c.latestResultMimeType,
      }));
  } catch {
    return [];
  }
}

function saveConversationsToLS(list: StoredConversation[]): void {
  try {
    const sorted = [...list].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    localStorage.setItem(LS_CONVERSATIONS_KEY, JSON.stringify(sorted.slice(0, MAX_CONVERSATIONS)));
  } catch {
    console.warn('corner: could not persist conversations to localStorage');
  }
}

function loadMessagesFromLS(conversationId: string): StoredMessage[] {
  try {
    const raw = localStorage.getItem(LS_MESSAGES_PREFIX + conversationId + LS_MESSAGES_SUFFIX);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMessagesToLS(conversationId: string, messages: StoredMessage[]): void {
  try {
    localStorage.setItem(
      LS_MESSAGES_PREFIX + conversationId + LS_MESSAGES_SUFFIX,
      JSON.stringify(messages)
    );
  } catch {
    console.warn('corner: could not persist messages to localStorage');
  }
}

function storedToChatMessage(m: StoredMessage, baseUrl: string): ChatMessage {
  const role = m.role === 'assistant' ? 'corner' : m.role;
  const result: ToolResult | undefined =
    m.toolCall?.resultFileId && m.toolCall?.resultFileName && m.toolCall?.resultMimeType
      ? {
          fileId: m.toolCall.resultFileId,
          downloadUrl: `${baseUrl}/api/file/${m.toolCall.resultFileId}`,
          fileName: m.toolCall.resultFileName,
          mimeType: m.toolCall.resultMimeType,
          sizeBytes: m.toolCall.resultSizeBytes ?? 0,
        }
      : undefined;
  return {
    id: m.id,
    role,
    content: m.content,
    timestamp: m.timestamp,
    ...(m.attachmentName && { attachmentName: m.attachmentName }),
    ...(result && { result }),
  };
}

function buildLatestResultFromMessages(
  messages: StoredMessage[],
  baseUrl: string
): ToolResult | null {
  const lastWithResult = [...messages].reverse().find((m) => m.toolCall?.resultFileId);
  if (!lastWithResult?.toolCall?.resultFileName || !lastWithResult.toolCall?.resultMimeType)
    return null;
  return {
    fileId: lastWithResult.toolCall.resultFileId!,
    downloadUrl: `${baseUrl}/api/file/${lastWithResult.toolCall.resultFileId}`,
    fileName: lastWithResult.toolCall.resultFileName,
    mimeType: lastWithResult.toolCall.resultMimeType,
    sizeBytes: lastWithResult.toolCall.resultSizeBytes ?? 0,
  };
}

/** Map API role to frontend: assistant -> corner */
function apiRoleToFrontend(role: string): 'user' | 'corner' | 'system' {
  if (role === 'assistant') return 'corner';
  if (role === 'user' || role === 'system') return role;
  return 'corner';
}

export interface UseConversationsOptions {
  isSignedIn: boolean;
  getToken?: () => string | null;
}

export function useConversations(options: UseConversationsOptions) {
  const { isSignedIn, getToken } = options;
  const [list, setList] = useState<ConversationListItem[]>(() =>
    isSignedIn ? [] : loadConversationsFromLS()
  );
  const [listLoading, setListLoading] = useState(false);
  const baseUrl = getApiBase();

  const refreshList = useCallback(async () => {
    if (!isSignedIn || !getToken?.()) {
      setList(loadConversationsFromLS());
      return;
    }
    setListLoading(true);
    try {
      const token = getToken();
      const { data } = await axios.get<{ conversations: Array<Record<string, unknown>> }>(
        '/api/conversations',
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const items: ConversationListItem[] = (data.conversations ?? []).map((c: Record<string, unknown>) => ({
        id: String(c._id ?? c.id),
        title: String(c.title ?? 'New Conversation'),
        lastMessageAt: new Date((c.lastMessageAt as string) ?? Date.now()),
        messageCount: Number(c.messageCount ?? 0),
        toolsUsed: Array.isArray(c.toolsUsed) ? (c.toolsUsed as string[]) : [],
        latestResultFileId: c.latestResultFileId as string | undefined,
        latestResultFileName: c.latestResultFileName as string | undefined,
        latestResultMimeType: c.latestResultMimeType as string | undefined,
      }));
      setList(items);
    } catch {
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isSignedIn && getToken?.()) {
      refreshList();
    } else {
      setList(loadConversationsFromLS());
    }
  }, [isSignedIn, getToken, refreshList]);

  const createConversation = useCallback(
    async (title?: string): Promise<string> => {
      const safeTitle = (title?.trim() || 'New Conversation').slice(0, 200);
      if (!isSignedIn || !getToken?.()) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newItem: StoredConversation = {
          id,
          title: safeTitle,
          lastMessageAt: now,
          messageCount: 0,
          toolsUsed: [],
        };
        const current = loadConversationsFromLS().map((c) => ({
          id: c.id,
          title: c.title,
          lastMessageAt: c.lastMessageAt.toISOString(),
          messageCount: c.messageCount,
          toolsUsed: c.toolsUsed,
          latestResultFileId: c.latestResultFileId,
          latestResultFileName: c.latestResultFileName,
          latestResultMimeType: c.latestResultMimeType,
        }));
        saveConversationsToLS([newItem, ...current]);
        setList(loadConversationsFromLS());
        return id;
      }
      const token = getToken();
      const { data } = await axios.post<{ _id: string }>(
        '/api/conversations',
        { title: safeTitle },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await refreshList();
      return String(data._id);
    },
    [isSignedIn, getToken, refreshList]
  );

  const getMessages = useCallback(
    async (conversationId: string): Promise<LoadedConversation> => {
      if (!isSignedIn || !getToken?.()) {
        const stored = loadMessagesFromLS(conversationId);
        const messages = stored.map((m) => storedToChatMessage(m, baseUrl));
        const latestResult = buildLatestResultFromMessages(stored, baseUrl);
        return { messages, latestResult };
      }
      const token = getToken();
      const { data } = await axios.get<{ messages: Array<Record<string, unknown>> }>(
        `/api/conversations/${conversationId}/messages`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const rawMessages = data.messages ?? [];
      const messages: ChatMessage[] = rawMessages.map((m: Record<string, unknown>) => {
        const tc = m.toolCall as Record<string, unknown> | undefined;
        const result: ToolResult | undefined =
          tc?.resultFileId && tc?.resultFileName && tc?.resultMimeType
            ? {
                fileId: String(tc.resultFileId),
                downloadUrl: `${baseUrl}/api/file/${tc.resultFileId}`,
                fileName: String(tc.resultFileName),
                mimeType: String(tc.resultMimeType),
                sizeBytes: Number(tc.resultSizeBytes ?? 0),
              }
            : undefined;
        return {
          id: String(m._id ?? m.id ?? crypto.randomUUID()),
          role: apiRoleToFrontend(String(m.role ?? 'assistant')),
          content: String(m.content ?? ''),
          timestamp: m.createdAt ? new Date(m.createdAt as string).getTime() : Date.now(),
          ...(result && { result }),
        };
      });
      const lastWithResult = [...rawMessages].reverse().find((m: Record<string, unknown>) => {
        const tc = m.toolCall as Record<string, unknown> | undefined;
        return tc?.resultFileId && tc?.resultFileName && tc?.resultMimeType;
      });
      let latestResult: ToolResult | null = null;
      if (lastWithResult) {
        const tc = lastWithResult.toolCall as Record<string, unknown>;
        latestResult = {
          fileId: String(tc.resultFileId),
          downloadUrl: `${baseUrl}/api/file/${tc.resultFileId}`,
          fileName: String(tc.resultFileName),
          mimeType: String(tc.resultMimeType),
          sizeBytes: Number(tc.resultSizeBytes ?? 0),
        };
      }
      return { messages, latestResult };
    },
    [isSignedIn, getToken, baseUrl]
  );

  const addMessage = useCallback(
    async (
      conversationId: string,
      payload: AddMessagePayload
    ): Promise<void> => {
      if (!isSignedIn || !getToken?.()) {
        const stored = loadMessagesFromLS(conversationId);
        const newMsg: StoredMessage = {
          id: crypto.randomUUID(),
          role: payload.role === 'corner' ? 'assistant' : payload.role,
          content: payload.content,
          timestamp: Date.now(),
          toolCall: payload.toolCall,
        };
        const next = [...stored, newMsg];
        saveMessagesToLS(conversationId, next);

        const listRaw = localStorage.getItem(LS_CONVERSATIONS_KEY);
        const conversations: StoredConversation[] = listRaw ? JSON.parse(listRaw) : [];
        const conv = conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.lastMessageAt = new Date().toISOString();
          conv.messageCount = next.length;
          if (payload.toolCall?.resultFileId) {
            conv.latestResultFileId = payload.toolCall.resultFileId;
            conv.latestResultFileName = payload.toolCall.resultFileName;
            conv.latestResultMimeType = payload.toolCall.resultMimeType;
          }
          if (payload.toolCall?.toolName && !conv.toolsUsed.includes(payload.toolCall.toolName)) {
            conv.toolsUsed = [...conv.toolsUsed, payload.toolCall.toolName];
          }
          saveConversationsToLS(conversations);
          setList(loadConversationsFromLS());
        }
        return;
      }
      const token = getToken();
      await axios.post(
        `/api/conversations/${conversationId}/messages`,
        {
          role: payload.role === 'corner' || payload.role === 'assistant' ? 'assistant' : payload.role,
          content: payload.content,
          attachments: payload.attachments ?? [],
          toolCall: payload.toolCall,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await refreshList();
    },
    [isSignedIn, getToken, refreshList]
  );

  const clearAll = useCallback(() => {
    if (isSignedIn && getToken?.()) return; // No API for bulk delete; leave list as-is
    try {
      const raw = localStorage.getItem(LS_CONVERSATIONS_KEY);
      const conversations: StoredConversation[] = raw ? JSON.parse(raw) : [];
      conversations.forEach((c) => {
        localStorage.removeItem(LS_MESSAGES_PREFIX + c.id + LS_MESSAGES_SUFFIX);
      });
      localStorage.removeItem(LS_CONVERSATIONS_KEY);
      setList([]);
    } catch {
      setList([]);
    }
  }, [isSignedIn, getToken]);

  return {
    list,
    listLoading,
    createConversation,
    getMessages,
    addMessage,
    refreshList,
    clearAll,
    getApiBase: () => baseUrl,
  };
}
