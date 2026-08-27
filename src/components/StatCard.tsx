import { Card } from '@/components/ui/card'

export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="gap-2 p-5">
      <div className="text-[11px] font-bold tracking-wider text-primary uppercase">{label}</div>
      <div className="font-heading text-[28px] leading-none text-foreground">{value}</div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </Card>
  )
}
