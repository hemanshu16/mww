/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Base for the postal-code lookup (defaults to the dev proxy, `/postal-api`). */
  readonly VITE_POSTAL_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
