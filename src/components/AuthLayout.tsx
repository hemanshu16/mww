import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

interface AuthLayoutProps {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  width?: 'narrow' | 'wide'
}

export function AuthLayout({ title, subtitle, children, width = 'narrow' }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-background"
      style={{
        backgroundImage:
          'radial-gradient(1200px 600px at 15% -10%, var(--blue-100) 0%, transparent 60%)',
      }}
    >
      <header className="p-5 sm:p-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div
          className={`flex w-full flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-elevate-lg sm:p-10 ${
            width === 'wide' ? 'max-w-[560px]' : 'max-w-[420px]'
          }`}
        >
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-[26px]">{title}</h1>
            {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
