import type { ReactNode } from "react"
import { BrandMark } from "./BrandMark"

export function AuthLayout({
  children,
  compact = false,
}: {
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-page text-ink">
      <img
        src="/login-bg.png"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-page/50" />

      <div
        className={`relative z-10 mx-auto flex min-h-svh w-full max-w-[380px] flex-col justify-center px-5 ${compact ? "py-5" : "py-8"}`}
      >
        <div
          className={`rounded-lg border border-line/70 bg-page/92 ${compact ? "px-5 py-5" : "px-6 py-7 sm:px-7 sm:py-8"}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-page text-[14px] text-muted">
      Carregando…
    </div>
  )
}

export function AuthBrand({
  description,
  compact = false,
}: {
  description: string
  compact?: boolean
}) {
  return (
    <div
      className={`${compact ? "mb-4" : "mb-6"} flex flex-col items-center text-center`}
    >
      <BrandMark size={compact ? "md" : "lg"} align="center" />
      <p className={`${compact ? "mt-1.5" : "mt-2"} text-[13px] text-muted`}>
        {description}
      </p>
    </div>
  )
}
