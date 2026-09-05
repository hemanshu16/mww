import { useRef } from 'react'
import { Reveal } from './Reveal'
import { CourierPackage3D } from './CourierPackage3D'
import { AirplaneCursor } from './AirplaneCursor'

// Anchors sit on a level baseline (y=110); the path bulges above/below between
// them so it reads as an actual curved route rather than a flat UI timeline.
// Percentages below are these same anchors' x-position as a share of the 1160
// viewBox width, used to align the HTML icon/label rows with the SVG beneath them.
const PATH_D = 'M90,110 C210,35 300,35 420,110 C540,185 630,185 750,110 C870,35 960,35 1080,110'
const ANCHOR_X = [90, 420, 750, 1080]
const ANCHOR_PCT = ANCHOR_X.map((x) => (x / 1160) * 100)

function ShipIcon() {
  return (
    <svg viewBox="-34 -16 68 42" aria-hidden="true">
      <path d="M-28,8 L28,8 L20,22 L-20,22Z" fill="var(--navy)" />
      <rect x="-16" y="-6" width="9" height="14" rx="1" fill="var(--azure)" />
      <rect x="-4" y="-10" width="9" height="18" rx="1" fill="var(--amber)" />
      <rect x="8" y="-6" width="9" height="14" rx="1" fill="var(--azure)" />
      <path d="M-32,11 Q0,16 32,11" stroke="var(--line-2)" strokeWidth="2" fill="none" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg viewBox="-32 -22 64 42" aria-hidden="true">
      <ellipse cx="0" cy="0" rx="26" ry="6" fill="var(--navy)" />
      <path d="M-4,-2 L-18,-16 L-11,-16 L2,-3Z" fill="var(--navy)" />
      <path d="M-4,2 L-18,16 L-11,16 L2,3Z" fill="var(--navy)" />
      <path d="M18,-2 L28,-9 L28,-2Z" fill="var(--navy)" />
      <circle cx="-16" cy="-14" r="4" fill="var(--line-2)" />
      <circle cx="14" cy="-13" r="5" fill="var(--line-2)" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg viewBox="-34 -12 68 40" aria-hidden="true">
      <rect x="-28" y="-4" width="34" height="20" rx="2" fill="var(--navy)" />
      <path d="M6,-4 L20,-4 L26,6 L26,16 L6,16Z" fill="var(--azure)" />
      <circle cx="-16" cy="18" r="5" fill="var(--ink-soft)" />
      <circle cx="14" cy="18" r="5" fill="var(--ink-soft)" />
      <path d="M-32,18 L30,18" stroke="var(--line-2)" strokeWidth="2" />
    </svg>
  )
}

function WarehouseIcon() {
  return (
    <svg viewBox="-32 -22 64 46" aria-hidden="true">
      <rect x="-26" y="-2" width="52" height="24" fill="var(--navy)" />
      <path d="M-30,-2 L0,-18 L30,-2Z" fill="var(--ink-soft)" />
      <rect x="-8" y="6" width="16" height="16" fill="var(--amber)" />
    </svg>
  )
}

const STAGES = [
  { id: 'ocean', num: '01', title: 'Ocean Freight', Icon: ShipIcon },
  { id: 'air', num: '02', title: 'Air Freight', Icon: PlaneIcon },
  { id: 'domestic', num: '03', title: 'Domestic Logistics', Icon: TruckIcon },
  { id: 'warehouse', num: '04', title: 'Warehousing & Delivery', Icon: WarehouseIcon },
] as const

export function ShipmentJourney() {
  const visualRef = useRef<HTMLDivElement>(null)

  return (
    <section className="sec journey-sec">
      <div className="wrap">
        <Reveal as="div" className="sec-head center">
          <span className="eyebrow">Your shipment in motion</span>
          <h2>
            From global routes to final destinations, <span className="em amber">we deliver.</span>
          </h2>
          <p>Seamless, reliable logistics — every step of the way.</p>
        </Reveal>

        <Reveal as="div" delay={1} className="journey-visual">
          <div className="package-stage-wrap" ref={visualRef}>
            <CourierPackage3D />
            <AirplaneCursor areaRef={visualRef} />
            <span className="journey-visual-hint">Drag to rotate the package</span>
          </div>
        </Reveal>

        <Reveal delay={2} className="journey">
          <div className="journey-icons" aria-hidden="true">
            {STAGES.map(({ id, Icon }, i) => (
              <span key={id} className={`journey-stage-ico stage-${i}`} style={{ left: `${ANCHOR_PCT[i]}%` }}>
                <Icon />
              </span>
            ))}
          </div>

          <svg className="journey-route" viewBox="0 0 1160 220" preserveAspectRatio="none" aria-hidden="true">
            <path className="journey-route-line" d={PATH_D} fill="none" />
            {ANCHOR_X.map((x, i) => (
              <circle key={i} className={`journey-marker stage-${i}`} cx={x} cy={110} r="7" />
            ))}
          </svg>

          <div className="journey-labels">
            {STAGES.map(({ id, num, title }, i) => (
              <div key={id} className="journey-label" style={{ left: `${ANCHOR_PCT[i]}%` }}>
                <b>{num}</b>
                <span>{title}</span>
              </div>
            ))}
          </div>

          <div className="journey-mobile">
            {STAGES.map(({ id, num, title, Icon }) => (
              <div key={id} className="journey-row">
                <span className="journey-row-dot" aria-hidden="true" />
                <span className="journey-row-ico" aria-hidden="true">
                  <Icon />
                </span>
                <div className="journey-row-txt">
                  <b>{num}</b>
                  <span>{title}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
