import { afterEach, describe, expect, it } from "vitest"
import {
  ITEMS_STORAGE_KEY,
  ITEMS_STORAGE_VERSION,
  MAX_ITEMS,
  MAX_PRICE_CENTS,
  MAX_QUANTITY,
  formatBRL,
  inspectPrice,
  inspectQuantity,
  itemSubtotal,
  itemsStorageKey,
  loadItems,
  parseItemsBackup,
  parseItemsPayload,
  parsePrice,
  parseQuantity,
  purchaseTotal,
  saveItems,
  serializeItemsBackup,
  type ShoppingItem,
} from "./items"

function item(partial: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: partial.id ?? "item-1",
    name: partial.name ?? "Café",
    priceCents: partial.priceCents ?? 1250,
    quantity: partial.quantity ?? 2,
  }
}

describe("inspectPrice", () => {
  it("aceita vazio, vírgula, ponto e prefixo R$", () => {
    expect(inspectPrice("")).toEqual({ status: "empty" })
    expect(inspectPrice("29,90")).toEqual({ status: "ok", cents: 2990 })
    expect(inspectPrice("29.90")).toEqual({ status: "ok", cents: 2990 })
    expect(inspectPrice("R$ 12,50")).toEqual({ status: "ok", cents: 1250 })
  })

  it("interpreta milhar brasileiro e americano", () => {
    expect(inspectPrice("1.250")).toEqual({ status: "ok", cents: 125000 })
    expect(inspectPrice("1.250,50")).toEqual({ status: "ok", cents: 125050 })
    expect(inspectPrice("1,250.50")).toEqual({ status: "ok", cents: 125050 })
  })

  it("rejeita valores inválidos, negativos e acima do teto", () => {
    expect(inspectPrice("0.125")).toEqual({ status: "invalid" })
    expect(inspectPrice("-10")).toEqual({ status: "non-positive" })
    expect(inspectPrice("0")).toEqual({ status: "non-positive" })
    expect(inspectPrice("1000000")).toEqual({ status: "too-large" })
    expect(inspectPrice(String(MAX_PRICE_CENTS / 100))).toEqual({
      status: "ok",
      cents: MAX_PRICE_CENTS,
    })
  })
})

describe("inspectQuantity", () => {
  it("aceita inteiros positivos até o teto", () => {
    expect(inspectQuantity("1")).toEqual({ status: "ok", quantity: 1 })
    expect(inspectQuantity(String(MAX_QUANTITY))).toEqual({
      status: "ok",
      quantity: MAX_QUANTITY,
    })
  })

  it("rejeita vazio, zero, negativo, notação científica e excesso", () => {
    expect(inspectQuantity("")).toEqual({ status: "empty" })
    expect(inspectQuantity("0")).toEqual({ status: "non-positive" })
    expect(inspectQuantity("-1")).toEqual({ status: "non-positive" })
    expect(inspectQuantity("1e2")).toEqual({ status: "invalid" })
    expect(inspectQuantity(String(MAX_QUANTITY + 1))).toEqual({
      status: "too-large",
    })
  })
})

describe("totais", () => {
  it("calcula subtotal e total em centavos", () => {
    const cafe = item({ priceCents: 1250, quantity: 2 })
    const pao = item({ id: "item-2", priceCents: 400, quantity: 3 })

    expect(itemSubtotal(cafe)).toBe(2500)
    expect(purchaseTotal([cafe, pao])).toBe(3700)
    expect(formatBRL(3700).replace(/\s/g, " ")).toBe("R$ 37,00")
  })
})

describe("parseItemsPayload", () => {
  it("lê array legado e envelope versionado", () => {
    const legacy = parseItemsPayload([item()])
    expect(legacy.persistable).toBe(true)
    expect(legacy.items).toHaveLength(1)

    const versioned = parseItemsPayload({
      version: ITEMS_STORAGE_VERSION,
      items: [item()],
    })
    expect(versioned.persistable).toBe(true)
    expect(versioned.items[0]?.name).toBe("Café")
  })

  it("recusa payload desconhecido sem liberar persistência", () => {
    const result = parseItemsPayload({ version: 99, items: [item()] })
    expect(result).toEqual({
      items: [],
      error: "Não foi possível carregar os itens salvos.",
      persistable: false,
    })
  })

  it("ignora item inválido, duplicado ou acima dos limites", () => {
    const result = parseItemsPayload([
      item(),
      { id: "bad", name: "", priceCents: 100, quantity: 1 },
      item({ id: "item-1", name: "Duplicado" }),
      item({ id: "huge", priceCents: MAX_PRICE_CENTS + 1 }),
    ])

    expect(result.persistable).toBe(true)
    expect(result.items).toHaveLength(1)
    expect(result.error).toContain("ignorados")
  })

  it("migra price em reais e limita a lista", () => {
    const migrated = parseItemsPayload([
      { id: "old", name: "Leite", price: 4.5, quantity: 1 },
    ])
    expect(migrated.items[0]?.priceCents).toBe(450)

    const overflow = parseItemsPayload(
      Array.from({ length: MAX_ITEMS + 3 }, (_, index) =>
        item({ id: `item-${index}`, name: `Item ${index}` }),
      ),
    )
    expect(overflow.items).toHaveLength(MAX_ITEMS)
    expect(overflow.persistable).toBe(true)
  })
})

describe("loadItems e saveItems", () => {
  const memory = new Map<string, string>()

  afterEach(() => {
    memory.clear()
  })

  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value)
    },
    removeItem: (key: string) => {
      memory.delete(key)
    },
  }

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  })

  it("grava envelope versionado na chave do usuário", () => {
    saveItems("teste@quantodeu.com", [item()])

    const stored = JSON.parse(
      memory.get(itemsStorageKey("teste@quantodeu.com")) ?? "null",
    ) as { version: number; items: ShoppingItem[] }

    expect(stored.version).toBe(ITEMS_STORAGE_VERSION)
    expect(stored.items).toHaveLength(1)
  })

  it("migra a chave legada para o usuário e remove o legado", () => {
    memory.set(ITEMS_STORAGE_KEY, JSON.stringify([item()]))

    const result = loadItems("teste@quantodeu.com")

    expect(result.persistable).toBe(true)
    expect(result.items).toHaveLength(1)
    expect(memory.has(ITEMS_STORAGE_KEY)).toBe(false)
    expect(memory.has(itemsStorageKey("teste@quantodeu.com"))).toBe(true)
  })

  it("não persiste quando o JSON está corrompido", () => {
    memory.set(itemsStorageKey("teste@quantodeu.com"), "{quebra")

    const result = loadItems("teste@quantodeu.com")

    expect(result.persistable).toBe(false)
    expect(result.items).toEqual([])
  })
})

describe("backup", () => {
  it("exporta e reimporta a mesma lista", () => {
    const items = [item(), item({ id: "item-2", name: "Pão", priceCents: 400 })]
    const raw = serializeItemsBackup(items)
    const parsed = JSON.parse(raw) as { version: number; items: ShoppingItem[] }

    expect(parsed.version).toBe(ITEMS_STORAGE_VERSION)

    const result = parseItemsBackup(raw)
    expect(result.persistable).toBe(true)
    expect(result.items).toEqual(items)
  })

  it("recusa arquivo que não é JSON", () => {
    const result = parseItemsBackup("<nao-json>")
    expect(result.persistable).toBe(false)
    expect(result.items).toEqual([])
  })
})

describe("parse helpers", () => {
  it("retorna null quando o inspect falha", () => {
    expect(parsePrice("abc")).toBeNull()
    expect(parseQuantity("abc")).toBeNull()
    expect(parsePrice("10,00")).toBe(1000)
    expect(parseQuantity("3")).toBe(3)
  })
})
