import type { MouseEvent } from 'react'
import { Reveal } from './Reveal'

const SERVICES = [
  {
    icon: (
      <path d="M22 12l-8-2-3-8-1 0-1 6-6 1v2l6 1 1 6 1 0 3-8 8-2z" />
    ),
    title: 'Air Freight & Express',
    body: 'Time-sensitive documents and commercial shipments carried worldwide through our offices, agents and international network — coordinated for safety, speed and cost.',
    tag: 'Documents · Commercial · Time-critical',
  },
  {
    icon: <path d="M2 18h20M4 18l2-6h12l2 6M7 12V7h10v5M9 7V4h6v3" />,
    title: 'Sea Freight',
    body: 'For companies moving bulk consignments internationally, ocean freight offers the most cost-efficient way to ship larger quantities across global destinations.',
    tag: 'Bulk cargo · Import & export',
  },
  {
    icon: <path d="M3 12h18M12 3v18M4 8h4v4H4zM16 12h4v4h-4z" />,
    title: 'Door-to-Door Delivery',
    body: 'If it can reach your doorstep, we can collect it from your doorstep too. We pick up parcels and larger consignments and carry them all the way to their destination.',
    tag: 'Pickup → transport → deliver',
  },
  {
    icon: <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />,
    title: 'Import & Export Support',
    body: 'Worldwide import and export handling with the paperwork done right — customs coordination, declarations and carrier authority letters, all under one roof.',
    tag: 'Customs · Declarations · Waivers',
  },
  {
    icon: <path d="M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h6" />,
    title: 'Documentation Centre',
    body: 'Invoices, packing lists, SLI, MSDS, drawback annexures and carrier authority letters — a full export documentation library ready to download when you need it.',
    tag: '20+ forms · PDF & Excel',
  },
  {
    icon: <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7zM9 12l2 2 4-4" />,
    title: 'Restricted & Prohibited Goods',
    body: 'Clear guidance on what can and cannot cross borders — items restricted for reasons of health, environment, endangered species, security or regulation.',
    tag: 'Know before you ship',
  },
]

function Card({ service, delay }: { service: (typeof SERVICES)[number]; delay?: 1 | 2 }) {
  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <Reveal className="card" delay={delay} onMouseMove={onMouseMove}>
      <div className="ico">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          {service.icon}
        </svg>
      </div>
      <h3>{service.title}</h3>
      <p>{service.body}</p>
      <span className="tag">{service.tag}</span>
    </Reveal>
  )
}

export function Services() {
  return (
    <section className="sec" id="services">
      <div className="wrap">
        <Reveal as="div" className="sec-head">
          <span className="eyebrow">What we move</span>
          <h2>
            Every route to your customer, <span className="em amber">handled end to end.</span>
          </h2>
          <p>
            Four decades of shipping know-how, distilled into services built for exporters,
            importers and everyday senders alike. Only what we genuinely operate — no filler.
          </p>
        </Reveal>
        <div className="cards">
          {SERVICES.map((service, i) => (
            <Card key={service.title} service={service} delay={(i % 3 === 1 ? 1 : i % 3 === 2 ? 2 : undefined) as 1 | 2 | undefined} />
          ))}
        </div>
      </div>
    </section>
  )
}
