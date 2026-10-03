import { useEffect, useRef, useState } from 'react'
import type { ChartPoint } from '@/lib/mockDashboard'

const PAD = { left: 36, right: 12, top: 12, bottom: 28 }

export function ShipmentChart({ data, height = 260 }: { data: ChartPoint[]; height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const max = Math.max(...data.map((d) => d.value))
  const niceMax = Math.ceil(max / 20) * 20 || 20
  const stepX = plotW / (data.length - 1)

  const xs = data.map((_, i) => PAD.left + i * stepX)
  const ys = data.map((d) => PAD.top + plotH - (d.value / niceMax) * plotH)

  // Smooth line: horizontal tangents at every point, so it never overshoots the data.
  const line = xs
    .map((x, i) => {
      if (i === 0) return `M${x.toFixed(1)},${ys[i].toFixed(1)}`
      const mid = (xs[i - 1] + x) / 2
      return `C${mid.toFixed(1)},${ys[i - 1].toFixed(1)} ${mid.toFixed(1)},${ys[i].toFixed(1)} ${x.toFixed(1)},${ys[i].toFixed(1)}`
    })
    .join(' ')
  const baseline = PAD.top + plotH
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${baseline} L${xs[0].toFixed(1)},${baseline} Z`

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((g) => ({
    y: PAD.top + plotH * (1 - g),
    label: Math.round(niceMax * g),
  }))

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const i = Math.round((x - PAD.left) / stepX)
    setActive(Math.min(data.length - 1, Math.max(0, i)))
  }

  const delta =
    active !== null && active > 0 && data[active - 1].value > 0
      ? Math.round(((data[active].value - data[active - 1].value) / data[active - 1].value) * 100)
      : null

  return (
    <div ref={wrapRef} className="relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block touch-pan-y"
        role="img"
        aria-label="Shipments over time"
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id="shipment-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--blue-200)' }} stopOpacity="0.7" />
            <stop offset="100%" style={{ stopColor: 'var(--blue-50)' }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.label}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={t.y}
              y2={t.y}
              strokeWidth={1}
              style={{ stroke: 'var(--border-subtle)' }}
            />
            <text
              x={PAD.left - 10}
              y={t.y + 4}
              textAnchor="end"
              className="text-[11px]"
              style={{ fill: 'var(--text-muted)' }}
            >
              {t.label}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#shipment-area)" />
        <path
          d={line}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: 'var(--blue-600)' }}
        />

        {active !== null && (
          <line
            x1={xs[active]}
            x2={xs[active]}
            y1={PAD.top}
            y2={baseline}
            strokeWidth={1}
            strokeDasharray="3 4"
            style={{ stroke: 'var(--blue-300)' }}
          />
        )}

        {/* End-point marker, plus the hovered point */}
        {data.map((_, i) =>
          i === data.length - 1 || i === active ? (
            <circle
              key={i}
              cx={xs[i]}
              cy={ys[i]}
              r={4.5}
              strokeWidth={2.5}
              style={{ fill: 'var(--surface)', stroke: 'var(--blue-600)' }}
            />
          ) : null,
        )}

        {data.map((d, i) => (
          <text
            key={d.label}
            x={xs[i]}
            y={height - 8}
            textAnchor="middle"
            className="text-[11px]"
            style={{ fill: i === active ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {d.label}
          </text>
        ))}
      </svg>

      {active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] bg-blue-900 px-3 py-2 text-xs text-white shadow-dropdown"
          style={{
            left: Math.min(Math.max(xs[active], 64), width - 64),
            top: ys[active] - 14,
          }}
        >
          <div className="font-semibold">{data[active].value.toLocaleString('en-IN')} bookings</div>
          <div className="mt-0.5 text-blue-200">
            {delta === null
              ? data[active].label
              : `${delta >= 0 ? '+' : ''}${delta}% vs ${data[active - 1].label}`}
          </div>
        </div>
      )}
    </div>
  )
}
