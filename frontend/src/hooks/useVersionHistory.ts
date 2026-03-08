import { useState, useEffect } from 'react';
import type { VersionNode } from '../types';

const STORAGE_KEY = 'corner:version-history';
const MAX_NODES = 20;

function loadFromStorage(): VersionNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VersionNode[];
    // Rehydrate Date objects — JSON.parse turns them into strings
    return parsed.map((node) => ({
      ...node,
      timestamp: new Date(node.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(nodes: VersionNode[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch {
    // localStorage full or unavailable — fail silently
    console.warn('corner: could not persist version history');
  }
}

export function useVersionHistory() {
  const [nodes, setNodes] = useState<VersionNode[]>(loadFromStorage);

  // Sync to localStorage whenever nodes change
  useEffect(() => {
    saveToStorage(nodes);
  }, [nodes]);

  function addNode(label: string, fileSnapshot?: Blob, downloadUrl?: string, operation?: string): VersionNode {
    const newNode: VersionNode = {
      id: crypto.randomUUID(),
      label,
      timestamp: new Date(),
      status: 'complete',
      fileSnapshot,
      downloadUrl,
      isCurrent: true,
      operation,
    };

    setNodes((prev) => {
      const updated = prev.map((n) => ({ ...n, isCurrent: false }));
      return [...updated, newNode].slice(-MAX_NODES);
    });

    return newNode;
  }

  function updateNode(id: string, patch: Partial<VersionNode>) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function restoreNode(id: string): VersionNode | null {
    setNodes((prev) => prev.map((n) => ({ ...n, isCurrent: n.id === id })));
    return nodes.find((n) => n.id === id) ?? null;
  }

  function clearHistory() {
    setNodes([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const currentNode = nodes.findLast((n) => n.isCurrent) ?? null;

  return { nodes, currentNode, addNode, updateNode, restoreNode, clearHistory };
}
