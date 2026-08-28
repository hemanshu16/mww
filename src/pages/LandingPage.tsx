import { useEffect } from 'react'
import '@/styles/landing.css'
import { Header } from '@/components/landing/Header'
import { Hero } from '@/components/landing/Hero'
import { Marquee } from '@/components/landing/Marquee'
import { Stats } from '@/components/landing/Stats'
import { Services } from '@/components/landing/Services'
import { Network } from '@/components/landing/Network'
import { Purpose } from '@/components/landing/Purpose'
import { Values } from '@/components/landing/Values'
import { Documents } from '@/components/landing/Documents'
import { TrackSection } from '@/components/landing/TrackSection'
import { Contact } from '@/components/landing/Contact'
import { Footer } from '@/components/landing/Footer'

const PAGE_TITLE = 'Monarch Worldwide Express — Global Courier & Express Shipping'
const PAGE_DESCRIPTION =
  "Monarch Worldwide Express moves your air, sea and door-to-door shipments across India and the world — the personal touch of an independent courier with the reach of a global network. Since 2001."
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap'

function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = PAGE_TITLE

    const meta = document.createElement('meta')
    meta.name = 'description'
    meta.content = PAGE_DESCRIPTION
    document.head.appendChild(meta)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    document.head.appendChild(link)

    return () => {
      document.title = previousTitle
      meta.remove()
      link.remove()
    }
  }, [])

  return (
    <div className="monarch-landing">
      <Header />
      <main id="top">
        <Hero />
        <Marquee />
        <Stats />
        <Services />
        <Network />
        <Purpose />
        <Values />
        <Documents />
        <TrackSection />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
