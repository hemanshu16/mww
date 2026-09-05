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
          <img className="mark" src="/logo-mark.png" alt="" />
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
