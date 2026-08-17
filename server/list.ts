import type { ApiUser } from "./auth.ts"
import { getSql } from "./db.ts"

export type ShoppingItem = {
  id: string
  name: string
  priceCents: number
  quantity: number
}

const MAX_ITEM_NAME_LENGTH = 80
const MAX_PRICE_CENTS = 99_999_999
const MAX_QUANTITY = 9_999
const MAX_ITEMS = 200

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ItemRow = {
  id: string
  name: string
  price_cents: number
  quantity: number
}

function normalizeItemId(id: string): string {
  return uuidPattern.test(id) ? id : crypto.randomUUID()
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
    item.name.trim().length > MAX_ITEM_NAME_LENGTH ||
    typeof item.quantity !== "number" ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > MAX_QUANTITY ||
    typeof item.priceCents !== "number" ||
    !Number.isInteger(item.priceCents) ||
    item.priceCents <= 0 ||
    item.priceCents > MAX_PRICE_CENTS
  ) {
    return null
  }

  return {
    id: item.id,
    name: item.name.trim(),
    priceCents: item.priceCents,
    quantity: item.quantity,
  }
}

export function toInsertRows(items: ShoppingItem[]) {
  return items.map((item, position) => ({
    id: item.id,
    name: item.name,
    price_cents: item.priceCents,
    quantity: item.quantity,
    position,
  }))
}

function toShoppingItems(rows: ItemRow[]): ShoppingItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    quantity: row.quantity,
  }))
}

export function parseListBody(body: unknown):
  | { ok: true; items: ShoppingItem[]; warning: string | null }
  | { ok: false; error: string } {
  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null

  if (!Array.isArray(record?.items)) {
    return { ok: false, error: "Lista inválida." }
  }

  const items: ShoppingItem[] = []
  const seen = new Set<string>()
  let skipped = false

  for (const value of record.items) {
    const item = toShoppingItem(value)

    if (item === null || seen.has(item.id)) {
      skipped = true
      continue
    }

    if (items.length >= MAX_ITEMS) {
      skipped = true
      continue
    }

    const normalized = {
      ...item,
      id: normalizeItemId(item.id),
    }

    seen.add(item.id)
    seen.add(normalized.id)
    items.push(normalized)
  }

  if (record.items.length > 0 && items.length === 0) {
    return { ok: false, error: "Lista inválida." }
  }

  return {
    ok: true,
    items,
    warning: skipped
      ? "Alguns itens salvos foram ignorados porque estavam inválidos."
      : null,
  }
}

export async function ensureOpenPurchase(user: ApiUser): Promise<void> {
  const sql = getSql()

  await sql`
    insert into profiles (id, name, email)
    values (${user.id}::uuid, ${user.name}, ${user.email})
    on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      updated_at = now()
  `

  await sql`
    insert into purchases (id, user_id, status)
    select gen_random_uuid(), ${user.id}::uuid, 'open'
    where not exists (
      select 1
      from purchases
      where user_id = ${user.id}::uuid
        and status = 'open'
    )
  `
}

export async function listOpenItems(user: ApiUser): Promise<ShoppingItem[]> {
  await ensureOpenPurchase(user)
  const sql = getSql()
  const rows = await sql`
    select i.id, i.name, i.price_cents, i.quantity
    from purchase_items i
    join purchases p on p.id = i.purchase_id
    where p.user_id = ${user.id}::uuid
      and p.status = 'open'
    order by i.position
  `

  return toShoppingItems(rows as ItemRow[])
}

export async function replaceOpenItems(
  user: ApiUser,
  items: ShoppingItem[],
): Promise<void> {
  await ensureOpenPurchase(user)
  const sql = getSql()
  const payload = JSON.stringify(toInsertRows(items))

  await sql`
    with purchase as (
      select id
      from purchases
      where user_id = ${user.id}::uuid
        and status = 'open'
    ),
    deleted as (
      delete from purchase_items
      where purchase_id in (select id from purchase)
    )
    insert into purchase_items (
      id,
      purchase_id,
      name,
      price_cents,
      quantity,
      position
    )
    select
      x.id,
      (select id from purchase),
      x.name,
      x.price_cents,
      x.quantity,
      x.position
    from jsonb_to_recordset(${payload}::jsonb) as x(
      id uuid,
      name text,
      price_cents integer,
      quantity integer,
      position integer
    )
  `

  await sql`
    update purchases
    set updated_at = now()
    where user_id = ${user.id}::uuid
      and status = 'open'
  `
}
