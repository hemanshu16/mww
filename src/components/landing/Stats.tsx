import { Reveal } from './Reveal'
import { useCountUp } from '@/hooks/useCountUp'

export function Stats() {
  const established = useCountUp<HTMLDivElement>(2001, 24)
  const domesticDays = useCountUp<HTMLSpanElement>(7)
  const intlDays = useCountUp<HTMLSpanElement>(15)
  const docs = useCountUp<HTMLSpanElement>(20)

  return (
    <section className="sec">
      <div className="wrap">
        <div className="stats">
          <Reveal className="stat">
            <div className="num" ref={established.ref}>
              {established.value}
            </div>
            <div className="cap">Established in Rajkot, Gujarat</div>
          </Reveal>
          <Reveal delay={1} className="stat">
            <div className="num">
              <span ref={domesticDays.ref}>{domesticDays.value}</span>
            </div>
            <div className="cap">Days · domestic delivery window</div>
          </Reveal>
          <Reveal delay={2} className="stat">
            <div className="num">
              <span ref={intlDays.ref}>{intlDays.value}</span>
            </div>
            <div className="cap">Days · international delivery window</div>
          </Reveal>
          <Reveal delay={3} className="stat">
            <div className="num">
              <span ref={docs.ref}>{docs.value}</span>
              <span className="u">+</span>
            </div>
            <div className="cap">Export documents, ready to download</div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
