import Lottie from 'lottie-react';
import animationData from '../assets/Scene-1-Cinematic.json';

interface Props {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function LandingPage({ onGetStarted, onSkip }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        width: '100vw',
        height: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        overflow: 'auto',
      }}
    >
      {/* Logo — top left */}
      <div
        style={{
          position: 'fixed',
          top: 28,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <img src="/CornerLogo.svg" alt="Corner" style={{ width: 28, height: 28 }} />
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          Corner
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: '52px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          textAlign: 'center',
          margin: 0,
          marginBottom: 10,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        Welcome to Corner
      </h1>

      {/* Subheadline */}
      <p
        style={{
          fontSize: '18px',
          color: 'var(--accent)',
          fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          textAlign: 'center',
          margin: 0,
          marginBottom: 36,
          fontWeight: 500,
          letterSpacing: '-0.02em',
        }}
      >
        Your one stop shop for all document work
      </p>

      {/* Lottie animation */}
      <div style={{ width: '100%', maxWidth: 820, marginBottom: 36 }}>
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          maxWidth: 560,
          marginBottom: 28,
        }}
      >
        {[
          'Convert PDFs',
          'Sign contracts',
          'Transcribe audio',
          'Compress files',
          'Remove backgrounds',
          'Generate QR codes',
          'OCR',
          'Watermark',
          'Merge & split',
        ].map((feature) => (
          <span
            key={feature}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--canvas)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Punchy tagline */}
      <p
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          textAlign: 'center',
          maxWidth: 440,
          lineHeight: 1.35,
          margin: 0,
          marginBottom: 44,
          letterSpacing: '-0.03em',
        }}
      >
        No more 20 tabs for 20 workflows.{' '}
        <span style={{ color: 'var(--accent)' }}>One AI handles everything.</span>
      </p>

      {/* CTA button */}
      <button
        type="button"
        onClick={onGetStarted}
        style={{
          padding: '13px 52px',
          background: 'var(--text-primary)',
          color: 'var(--bg)',
          border: 'none',
          borderRadius: 10,
          fontSize: '16px',
          fontWeight: 500,
          fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          cursor: 'pointer',
          transition: '150ms ease',
          letterSpacing: '0.01em',
          marginBottom: 16,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; }}
      >
        Get started →
      </button>

      {/* Skip link */}
      <button
        type="button"
        onClick={onSkip}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontSize: '13px',
          fontFamily: "'Geist', 'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: 0,
        }}
      >
        Skip for now
      </button>
    </div>
  );
}
