import { useState, useEffect } from 'react';
import { Trash2, CreditCard, Sparkles, HelpCircle, Shield, BookOpen, GraduationCap, Keyboard, ChevronRight } from 'lucide-react';
import type { RightPanelSettings } from '../components/Layout/RightPanel';
import type { SavedSignature } from '../types';
import SignatureCapture from '../components/Onboarding/SignatureCapture';
import { getTheme, setTheme, type Theme } from '../lib/theme';
import { getChatFont, setChatFont, type ChatFont } from '../lib/chatFont';

interface Props {
  settings: RightPanelSettings;
  onSettingsChange: (patch: Partial<RightPanelSettings>) => void;
}

function loadSignature(): SavedSignature | null {
  try {
    const raw = localStorage.getItem('corner:signature');
    if (!raw) return null;
    return JSON.parse(raw) as SavedSignature;
  } catch {
    return null;
  }
}

const cardStyle = {
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--white)',
  overflow: 'hidden' as const,
  boxShadow: 'var(--shadow-xs)',
};

const rowStyle = {
  padding: '18px 44px',
  borderTop: '1px solid var(--border)',
};

const firstRowStyle = {
  ...rowStyle,
  borderTop: 'none',
};

export default function SettingsPage({ settings, onSettingsChange }: Props) {
  const [currentSignature, setCurrentSignature] = useState<SavedSignature | null>(null);
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [chatFont, setChatFontState] = useState<ChatFont>(() => getChatFont());

  useEffect(() => {
    setCurrentSignature(loadSignature());
  }, []);

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
    setThemeState(value);
  };
  const handleChatFontChange = (value: ChatFont) => {
    setChatFont(value);
    setChatFontState(value);
  };

  const handleSaveSignature = (sig: SavedSignature) => {
    localStorage.setItem('corner:signature', JSON.stringify(sig));
    setCurrentSignature(sig);
    setShowSignatureEditor(false);
  };

  const handleDeleteSignature = () => {
    localStorage.removeItem('corner:signature');
    setCurrentSignature(null);
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const sig: SavedSignature = {
        dataUrl,
        initialsDataUrl: dataUrl,
        method: 'upload',
        createdAt: Date.now(),
      };
      localStorage.setItem('corner:signature', JSON.stringify(sig));
      setCurrentSignature(sig);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-auto"
      style={{ background: 'var(--canvas)' }}
    >
      {/* Main content */}
      <div
        className="flex-1 flex justify-center overflow-auto"
        style={{ padding: '32px 24px 400px' }}
      >
        <div className="w-full max-w-[560px] flex flex-col">
          {/* Page title */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              Tweak how Corner behaves on this device.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* ─── Appearance ─── */}
            <section>
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Appearance
              </h2>
              <div style={cardStyle}>
                <div style={{ padding: '20px 44px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Theme
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['light', 'auto', 'dark'] as const).map((value) => {
                      const isActive = theme === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleThemeChange(value)}
                          style={{
                            padding: '10px 24px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 500,
                            border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                            background: isActive ? 'var(--hover)' : 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {value === 'light' ? 'Light' : value === 'auto' ? 'Auto' : 'Dark'}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
                    Auto follows your system light/dark preference.
                  </p>
                </div>
                <div style={rowStyle}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Chat font
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(
                      [
                        { value: 'default' as const, label: 'Default' },
                        { value: 'sans' as const, label: 'Sans' },
                        { value: 'system' as const, label: 'System' },
                        { value: 'dyslexic' as const, label: 'Dyslexic friendly' },
                      ] as const
                    ).map(({ value, label }) => {
                      const isActive = chatFont === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleChatFontChange(value)}
                          style={{
                            padding: '10px 24px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 500,
                            border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                            background: isActive ? 'var(--hover)' : 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Behavior ─── */}
            <section>
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Behavior
              </h2>
              <div style={cardStyle}>
                <div style={firstRowStyle} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      Auto-download result
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Skip the download button when a tool finishes.
                    </div>
                  </div>
                  <Toggle
                    checked={settings.autoDownload ?? false}
                    onChange={() => onSettingsChange({ autoDownload: !(settings.autoDownload ?? false) })}
                  />
                </div>
                <div style={rowStyle} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      Strip metadata by default
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Remove EXIF and other metadata on image exports.
                    </div>
                  </div>
                  <Toggle
                    checked={settings.stripMetadataDefault ?? false}
                    onChange={() =>
                      onSettingsChange({ stripMetadataDefault: !(settings.stripMetadataDefault ?? false) })
                    }
                  />
                </div>
              </div>
            </section>

            {/* ─── Signature ─── */}
            <section>
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Signature
              </h2>
              <div style={cardStyle}>
                <div style={{ padding: '20px 44px' }}>
                  {currentSignature ? (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Your saved signature
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <img
                        src={currentSignature.dataUrl}
                        alt="Your signature"
                        style={{
                          maxHeight: 56,
                          maxWidth: 200,
                          objectFit: 'contain',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--canvas)',
                        }}
                      />
                      {currentSignature.initialsDataUrl !== currentSignature.dataUrl && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                            Initials
                          </div>
                          <img
                            src={currentSignature.initialsDataUrl}
                            alt="Initials"
                            style={{
                              maxHeight: 32,
                              maxWidth: 80,
                              objectFit: 'contain',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              background: 'var(--canvas)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3" style={{ marginTop: 16 }}>
                      <SettingsButton variant="secondary" onClick={() => setShowSignatureEditor(true)}>
                        Edit
                      </SettingsButton>
                      <SettingsButton variant="danger" onClick={handleDeleteSignature}>
                        <Trash2 size={14} strokeWidth={1.5} />
                        Delete
                      </SettingsButton>
                      <label className="cursor-pointer">
                        <span
                          className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border border-(--border) bg-(--white) text-(--text-primary) hover:bg-(--hover) hover:border-(--text-muted)/30 transition-all duration-150 ease-out"
                          style={{ minHeight: 36, padding: '10px 24px' }}
                        >
                          Upload new
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadSignature}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                        No signature saved. Add one to sign documents.
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <SettingsButton variant="primary" onClick={() => setShowSignatureEditor(true)}>
                          Add signature
                        </SettingsButton>
                        <label className="cursor-pointer">
                          <span
                          className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border border-(--border) bg-(--white) text-(--text-primary) hover:bg-(--hover) hover:border-(--text-muted)/30 transition-all duration-150 ease-out"
                          style={{ minHeight: 36, padding: '10px 24px' }}
                        >
                            Upload image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSignature}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ─── Billing ─── */}
            <section>
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Billing
              </h2>
              <div style={cardStyle}>
                <div style={firstRowStyle} className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      <CreditCard size={14} strokeWidth={1.5} />
                      Current plan
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                      Free: all tools, limited AI and limited pages per document. Pay as you go for
                      extra AI or extra pages (cents). Or upgrade to Premium for unlimited usage.
                    </p>
                  </div>
                  <span
                    className="shrink-0"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'var(--hover)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Free
                  </span>
                </div>
                <div style={rowStyle}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Upgrade to Premium
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                    Unlimited AI and document pages. $9/month or $98/year (save when you pay yearly).
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold border-0 cursor-not-allowed opacity-80"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--white)',
                        minHeight: 40,
                        padding: '10px 24px',
                      }}
                      title="Stripe checkout coming soon"
                    >
                      <Sparkles size={16} strokeWidth={1.5} />
                      $9/month
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold border-2 border-(--border) bg-(--white) text-(--text-primary) cursor-not-allowed opacity-80 hover:bg-(--white) hover:border-(--border)"
                      style={{ minHeight: 40, padding: '10px 24px' }}
                      title="Stripe checkout coming soon"
                    >
                      $98/year
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                    Billing and subscription management will be available after Stripe is set up.
                  </p>
                </div>
              </div>
            </section>

            {/* ─── Help & support ─── */}
            <section>
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Help & support
              </h2>
              <div style={cardStyle}>
                {[
                  { icon: HelpCircle, label: 'Get help / support', href: '#', description: 'Contact us or browse FAQs' },
                  { icon: Shield, label: 'Privacy policy', href: '#', description: 'How we handle your data' },
                  { icon: BookOpen, label: 'Tutorials', href: '#', description: 'Step-by-step guides' },
                  { icon: GraduationCap, label: 'Courses', href: '#', description: 'Learn Corner in depth' },
                  { icon: Keyboard, label: 'Keyboard shortcuts', href: '#', description: 'Speed up your workflow' },
                ].map(({ icon: Icon, label, href, description }, i) => (
                  <a
                    key={label}
                    href={href}
                    onClick={(e) => e.preventDefault()}
                    style={{
                      ...(i === 0 ? firstRowStyle : rowStyle),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                    className="hover:bg-(--hover) transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={18} strokeWidth={1.5} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div className="min-w-0">
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </section>

            {/* Spacer so there's plenty of scroll space below the last card */}
            <div style={{ minHeight: 360 }} aria-hidden />
          </div>
        </div>
      </div>

      {/* Signature editor overlay */}
      {showSignatureEditor && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(26, 23, 20, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowSignatureEditor(false)}
        >
          <div
            style={{
              width: 480,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              ...cardStyle,
              boxShadow: 'var(--shadow-realistic)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {currentSignature ? 'Edit signature' : 'Add signature'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSignatureEditor(false)}
                className="flex items-center justify-center rounded-lg w-9 h-9 border-0 cursor-pointer text-(--text-muted) hover:bg-(--hover) hover:text-(--text-primary) transition-colors"
                aria-label="Cancel"
              >
                ×
              </button>
            </div>
            <SignatureCapture onNext={handleSaveSignature} />
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="shrink-0 w-9 h-5 rounded-full border border-(--border) flex items-center transition-[background,justify-content] duration-150 ease-out"
      style={{
        background: checked ? 'var(--accent)' : 'var(--white)',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        padding: 2,
      }}
    >
      <span
        className="w-4 h-4 rounded-full shrink-0"
        style={{
          background: checked ? 'var(--white)' : 'var(--border)',
        }}
      />
    </button>
  );
}

function SettingsButton({
  variant = 'secondary',
  onClick,
  children,
}: {
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border cursor-pointer transition-all duration-150 ease-out font-[inherit]';
  const styles = {
    primary:
      'border-transparent bg-(--text-primary) text-(--white) hover:opacity-90 active:opacity-95',
    secondary:
      'border border-(--border) bg-(--white) text-(--text-primary) hover:bg-(--hover) hover:border-(--text-muted)/30 active:bg-(--border)',
    danger:
      'border border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 active:bg-red-800',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${styles[variant]}`}
      style={{ minHeight: 36, paddingLeft: 24, paddingRight: 24, paddingTop: 10, paddingBottom: 10 }}
    >
      {children}
    </button>
  );
}
