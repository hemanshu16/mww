import { useEffect, useRef } from 'react'

/**
 * Sitewide custom cursor: a plane glyph that lerps toward the pointer and
 * points in its travel direction, replacing the system arrow everywhere.
 * Position/rotation are written directly to the DOM each frame (not React
 * state) to stay cheap at 60fps. Disabled entirely on touch/coarse-pointer
 * devices — there's no mouse to follow, and native touch interaction covers
 * those cases already.
 */
export function AirplaneCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement

    let raf = 0
    let running = false
    let visible = false
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let angle = 0
    let hasPosition = false

    function paint() {
      cursor!.style.transform = `translate(${curX}px, ${curY}px) rotate(${angle}rad)`
    }

    function startLoop() {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }

    // Text-editable targets keep their native caret (see the matching :not()
    // exclusion in index.css) — hide the plane glyph there instead of
    // stacking it on top of the caret.
    function isTextTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
    }

    function onMove(e: PointerEvent) {
      targetX = e.clientX
      targetY = e.clientY
      if (!hasPosition) {
        curX = targetX
        curY = targetY
        hasPosition = true
        paint()
      }
      if (isTextTarget(e.target)) {
        if (visible) {
          visible = false
          cursor!.classList.remove('show')
        }
        return
      }
      if (!visible) {
        visible = true
        cursor!.classList.add('show')
      }
      startLoop()
    }
    function onLeave() {
      visible = false
      cursor!.classList.remove('show')
    }

    root.classList.add('plane-cursor-active')
    window.addEventListener('pointermove', onMove)
    document.addEventListener('mouseleave', onLeave)

    // Only spins while catching up to the pointer — settles and stops scheduling
    // frames the instant it reaches the target, instead of polling at 60fps forever.
    function tick() {
      const dx = targetX - curX
      const dy = targetY - curY
      const dist = Math.hypot(dx, dy)
      const lerp = reduce ? 1 : 0.18

      if (dist < 0.05) {
        curX = targetX
        curY = targetY
        paint()
        running = false
        return
      }

      curX += dx * lerp
      curY += dy * lerp
      if (dist > 1.2) {
        angle = Math.atan2(dy, dx)
      }
      paint()
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('plane-cursor-active')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="airplane-cursor" ref={cursorRef} aria-hidden="true">
      <svg width="34" height="34" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="planeCursorGrad" x1="4" y1="20" x2="18" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0C1E45" />
            <stop offset="1" stopColor="#26365B" />
          </linearGradient>
        </defs>
        {/* Nose points up by default (Material "flight" glyph) — rotated 90° here so
            angle 0 (nose right) matches the atan2 convention driving the per-frame
            rotate() below, i.e. the plane visually noses toward its travel direction. */}
        <g transform="rotate(90 12 12)">
          <path
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z"
            fill="url(#planeCursorGrad)"
            stroke="#0C1E45"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
          <rect x="9.4" y="14.4" width="1.6" height="3" rx="0.5" fill="#E28C22" opacity=".9" />
        </g>
      </svg>
    </div>
  )
}
