import { Plane } from 'lucide-react'

/** Small dotted flight-path ornament for the dashboard hero. Decorative only. */
export function RouteArt({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative h-[104px] w-[280px]">
        <svg viewBox="0 0 280 104" className="absolute inset-0 size-full overflow-visible">
          <path
            d="M10 88 C 80 88, 110 22, 232 28"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="0.1 7"
            style={{ stroke: 'var(--blue-400)' }}
          />
          <circle cx={10} cy={88} r={4} style={{ fill: 'var(--blue-600)' }} />
          <circle
            cx={10}
            cy={88}
            r={9}
            fill="none"
            strokeWidth={1}
            style={{ stroke: 'var(--blue-300)' }}
          />
        </svg>
        {/* Plane sits on the path end (232,28) of the 280×104 box */}
        <Plane
          className="absolute size-6 text-blue-700"
          style={{ left: 232 - 12, top: 28 - 12, transform: 'rotate(45deg)' }}
        />
        <p className="micro-label absolute bottom-0 right-0">Track. Ship. Grow.</p>
      </div>
    </div>
  )
}
