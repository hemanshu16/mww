import { Reveal } from './Reveal'

export function Purpose() {
  return (
    <section className="sec">
      <div className="wrap">
        <Reveal className="purpose">
          <div className="quote-mark">&ldquo;</div>
          <blockquote>
            Our purpose is to enable and empower connections between{' '}
            <span className="em">businesses, markets and people</span> — and to do it sustainably,
            with care in every hand-off.
          </blockquote>
          <div className="who">
            <div className="av">RA</div>
            <div>
              <b>Ridham Akabari</b>
              <span>Founder · Monarch Worldwide Express</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
