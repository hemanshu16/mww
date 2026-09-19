import { apiClient } from '@/lib/api/client'
import type { KycDownloadUrl, KycUploadUrl } from '@/lib/types'

export function requestKycUploadUrl(fileName: string, contentType?: string) {
  return apiClient.post<KycUploadUrl>('/uploads/kyc/upload-url', { fileName, contentType })
}

export function requestKycDownloadUrl(path: string) {
  return apiClient.post<KycDownloadUrl>('/uploads/kyc/download-url', { path })
}

/**
 * Full KYC upload: ask for a signed URL, PUT the raw bytes to storage, and
 * return the storage `path` string to persist on the shipper record.
 * `onProgress` reports 0..1; uses XHR so we get upload progress events.
 */
export async function uploadKycFile(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const { path, signedUrl } = await requestKycUploadUrl(file.name, file.type || undefined)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl, true)
    if (file.type) xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'))
    xhr.send(file)
  })

  onProgress?.(1)
  return path
}
