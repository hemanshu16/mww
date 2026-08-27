import { useEffect } from 'react'
import landingHtml from '@/assets/landing/monarch-landing.html?raw'

const titleMatch = landingHtml.match(/<title>([\s\S]*?)<\/title>/)
const descriptionMatch = landingHtml.match(/<meta name="description" content="([\s\S]*?)">/)
const fontHrefs = [...landingHtml.matchAll(/<link[^>]*href="(https:\/\/fonts\.[^"]+)"[^>]*>/g)].map(
  (m) => m[1],
)
const styleMatch = landingHtml.match(/<style>([\s\S]*?)<\/style>/)
const bodyMatch = landingHtml.match(/<body>([\s\S]*?)<\/body>/)
const scriptBlocks = [...landingHtml.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => ({
  src: m[1].match(/src="([^"]+)"/)?.[1] ?? null,
  content: m[2],
}))

const PAGE_TITLE = titleMatch?.[1] ?? 'Monarch Worldwide Express'
const PAGE_DESCRIPTION = descriptionMatch?.[1] ?? ''

// The stylesheet targets the real <body> element; scope it to the wrapper div instead
// since the landing page is mounted inside the app's own <body>.
const scopedStyle = (styleMatch?.[1] ?? '').replace(/(^|\})(\s*)body\{/g, '$1$2.monarch-landing{')

// Scripts are stripped out of the body markup here and re-inserted as real <script>
// elements in an effect below, since scripts inside dangerouslySetInnerHTML never execute.
const bodyContent = (bodyMatch?.[1] ?? '').replace(/<script[\s\S]*?<\/script>/g, '')

function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = PAGE_TITLE

    const addedHeadNodes: HTMLElement[] = []

    if (PAGE_DESCRIPTION) {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = PAGE_DESCRIPTION
      document.head.appendChild(meta)
      addedHeadNodes.push(meta)
    }

    fontHrefs.forEach((href) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      addedHeadNodes.push(link)
    })

    // A src script must finish loading before the next script runs (the inline
    // globe script depends on the three.js CDN script's THREE global) — an inline
    // script inserted right after a <script src> executes immediately regardless
    // of that src script's load state, so they're chained explicitly via onload.
    const addedScripts: HTMLScriptElement[] = []
    let cancelled = false
    function runNext(blocks: typeof scriptBlocks) {
      if (cancelled || blocks.length === 0) return
      const [{ src, content }, ...rest] = blocks
      const script = document.createElement('script')
      addedScripts.push(script)
      if (src) {
        script.src = src
        script.onload = () => runNext(rest)
        document.body.appendChild(script)
      } else {
        script.textContent = content
        document.body.appendChild(script)
        runNext(rest)
      }
    }
    runNext(scriptBlocks)

    return () => {
      cancelled = true
      document.title = previousTitle
      addedHeadNodes.forEach((node) => node.remove())
      addedScripts.forEach((node) => node.remove())
      delete (window as unknown as Record<string, unknown>).doTrack
      delete (window as unknown as Record<string, unknown>).submitQuote
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scopedStyle }} />
      <div className="monarch-landing" dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  )
}

export default LandingPage
