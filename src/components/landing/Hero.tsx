import { useEffect, useRef, useState } from 'react'
import { Reveal } from './Reveal'

// keep in sync with the .hero-tab.active .hero-tab-track i animation-duration in landing.css
const SLIDE_MS = 6000

const HERO_VIDEOS = [
  { id: 'ocean', num: '01', title: 'Ocean Freight' },
  { id: 'air', num: '02', title: 'Air Freight' },
  { id: 'domestic', num: '03', title: 'Domestic Logistics' },
] as const

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const [active, setActive] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  // Auto-advance the carousel; resets whenever `active` changes, so a manual click restarts the clock too.
  useEffect(() => {
    if (reducedMotion) return
    const id = setTimeout(() => {
      setActive((a) => (a + 1) % HERO_VIDEOS.length)
      setPlayCount((c) => c + 1)
    }, SLIDE_MS)
    return () => clearTimeout(id)
  }, [active, reducedMotion])

  // Pause all four clips when the hero scrolls out of view.
  useEffect(() => {
    if (reducedMotion) return
    const section = sectionRef.current
    if (!section) return
    const io = new IntersectionObserver(
      ([entry]) => {
        for (const el of videoRefs.current) {
          if (!el) continue
          if (entry.isIntersecting) el.play().catch(() => {})
          else el.pause()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(section)
    return () => io.disconnect()
  }, [reducedMotion])

  function selectSlide(index: number) {
    if (index === active) return
    setActive(index)
    setPlayCount((c) => c + 1)
  }

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-bg">
        {reducedMotion ? (
          <img src={`/videos/hero/${HERO_VIDEOS[active].id}-poster.jpg`} alt="" />
        ) : (
          HERO_VIDEOS.map((video, i) =>
            failed[video.id] ? (
              <img
                key={video.id}
                src={`/videos/hero/${video.id}-poster.jpg`}
                alt=""
                className={i === active ? 'is-active' : undefined}
              />
            ) : (
              <video
                key={video.id}
                ref={(el) => {
                  videoRefs.current[i] = el
                }}
                className={i === active ? 'is-active' : undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={`/videos/hero/${video.id}-poster.jpg`}
                aria-hidden="true"
                onError={() => setFailed((f) => ({ ...f, [video.id]: true }))}
              >
                <source src={`/videos/hero/${video.id}.webm`} type="video/webm" />
                <source src={`/videos/hero/${video.id}.mp4`} type="video/mp4" />
              </video>
            ),
          )
        )}
        <div className="hero-scrim" />
      </div>

      <div className="wrap">
        <div className="hero-copy">
          <Reveal as="span" className="eyebrow">
            Global logistics partner
          </Reveal>
          <Reveal as="h1" delay={1}>
            Moving the world.
            <br />
            <span className="em amber">One shipment</span> at a time.
          </Reveal>
          <Reveal as="p" delay={2} className="lead">
            Seamless ocean, air and domestic logistics solutions to connect your business across
            the globe.
          </Reveal>
          <Reveal as="div" delay={3} className="hero-actions">
            <a href="#track" className="btn btn-ghost">
              Track shipment →
            </a>
          </Reveal>
        </div>

        <Reveal
          as="div"
          delay={4}
          className="hero-carousel"
          role="tablist"
          aria-label="Featured logistics services"
        >
          {HERO_VIDEOS.map((video, i) => (
            <button
              key={video.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show ${video.title}`}
              className={`hero-tab${i === active ? ' active' : i < active ? ' done' : ''}`}
              onClick={() => selectSlide(i)}
            >
              <span className="hero-tab-track">
                <i key={i === active ? playCount : undefined} />
              </span>
              <span className="num">{video.num}</span>
              <span className="name">{video.title}</span>
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
