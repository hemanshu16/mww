import { ImagePlus, Plus } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/useAuth'
import { teamMembers } from '@/lib/mockData'

function ProfilePage() {
  const { profile } = useAuth()

  return (
    <div>
      <div className="mb-6 grid max-w-[900px] grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Company details
          </div>
          <FormField label="Company name" defaultValue={profile?.companyName} />
          <FormField label="GSTIN" placeholder="22AAAAA0000A1Z5" />
          <FormField
            label="Contact person"
            defaultValue={`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()}
          />
          <FormField label="Email" type="email" defaultValue={profile?.email} />
          <FormField label="Phone" type="tel" defaultValue={profile?.phoneNumber} />
          <Button className="mt-1 self-start">Save changes</Button>
        </Card>
        <Card className="gap-4 p-5">
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Company logo
          </div>
          <div className="flex min-h-55 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-input text-sm text-muted-foreground">
            <ImagePlus className="size-8" />
            <p>Drop your company logo</p>
          </div>
        </Card>
      </div>

      <div className="mb-3 flex max-w-[900px] items-center justify-between gap-3">
        <h2 className="text-[17px]">Team &amp; sub-user access</h2>
        <Button variant="secondary" size="sm">
          <Plus className="size-3.5" />
          Invite member
        </Button>
      </div>
      <div className="max-w-[900px] overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.email}>
                <TableCell>{member.name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>
                  <StatusBadge tone={member.statusTone}>{member.status}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProfilePage
