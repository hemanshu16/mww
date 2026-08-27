import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dashboardStats, recentShipments } from '@/lib/mockData'

function DashboardHomePage() {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <h2 className="mb-3 text-[17px]">Recent shipments</h2>
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Consignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentShipments.map((ship) => (
              <TableRow key={ship.ref}>
                <TableCell>{ship.ref}</TableCell>
                <TableCell>{ship.route}</TableCell>
                <TableCell>{ship.consignee}</TableCell>
                <TableCell>
                  <StatusBadge tone={ship.statusTone}>{ship.status}</StatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">{ship.eta}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default DashboardHomePage
