import { useState, type FormEvent } from 'react'
import { Reveal } from './Reveal'

export function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="sec" id="contact">
      <div className="wrap contact-grid">
        <Reveal className="contact-info">
          <span className="eyebrow">Let&rsquo;s move it</span>
          <h2>
            Request a <span className="em amber">shipping quote.</span>
          </h2>
          <p>
            Tell us where it&rsquo;s going and what you&rsquo;re sending. We&rsquo;ll come back
            with a route, a rate and a real person to look after it.
          </p>
          <div className="ci-row">
            <div className="ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>
            <div>
              <div className="k">Visit us</div>
              <div className="v">
                Office No. 13, Umesh Commercial Complex, Nr. Chaudhari High School, Rajkot -
                360001, Gujarat, India
              </div>
            </div>
          </div>
          <div className="ci-row">
            <div className="ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4h16v16H4zM4 7l8 5 8-5" />
              </svg>
            </div>
            <div>
              <div className="k">Email</div>
              <div className="v">
                <a href="mailto:cs.monarchwwe@gmail.com">cs.monarchwwe@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="ci-row">
            <div className="ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 4h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <div className="k">Call</div>
              <div className="v">
                <a href="tel:+919909497320">+91 99094 97320</a>
              </div>
              <div className="v-note">Ridham Akabari</div>
            </div>
          </div>
        </Reveal>

        <Reveal as="form" delay={1} className="form" onSubmit={onSubmit}>
          <h3>Get a quote</h3>
          <p className="sub">Usually answered within one working day.</p>
          <div className="field-row">
            <div className="field">
              <label>Full name</label>
              <input type="text" placeholder="Your name" />
            </div>
            <div className="field">
              <label>Company</label>
              <input type="text" placeholder="Company name" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@company.com" />
            </div>
            <div className="field">
              <label>Mobile</label>
              <input type="tel" placeholder="+91" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>From</label>
              <input type="text" placeholder="Pickup city" />
            </div>
            <div className="field">
              <label>To</label>
              <input type="text" placeholder="Destination city" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Mode</label>
              <select>
                <option>Air freight</option>
                <option>Sea freight</option>
                <option>Door-to-door</option>
                <option>Not sure yet</option>
              </select>
            </div>
            <div className="field">
              <label>Scope</label>
              <select>
                <option>International</option>
                <option>Domestic</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>What are you shipping?</label>
            <textarea placeholder="Contents, approx. weight & number of packages, preferred date…" />
          </div>
          <button className="btn btn-amber" type="submit">
            Request my quote
          </button>
          <div className="form-note" style={submitted ? { color: 'var(--amber)' } : undefined}>
            {submitted
              ? "✓ Thanks — your quote request is on its way. We'll reply within one working day."
              : 'Your details go straight to our team — never sold or shared.'}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
