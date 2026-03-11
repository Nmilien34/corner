import { useState, useCallback, useEffect } from 'react';
import type { Folder } from '../types';

const LS_FOLDERS_KEY = 'corner:folders';

function loadFoldersFromLS(): Folder[] {
  try {
    const raw = localStorage.getItem(LS_FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Folder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFoldersToLS(folders: Folder[]): void {
  try {
    localStorage.setItem(LS_FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    console.warn('corner: could not persist folders to localStorage');
  }
}

export interface UseFoldersOptions {
  /** Called when assigning a conversation to a folder (or clearing). Required for assignConversationToFolder. */
  updateConversation: (
    conversationId: string,
    patch: { folderId?: string | null }
  ) => Promise<void>;
  /** Full conversation list; used by deleteFolder to clear folderId on affected conversations. */
  conversationIdsInFolder: (folderId: string) => string[];
}

export function useFolders(options: UseFoldersOptions) {
  const { updateConversation, conversationIdsInFolder } = options;
  const [folders, setFolders] = useState<Folder[]>(() => loadFoldersFromLS());

  useEffect(() => {
    setFolders(loadFoldersFromLS());
  }, []);

  const persist = useCallback((next: Folder[]) => {
    setFolders(next);
    saveFoldersToLS(next);
  }, []);

  const createFolder = useCallback(
    (name: string): string => {
      const trimmed = name.trim().slice(0, 100) || 'New folder';
      const id = crypto.randomUUID();
      const next: Folder[] = [
        ...loadFoldersFromLS(),
        { id, name: trimmed, createdAt: Date.now() },
      ];
      persist(next);
      return id;
    },
    [persist]
  );

  const renameFolder = useCallback(
    (id: string, name: string): void => {
      const trimmed = name.trim().slice(0, 100) || 'New folder';
      const next = loadFoldersFromLS().map((f) =>
        f.id === id ? { ...f, name: trimmed } : f
      );
      persist(next);
    },
    [persist]
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<void> => {
      const idsToClear = conversationIdsInFolder(id);
      for (const conversationId of idsToClear) {
        await updateConversation(conversationId, { folderId: null });
      }
      const next = loadFoldersFromLS().filter((f) => f.id !== id);
      persist(next);
    },
    [persist, updateConversation, conversationIdsInFolder]
  );

  const assignConversationToFolder = useCallback(
    async (conversationId: string, folderId: string | null): Promise<void> => {
      await updateConversation(conversationId, { folderId });
    },
    [updateConversation]
  );

  return {
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    assignConversationToFolder,
  };
}
