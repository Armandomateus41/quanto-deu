import {
  Cancel01Icon,
  Logout03Icon,
  Menu01Icon,
  ShoppingBasket01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import { useState, type ReactNode } from "react"
import { BrandMark } from "./BrandMark"
import { Icon } from "./Icon"

type AppShellProps = {
  title: string
  user: { name: string; email: string } | null
  onLogout: () => void
  headerExtra?: ReactNode
  children: ReactNode
}

export function AppShell({
  title,
  user,
  onLogout,
  headerExtra,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-svh bg-page text-ink lg:flex">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={
          menuOpen
            ? "fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col border-r border-line bg-page px-5 py-6 lg:static lg:flex"
            : "hidden w-[17.5rem] shrink-0 flex-col border-r border-line bg-page px-5 py-6 lg:flex"
        }
      >
        <BrandMark />
        <p className="mt-3 text-[13px] leading-5 text-muted">
          Controle rápido das suas compras
        </p>

        <nav className="mt-8 flex flex-1 flex-col" aria-label="Principal">
          <span
            className="inline-flex items-center gap-2.5 rounded-lg bg-brand/10 px-3 py-2.5 text-[14px] text-brand"
            aria-current="page"
          >
            <Icon icon={ShoppingBasket01Icon} size={18} />
            Lista
          </span>
        </nav>

        <div className="border-t border-line pt-4">
          {user ? (
            <div className="mb-3 flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 text-muted">
                <Icon icon={UserCircleIcon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] leading-5">{user.name}</p>
                <p className="truncate text-[13px] leading-5 text-muted">
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-sm text-[14px] text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <Icon icon={Logout03Icon} size={16} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="relative z-50 flex size-11 items-center justify-center text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="app-sidebar"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <Icon icon={Cancel01Icon} size={20} />
              ) : (
                <Icon icon={Menu01Icon} size={20} />
              )}
            </button>
            <h1 className="truncate text-[1.25rem] tracking-tight">{title}</h1>
          </div>
          {headerExtra}
        </header>

        <main className="flex-1 px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
