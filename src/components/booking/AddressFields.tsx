import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Step2FormValues } from '@/lib/bookingSchemas'

type Party = 'shipper' | 'consignee'
type AddressField =
  | 'fullName'
  | 'attention'
  | 'address1'
  | 'address2'
  | 'address3'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'country'
  | 'phoneNo'
  | 'phoneNoAlt'
  | 'email'
  | 'reference'

export function AddressFields({ party }: { party: Party }) {
  const { control } = useFormContext<Step2FormValues>()
  const name = (field: AddressField): `${Party}.${AddressField}` => `${party}.${field}`

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={name('fullName')}
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Full name</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={name('attention')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attention</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={name('reference')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name={name('address1')}
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Address line 1</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={name('address2')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address line 2</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={name('address3')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address line 3</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={name('city')}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>City</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={name('state')}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>State / region</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={name('zipCode')}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>ZIP / postal code</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={name('country')}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Country (ISO-2)</FormLabel>
              <FormControl>
                <Input placeholder="IN" maxLength={2} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={name('phoneNo')}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Phone</FormLabel>
              <FormControl>
                <Input type="tel" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={name('phoneNoAlt')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alt. phone</FormLabel>
              <FormControl>
                <Input type="tel" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name={name('email')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
