import { storageGet, storageRemove, storageSet } from "./storage"

export type ShoppingItem = {
  id: string
  name: string
  priceCents: number
  quantity: number
}

export const ITEMS_STORAGE_KEY = "quanto-deu-items"
export const ITEMS_STORAGE_VERSION = 1
export const MAX_ITEM_NAME_LENGTH = 80
export const MAX_PRICE_CENTS = 99_999_999
export const MAX_QUANTITY = 9_999
export const MAX_ITEMS = 200

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatBRL(cents: number): string {
  return brlFormatter.format(cents / 100)
}

export function itemSubtotal(item: ShoppingItem): number {
  return item.priceCents * item.quantity
}

export function purchaseTotal(items: ShoppingItem[]): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item), 0)
}

export function itemsStorageKey(ownerEmail: string): string {
  return `${ITEMS_STORAGE_KEY}:${ownerEmail.trim().toLowerCase()}`
}

function reaisToCents(reais: number): number {
  return Math.round(reais * 100)
}

export type PriceInspectResult =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "non-positive" }
  | { status: "too-large" }
  | { status: "ok"; cents: number }

export type QuantityInspectResult =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "non-positive" }
  | { status: "too-large" }
  | { status: "ok"; quantity: number }

export type LoadItemsResult = {
  items: ShoppingItem[]
  error: string | null
  persistable: boolean
}

function normalizePriceInput(value: string): string | null {
  const lastComma = value.lastIndexOf(",")
  const lastDot = value.lastIndexOf(".")

  if (lastComma !== -1 && lastDot !== -1) {
    return lastComma > lastDot
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "")
  }

  if (lastComma !== -1) {
    const parts = value.split(",")

    if (parts.length !== 2) {
      return null
    }

    return `${parts[0]}.${parts[1]}`
  }

  if (lastDot !== -1) {
    const parts = value.split(".")

    if (parts.length === 2) {
      if (parts[0] !== "" && parts[0] !== "0" && parts[1].length === 3) {
        return `${parts[0]}${parts[1]}`
      }

      return value
    }

    const last = parts[parts.length - 1]
    const middle = parts.slice(1, -1)

    if (
      parts[0] !== "" &&
      last.length <= 2 &&
      middle.every((group) => group.length === 3)
    ) {
      return `${parts[0]}${middle.join("")}.${last}`
    }

    return null
  }

  return value
}

export function inspectPrice(raw: string): PriceInspectResult {
  const trimmed = raw.trim()

  if (!trimmed) {
    return { status: "empty" }
  }

  let value = trimmed.replace(/\s/g, "").replace(/^R\$/i, "")

  if (!value) {
    return { status: "empty" }
  }

  const negative = value.startsWith("-")

  if (negative) {
    value = value.slice(1)
  }

  if (!value) {
    return { status: "invalid" }
  }

  const normalized = normalizePriceInput(value)

  if (normalized === null) {
    return { status: "invalid" }
  }

  if (!/^\d+\.\d+$/.test(normalized) && !/^\d+$/.test(normalized)) {
    return { status: "invalid" }
  }

  const [integerPart, decimalPart = ""] = normalized.split(".")

  if (decimalPart.length > 2) {
    return { status: "invalid" }
  }

  if (integerPart.length > 15) {
    return { status: "invalid" }
  }

  const cents =
    Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0") || "0")

  if (!Number.isInteger(cents) || !Number.isSafeInteger(cents)) {
    return { status: "invalid" }
  }

  if (negative || cents <= 0) {
    return { status: "non-positive" }
  }

  if (cents > MAX_PRICE_CENTS) {
    return { status: "too-large" }
  }

  return { status: "ok", cents }
}

export function parsePrice(raw: string): number | null {
  const result = inspectPrice(raw)
  return result.status === "ok" ? result.cents : null
}

export function inspectQuantity(raw: string): QuantityInspectResult {
  const trimmed = raw.trim()

  if (!trimmed) {
    return { status: "empty" }
  }

  if (/^-\d+$/.test(trimmed) || /^0+$/.test(trimmed)) {
    return { status: "non-positive" }
  }

  if (!/^\d+$/.test(trimmed)) {
    return { status: "invalid" }
  }

  const quantity = Number(trimmed)

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { status: "non-positive" }
  }

  if (quantity > MAX_QUANTITY) {
    return { status: "too-large" }
  }

  return { status: "ok", quantity }
}

export function parseQuantity(raw: string): number | null {
  const result = inspectQuantity(raw)
  return result.status === "ok" ? result.quantity : null
}

function toShoppingItem(value: unknown): ShoppingItem | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const item = value as Record<string, unknown>

  if (
    typeof item.id !== "string" ||
    item.id.trim() === "" ||
    typeof item.name !== "string" ||
    item.name.trim() === "" ||
    item.name.trim().length > MAX_ITEM_NAME_LENGTH
  ) {
    return null
  }

  if (
    typeof item.quantity !== "number" ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > MAX_QUANTITY
  ) {
    return null
  }

  if (
    typeof item.priceCents === "number" &&
    Number.isInteger(item.priceCents) &&
    item.priceCents > 0 &&
    item.priceCents <= MAX_PRICE_CENTS
  ) {
    return {
      id: item.id,
      name: item.name.trim(),
      priceCents: item.priceCents,
      quantity: item.quantity,
    }
  }

  if (typeof item.price === "number" && Number.isFinite(item.price) && item.price > 0) {
    const priceCents = reaisToCents(item.price)

    if (priceCents <= 0 || priceCents > MAX_PRICE_CENTS) {
      return null
    }

    return {
      id: item.id,
      name: item.name.trim(),
      priceCents,
      quantity: item.quantity,
    }
  }

  return null
}

export function serializeItemsBackup(items: ShoppingItem[]): string {
  return JSON.stringify({
    version: ITEMS_STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    items,
  })
}

export function parseItemsBackup(raw: string): LoadItemsResult {
  try {
    return parseItemsPayload(JSON.parse(raw) as unknown)
  } catch {
    return {
      items: [],
      error: "Arquivo de backup inválido.",
      persistable: false,
    }
  }
}

export function parseItemsPayload(parsed: unknown): LoadItemsResult {
  if (Array.isArray(parsed)) {
    return collectItems(parsed)
  }

  if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, unknown>

    if (record.version === ITEMS_STORAGE_VERSION && Array.isArray(record.items)) {
      return collectItems(record.items)
    }
  }

  return {
    items: [],
    error: "Não foi possível carregar os itens salvos.",
    persistable: false,
  }
}

function collectItems(values: unknown[]): LoadItemsResult {
  const items: ShoppingItem[] = []
  const seen = new Set<string>()
  let skipped = false

  for (const value of values) {
    const item = toShoppingItem(value)

    if (item === null || seen.has(item.id)) {
      skipped = true
      continue
    }

    if (items.length >= MAX_ITEMS) {
      skipped = true
      continue
    }

    seen.add(item.id)
    items.push(item)
  }

  return {
    items,
    error: skipped
      ? "Alguns itens salvos foram ignorados porque estavam inválidos."
      : null,
    persistable: true,
  }
}

export function loadItems(ownerEmail: string): LoadItemsResult {
  const ownerKey = itemsStorageKey(ownerEmail)

  try {
    const scoped = storageGet(ownerKey)

    if (scoped) {
      return parseItemsPayload(JSON.parse(scoped) as unknown)
    }

    const legacy = storageGet(ITEMS_STORAGE_KEY)

    if (!legacy) {
      return { items: [], error: null, persistable: true }
    }

    const result = parseItemsPayload(JSON.parse(legacy) as unknown)

    if (result.persistable) {
      try {
        saveItems(ownerEmail, result.items)
        storageRemove(ITEMS_STORAGE_KEY)
      } catch {
        return result
      }
    }

    return result
  } catch {
    return {
      items: [],
      error: "Não foi possível carregar os itens salvos.",
      persistable: false,
    }
  }
}

export function saveItems(ownerEmail: string, items: ShoppingItem[]): void {
  storageSet(
    itemsStorageKey(ownerEmail),
    JSON.stringify({
      version: ITEMS_STORAGE_VERSION,
      items,
    }),
  )
}
