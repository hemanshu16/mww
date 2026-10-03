import { useId } from 'react'

export type SparkTone = 'blue' | 'green' | 'red'

const TONE_VAR: Record<SparkTone, string> = {
  blue: 'var(--blue-600)',
  green: 'var(--success)',
  red: 'var(--danger)',
}

export function Sparkline({
  data,
  tone = 'blue',
  className,
  width = 96,
  height = 36,
}: {
  data: number[]
  tone?: SparkTone
  className?: string
  width?: number
  height?: number
}) {
  const id = useId().replace(/:/g, '')
  if (data.length < 2) return null
  const color = TONE_VAR[tone]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((d, i) => {
    const x = i * stepX
    const y = height - ((d - min) / span) * (height - 4) - 2
    return [x, y] as const
  })
  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color }} stopOpacity="0.16" />
          <stop offset="100%" style={{ stopColor: color }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        style={{ stroke: color }}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
