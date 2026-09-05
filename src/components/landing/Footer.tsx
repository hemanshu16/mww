export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <a href="#top" className="brand">
              <span className="mark">
                <img src="/logo-mark-white.png" alt="" className="mark-white" />
              </span>
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
