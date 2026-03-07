import { getToolIcon } from '../Layout/RightPanel';

const ORBIT_RADIUS = 36;
const ICON_SIZE = 20;

interface OrchestratorLoadingAnimationProps {
  toolNames: string[];
  label?: string;
}

export default function OrchestratorLoadingAnimation({
  toolNames,
  label,
}: OrchestratorLoadingAnimationProps) {
  if (toolNames.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pull-in wrapper: icons appear to come from the right (panel) then orbit */}
      <div className="orchestrator-tool-ring-pull">
        <div
          className="orchestrator-tool-ring"
          style={{
            width: ORBIT_RADIUS * 2 + ICON_SIZE * 2,
            height: ORBIT_RADIUS * 2 + ICON_SIZE * 2,
          }}
        >
        {toolNames.map((name, i) => {
          const Icon = getToolIcon(name);
          const angle = (360 / toolNames.length) * i;
          return (
            <div
              key={`${name}-${i}`}
              className="orchestrator-tool-ring__icon"
              style={{
                '--angle': `${angle}deg`,
                '--n': toolNames.length,
                '--r': `${ORBIT_RADIUS}px`,
                width: ICON_SIZE,
                height: ICON_SIZE,
              } as React.CSSProperties}
            >
              <Icon size={ICON_SIZE} style={{ color: 'var(--accent)' }} strokeWidth={2} />
            </div>
          );
        })}
        </div>
      </div>
      {label && (
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{label}</p>
      )}
    </div>
  );
}
