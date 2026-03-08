import { useState, useEffect } from 'react';
import type { SavedSignature } from '../../types';
import SignatureCapture from './SignatureCapture';

type Step = 'welcome' | 'signature' | 'signature_review' | 'done';

interface Props {
  onComplete: () => void;
  onSignInWithGoogle?: () => void | Promise<void>;
  onSignInWithEmail?: (email: string) => void | Promise<void>;
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

export default function OnboardingModal({ onComplete, onSignInWithGoogle, onSignInWithEmail }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [pendingSignature, setPendingSignature] = useState<SavedSignature | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [email, setEmail] = useState('');
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
    if (step !== 'signature_review' || countdown < 0) return;
    if (countdown === 0) return; // stay at 0, don't go negative
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

  const handleSignInWithGoogle = async () => {
    if (onSignInWithGoogle) {
      setAuthLoading(true);
      try {
        await onSignInWithGoogle();
        handleContinueToSignature();
      } finally {
        setAuthLoading(false);
      }
    } else {
      handleContinueToSignature();
    }
  };

  const handleContinueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignInWithEmail && email.trim()) {
      setAuthLoading(true);
      try {
        await onSignInWithEmail(email.trim());
        handleContinueToSignature();
      } finally {
        setAuthLoading(false);
      }
    } else {
      handleContinueToSignature();
    }
  };

  const handleClose = () => {
    localStorage.setItem('corner:onboarding-complete', '1');
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(26, 23, 20, 0.45)', backdropFilter: 'blur(3px)' }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
    >
      <div
        className="relative flex flex-col rounded-xl"
        style={{
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          width: 480,
          padding: '36px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close (X) button — always visible */}
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
        {step === 'welcome' && (
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
              Welcome to Corner
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
              Create an account or sign in to save your work and sync across devices.
            </p>
            {/* Sign in with Google */}
            <button
              type="button"
              onClick={handleSignInWithGoogle}
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
              Sign in with Google
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
            {/* Continue with email */}
            <form onSubmit={handleContinueWithEmail} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authLoading}
                className="w-full rounded-lg outline-none transition-colors duration-150"
                style={{
                  height: 44,
                  padding: '0 14px',
                  border: '1px solid var(--border)',
                  background: 'var(--white)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: 'Geist, sans-serif',
                }}
              />
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
                }}
              >
                Continue with email
              </button>
            </form>
            {/* Continue without account */}
            <button
              type="button"
              onClick={handleContinueToSignature}
              disabled={authLoading}
              style={{
                marginTop: 20,
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
        )}

        {step === 'signature' && (
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
        )}

        {step === 'signature_review' && pendingSignature && (
          <div className="flex flex-col gap-6">
            {countdown > 0 ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.5 }}>
                  Your signature is something that's very important — take a moment to breathe.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
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
                    onClick={() => {
                      setStep('signature');
                      setPendingSignature(null);
                    }}
                    className="px-4 py-2.5 rounded-lg"
                    style={{
                      background: 'none',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleSignatureSave(pendingSignature)}
                    className="px-4 py-2.5 rounded-lg"
                    style={{
                      background: 'var(--text-primary)',
                      color: 'var(--canvas)',
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    Looks good, continue
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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
