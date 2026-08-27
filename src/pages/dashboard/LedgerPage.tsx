import { StatCard } from '@/components/StatCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { courierBreakdown, ledgerEntries, ledgerStats } from '@/lib/mockData'

function LedgerPage() {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ledgerStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <h2 className="mb-3 text-[17px]">Account statement</h2>
      <div className="mb-6 overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerEntries.map((entry) => (
              <TableRow key={`${entry.date}-${entry.desc}`}>
                <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                <TableCell>{entry.desc}</TableCell>
                <TableCell className="text-right tabular-nums">{entry.debit}</TableCell>
                <TableCell className="text-right tabular-nums">{entry.credit}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {entry.balance}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <h2 className="mb-3 text-[17px]">Courier-wise breakdown</h2>
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Courier partner</TableHead>
              <TableHead>Shipments</TableHead>
              <TableHead>Total spend</TableHead>
              <TableHead>Avg. cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courierBreakdown.map((c) => (
              <TableRow key={c.partner}>
                <TableCell>{c.partner}</TableCell>
                <TableCell className="text-right tabular-nums">{c.shipments}</TableCell>
                <TableCell className="text-right tabular-nums">{c.spend}</TableCell>
                <TableCell className="text-right tabular-nums">{c.avgCost}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default LedgerPage
