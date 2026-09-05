import { Reveal } from './Reveal'
import { NetworkGlobe } from './NetworkGlobe'

export function Network() {
  return (
    <section className="sec wash" id="network">
      <div className="wrap net-grid globe-grid">
        <Reveal className="net-copy">
          <span className="eyebrow">Global courier network</span>
          <h2 className="globe-h2">
            Connecting India <span className="em amber">to the world.</span>
          </h2>
          <p className="globe-lead">
            From our India hub to destinations across the globe, Monarch Worldwide Express
            delivers documents, parcels and shipments with reliable international courier and
            logistics solutions.
          </p>
          <div className="globe-cta">
            <a href="#track" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
              </svg>
              Track a Shipment
            </a>
            <a href="#contact" className="btn btn-outline-navy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h6" />
              </svg>
              Get a Quote
            </a>
          </div>
          <a href="#services" className="reach-explore">
            Explore our global network
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <ul className="reach-legend" aria-hidden="true">
            <li>
              <span className="lg-ico origin">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <span className="lg-txt">
                <b>Origin</b>
                <span>India hub</span>
              </span>
            </li>
            <li>
              <span className="lg-ico dest">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <span className="lg-txt">
                <b>Destination</b>
                <span>120+ countries</span>
              </span>
            </li>
            <li>
              <span className="lg-ico route">
                <svg width="17" height="11" viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 7h18M15 2l6 5-6 5" />
                </svg>
              </span>
              <span className="lg-txt">
                <b>Active Route</b>
                <span>Real-time shipping</span>
              </span>
            </li>
          </ul>
          <p className="sr-only">
            Monarch Worldwide Express connects shipments from India with international
            destinations through courier and logistics services. Representative global
            destinations include Dubai, London, New York, Los Angeles, Singapore, Hong Kong,
            Tokyo, Sydney, Johannesburg and São Paulo.
          </p>
        </Reveal>

        <Reveal delay={1} className="globe-col">
          <NetworkGlobe selectedCountry="India" />
          <div className="globe-note">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{ verticalAlign: '-2px', marginRight: 5 }}
            >
              <rect x="6" y="2" width="12" height="20" rx="6" />
              <path d="M12 6v4" />
            </svg>
            <span className="gn-desktop">Drag to explore · Click a destination</span>
            <span className="gn-mobile">Tap a destination to explore</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
