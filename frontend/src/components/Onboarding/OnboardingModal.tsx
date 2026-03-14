import { useState, useEffect } from 'react';
import type { SavedSignature } from '../../types';
import SignatureCapture from './SignatureCapture';
import { toast } from '../../hooks/use-toast';

type Step = 'welcome' | 'signature' | 'signature_review' | 'done';
type AuthMode = 'register' | 'login';

interface Props {
  onComplete: () => void;
  onRegister?: (email: string, password: string, displayName: string) => Promise<void>;
  onLogin?: (email: string, password: string) => Promise<void>;
}

function IconGoogle({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  border: '1px solid var(--border)',
  background: 'var(--white)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'Geist, sans-serif',
  borderRadius: 8,
  width: '100%',
  outline: 'none',
};

export default function OnboardingModal({ onComplete, onRegister, onLogin }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [pendingSignature, setPendingSignature] = useState<SavedSignature | null>(null);
  const [countdown, setCountdown] = useState(3);

  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Auto-close after "done" step
  useEffect(() => {
    if (step !== 'done') return;
    const t = setTimeout(() => {
      localStorage.setItem('corner:onboarding-complete', '1');
      onComplete();
    }, 1500);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  // 3-second countdown when entering signature_review
  useEffect(() => {
    if (step !== 'signature_review' || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  const handleNextFromSignature = (sig: SavedSignature) => {
    setPendingSignature(sig);
    setCountdown(3);
    setStep('signature_review');
  };

  const handleSignatureSave = (sig: SavedSignature) => {
    localStorage.setItem('corner:signature', JSON.stringify(sig));
    setStep('done');
  };

  const handleSkip = () => {
    localStorage.setItem('corner:onboarding-complete', '1');
    onComplete();
  };

  const handleContinueToSignature = () => setStep('signature');

  const handleClose = () => {
    localStorage.setItem('corner:onboarding-complete', '1');
    onComplete();
  };

  const handleGoogleSignIn = () => {
    toast({
      title: 'Coming soon',
      description: 'Google sign-in is on the way!',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'register') {
      if (!displayName.trim()) {
        setAuthError('Please enter your name.');
        return;
      }
      if (password.length < 8) {
        setAuthError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    if (!email.trim() || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === 'register' && onRegister) {
        await onRegister(email.trim(), password, displayName.trim());
        handleContinueToSignature();
      } else if (authMode === 'login' && onLogin) {
        await onLogin(email.trim(), password);
        handleClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'EMAIL_EXISTS') {
        setAuthError('This email is already registered.');
      } else if (msg === 'USER_NOT_FOUND') {
        setAuthError('USER_NOT_FOUND');
      } else if (msg === 'INVALID_CREDENTIALS') {
        setAuthError('Incorrect password.');
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26, 23, 20, 0.45)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '480px',
          maxHeight: '90vh',
          borderRadius: 16,
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
          overflow: 'auto',
          padding: '36px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Auth / welcome step ─────────────────────────────────────────── */}
        {step === 'welcome' && (
          <>
            {/* Close (X) button */}
            <button
              type="button"
              onClick={handleClose}
              title="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col w-full" style={{ maxWidth: 400, margin: '0 auto' }}>
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src="/CornerLogo.svg"
                  alt="Corner"
                  style={{ height: 32, width: 'auto' }}
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                    const fallback = el.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  style={{
                    display: 'none',
                    width: 40,
                    height: 40,
                    border: '1.5px solid var(--accent)',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)', fontFamily: 'Geist, sans-serif' }}>C</span>
                </div>
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'Geist, sans-serif',
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {authMode === 'register' ? 'Welcome to the Corner of the internet' : 'Welcome back'}
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginBottom: 24,
                  lineHeight: 1.45,
                }}
              >
                {authMode === 'register'
                  ? 'Your one-stop shop for document work — conversion, compression, signature, and more. Sign up to get started!'
                  : 'Sign in to pick up where you left off.'}
              </p>

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 rounded-lg transition-colors duration-150"
                style={{
                  height: 44,
                  padding: '0 16px',
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'Geist, sans-serif',
                  cursor: authLoading ? 'wait' : 'pointer',
                }}
              >
                <IconGoogle size={20} />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-5">
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span
                  style={{
                    padding: '0 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontFamily: 'Geist, sans-serif',
                  }}
                >
                  or
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {/* Auth form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {authMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={authLoading}
                    style={inputStyle}
                    autoComplete="name"
                  />
                )}

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authLoading}
                  style={inputStyle}
                  autoComplete="email"
                />

                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  style={inputStyle}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                />

                {authMode === 'register' && (
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={authLoading}
                    style={inputStyle}
                    autoComplete="new-password"
                  />
                )}

                {/* Error message */}
                {authError && (
                  <p style={{ fontSize: 13, color: '#c0392b', fontFamily: 'Geist, sans-serif', margin: '2px 0 0' }}>
                    {authError === 'USER_NOT_FOUND' ? (
                      <>
                        No account found with this email.{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('register')}
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontFamily: 'Geist, sans-serif', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                        >
                          Sign up instead
                        </button>
                      </>
                    ) : (
                      <>
                        {authError}
                        {authError.includes('already registered') && authMode === 'register' && (
                          <>
                            {' '}
                            <button
                              type="button"
                              onClick={() => switchMode('login')}
                              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontFamily: 'Geist, sans-serif', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                            >
                              Sign in instead
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-lg transition-colors duration-150"
                  style={{
                    height: 44,
                    background: 'var(--accent)',
                    color: 'var(--white)',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'Geist, sans-serif',
                    cursor: authLoading ? 'wait' : 'pointer',
                    marginTop: 4,
                  }}
                >
                  {authLoading
                    ? authMode === 'register' ? 'Creating account…' : 'Signing in…'
                    : authMode === 'register' ? 'Create account' : 'Sign in'}
                </button>
              </form>

              {/* Mode toggle */}
              <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'Geist, sans-serif' }}>
                {authMode === 'register' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      disabled={authLoading}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontFamily: 'Geist, sans-serif', cursor: authLoading ? 'wait' : 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      disabled={authLoading}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontFamily: 'Geist, sans-serif', cursor: authLoading ? 'wait' : 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Create one
                    </button>
                  </>
                )}
              </p>

              {/* Continue without account */}
              <button
                type="button"
                onClick={handleContinueToSignature}
                disabled={authLoading}
                style={{
                  marginTop: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontFamily: 'Geist, sans-serif',
                  cursor: authLoading ? 'wait' : 'pointer',
                  textDecoration: 'underline',
                  alignSelf: 'center',
                }}
              >
                Continue without account
              </button>
            </div>
          </>
        )}

        {/* ── Signature step ──────────────────────────────────────────────── */}
        {step === 'signature' && (
          <>
            {/* Close (X) button */}
            <button
              type="button"
              onClick={handleClose}
              title="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col gap-5">
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Save your signature
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                  We'll use this automatically whenever you need to sign something. You can draw, type, or upload an image of your signature.
                </p>
              </div>

              <SignatureCapture onNext={handleNextFromSignature} />

              <button
                onClick={handleSkip}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Geist, sans-serif',
                  textDecoration: 'underline',
                  alignSelf: 'center',
                  marginTop: 16,
                }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {/* ── Signature review step ───────────────────────────────────────── */}
        {step === 'signature_review' && pendingSignature && (
          <>
            {/* Close (X) button */}
            <button
              type="button"
              onClick={handleClose}
              title="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col gap-6">
              {countdown > 0 ? (
                <>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.5 }}>
                    Your signature is something that's very important — take a moment to breathe.
                  </p>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent)', fontFamily: 'Geist, sans-serif' }}>
                      {countdown}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', textAlign: 'center' }}>
                    Here's your signature. Do you want to edit it?
                  </p>
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--white)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 80,
                    }}
                  >
                    <img
                      src={pendingSignature.dataUrl}
                      alt="Your signature"
                      style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => { setStep('signature'); setPendingSignature(null); }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: 'var(--canvas)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: 'Geist, sans-serif',
                        cursor: 'pointer',
                        transition: '150ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--canvas)'; }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSignatureSave(pendingSignature)}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 999,
                        border: 'none',
                        background: 'var(--text-primary)',
                        color: 'var(--white)',
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: 'Geist, sans-serif',
                        cursor: 'pointer',
                        transition: '150ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      Looks good, continue
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Done step ───────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)' }}>
              You're set.
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Drop a file or describe what you need.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
