import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Folder, ChevronRight, Trash2 } from 'lucide-react';
import type { Folder as FolderType } from '../types';

const cardStyle = {
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--white)',
  overflow: 'hidden' as const,
  boxShadow: 'var(--shadow-xs)',
};

interface Props {
  folders: FolderType[];
  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => Promise<void>;
  conversationCountByFolderId: (folderId: string) => number;
}

export default function FoldersPage({
  folders,
  createFolder,
  renameFolder,
  deleteFolder,
  conversationCountByFolderId,
}: Props) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newFolderId, setNewFolderId] = useState<string | null>(null);

  const handleCreate = () => {
    const id = createFolder('New folder');
    if (id) {
      setNewFolderId(id);
      setEditingId(id);
      setEditingName('New folder');
    }
  };

  const handleBlur = (folderId: string, currentName: string) => {
    const name = editingName.trim().slice(0, 100) || 'New folder';
    renameFolder(folderId, name);
    setEditingId(null);
    if (folderId === newFolderId) setNewFolderId(null);
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-auto"
      style={{ background: 'var(--canvas)' }}
    >
      <div
        className="flex-1 flex justify-center overflow-auto"
        style={{ padding: '32px 24px 48px' }}
      >
        <div className="w-full max-w-[560px] flex flex-col">
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Folders
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Group conversations into folders. Click a folder to open it.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 w-full rounded-xl border border-(--border) bg-(--white) hover:bg-(--hover) transition-colors text-left"
              style={{
                padding: '14px 16px',
                fontSize: 13,
                color: 'var(--text-muted)',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <FolderPlus size={18} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
              New folder
            </button>
          </div>

          <div style={cardStyle}>
            {folders.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                No folders yet. Create one to get started.
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {folders.map((folder) => {
                  const isEditing = editingId === folder.id;
                  const count = conversationCountByFolderId(folder.id);
                  return (
                    <div
                      key={folder.id}
                      style={{
                        borderTop: folder.id === folders[0]?.id ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="flex items-center gap-3"
                        style={{
                          padding: '12px 16px',
                          minHeight: 52,
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleBlur(folder.id, folder.name)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                            autoFocus
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '6px 10px',
                              fontSize: 13,
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              background: 'var(--white)',
                              color: 'var(--text-primary)',
                              fontFamily: 'inherit',
                            }}
                          />
                        ) : (
                          <>
                            <Folder
                              size={18}
                              strokeWidth={1.5}
                              style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                            />
                            <button
                              type="button"
                              onClick={() => navigate(`/folders/${folder.id}`)}
                              className="flex-1 min-w-0 flex items-center gap-2 text-left"
                              style={{
                                border: 'none',
                                background: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              <span
                                className="truncate"
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {folder.name}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-muted)',
                                  flexShrink: 0,
                                }}
                              >
                                {count} {count === 1 ? 'conversation' : 'conversations'}
                              </span>
                              <ChevronRight size={16} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(folder.id);
                                setEditingName(folder.name);
                              }}
                              style={{
                                padding: '6px 8px',
                                border: 'none',
                                background: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--hover)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFolder(folder.id)}
                              aria-label="Delete folder"
                              style={{
                                padding: 6,
                                border: 'none',
                                background: 'none',
                                borderRadius: 6,
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--hover)';
                                e.currentTarget.style.color = '#dc2626';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
