const ITEMS = [
  'DHL Express',
  'FedEx',
  'UPS',
  'Air Freight',
  'Sea Freight',
  'Customs Cleared',
  'Door to Door',
]

export function Marquee() {
  return (
    <div className="marquee-sec">
      <div className="wrap">
        <div className="marquee-label">Coordinating worldwide through leading global carriers</div>
        <div className="marquee">
          <div className="marquee-track">
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <span className="m-item" key={`${item}-${i}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
