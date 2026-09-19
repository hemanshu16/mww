import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, ImageOff } from 'lucide-react'
import { requestKycDownloadUrl } from '@/lib/api/uploads'
import { queryKeys } from '@/lib/queryKeys'

const isImage = (path: string) => /\.(png|jpe?g|webp|gif)$/i.test(path)

export function KycDocLink({ label, path }: { label: string; path: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.kycDownload(path),
    queryFn: () => requestKycDownloadUrl(path),
    staleTime: 60 * 1000,
  })

  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {isLoading ? (
        <div className="h-16 w-full animate-pulse rounded-md bg-neutral-200" />
      ) : isError || !data ? (
        <div className="flex h-16 items-center justify-center gap-2 rounded-md border border-dashed border-border text-xs text-muted-foreground">
          <ImageOff className="size-4" /> Unavailable
        </div>
      ) : isImage(path) ? (
        <a href={data.signedUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={data.signedUrl}
            alt={label}
            className="h-24 w-full rounded-md border border-border object-cover transition-opacity hover:opacity-90"
          />
        </a>
      ) : (
        <a
          href={data.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:underline"
        >
          <FileText className="size-4" />
          View document
          <ExternalLink className="ml-auto size-3.5" />
        </a>
      )}
    </div>
  )
}
