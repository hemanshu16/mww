import { Link } from 'react-router-dom'

const COMPANY_LINKS = [
  { label: 'About Us', href: '#' },
  { label: 'Our Network', href: '#network' },
  { label: 'Careers', href: '#' },
  { label: 'Contact Us', href: '#contact' },
]

const SERVICE_LINKS = [
  { label: 'Ocean Freight', href: '#services' },
  { label: 'Air Freight', href: '#services' },
  { label: 'Domestic Logistics', href: '#services' },
]

const SUPPORT_LINKS = [
  { label: 'Track Shipment', href: '#track' },
  { label: 'Client Login', href: '/login' },
  { label: 'Documents', href: '#documents' },
  { label: 'Request a Quote', href: '#contact' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Sitemap', href: '#' },
]

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="7.5" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <path d="M7.5 10.5v6" />
      <path d="M12 16.5v-3.8c0-1.4.9-2.3 2.2-2.3s2.3.9 2.3 2.3v3.8" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.3 9.3l5 2.7-5 2.7z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

const SOCIALS = [
  { label: 'LinkedIn', icon: LinkedInIcon },
  { label: 'Twitter / X', icon: XIcon },
  { label: 'YouTube', icon: YouTubeIcon },
  { label: 'Instagram', icon: InstagramIcon },
]

function LinkColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div className="foot-col">
      <h5>{heading}</h5>
      {links.map((link) =>
        link.href.startsWith('#') ? (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ) : (
          <Link key={link.label} to={link.href}>
            {link.label}
          </Link>
        ),
      )}
    </div>
  )
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-card">
          <div className="foot-grid">
            <div className="foot-brand-col">
              <a href="#top" className="foot-logo">
                <img src="/logo-mark.png" alt="" />
                <span>
                  Monarch
                  <br />
                  <small>WORLDWIDE EXPRESS</small>
                </span>
              </a>
              <p className="foot-tagline">
                Connecting businesses.
                <br />
                Powering possibilities.
              </p>
              <div className="foot-social">
                {SOCIALS.map(({ label, icon: Icon }) => (
                  <a key={label} href="#" aria-label={label}>
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            <LinkColumn heading="Company" links={COMPANY_LINKS} />
            <LinkColumn heading="Services" links={SERVICE_LINKS} />
            <LinkColumn heading="Support" links={SUPPORT_LINKS} />
          </div>

          <div className="foot-divider2" />

          <div className="foot-bottom2">
            <span>© 2026 Monarch Worldwide Express. All rights reserved.</span>
            <nav className="foot-legal">
              {LEGAL_LINKS.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
