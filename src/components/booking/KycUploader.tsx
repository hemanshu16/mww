import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2, UploadCloud, X } from 'lucide-react'
import { uploadKycFile } from '@/lib/api/uploads'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf'
const MAX_BYTES = 10 * 1024 * 1024

/** Show only the trailing file name from a storage path like kyc/<id>/<uuid>-name.jpg. */
function displayName(path: string): string {
  const base = path.split('/').pop() ?? path
  return base.replace(/^[0-9a-f-]{8,}-/i, '')
}

export function KycUploader({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (path: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error('File too large. Maximum size is 10 MB.')
      return
    }
    setProgress(0)
    try {
      const path = await uploadKycFile(file, (f) => setProgress(Math.round(f * 100)))
      onChange(path)
      toast.success(`${label} uploaded.`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Upload failed.'))
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const uploading = progress !== null

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <FileText className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm" title={value}>
            {displayName(value)}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Remove ${label}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-card px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading… {progress}%
            </>
          ) : (
            <>
              <UploadCloud className="size-4" />
              Upload file
            </>
          )}
        </button>
      )}
    </div>
  )
}
