import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronsUpDown, CircleHelp, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { useStaffAuth } from '@/admin/staffAuthContext'
import { ADMIN_NAV_GROUPS, SUPPORT_EMAIL } from '@/admin/nav'
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

// Shared by nav links and the Help item so they line up exactly.
const itemBase =
  'relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/30'
const itemIdle = 'font-medium text-[#334155] hover:bg-[#F8FAFC] hover:text-[#1E293B]'

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useStaffAuth()
  const groups = ADMIN_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => can(item.perm)),
  })).filter((g) => g.items.length > 0)

  if (groups.length === 0) {
    return <p className="px-6 text-xs text-[#64748B]">No sections available yet.</p>
  }

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6 px-4">
      {groups.map((group) => (
        <div key={group.label} role="group" aria-labelledby={`nav-${group.label}`}>
          <p
            id={`nav-${group.label}`}
            className="px-3.5 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]"
          >
            {group.label}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                {/* Not `end`, so nested pages (e.g. a booking's detail) keep their item active. */}
                <NavLink
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(itemBase, isActive ? 'bg-[#EFF6FF] font-semibold text-[#1D4ED8]' : itemIdle)
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1D4ED8]"
                          aria-hidden
                        />
                      )}
                      <Icon
                        className={cn(
                          'size-5 shrink-0',
                          isActive ? 'text-[#1D4ED8]' : 'text-[#475569]',
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function roleLabel(profile: ReturnType<typeof useStaffAuth>['profile']) {
  if (!profile) return ''
  if (profile.isSuperAdmin) return 'Super admin'
  return profile.roles.map((r) => r.name).join(', ') || 'No roles'
}

function initialsOf(name: string | undefined) {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'S'
  )
}

/** Help link, account menu and footer, pinned to the bottom of the sidebar. */
function SidebarFooter() {
  const { profile, signOut } = useStaffAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="border-t border-[#E2E8F0]">
      <div className="space-y-1 px-4 pb-3 pt-3">
        <a href={`mailto:${SUPPORT_EMAIL}`} className={cn(itemBase, itemIdle)}>
          <CircleHelp className="size-5 shrink-0 text-[#475569]" aria-hidden />
          Help &amp; Support
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left transition-colors duration-150 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/30 data-[state=open]:bg-[#F8FAFC]"
              aria-label="Account menu"
            >
              <Avatar className="size-9 shrink-0">
                <AvatarFallback>{initialsOf(profile?.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold text-[#1E293B]">
                  {profile?.name}
                </span>
                <span className="block truncate text-xs text-[#64748B]">{roleLabel(profile)}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-[#64748B]" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-[232px]">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate font-semibold">{profile?.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{profile?.email}</span>
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
      <p className="border-t border-[#E2E8F0] px-6 py-3 text-xs text-[#64748B]">
        Staff console · © {new Date().getFullYear()} Monarch
      </p>
    </div>
  )
}

/** Brand, scrolling nav groups, and the pinned footer. Used by the desktop sidebar and mobile drawer. */
function SidebarContent({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void
  onClose?: () => void
}) {
  return (
    <>
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#E2E8F0] px-6">
        <img src="/logo-lockup.png" alt="Monarch Worldwide Express" className="h-10 w-auto" />
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-6">
        <NavGroups onNavigate={onNavigate} />
      </div>
      <SidebarFooter />
    </>
  )
}

export function AdminLayout() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => setDrawerOpen(false), [location.pathname])

  return (
    <div className="monarch-app min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-[#E2E8F0] bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-[rgba(15,23,42,0.35)]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[264px] max-w-[85%] flex-col bg-white shadow-dropdown">
            <SidebarContent
              onNavigate={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[#E2E8F0] bg-card px-4 sm:px-6">
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
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
