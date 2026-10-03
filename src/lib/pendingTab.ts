/**
 * A new tab for a link we don't have yet (e.g. a signed PDF URL).
 *
 * The tab has to be opened inside the click, or popup blockers stop it, but
 * the URL arrives a few seconds later. Meanwhile we draw a small loading page
 * in it (it's about:blank, so same-origin and writable) instead of leaving it
 * white. Returns null when the browser blocked the popup anyway.
 */
export function openPendingTab(label: string) {
  const tab = window.open('', '_blank')
  if (!tab) return null
  // Keep the opened page from reaching back into the app.
  tab.opener = null

  try {
    tab.document.title = `Preparing ${label}…`
    tab.document.body.innerHTML = LOADER_HTML.replace('{label}', escapeHtml(label))
    const style = tab.document.createElement('style')
    style.textContent = LOADER_CSS
    tab.document.head.appendChild(style)
  } catch {
    /* Not writable in this browser; it just stays blank. */
  }

  return {
    go: (url: string) => tab.location.replace(url),
    close: () => tab.close(),
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

const LOADER_HTML = `
  <main>
    <div class="spinner" role="status" aria-label="Loading"></div>
    <h1>Preparing {label}…</h1>
    <p>This can take a few seconds. It will open here automatically.</p>
  </main>`

const LOADER_CSS = `
  :root { color-scheme: light dark; }
  html, body { height: 100%; margin: 0; }
  body {
    display: grid; place-items: center;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #f6f9fd; color: #0f1f36;
  }
  main { text-align: center; padding: 24px; }
  h1 { margin: 20px 0 6px; font-size: 17px; font-weight: 600; }
  p { margin: 0; font-size: 14px; color: #526581; }
  .spinner {
    width: 36px; height: 36px; margin: 0 auto;
    border: 3px solid #d5dde8; border-top-color: #2563eb; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-color-scheme: dark) {
    body { background: #0b1220; color: #e6edf7; }
    p { color: #9aa8ba; }
    .spinner { border-color: #2a3a52; border-top-color: #60a5fa; }
  }
  @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2.4s; } }`
