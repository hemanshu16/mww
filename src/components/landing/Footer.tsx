export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <a href="#top" className="brand">
              <svg className="mark" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 4 C15 12 8 14 6 20 C11 21 15 24 20 32 C25 24 29 21 34 20 C32 14 25 12 20 4Z"
                  fill="url(#g2)"
                  opacity=".9"
                />
                <path
                  d="M20 4 C25 12 32 14 34 20 C29 21 25 24 20 32 C20 22 20 12 20 4Z"
                  fill="#F0A93B"
                  opacity=".85"
                />
                <circle cx="20" cy="19" r="2.4" fill="#04122e" />
                <defs>
                  <linearGradient id="g2" x1="6" y1="4" x2="34" y2="32">
                    <stop stopColor="#6ba0ff" />
                    <stop offset="1" stopColor="#2b56a8" />
                  </linearGradient>
                </defs>
              </svg>
              <span>
                Monarch
                <br />
                <small>WORLDWIDE EXPRESS</small>
              </span>
            </a>
            <p>
              Global shipping with a local hand. Air, sea and door-to-door courier and express
              services, delivered with personal care since 2001.
            </p>
          </div>
          <div className="foot-col">
            <h5>Services</h5>
            <a href="#services">Air Freight</a>
            <a href="#services">Sea Freight</a>
            <a href="#services">Door-to-Door</a>
            <a href="#services">Import &amp; Export</a>
          </div>
          <div className="foot-col">
            <h5>Company</h5>
            <a href="#network">Our Network</a>
            <a href="#documents">Documents</a>
            <a href="#track">Track Shipment</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="foot-col">
            <h5>Legal</h5>
            <a href="#">Shipping Policy</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Refund Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2025 Monarch Worldwide Express. All rights reserved.</span>
          <span>Rajkot · Gujarat · India</span>
        </div>
      </div>
    </footer>
  )
}
