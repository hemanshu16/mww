import { useSearchParams } from 'react-router-dom'

/**
 * List filters kept in the URL, so reloads, back/forward and shared links keep
 * them. Any change other than `page` goes back to page 1.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams()

  const get = (key: string) => params.get(key) ?? ''
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const set = (patch: Record<string, string | null | undefined>, opts?: { replace?: boolean }) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        if (!('page' in patch)) next.delete('page')
        return next
      },
      { replace: opts?.replace },
    )

  /** "true" / "false" → boolean; anything else → undefined. */
  const bool = (key: string) => {
    const v = params.get(key)
    return v === 'true' ? true : v === 'false' ? false : undefined
  }

  const num = (key: string) => {
    const v = params.get(key)
    return v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined
  }

  const date = (key: string) => {
    const v = params.get(key) ?? ''
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
  }

  return { params, get, bool, num, date, page, set }
}
