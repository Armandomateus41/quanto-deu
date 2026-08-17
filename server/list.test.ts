import { describe, expect, it } from "vitest"
import { parseListBody, toInsertRows, type ShoppingItem } from "./list.ts"

const cafe: ShoppingItem = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Café",
  priceCents: 1250,
  quantity: 2,
}

describe("toInsertRows", () => {
  it("preserva centavos e gera position pela ordem", () => {
    expect(toInsertRows([cafe])).toEqual([
      {
        id: cafe.id,
        name: "Café",
        price_cents: 1250,
        quantity: 2,
        position: 0,
      },
    ])
  })
})

describe("parseListBody", () => {
  it("aceita items válidos e rejeita payload inválido", () => {
    expect(parseListBody({ items: [cafe] })).toEqual({
      ok: true,
      items: [cafe],
      warning: null,
    })
    expect(parseListBody({ items: "nope" }).ok).toBe(false)
  })

  it("troca id que não é UUID antes de gravar", () => {
    const parsed = parseListBody({
      items: [{ ...cafe, id: "item-1" }],
    })

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.items[0]?.id).not.toBe("item-1")
      expect(parsed.items[0]?.priceCents).toBe(1250)
    }
  })
})
