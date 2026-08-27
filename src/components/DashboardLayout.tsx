import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookText,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileJson,
  FileSpreadsheet,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  User,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/dashboard/courier-booking', label: 'Courier Booking', icon: Package },
  { to: '/dashboard/rate-import', label: 'Rate Import', icon: FileSpreadsheet },
  { to: '/dashboard/provider-export', label: 'Provider Export', icon: FileJson },
  { to: '/dashboard/rate-import-2', label: 'Rate Import 2', icon: FileSpreadsheet },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/ledger', label: 'Ledger', icon: BookText },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
]

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Live overview of shipments, revenue and fleet health',
  },
  '/dashboard/courier-booking': {
    title: 'Courier Booking',
    subtitle: 'Calculate a rate and schedule a pickup',
  },
  '/dashboard/rate-import': {
    title: 'Rate Import',
    subtitle: 'Manually map provider rate sheets sheet-by-sheet',
  },
  '/dashboard/provider-export': {
    title: 'Provider Export',
    subtitle: 'Upload a known provider file, parse it automatically, view and download the JSON',
  },
  '/dashboard/rate-import-2': {
    title: 'Rate Import 2',
    subtitle: 'Choose a rate-sheet parser, then preview the selected worksheet',
  },
  '/dashboard/payments': {
    title: 'Payments',
    subtitle: 'Invoices, dues and payment history',
  },
  '/dashboard/ledger': {
    title: 'Ledger',
    subtitle: 'Account balance and courier-wise spend',
  },
  '/dashboard/profile': {
    title: 'Profile',
    subtitle: 'Company details and team access',
  },
}

export function DashboardLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`
  const meta = PAGE_META[location.pathname] ?? PAGE_META['/dashboard']

  return (
    <div className="flex min-h-dvh bg-background">
      <button
        type="button"
        className="fixed top-4 left-4 z-30 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-elevate md:hidden"
        onClick={() => setNavOpen((v) => !v)}
        aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={navOpen}
      >
        <Menu className="size-5.5" />
      </button>

      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 cursor-pointer border-none bg-neutral-900/45 p-0 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={cn(
          'sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-card transition-[width,transform] duration-200 ease-out',
          collapsed ? 'w-21' : 'w-62',
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-25 max-md:w-65 max-md:-translate-x-full max-md:shadow-elevate-lg',
          navOpen && 'max-md:translate-x-0',
        )}
      >
        <div className="flex min-h-8 items-center gap-3 border-b border-border p-5">
          <span className="inline-flex size-9.5 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-sm text-primary-foreground">
            JK
          </span>
          {!collapsed && (
            <span className="font-heading text-lg tracking-tight whitespace-nowrap">
              Enterprise
            </span>
          )}
        </div>
        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-3"
          aria-label="Main"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold whitespace-nowrap text-muted-foreground no-underline transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-primary',
                )
              }
              onClick={() => setNavOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-[19px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-border p-3">
          <button
            type="button"
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border-none bg-transparent px-4 py-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive"
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
          >
            <LogOut className="size-[19px] shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
          <button
            type="button"
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border-none bg-transparent px-4 py-3 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-primary max-md:hidden"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? (
              <ChevronsRight className="size-[19px] shrink-0" />
            ) : (
              <ChevronsLeft className="size-[19px] shrink-0" />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-19 items-center justify-between gap-4 border-b border-border bg-card px-5 py-4 max-md:pl-16 sm:px-8">
          <div>
            <h1 className="text-[22px]">{meta.title}</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{meta.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-semibold max-sm:hidden">
              {profile?.firstName} {profile?.lastName}
            </span>
            <span
              className="inline-flex size-9.5 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-[13px] text-primary-foreground uppercase"
              aria-hidden="true"
            >
              {initials || 'JK'}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
