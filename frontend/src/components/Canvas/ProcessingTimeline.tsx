import { useMemo } from 'react';

interface Props {
  label: string;
  stepCurrent?: number;
  stepTotal?: number;
  toolNames?: string[];
}

/** Friendly display name for a tool name */
function toolLabel(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProcessingTimeline({ label, stepCurrent, toolNames }: Props) {
  const steps = useMemo(() => {
    const planning = { key: '__planning__', label: 'Planning' };
    const toolSteps = (toolNames ?? []).map((t) => ({ key: t, label: toolLabel(t) }));
    return [planning, ...toolSteps];
  }, [toolNames]);

  // stepCurrent is 1-indexed for tool steps; planning is always step 0
  const hasTools = (toolNames ?? []).length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        minWidth: 200,
        fontFamily: 'Geist, sans-serif',
      }}
    >
      {steps.map((step, i) => {
        let status: 'done' | 'active' | 'pending';

        if (step.key === '__planning__') {
          // Planning is done once we have tool names
          status = hasTools ? 'done' : 'active';
        } else {
          // Tool steps: i is 1-indexed when compared to stepCurrent
          const toolIndex = i; // 1-based (planning is 0)
          if (stepCurrent === undefined) {
            status = 'pending';
          } else if (toolIndex < stepCurrent) {
            status = 'done';
          } else if (toolIndex === stepCurrent) {
            status = 'active';
          } else {
            status = 'pending';
          }
        }

        const isLast = i === steps.length - 1;

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {/* Left column: dot + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
              <StepDot status={status} />
              {!isLast && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    minHeight: 16,
                    background: status === 'done' ? 'var(--accent)' : 'var(--border)',
                    marginTop: 2,
                    transition: 'background 300ms ease',
                  }}
                />
              )}
            </div>

            {/* Label */}
            <div
              style={{
                paddingBottom: isLast ? 0 : 14,
                paddingTop: 0,
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: status === 'active' ? 600 : 400,
                  color:
                    status === 'done'
                      ? 'var(--text-muted)'
                      : status === 'active'
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                  transition: 'color 300ms ease, font-weight 300ms ease',
                }}
              >
                {status === 'active' && step.key !== '__planning__' ? label : step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepDot({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') {
    return (
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 300ms ease',
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 4L3.2 5.7L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--accent)',
          flexShrink: 0,
          animation: 'timeline-pulse 1.2s ease-in-out infinite',
        }}
      />
    );
  }

  // pending
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '1.5px solid var(--border)',
        background: 'var(--white)',
        flexShrink: 0,
      }}
    />
  );
}
