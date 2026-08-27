import type { StatusTone } from '@/components/StatusBadge'

export const dashboardStats = [
  { label: 'Active shipments', value: '128', note: '+12 since yesterday' },
  { label: 'Pending pickups', value: '24', note: '6 due today' },
  { label: 'Deliveries today', value: '86', note: 'Target 100' },
  { label: 'Revenue (month)', value: '₹18.4L', note: '+8.2% MoM' },
  { label: 'Outstanding payments', value: '₹3.2L', note: '14 invoices' },
  { label: 'Fleet status', value: '42 / 48', note: '6 in maintenance' },
  { label: 'Delayed / exceptions', value: '5', note: '3 on customs hold' },
  { label: 'On-time delivery rate', value: '96.4%', note: 'Last 30 days' },
]

export const recentShipments: {
  ref: string
  route: string
  consignee: string
  status: string
  statusTone: StatusTone
  eta: string
}[] = [
  {
    ref: 'CB-48211',
    route: 'Mumbai → Pune',
    consignee: 'R. Sharma',
    status: 'In transit',
    statusTone: 'outline',
    eta: 'Today, 6 PM',
  },
  {
    ref: 'CB-48198',
    route: 'Delhi → Jaipur',
    consignee: 'A. Kapoor',
    status: 'Delivered',
    statusTone: 'neutral',
    eta: 'Yesterday',
  },
  {
    ref: 'CB-48176',
    route: 'Bengaluru → Chennai',
    consignee: 'S. Iyer',
    status: 'Delayed',
    statusTone: 'gold',
    eta: 'Tomorrow',
  },
  {
    ref: 'CB-48155',
    route: 'Hyderabad → Nagpur',
    consignee: 'V. Rao',
    status: 'Pending pickup',
    statusTone: 'outline',
    eta: '25 Aug',
  },
  {
    ref: 'CB-48120',
    route: 'Ahmedabad → Surat',
    consignee: 'M. Patel',
    status: 'Delivered',
    statusTone: 'neutral',
    eta: '2 days ago',
  },
]

export const paymentStats = [
  { label: 'Outstanding', value: '₹3,20,400' },
  { label: 'Paid this month', value: '₹9,84,120' },
  { label: 'Overdue', value: '₹64,900' },
]

export const invoices: {
  id: string
  date: string
  amount: string
  status: string
  statusTone: StatusTone
  due: string
}[] = [
  {
    id: 'INV-2216',
    date: '18 Aug',
    amount: '₹42,300',
    status: 'Paid',
    statusTone: 'neutral',
    due: '—',
  },
  {
    id: 'INV-2209',
    date: '12 Aug',
    amount: '₹18,900',
    status: 'Due',
    statusTone: 'outline',
    due: '28 Aug',
  },
  {
    id: 'INV-2198',
    date: '04 Aug',
    amount: '₹64,900',
    status: 'Overdue',
    statusTone: 'gold',
    due: '15 Aug',
  },
  {
    id: 'INV-2181',
    date: '27 Jul',
    amount: '₹96,400',
    status: 'Paid',
    statusTone: 'neutral',
    due: '—',
  },
  {
    id: 'INV-2170',
    date: '19 Jul',
    amount: '₹31,200',
    status: 'Paid',
    statusTone: 'neutral',
    due: '—',
  },
  {
    id: 'INV-2154',
    date: '08 Jul',
    amount: '₹12,800',
    status: 'Due',
    statusTone: 'outline',
    due: '05 Sep',
  },
]

export const ledgerStats = [
  { label: 'Opening balance', value: '₹1,20,000' },
  { label: 'Total debits', value: '₹4,86,300' },
  { label: 'Total credits', value: '₹5,10,000' },
  { label: 'Closing balance', value: '₹1,43,700' },
]

export const ledgerEntries = [
  {
    date: '18 Aug',
    desc: 'Invoice INV-2216 payment',
    debit: '—',
    credit: '₹42,300',
    balance: '₹1,62,300',
  },
  {
    date: '15 Aug',
    desc: 'Shipment CB-48176 charge',
    debit: '₹5,400',
    credit: '—',
    balance: '₹1,20,000',
  },
  {
    date: '10 Aug',
    desc: 'Shipment CB-48155 charge',
    debit: '₹3,200',
    credit: '—',
    balance: '₹1,25,400',
  },
  {
    date: '04 Aug',
    desc: 'Invoice INV-2198 due',
    debit: '₹64,900',
    credit: '—',
    balance: '₹1,28,600',
  },
  {
    date: '27 Jul',
    desc: 'Invoice INV-2181 payment',
    debit: '—',
    credit: '₹96,400',
    balance: '₹1,93,500',
  },
  {
    date: '19 Jul',
    desc: 'Shipment CB-48091 charge',
    debit: '₹2,900',
    credit: '—',
    balance: '₹97,100',
  },
]

export const courierBreakdown = [
  { partner: 'Bluedart', shipments: '312', spend: '₹2,14,600', avgCost: '₹688' },
  { partner: 'Delhivery', shipments: '198', spend: '₹1,32,900', avgCost: '₹671' },
  { partner: 'DTDC', shipments: '86', spend: '₹58,400', avgCost: '₹679' },
  { partner: 'In-house fleet', shipments: '44', spend: '₹80,400', avgCost: '₹1,827' },
]

export const teamMembers: {
  name: string
  email: string
  role: string
  status: string
  statusTone: StatusTone
}[] = [
  {
    name: 'Jaydeep Kulkarni',
    email: 'jaydeep@jkenterprise.com',
    role: 'Owner',
    status: 'Active',
    statusTone: 'neutral',
  },
  {
    name: 'Priya Nair',
    email: 'priya@jkenterprise.com',
    role: 'Operations',
    status: 'Active',
    statusTone: 'neutral',
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan@jkenterprise.com',
    role: 'Accounts',
    status: 'Active',
    statusTone: 'neutral',
  },
  {
    name: 'Sana Sheikh',
    email: 'sana@jkenterprise.com',
    role: 'Operations',
    status: 'Invited',
    statusTone: 'outline',
  },
]
