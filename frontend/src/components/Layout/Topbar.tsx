import { useState, useRef, useEffect } from 'react';
import { Share2, Download, PanelLeft, FolderPlus, ChevronDown, type LucideIcon } from 'lucide-react';
import type { Folder } from '../../types';

function IconBtn({ Icon }: { Icon: LucideIcon }) {
  return (
    <button
      className="flex items-center justify-center transition-all duration-200 ease-out"
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

interface Props {
  fileName?: string;
  /** When true, show a button to open the left panel (e.g. when panel is collapsed) */
  showOpenLeftPanel?: boolean;
  onOpenLeftPanel?: () => void;
  /** When set, show "Add to folder" dropdown */
  currentConversationId?: string | null;
  /** Current folder id for this conversation (if any) */
  currentFolderId?: string | null;
  folders?: Folder[];
  onAssignToFolder?: (conversationId: string, folderId: string | null) => void;
}

export default function Topbar({
  fileName,
  showOpenLeftPanel,
  onOpenLeftPanel,
  currentConversationId,
  currentFolderId,
  folders = [],
  onAssignToFolder,
}: Props) {
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folderDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFolderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [folderDropdownOpen]);

  const currentFolderName = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)?.name
    : null;

  return (
    <header
      className="flex items-center justify-between pr-4 shrink-0"
      style={{
        height: 40,
        minHeight: 40,
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ marginLeft: 5 }}
      >
        {showOpenLeftPanel && onOpenLeftPanel && (
          <button
            type="button"
            onClick={onOpenLeftPanel}
            aria-label="Open sidebar"
            className="flex items-center justify-center transition-all duration-200 ease-out"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <PanelLeft size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {fileName ? (
        <span
          className="truncate max-w-[40%]"
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {fileName}
        </span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }} />
      )}

      <div className="flex items-center gap-1">
        {currentConversationId && onAssignToFolder && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setFolderDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 transition-all duration-200 ease-out"
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--white)',
                fontSize: 11,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--white)';
              }}
            >
              <FolderPlus size={12} strokeWidth={1.5} />
              {currentFolderName ? (
                <span className="truncate max-w-[100px]" title={currentFolderName}>
                  {currentFolderName}
                </span>
              ) : (
                <span>Add to folder</span>
              )}
              <ChevronDown size={12} strokeWidth={1.5} />
            </button>
            {folderDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  minWidth: 160,
                  maxWidth: 220,
                  maxHeight: 280,
                  overflowY: 'auto',
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: 'var(--shadow-md)',
                  padding: 4,
                  zIndex: 50,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onAssignToFolder(currentConversationId, null);
                    setFolderDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: 6,
                    background: currentFolderId == null ? 'var(--hover)' : 'transparent',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (currentFolderId != null) e.currentTarget.style.background = 'var(--hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentFolderId != null) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  No folder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      onAssignToFolder(currentConversationId, folder.id);
                      setFolderDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: 6,
                      background: currentFolderId === folder.id ? 'var(--hover)' : 'transparent',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      if (currentFolderId !== folder.id) e.currentTarget.style.background = 'var(--hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (currentFolderId !== folder.id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-0">
          <IconBtn Icon={Share2} />
          <IconBtn Icon={Download} />
        </div>
      </div>
    </header>
  );
}
