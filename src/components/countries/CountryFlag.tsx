import { useState } from 'react'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'h-6 w-8 text-[10px]',
  lg: 'h-12 w-16 text-sm',
} as const

/** 4:3 flag with a quiet ISO-code tile when there's no URL or it fails to load. */
export function CountryFlag({
  flagUrl,
  alpha2,
  size = 'sm',
  className,
}: {
  flagUrl: string | null | undefined
  alpha2: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = !!flagUrl && failedUrl !== flagUrl

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#f1f5f9] font-semibold tracking-wide text-[#8291a8] ring-1 ring-inset ring-[rgba(19,41,75,0.08)]',
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={flagUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedUrl(flagUrl)}
        />
      ) : (
        <span aria-hidden>{alpha2 || '··'}</span>
      )}
      {/* Keeps white flag edges from bleeding into the white card. */}
      <span className="pointer-events-none absolute inset-0 rounded-[4px] ring-1 ring-inset ring-[rgba(19,41,75,0.08)]" />
    </span>
  )
}
