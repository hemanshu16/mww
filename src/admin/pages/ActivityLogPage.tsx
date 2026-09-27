import { X } from 'lucide-react'
import { useActivityLogs, useLookupStaff } from '@/admin/hooks'
import { useUrlFilters } from '@/admin/useUrlFilters'
import { ActivityList } from '@/admin/components/activity/ActivityList'
import { AUDIT_ACTIONS, ENTITY_LABELS } from '@/admin/components/activity/activityMeta'
import { DateRange } from '@/admin/components/ListControls'
import { AUDIT_ENTITY_TYPES, type AuditEntityType } from '@/admin/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 25
const ALL = 'all'

export default function ActivityLogPage() {
  const f = useUrlFilters()
  const staff = useLookupStaff()

  const typeParam = f.get('type')
  const entityType = (AUDIT_ENTITY_TYPES as readonly string[]).includes(typeParam)
    ? (typeParam as AuditEntityType)
    : undefined
  const actorId = f.get('actor') || undefined
  const action = f.get('action') || undefined
  const from = f.date('from')
  const to = f.date('to')

  const { data, isLoading, isError } = useActivityLogs({
    page: f.page,
    limit: PAGE_SIZE,
    entityType,
    actorId,
    action,
    from,
    to,
  })
  const filtered = !!(entityType || actorId || action || from || to)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Every change made by staff: who, what, when, and which fields changed."
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto] xl:items-end">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Record type</p>
            <Select
              value={entityType ?? ALL}
              onValueChange={(v) => f.set({ type: v === ALL ? null : v })}
            >
              <SelectTrigger className="h-10" aria-label="Record type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All records</SelectItem>
                {AUDIT_ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ENTITY_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Staff member</p>
            <Select
              value={actorId ?? ALL}
              onValueChange={(v) => f.set({ actor: v === ALL ? null : v })}
            >
              <SelectTrigger className="h-10" aria-label="Staff member">
                <SelectValue placeholder={staff.isLoading ? 'Loading…' : undefined} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Everyone</SelectItem>
                {(staff.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {!s.isActive && ' (inactive)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Action</p>
            <Select
              value={action ?? ALL}
              onValueChange={(v) => f.set({ action: v === ALL ? null : v })}
            >
              <SelectTrigger className="h-10" aria-label="Action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All actions</SelectItem>
                {AUDIT_ACTIONS.map((g) => (
                  <SelectGroup key={g.group}>
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.group}
                    </p>
                    {g.actions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DateRange
            label="Date"
            idPrefix="activity"
            from={f.get('from')}
            to={f.get('to')}
            onChange={(from, to) => f.set({ from, to })}
          />
          {filtered && (
            <Button
              variant="ghost"
              className="h-10"
              onClick={() => f.set({ type: null, actor: null, action: null, from: null, to: null })}
            >
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      </Card>

      <ActivityList
        items={data?.items ?? []}
        pagination={data?.pagination}
        page={f.page}
        onPage={(p) => f.set({ page: String(p) })}
        isLoading={isLoading}
        isError={isError}
        emptyText={filtered ? 'No activity matches these filters.' : 'No activity yet.'}
      />
    </div>
  )
}
