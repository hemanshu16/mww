import { Download } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { invoices, paymentStats } from '@/lib/mockData'

function PaymentPage() {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {paymentStats.map((stat) => (
          <Card key={stat.label} className="gap-2 p-5">
            <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
              {stat.label}
            </div>
            <div className="font-heading text-[26px] leading-none">{stat.value}</div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-[17px]">Invoices</h2>
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.id}</TableCell>
                <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                <TableCell>{inv.amount}</TableCell>
                <TableCell>
                  <StatusBadge tone={inv.statusTone}>{inv.status}</StatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">{inv.due}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" aria-label={`Download ${inv.id}`}>
                    <Download />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default PaymentPage
