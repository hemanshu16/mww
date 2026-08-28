import { Reveal } from './Reveal'
import { TrackingCard } from './TrackingCard'

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <Reveal as="span" className="eyebrow">
            Express courier · Import &amp; export · Since 2001
          </Reveal>
          <Reveal as="h1" delay={1}>
            Ship across the world, <span className="em">delivered with care.</span>
          </Reveal>
          <Reveal as="p" delay={2} className="lead">
            Like the monarch&rsquo;s crossing of continents, your shipment travels far — but never
            alone. Monarch Worldwide Express moves air, sea and door-to-door consignments across
            India and beyond, with the personal attention of an independent courier and the reach
            of a global network.
          </Reveal>
          <Reveal as="div" delay={3} className="hero-actions">
            <a href="#track" className="btn btn-amber">
              Track a shipment
            </a>
            <a href="#services" className="btn btn-ghost">
              Explore services →
            </a>
          </Reveal>
          <Reveal as="div" delay={4} className="trust-line">
            <div className="dots">
              <span>AIR</span>
              <span>SEA</span>
              <span>D2D</span>
            </div>
            <span>Trusted for cross-border shipping since 2001</span>
          </Reveal>
        </div>

        <Reveal as="div" delay={2} className="track-card" id="demoCard">
          <TrackingCard />
        </Reveal>
      </div>
    </section>
  )
}
