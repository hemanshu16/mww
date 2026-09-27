import { toast } from 'sonner'
import { useDeleteCountry, useUpdateCountry } from '@/hooks/useCountries'
import { getApiErrorMessage } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CountryFlag } from '@/components/countries/CountryFlag'
import type { Country } from '@/lib/types'

export function DeleteCountryDialog({
  country,
  onOpenChange,
}: {
  country: Country | null
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteCountry()
  const update = useUpdateCountry()
  const busy = remove.isPending || update.isPending

  const handleDelete = async () => {
    if (!country) return
    try {
      await remove.mutateAsync(country.id)
      toast.success(`${country.name} deleted.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not delete country.'))
    }
  }

  const handleHide = async () => {
    if (!country) return
    try {
      await update.mutateAsync({ id: country.id, input: { isVisible: false } })
      toast.success(`${country.name} hidden from customers.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not hide country.'))
    }
  }

  return (
    <Dialog open={!!country} onOpenChange={(open) => !busy && onOpenChange(open)}>
      <DialogContent className="max-w-md">
        {country && (
          <>
            <DialogHeader className="gap-3">
              <CountryFlag flagUrl={country.flagUrl} alpha2={country.alpha2} size="lg" />
              <DialogTitle className="text-lg font-semibold">Delete {country.name}?</DialogTitle>
              <DialogDescription>
                This permanently removes {country.name} ({country.alpha3}) and can&apos;t be undone.
                {country.isVisible &&
                  ' To stop new bookings but keep the record, hide it from customers instead.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              {country.isVisible && (
                <Button variant="outline" onClick={handleHide} loading={update.isPending} disabled={busy}>
                  Hide instead
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete} loading={remove.isPending} disabled={busy}>
                Delete country
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
