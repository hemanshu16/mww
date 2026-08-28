import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RevealProps<T extends ElementType> = {
  as?: T
  delay?: 1 | 2 | 3 | 4
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>

/** Fades/slides an element in once it scrolls into view (matches the original .reveal/.in behavior). */
export function Reveal<T extends ElementType = 'div'>({
  as,
  delay,
  className,
  children,
  ...rest
}: RevealProps<T>) {
  const Comp = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.14 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Comp
      ref={ref}
      className={cn('reveal', delay && `d${delay}`, inView && 'in', className as string | undefined)}
      {...rest}
    >
      {children}
    </Comp>
  )
}
