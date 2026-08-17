import {
  ITEMS_STORAGE_VERSION,
  loadItems,
  parseItemsPayload,
  saveItems,
  type LoadItemsResult,
  type ShoppingItem,
} from "./items"
import { supabase } from "./supabase"

const remoteUnavailable: LoadItemsResult = {
  items: [],
  error: "Não foi possível sincronizar a lista.",
  persistable: false,
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error("Sessão expirada. Entre novamente.")
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error
    }
  } catch {
    // mantém o fallback
  }

  return fallback
}

async function loadNeonList(): Promise<
  | { status: "ok"; result: LoadItemsResult }
  | { status: "unavailable"; error: string }
> {
  try {
    const response = await fetch("/api/list", {
      headers: await authHeaders(),
    })

    if (!response.ok) {
      return {
        status: "unavailable",
        error: await readApiError(response, remoteUnavailable.error ?? ""),
      }
    }

    const body: unknown = await response.json()
    const items =
      typeof body === "object" && body !== null
        ? (body as { items?: unknown }).items
        : undefined

    return {
      status: "ok",
      result: parseItemsPayload({
        version: ITEMS_STORAGE_VERSION,
        items,
      }),
    }
  } catch (error) {
    return {
      status: "unavailable",
      error:
        error instanceof Error
          ? error.message
          : (remoteUnavailable.error ?? "Não foi possível sincronizar a lista."),
    }
  }
}

async function loadSupabaseList(userId: string): Promise<
  | { status: "ok"; result: LoadItemsResult }
  | { status: "missing" }
  | { status: "unavailable" }
> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("version, items")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return { status: "unavailable" }
  }

  if (!data) {
    return { status: "missing" }
  }

  return {
    status: "ok",
    result: parseItemsPayload({
      version: data.version,
      items: data.items as unknown,
    }),
  }
}

export async function saveRemoteList(
  _userId: string,
  items: ShoppingItem[],
): Promise<ShoppingItem[]> {
  const response = await fetch("/api/list", {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({ items }),
  })

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível sincronizar a lista."),
    )
  }

  const body: unknown = await response.json()
  const parsed = parseItemsPayload({
    version: ITEMS_STORAGE_VERSION,
    items:
      typeof body === "object" && body !== null
        ? (body as { items?: unknown }).items
        : undefined,
  })

  return parsed.persistable ? parsed.items : items
}

export async function hydrateShoppingList(
  userId: string,
  ownerEmail: string,
): Promise<LoadItemsResult> {
  const neon = await loadNeonList()
  const local = loadItems(ownerEmail)

  if (neon.status === "ok") {
    if (!neon.result.persistable) {
      return neon.result
    }

    if (neon.result.items.length > 0) {
      try {
        saveItems(ownerEmail, neon.result.items)
      } catch {
        return neon.result
      }

      return neon.result
    }

    const supabaseList = await loadSupabaseList(userId)
    const incoming =
      supabaseList.status === "ok" && supabaseList.result.persistable
        ? supabaseList.result
        : local.persistable && local.items.length > 0
          ? local
          : { items: [] as ShoppingItem[], error: null, persistable: true }

    if (incoming.items.length > 0) {
      try {
        await saveRemoteList(userId, incoming.items)
        try {
          saveItems(ownerEmail, incoming.items)
        } catch {
          return incoming
        }
        return incoming
      } catch {
        return {
          items: incoming.items,
          error: "A lista local não pôde ser enviada ao servidor.",
          persistable: true,
        }
      }
    }

    return { items: [], error: neon.result.error, persistable: true }
  }

  if (local.persistable) {
    return {
      items: local.items,
      error:
        "Não foi possível sincronizar. Mostrando a última cópia deste dispositivo.",
      persistable: true,
    }
  }

  return remoteUnavailable
}
