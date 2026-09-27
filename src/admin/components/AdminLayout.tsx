import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { ADMIN_NAV } from '@/admin/nav'
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

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useStaffAuth()
  const items = ADMIN_NAV.filter((item) => can(item.perm))

  return (
    <nav className="flex flex-col gap-1 px-3">
      <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8291a8]">
        Admin
      </p>
      {items.length === 0 && (
        <p className="px-3 text-xs text-muted-foreground">No sections available yet.</p>
      )}
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
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
    <div className="flex h-[88px] items-center gap-2 px-5">
      <img src="/logo-lockup.png" alt="Monarch Worldwide Express" className="h-11 w-auto" />
    </div>
  )
}

export function AdminLayout() {
  const { profile, signOut } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => setDrawerOpen(false), [location.pathname])

  const initials =
    (profile?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'S'

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
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
          Staff console · © {new Date().getFullYear()} Monarch
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
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="size-3.5" /> Staff console
          </Badge>

          <div className="ml-auto flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#f6f9fd] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left leading-tight sm:block">
                    <div className="max-w-[160px] truncate text-sm font-semibold text-foreground">
                      {profile?.name}
                    </div>
                    <div className="max-w-[160px] truncate text-xs text-muted-foreground">
                      {profile?.isSuperAdmin
                        ? 'Super admin'
                        : profile?.roles.map((r) => r.name).join(', ') || 'No roles'}
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate font-semibold">{profile?.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {profile?.email}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profile?.isSuperAdmin && <Badge variant="gold">Super admin</Badge>}
                    {profile?.roles.map((r) => (
                      <Badge key={r.id} variant="booked">
                        {r.name}
                      </Badge>
                    ))}
                    {!profile?.isSuperAdmin && profile?.roles.length === 0 && (
                      <span className="text-xs text-muted-foreground">No roles assigned</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
