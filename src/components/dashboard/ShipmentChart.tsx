import { useId } from 'react'
import type { ChartPoint } from '@/lib/mockDashboard'

const PRIMARY = '#2874B2'

export function ShipmentChart({ data, height = 220 }: { data: ChartPoint[]; height?: number }) {
  const gradId = useId().replace(/:/g, '')
  const width = 720
  const padX = 8
  const padTop = 12
  const padBottom = 28
  const plotH = height - padTop - padBottom
  const plotW = width - padX * 2

  const max = Math.max(...data.map((d) => d.value))
  const niceMax = Math.ceil(max / 20) * 20 || 20
  const stepX = plotW / (data.length - 1)

  const pt = (d: ChartPoint, i: number) => {
    const x = padX + i * stepX
    const y = padTop + plotH - (d.value / niceMax) * plotH
    return [x, y] as const
  }
  const points = data.map(pt)
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${padX + plotW},${padTop + plotH} L${padX},${padTop + plotH} Z`

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Shipments over time"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g) => {
        const y = padTop + plotH * g
        return <line key={g} x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#E9EEF5" strokeWidth={1} />
      })}

      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={PRIMARY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke={PRIMARY} strokeWidth={2} />
      ))}

      {data.map((d, i) => {
        const [x] = points[i]
        return (
          <text
            key={d.label}
            x={x}
            y={height - 8}
            textAnchor="middle"
            className="fill-[#8291a8] text-[11px]"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
