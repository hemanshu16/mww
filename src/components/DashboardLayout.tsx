import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/bookings', label: 'Bookings', icon: Package, end: false },
  { to: '/dashboard/bookings/new', label: 'New Booking', icon: PlusCircle, end: false },
  { to: '/dashboard/profile', label: 'Profile', icon: User, end: false },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a8]">
        Menu
      </p>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-[#eff6ff] text-[#21649c]'
                : 'text-[#526581] hover:bg-[#f6f9fd] hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                  aria-hidden
                />
              )}
              <Icon className="size-[18px] shrink-0" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarBrand() {
  return (
    <div className="flex h-[88px] items-center px-5">
      <img src="/logo-lockup.png" alt="Monarch Worldwide Express" className="h-11 w-auto" />
    </div>
  )
}

export function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => setDrawerOpen(false), [location.pathname])

  const initials =
    `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'U'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="monarch-app min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-card lg:flex">
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto pb-6">
          <NavItems />
        </div>
        <div className="border-t border-border px-5 py-4 text-[11px] text-[#8291a8]">
          © {new Date().getFullYear()} Monarch Worldwide Express
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-[rgba(15,23,42,0.35)]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col bg-card shadow-dropdown">
            <div className="flex items-center justify-between pr-3">
              <SidebarBrand />
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-56">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>

          {/* Search */}
          <div className="relative hidden max-w-[580px] flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8291a8]" />
            <input
              type="text"
              placeholder="Search bookings, tracking…"
              className="h-10 w-full min-w-[220px] rounded-[8px] border border-border bg-[#f8fafc] pl-9 pr-3 text-sm text-foreground placeholder:text-[#9aa8ba] focus:border-primary focus:bg-card focus:outline-none focus:ring-[3px] focus:ring-primary/10"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {profile?.isGstBilling && (
              <Badge variant="booked" className="hidden sm:inline-flex">
                GST billing
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#f6f9fd] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left leading-tight sm:block">
                    <div className="max-w-[140px] truncate text-sm font-semibold text-foreground">
                      {profile?.companyName ?? 'Account'}
                    </div>
                    <div className="max-w-[140px] truncate text-xs text-muted-foreground">
                      {profile ? `${profile.firstName} ${profile.lastName}` : ''}
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-[220px] truncate font-normal">
                  <span className="block font-semibold">
                    {profile?.firstName} {profile?.lastName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{profile?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                  <User className="size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
