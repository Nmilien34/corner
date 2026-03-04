import { useState, useEffect } from 'react';
import { SavedSignature } from '../../types';
import SignatureCapture from './SignatureCapture';

type Step = 'welcome' | 'signature' | 'done';

interface Props {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');

  // Auto-close after "done" step
  useEffect(() => {
    if (step !== 'done') return;
    const t = setTimeout(() => {
      localStorage.setItem('corner:onboarding-complete', '1');
      onComplete();
    }, 1500);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  const handleSignatureSave = (sig: SavedSignature) => {
    localStorage.setItem('corner:signature', JSON.stringify(sig));
    setStep('done');
  };

  const handleSkip = () => {
    localStorage.setItem('corner:onboarding-complete', '1');
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(26, 23, 20, 0.45)', backdropFilter: 'blur(3px)' }}
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
      >
        {step === 'welcome' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div
              style={{
                width: 48,
                height: 48,
                border: '1.5px solid var(--accent)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--accent)' }}>C</span>
            </div>
            <div className="flex flex-col gap-2">
              <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)' }}>
                Welcome to Corner
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                The last tool you'll need for files.
              </p>
            </div>
            <button
              onClick={() => setStep('signature')}
              className="px-6 py-2.5 rounded-lg"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--canvas)',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Geist, sans-serif',
              }}
            >
              Get started →
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
                We'll use this automatically whenever you need to sign something.
              </p>
            </div>

            <SignatureCapture onSave={handleSignatureSave} />

            <button
              onClick={handleSkip}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Geist, sans-serif',
                textDecoration: 'underline',
                alignSelf: 'center',
              }}
            >
              Skip for now
            </button>
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
