import {
  formatBRL,
  itemSubtotal,
  purchaseTotal,
  type ShoppingItem,
} from "../lib/items"
import { card } from "../lib/ui"

const PALETTE = ["#00a8e8", "#4eb8d9", "#7a8b96", "#5c6570", "#3a414a"] as const

const DONUT_SIZE = 96
const DONUT_CENTER = DONUT_SIZE / 2
const DONUT_RADIUS = 34
const DONUT_STROKE = 12
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

type Slice = {
  id: string
  name: string
  cents: number
  color: string
}

function buildSlices(items: ShoppingItem[]): Slice[] {
  const ranked = [...items]
    .map((item) => ({
      id: item.id,
      name: item.name,
      cents: itemSubtotal(item),
    }))
    .sort((a, b) => b.cents - a.cents)

  const visible =
    ranked.length > 5
      ? [
          ...ranked.slice(0, 4),
          {
            id: "outros",
            name: "Outros",
            cents: ranked.slice(4).reduce((sum, row) => sum + row.cents, 0),
          },
        ]
      : ranked

  return visible.map((row, index) => ({
    ...row,
    color: PALETTE[index] ?? PALETTE[PALETTE.length - 1],
  }))
}

function formatShare(cents: number, total: number): string {
  if (total <= 0) {
    return "0%"
  }

  const percent = (cents / total) * 100

  if (percent > 0 && percent < 1) {
    return "< 1%"
  }

  return `${Math.round(percent)}%`
}

export function PurchaseBreakdown({ items }: { items: ShoppingItem[] }) {
  const total = purchaseTotal(items)
  const slices = buildSlices(items)

  if (slices.length === 0 || total <= 0) {
    return null
  }

  let nextOffset = 0
  const rings = slices.map((slice) => {
    const length = (slice.cents / total) * DONUT_CIRCUMFERENCE
    const offset = nextOffset
    nextOffset += length

    return { ...slice, length, offset }
  })

  return (
    <section className={`${card} flex h-full flex-col`}>
      <div className="mb-5 flex items-center gap-2.5">
        <img
          src="/growth-icon.png"
          alt=""
          className="size-8 object-contain"
        />
        <h2 className="text-[15px] tracking-tight text-ink/90">Composição</h2>
      </div>

      <div className="flex items-center gap-4">
        <svg
          viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
          className="size-24 shrink-0"
          role="img"
          aria-label="Participação de cada item no total da compra"
        >
          <circle
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={DONUT_STROKE}
          />
          <g transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}>
            {rings.map((ring) => (
              <circle
                key={ring.id}
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS}
                fill="none"
                stroke={ring.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${ring.length} ${DONUT_CIRCUMFERENCE}`}
                strokeDashoffset={-ring.offset}
              />
            ))}
          </g>
        </svg>

        <div className="min-w-0">
          <p className="text-[11px] tracking-wide text-muted uppercase">
            Total
          </p>
          <p className="truncate text-xl tracking-tight text-brand tabular-nums">
            {formatBRL(total)}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-3">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="shrink-0 text-muted tabular-nums">
              {formatShare(slice.cents, total)}
            </span>
            <span className="w-[5.5rem] shrink-0 text-right tabular-nums">
              {formatBRL(slice.cents)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
