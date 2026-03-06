import type { RightPanelSettings } from './RightPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: RightPanelSettings;
  onSettingsChange: (patch: Partial<RightPanelSettings>) => void;
}

export default function SettingsModal({ open, onClose, settings, onSettingsChange }: Props) {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(26, 23, 20, 0.35)', backdropFilter: 'blur(3px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="flex flex-col"
        style={{
          width: 420,
          maxWidth: '90vw',
          maxHeight: '80vh',
          background: 'var(--canvas)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-realistic)',
          padding: 20,
          fontFamily: 'Geist, sans-serif',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 12 }}
        >
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Settings
            </h2>
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 2,
              }}
            >
              Tweak how Corner behaves on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 14,
            }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div
          className="flex-1 overflow-auto right-panel-scroll"
          style={{ paddingTop: 8, paddingBottom: 8 }}
        >
          {/* Behavior */}
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Behavior
            </span>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 12,
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-primary)' }}>Auto-download result</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  Skip the download button when a tool finishes.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSettingsChange({ autoDownload: !(settings.autoDownload ?? false) })
                }
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: settings.autoDownload ? 'var(--accent)' : 'var(--white)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: settings.autoDownload ? 'flex-end' : 'flex-start',
                  transition: 'background 150ms ease, justify-content 150ms ease',
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: settings.autoDownload ? 'var(--white)' : 'var(--border)',
                  }}
                />
              </button>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: 12,
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-primary)' }}>Strip metadata by default</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  Remove EXIF and other metadata on image exports.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSettingsChange({
                    stripMetadataDefault: !(settings.stripMetadataDefault ?? false),
                  })
                }
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: settings.stripMetadataDefault ? 'var(--accent)' : 'var(--white)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: settings.stripMetadataDefault ? 'flex-end' : 'flex-start',
                  transition: 'background 150ms ease, justify-content 150ms ease',
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: settings.stripMetadataDefault ? 'var(--white)' : 'var(--border)',
                  }}
                />
              </button>
            </label>
          </div>
        </div>

        <div
          className="flex justify-end gap-2"
          style={{ paddingTop: 8, marginTop: 4 }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'none',
              fontSize: 12,
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

