import { useEffect, useRef, useState } from 'react'
import { Reveal } from './Reveal'

const TABS = [
  { label: 'AWB No.', placeholder: 'e.g. MWX 483 209 771' },
  { label: 'Forwarding No.', placeholder: 'e.g. FWD-2025-00841' },
  { label: 'Reference No.', placeholder: 'e.g. REF/RAJ/0912' },
]

const STEPS = ['Locating shipment…', 'Contacting carrier network…', 'Fetching latest scan…']

export function TrackSection() {
  const [activeTab, setActiveTab] = useState(0)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<{ text: string; color: 'amber' | 'sky' } | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const doTrack = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const v = value.trim()
    if (!v) {
      setResult({ text: '↳ Enter a tracking number to see its status.', color: 'amber' })
      return
    }
    setResult({ text: `› ${STEPS[0]}`, color: 'sky' })
    STEPS.forEach((step, i) => {
      if (i === 0) return
      timers.current.push(
        setTimeout(() => setResult({ text: `› ${step}`, color: 'sky' }), i * 650),
      )
    })
    timers.current.push(
      setTimeout(
        () =>
          setResult({
            text: `● ${v} — In transit · departed Rajkot hub · ETA 3–5 working days.`,
            color: 'amber',
          }),
        STEPS.length * 650,
      ),
    )
  }

  return (
    <section className="sec" id="track">
      <div className="wrap">
        <Reveal className="track-sec">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            Track your shipment
          </span>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 'clamp(26px,3.4vw,40px)',
              letterSpacing: '-.025em',
              marginTop: 14,
            }}
          >
            Where is it right now?
          </h2>
          <div className="tabs" role="tablist">
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                className={i === activeTab ? 'tab active' : 'tab'}
                onClick={() => setActiveTab(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="track-input">
            <input
              type="text"
              placeholder={TABS[activeTab].placeholder}
              aria-label="Tracking number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button className="btn btn-amber" onClick={doTrack}>
              Track shipment
            </button>
          </div>
          <div className="track-result" style={{ color: result ? `var(--${result.color})` : undefined }}>
            {result?.text}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
