import { Reveal } from './Reveal'
import { CourierPackage3D } from './CourierPackage3D'

export function ShipmentJourney() {
  return (
    <section className="sec journey-sec">
      <div className="journey-atmosphere" aria-hidden="true">
        <span className="atmo-blob atmo-left" />
        <span className="atmo-blob atmo-mid" />
        <span className="atmo-blob atmo-right" />
      </div>

      <div className="wrap">
        <Reveal as="div" className="sec-head center">
          <span className="eyebrow">Your shipment in motion</span>
          <h2>
            From global routes to final destinations, <span className="em amber">we deliver.</span>
          </h2>
          <p>Seamless, reliable logistics — every step of the way.</p>
        </Reveal>

        <Reveal as="div" delay={1} className="journey-visual">
          <div className="package-stage-wrap">
            <CourierPackage3D />
            <span className="journey-visual-hint">Drag to rotate the package</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
