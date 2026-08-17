export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page"

export function fieldClass(hasError: boolean, extra?: string) {
  return cx(
    "h-11 w-full min-w-0 rounded-lg border bg-page px-3 text-[14px] text-ink outline-none placeholder:text-muted/50",
    focusRing,
    hasError
      ? "border-red-400/80 focus:border-red-400 focus-visible:ring-red-400/40"
      : "border-line/80 focus:border-brand",
    extra,
  )
}

export const btnPrimary =
  `inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-[14px] tracking-tight text-page transition-opacity hover:opacity-85 ${focusRing}`

export const btnSecondary =
  `inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line/80 px-5 text-[14px] tracking-tight text-ink transition-colors hover:border-ink/30 hover:bg-white/[0.03] ${focusRing}`

export const btnQuiet =
  `inline-flex h-10 items-center justify-center gap-1.5 px-2 text-[14px] tracking-tight text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`

export const btnDanger =
  `inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#8f2f2f] px-5 text-[14px] tracking-tight text-white transition-colors hover:bg-[#a33838] ${focusRing}`

export const btnIcon =
  `inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`

export const btnIconDanger =
  `inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 ${focusRing}`

export const card =
  "rounded-lg border border-line bg-surface p-5 sm:p-6"

export const linkBrand = `text-[14px] text-brand hover:opacity-80 ${focusRing} rounded-sm`
