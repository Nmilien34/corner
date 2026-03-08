import { getFileFormatInfo } from '../../lib/fileFormat'

interface Props {
  fileName: string
  size?: 'sm' | 'md'
}

export default function FormatBadge({ fileName, size = 'md' }: Props) {
  const info = getFileFormatInfo(fileName)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: 4,
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: info.color,
        color: info.textColor,
        fontFamily: 'Geist, sans-serif',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {info.label}
    </span>
  )
}
