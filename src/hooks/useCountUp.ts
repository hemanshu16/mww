import { useEffect, useRef, useState } from 'react'

/**
 * Animates from a start value up to `target` once the returned ref scrolls into view.
 * Mirrors the original counter: numbers starting at 0 count up from zero, while the
 * "plain" 2001 stat (`startFromTargetMinus`) counts up from a nearby offset instead.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  target: number,
  startFromTargetMinus?: number,
) {
  const ref = useRef<T | null>(null)
  const [value, setValue] = useState(startFromTargetMinus ? target - startFromTargetMinus : 0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }

    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = startFromTargetMinus ? target - startFromTargetMinus : 0
        const duration = 1100
        const t0 = performance.now()
        const step = (t: number) => {
          const k = Math.min((t - t0) / duration, 1)
          const eased = 1 - Math.pow(1 - k, 3)
          setValue(Math.round(start + (target - start) * eased))
          if (k < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [target, startFromTargetMinus])

  return { ref, value }
}
