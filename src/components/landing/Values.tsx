import { Reveal } from './Reveal'

const VALUES = [
  { n: '01', title: 'Professionalism', body: 'Responsible, dependable execution on every consignment.' },
  { n: '02', title: 'Team Work', body: 'People working together to deliver a better outcome for you.' },
  { n: '03', title: 'Customer Focus', body: 'Your needs and satisfaction sit at the centre of every decision.' },
  { n: '04', title: 'Value for Money', body: 'Services priced to deliver genuine, meaningful value.' },
  { n: '05', title: 'Caring', body: 'Personal attention to you and to every shipment we carry.' },
]

export function Values() {
  return (
    <section className="sec">
      <div className="wrap">
        <Reveal as="div" className="sec-head center">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            What we stand on
          </span>
          <h2>
            Five values, <span className="em amber">held since day one.</span>
          </h2>
        </Reveal>
        <div className="values">
          {VALUES.map((v, i) => (
            <Reveal key={v.n} className="value" delay={i === 0 ? undefined : ((i as 1 | 2 | 3 | 4))}>
              <div className="vn">{v.n}</div>
              <h4>{v.title}</h4>
              <p>{v.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
