import { useEffect, useRef, useState } from "react"
import { hydrateShoppingList, saveRemoteList } from "../lib/items-remote"
import {
  parseItemsBackup,
  purchaseTotal,
  saveItems,
  serializeItemsBackup,
  type ShoppingItem,
} from "../lib/items"

const persistBlockedMessage =
  "Os itens salvos não puderam ser lidos. Nada será gravado para não apagar seus dados."

export function useShoppingList(ownerId: string, ownerEmail: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [storageError, setStorageError] = useState<string | null>(null)
  const [persistable, setPersistable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pendingImport, setPendingImport] = useState<ShoppingItem[] | null>(
    null,
  )
  const itemsRef = useRef(items)
  const persistableRef = useRef(persistable)
  itemsRef.current = items
  persistableRef.current = persistable

  const total = purchaseTotal(items)

  useEffect(() => {
    if (!ownerId || !ownerEmail) {
      setItems([])
      setStorageError(null)
      setPersistable(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setPersistable(false)

    void hydrateShoppingList(ownerId, ownerEmail).then((result) => {
      if (cancelled) {
        return
      }

      setItems(result.items)
      setStorageError(result.error)
      setPersistable(result.persistable)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [ownerId, ownerEmail])

  async function persist(nextItems: ShoppingItem[]) {
    if (!ownerId || !ownerEmail) {
      return false
    }

    if (!persistableRef.current) {
      setStorageError(persistBlockedMessage)
      return false
    }

    setBusy(true)

    try {
      const savedItems = await saveRemoteList(ownerId, nextItems)

      try {
        saveItems(ownerEmail, savedItems)
      } catch {
        // A cópia local é secundária à sincronização.
      }

      setItems(savedItems)
      setStorageError(null)
      return true
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Não foi possível sincronizar a lista.",
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  function addItem(item: ShoppingItem) {
    return persist([...itemsRef.current, item])
  }

  function removeItem(itemId: string) {
    return persist(itemsRef.current.filter((item) => item.id !== itemId))
  }

  function clearItems() {
    return persist([])
  }

  function exportItems() {
    const blob = new Blob([serializeItemsBackup(itemsRef.current)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const day = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `quanto-deu-${day}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function prepareImport(raw: string) {
    const result = parseItemsBackup(raw)

    if (!result.persistable) {
      setStorageError(result.error ?? "Arquivo de backup inválido.")
      return false
    }

    setStorageError(result.error)
    setPendingImport(result.items)
    return true
  }

  async function confirmImport() {
    if (!pendingImport) {
      return false
    }

    const saved = await persist(pendingImport)

    if (saved) {
      setPersistable(true)
      setPendingImport(null)
    }

    return saved
  }

  return {
    items,
    total,
    persistable,
    storageError,
    pendingImport,
    loading,
    busy,
    setStorageError,
    addItem,
    removeItem,
    clearItems,
    exportItems,
    prepareImport,
    confirmImport,
    cancelImport: () => setPendingImport(null),
  }
}
