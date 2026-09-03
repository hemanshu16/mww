import { useMemo, useState, type ReactNode } from 'react'
import { Reveal } from './Reveal'
import { DOCUMENTS, DOCUMENT_CATEGORIES, type DocCategory, type DocFormat, type DocumentEntry } from '@/data/documents'

const FILTERS: Array<'All' | DocCategory> = ['All', ...DOCUMENT_CATEGORIES]

const FORMAT_LABEL: Record<DocFormat, string> = { pdf: 'PDF', excel: 'XLS', word: 'DOC' }

const CATEGORY_ICON: Record<DocCategory, ReactNode> = {
  Shipping: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 16V6a1 1 0 0 1 1-1h9v11" />
      <path d="M13 9h4l4 4v3h-2" />
      <circle cx="7.5" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
      <path d="M9.3 18.5h6.4" />
    </svg>
  ),
  Customs: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
    </svg>
  ),
  Declarations: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="4" width="12" height="17" rx="1.5" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9 11h6M9 14.5h6M9 18h3.5" />
    </svg>
  ),
  'Authority Letters': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9" />
      <path d="M3 19h18" />
    </svg>
  ),
  Others: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  ),
}

const CATEGORY_VAR: Record<DocCategory, string> = {
  Shipping: 'amber',
  Customs: 'azure',
  Declarations: 'purple',
  'Authority Letters': 'teal',
  Others: 'muted',
}

const ALL_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 2h9l5 5v15H6z" />
    <path d="M15 2v5h5" />
  </svg>
)

const DOC_ICON_TONE = ['azure', 'green', 'amber'] as const

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 4v11" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function FormatPill({ format, href, name }: { format: DocFormat; href: string; name: string }) {
  return (
    <a
      href={href}
      download
      className={`doc-fmt-pill fmt-${format}`}
      aria-label={`Download ${name} as ${FORMAT_LABEL[format]}`}
    >
      <DownloadIcon />
      {FORMAT_LABEL[format]}
    </a>
  )
}

function DocIllustration() {
  return (
    <svg viewBox="0 0 400 360" className="docs-illus" aria-hidden="true">
      <defs>
        <pattern id="docsDots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="1.4" fill="var(--azure)" opacity=".18" />
        </pattern>
        <linearGradient id="docsFolder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3D7BF0" />
          <stop offset="1" stopColor="#1E4FB8" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="185" r="150" fill="url(#docsDots)" />
      <g opacity=".55">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={44 + i * 7} y={40 + i * 7} width="8" height="8" rx="2" fill="var(--azure)" opacity={0.5 - i * 0.12} />
        ))}
      </g>
      <g transform="translate(238,58)">
        <circle cx="30" cy="30" r="30" fill="var(--wash-2)" />
        <path d="M18 34a8 8 0 0 1 3-15 11 11 0 0 1 21-3 8 8 0 0 1 -2 15.8H18Z" fill="#fff" stroke="var(--line-2)" strokeWidth="1.4" />
        <path d="M30 30v11M25 36l5 5 5-5" fill="none" stroke="var(--azure)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="180" y="70" width="98" height="128" rx="8" fill="#fff" stroke="var(--line-2)" strokeWidth="1.5" transform="rotate(-6 229 134)" />
      <rect x="120" y="66" width="98" height="128" rx="8" fill="#fff" stroke="var(--line-2)" strokeWidth="1.5" transform="rotate(4 169 130)" />
      <g transform="rotate(4 169 130)">
        <rect x="132" y="80" width="60" height="6" rx="3" fill="var(--line-2)" />
        <rect x="132" y="93" width="46" height="6" rx="3" fill="var(--line-2)" />
        <rect x="132" y="106" width="52" height="6" rx="3" fill="var(--line-2)" />
      </g>
      <rect x="153" y="150" width="34" height="18" rx="4" fill="#E2574C" transform="rotate(4 169 130)" />
      <text x="170" y="164" transform="rotate(4 169 130)" textAnchor="middle" fontFamily="var(--display)" fontWeight="700" fontSize="9" fill="#fff">
        PDF
      </text>
      <rect x="252" y="150" width="34" height="18" rx="4" fill="var(--green)" transform="rotate(-6 229 134)" />
      <text x="269" y="164" transform="rotate(-6 229 134)" textAnchor="middle" fontFamily="var(--display)" fontWeight="700" fontSize="9" fill="#fff">
        XLS
      </text>
      <path
        d="M110 150h180v96a14 14 0 0 1-14 14H124a14 14 0 0 1-14-14z"
        fill="url(#docsFolder)"
      />
      <path
        d="M110 150l10-24a10 10 0 0 1 9-6h32a10 10 0 0 1 9 5.5l6 12H262a10 10 0 0 1 10 10v2.5H110Z"
        fill="#3D7BF0"
      />
      <circle cx="200" cy="196" r="26" fill="#1E4FB8" />
      <path d="M200 184v22M190 197l10 10 10-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Documents() {
  const [active, setActive] = useState<'All' | DocCategory>('All')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<DocCategory>('Shipping')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DOCUMENTS.filter((doc) => {
      const matchesCategory = active === 'All' || doc.category === active
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [active, query])

  const groups = useMemo(() => {
    const byCategory = new Map<DocCategory, DocumentEntry[]>()
    for (const doc of filtered) {
      if (!byCategory.has(doc.category)) byCategory.set(doc.category, [])
      byCategory.get(doc.category)!.push(doc)
    }
    return DOCUMENT_CATEGORIES.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      docs: byCategory.get(category)!,
    }))
  }, [filtered])

  const searching = query.trim().length > 0 || active !== 'All'
  const popular = DOCUMENTS.filter((d) => d.popular)

  return (
    <section className="sec wash" id="documents">
      <div className="wrap docs-hero">
        <Reveal as="div" className="docs-hero-text">
          <span className="eyebrow">Documentation centre</span>
          <h2 className="docs-h2">
            Shipping documents, <span className="em amber">ready when</span>
            <br />
            you need them.
          </h2>
          <p>
            Access forms, declarations and other documents required for your shipments — no
            account required.
          </p>
        </Reveal>
        <Reveal delay={1} className="docs-hero-art" aria-hidden="true">
          <DocIllustration />
        </Reveal>
      </div>

      <div className="wrap">
        <Reveal className="docs-panel">
          <div className="docs-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="docs-search"
              placeholder="Search documents by name or keyword…"
              aria-label="Search documents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="docs-cats" role="tablist">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={filter === active ? 'doc-tab active' : 'doc-tab'}
                onClick={() => setActive(filter)}
              >
                {filter === 'All' ? ALL_ICON : CATEGORY_ICON[filter]}
                {filter === 'All' ? 'All Documents' : filter}
              </button>
            ))}
          </div>
        </Reveal>

        {popular.length > 0 && !searching && (
          <Reveal className="docs-popular">
            <div className="docs-popular-head">
              <span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="1">
                  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
                </svg>
                Popular documents
              </span>
              <button className="docs-view-all" onClick={() => setActive('All')}>
                View all
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="docs-popular-grid">
              {popular.map((doc, i) => (
                <div className="doc-pop-card" key={doc.id}>
                  <span className={`doc-pop-ico tone-${DOC_ICON_TONE[i % 3]}`}>
                    <DocIcon />
                  </span>
                  <div className="doc-pop-body">
                    <h3>{doc.name}</h3>
                    <p>{doc.description}</p>
                  </div>
                  <div className="doc-pop-formats">
                    {(Object.entries(doc.files) as Array<[DocFormat, string]>).map(([format, href]) => (
                      <FormatPill key={format} format={format} href={href} name={doc.name} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {groups.length > 0 ? (
          <Reveal as="div" className="doc-library">
            {groups.map((group) => {
              const isOpen = searching || expanded === group.category
              const tone = CATEGORY_VAR[group.category]
              return (
                <div className="doc-accordion" key={group.category}>
                  <button
                    className="doc-accordion-head"
                    style={{ color: `var(--${tone})` }}
                    onClick={() => setExpanded(group.category)}
                    aria-expanded={isOpen}
                  >
                    <span className="doc-accordion-title">{group.category}</span>
                    <span className="doc-accordion-count">
                      {group.docs.length} document{group.docs.length === 1 ? '' : 's'}
                    </span>
                    <svg
                      className="doc-accordion-chevron"
                      style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className="doc-accordion-body" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                    <div className="doc-accordion-inner">
                      {group.docs.map((doc) => (
                        <div className="doc-row" key={doc.id}>
                          <span className="doc-row-ico" aria-hidden="true">
                            <DocIcon />
                          </span>
                          <div className="doc-row-main">
                            <span className="doc-row-name">{doc.name}</span>
                            <span className="doc-row-desc">{doc.description}</span>
                          </div>
                          <div className="doc-row-formats">
                            {(Object.entries(doc.files) as Array<[DocFormat, string]>).map(([format, href]) => (
                              <FormatPill key={format} format={format} href={href} name={doc.name} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </Reveal>
        ) : (
          <Reveal className="doc-empty">No documents match your search.</Reveal>
        )}

        <Reveal className="docs-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--azure)" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5.5M12 8v.01" />
          </svg>
          <p>
            All documents are provided in commonly used formats. If you need any other format or
            assistance, please contact our support team.
          </p>
          <a href="#contact" className="docs-view-all">
            Contact us
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  )
}
