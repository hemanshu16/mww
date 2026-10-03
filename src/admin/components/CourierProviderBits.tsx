import { useState } from 'react'
import { toast } from 'sonner'
import { useSetCourierProviderStatus } from '@/admin/hooks'
import type { AdminCourierProvider } from '@/admin/types'
import { getApiErrorMessage } from '@/lib/api/client'
import { Switch } from '@/components/ui/switch'

export function ProviderLogo({ provider }: { provider: AdminCourierProvider }) {
  const [broken, setBroken] = useState(false)
  if (!provider.logoUrl || broken) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f5f9] text-sm font-semibold text-[#526581]">
        {provider.name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={provider.logoUrl}
      alt=""
      onError={() => setBroken(true)}
      className="size-10 shrink-0 rounded-[10px] border border-border bg-white object-contain p-1"
    />
  )
}

export function ProviderStatusSwitch({ provider }: { provider: AdminCourierProvider }) {
  const setStatus = useSetCourierProviderStatus()
  return (
    <Switch
      checked={provider.status === 'ACTIVE'}
      aria-label={`${provider.name} active`}
      onCheckedChange={(active) =>
        setStatus.mutate(
          { id: provider.id, status: active ? 'ACTIVE' : 'INACTIVE' },
          {
            onSuccess: () =>
              toast.success(
                active
                  ? `${provider.name} is now shown to customers.`
                  : `${provider.name} is now hidden from customers.`,
              ),
            onError: (error) => toast.error(getApiErrorMessage(error, 'Could not change status.')),
          },
        )
      }
    />
  )
}
