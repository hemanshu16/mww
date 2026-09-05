import { useEffect, useRef, type RefObject } from 'react'

/**
 * A small airplane glyph that lerps toward the pointer and points in its travel
 * direction, replacing the system cursor inside `areaRef`. Position/rotation are
 * written directly to the DOM each frame (not React state) to stay cheap at 60fps.
 * Disabled entirely on touch/coarse-pointer devices — there's no mouse to follow,
 * and the hero's own drag-to-rotate already covers touch interaction.
 */
export function AirplaneCursor({ areaRef }: { areaRef: RefObject<HTMLElement | null> }) {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const area = areaRef.current
    const cursor = cursorRef.current
    if (!area || !cursor) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let visible = false
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let angle = 0
    let hasPosition = false

    function onMove(e: PointerEvent) {
      const rect = area!.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
      if (!hasPosition) {
        curX = targetX
        curY = targetY
        hasPosition = true
      }
    }
    function onEnter() {
      visible = true
      cursor!.classList.add('show')
    }
    function onLeave() {
      visible = false
      cursor!.classList.remove('show')
    }

    area.addEventListener('pointerenter', onEnter)
    area.addEventListener('pointerleave', onLeave)
    area.addEventListener('pointermove', onMove)
    area.classList.add('has-plane-cursor')

    function tick() {
      raf = requestAnimationFrame(tick)
      if (!hasPosition) return
      const dx = targetX - curX
      const dy = targetY - curY
      const lerp = reduce ? 1 : 0.18
      curX += dx * lerp
      curY += dy * lerp
      if (Math.hypot(dx, dy) > 1.2) {
        angle = Math.atan2(dy, dx)
      }
      cursor!.style.transform = `translate(${curX}px, ${curY}px) rotate(${angle}rad)`
      if (visible && cursor!.style.opacity !== '1') cursor!.style.opacity = '1'
      if (!visible && cursor!.style.opacity !== '0') cursor!.style.opacity = '0'
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      area.removeEventListener('pointerenter', onEnter)
      area.removeEventListener('pointerleave', onLeave)
      area.removeEventListener('pointermove', onMove)
      area.classList.remove('has-plane-cursor')
    }
  }, [areaRef])

  return (
    <div className="airplane-cursor" ref={cursorRef} aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12l-8-2-3-8-1 0-1 6-6 1v2l6 1 1 6 1 0 3-8 8-2z" />
      </svg>
    </div>
  )
}
