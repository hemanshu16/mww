import { useEffect, useRef, useState, type CSSProperties } from 'react'

const STAGES = [
  { label: 'Shipment booked', time: '08:12' },
  { label: 'Picked up from door', time: '09:40' },
  { label: 'In transit — air freight', time: '14:05' },
  { label: 'Customs clearance', time: '—' },
  { label: 'Out for delivery', time: '—' },
  { label: 'Delivered to consignee', time: '—' },
]

const CHECK = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#04122e" strokeWidth="2.4">
    <path d="M2 6l3 3 5-6" />
  </svg>
)

/** Cycles the hero's live-tracking demo card through its stages, matching the original interval-driven animation. */
export function TrackingCard() {
  const [idx, setIdx] = useState(2)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion.current) return

    let cancelled = false
    let holdTimer: ReturnType<typeof setTimeout> | undefined

    const interval = setInterval(() => {
      if (cancelled) return
      setIdx((prev) => {
        const next = (prev + 1) % (STAGES.length + 1)
        if (next === STAGES.length) {
          holdTimer = setTimeout(() => {
            if (!cancelled) setIdx(0)
          }, 1400)
          return STAGES.length - 1
        }
        return next
      })
    }, 1900)

    return () => {
      cancelled = true
      clearInterval(interval)
      if (holdTimer) clearTimeout(holdTimer)
    }
  }, [])

  const p = idx / (STAGES.length - 1)

  return (
    <>
      <div className="tc-head">
        <div className="tc-id">
          AWB <b>MWX 483 209 771</b>
        </div>
        <div className="tc-live">
          <span className="pulse" />
          Live
        </div>
      </div>
      <div className="route">
        <div className="node">
          <div className="code">RAJ</div>
          <div className="city">Rajkot, IN</div>
        </div>
        <div className="path">
          <i style={{ '--p': p.toFixed(3) } as CSSProperties} />
          <span className="plane" style={{ left: `${p * 100}%` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12l-8-2-3-8-1 0-1 6-6 1v2l6 1 1 6 1 0 3-8 8-2z" />
            </svg>
          </span>
        </div>
        <div className="node">
          <div className="code">JFK</div>
          <div className="city">New York, US</div>
        </div>
      </div>
      <ul className="stages">
        {STAGES.map((stage, i) => (
          <li key={stage.label} className={i < idx ? 'stage done' : i === idx ? 'stage active' : 'stage'}>
            <div className="ring">{CHECK}</div>
            <div className="txt">
              <span className="label">{stage.label}</span>
              <span className="time">{stage.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
