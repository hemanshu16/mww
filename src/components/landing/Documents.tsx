import { Reveal } from './Reveal'

const DOCS = [
  { ext: 'PDF', label: 'Commercial Invoice' },
  { ext: 'XLS', label: 'Packing List' },
  { ext: 'PDF', label: 'Export Value Declaration' },
  { ext: 'XLS', label: "Shipper's Letter (SLI)" },
  { ext: 'PDF', label: 'Non-DG Declaration' },
  { ext: 'XLS', label: 'MSDS' },
  { ext: 'PDF', label: 'DHL Authority Letter' },
  { ext: 'XLS', label: 'FedEx Authority Letter' },
  { ext: 'PDF', label: 'UPS Authority Letter' },
  { ext: 'XLS', label: 'Drawback Annexures' },
]

export function Documents() {
  return (
    <section className="sec wash" id="documents">
      <div className="wrap docs-grid">
        <Reveal>
          <span className="eyebrow">Export documentation centre</span>
          <h2
            className="sec-head"
            style={{
              marginBottom: 14,
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 'clamp(28px,3.6vw,42px)',
              letterSpacing: '-.025em',
              lineHeight: 1.1,
            }}
          >
            Every form your <span className="em amber">shipment needs.</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 440, marginBottom: 24 }}>
            From commercial invoices to carrier authority letters, our documentation library keeps
            exporters moving. Download what you need in PDF or Excel — no account required.
          </p>
          <a href="#contact" className="btn btn-primary">
            Ask about a document →
          </a>
        </Reveal>
        <Reveal delay={1} className="doc-list">
          {DOCS.map((doc) => (
            <div className="doc-chip" key={doc.label}>
              <span className="ext">{doc.ext}</span>
              {doc.label}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
