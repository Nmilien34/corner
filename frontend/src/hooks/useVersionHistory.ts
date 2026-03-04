import { useState, useCallback } from 'react';
import { VersionNode, ToolResult } from '../types';

const STORAGE_KEY = 'corner:versions';
const MAX_VERSIONS = 20;

function loadFromStorage(): VersionNode[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(versions: VersionNode[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  } catch {
    // sessionStorage quota exceeded — ignore
  }
}

export function useVersionHistory() {
  const [versions, setVersions] = useState<VersionNode[]>(loadFromStorage);

  const addVersion = useCallback((result: ToolResult, toolName: string, label: string) => {
    setVersions((prev) => {
      const next = prev.map((v) => ({ ...v, isCurrent: false }));
      const node: VersionNode = {
        id: result.fileId,
        label,
        toolName,
        timestamp: Date.now(),
        status: 'complete',
        fileId: result.fileId,
        fileUrl: result.downloadUrl,
        isCurrent: true,
      };
      const updated = [node, ...next].slice(0, MAX_VERSIONS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const restoreVersion = useCallback((id: string) => {
    setVersions((prev) => {
      const updated = prev.map((v) => ({ ...v, isCurrent: v.id === id }));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { versions, addVersion, restoreVersion };
}
