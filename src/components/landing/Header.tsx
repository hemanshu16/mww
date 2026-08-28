import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#network', label: 'Network' },
  { href: '#documents', label: 'Documents' },
  { href: '#track', label: 'Track' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn(scrolled && 'scrolled')}>
      <nav className="nav">
        <a href="#top" className="brand">
          <svg className="mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 4 C15 12 8 14 6 20 C11 21 15 24 20 32 C25 24 29 21 34 20 C32 14 25 12 20 4Z"
              fill="url(#g1)"
              opacity=".9"
            />
            <path
              d="M20 4 C25 12 32 14 34 20 C29 21 25 24 20 32 C20 22 20 12 20 4Z"
              fill="var(--amber)"
              opacity=".85"
            />
            <circle cx="20" cy="19" r="2.4" fill="#04122e" />
            <defs>
              <linearGradient id="g1" x1="6" y1="4" x2="34" y2="32">
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
        <div className={cn('nav-links', menuOpen && 'open')}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link to="/login" className="nav-login" onClick={() => setMenuOpen(false)}>
            Client Login
          </Link>
        </div>
        <div className="nav-cta">
          <a href="#track" className="btn btn-ghost">
            Track shipment
          </a>
          <a href="#contact" className="btn btn-primary">
            Request a quote
          </a>
          <button className="menu-toggle" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            <svg width="18" height="14" viewBox="0 0 18 14" stroke="var(--text)" strokeWidth="2">
              <path d="M0 1h18M0 7h18M0 13h18" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
