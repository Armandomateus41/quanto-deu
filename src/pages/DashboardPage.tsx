import { Delete02Icon } from "@hugeicons/core-free-icons"
import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { AddItemForm } from "../components/AddItemForm"
import { AppShell } from "../components/AppShell"
import { Icon } from "../components/Icon"
import { ItemsPanel } from "../components/ItemsPanel"
import { PurchaseBreakdown } from "../components/PurchaseBreakdown"
import {
  ClearListModal,
  ImportBackupModal,
  RemoveItemModal,
} from "../components/RemoveItemModal"
import { useSession } from "../hooks/useSession"
import { useShoppingList } from "../hooks/useShoppingList"
import { formatBRL, type ShoppingItem } from "../lib/items"
import { signOut } from "../lib/session"
import { btnIcon } from "../lib/ui"

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useSession()
  const list = useShoppingList(user?.id ?? "", user?.email ?? "")
  const [itemToRemove, setItemToRemove] = useState<ShoppingItem | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  async function handleLogout() {
    if (signingOut) {
      return
    }

    setSigningOut(true)

    try {
      await signOut()
      navigate("/login", { replace: true })
    } catch (error) {
      list.setStorageError(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar a sessão.",
      )
      setSigningOut(false)
    }
  }

  async function handleConfirmRemove() {
    if (!itemToRemove) {
      return
    }

    await list.removeItem(itemToRemove.id)
    setItemToRemove(null)
  }

  return (
    <AppShell
      title="Lista"
      user={user}
      onLogout={handleLogout}
      headerExtra={
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right">
            <p className="text-[11px] leading-4 tracking-wide text-muted uppercase">
              Total da compra
            </p>
            <p className="text-2xl leading-none tracking-tight text-brand tabular-nums sm:text-3xl">
              {formatBRL(list.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={!list.persistable || list.busy || list.items.length === 0}
            aria-label="Limpar lista"
            className={btnIcon}
          >
            <Icon icon={Delete02Icon} size={18} />
          </button>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {list.loading ? (
          <p className="text-[13px] text-muted">Sincronizando a lista…</p>
        ) : null}

        <AddItemForm
          persistable={list.persistable}
          busy={list.busy || list.loading}
          itemCount={list.items.length}
          onAdd={list.addItem}
          onBlocked={list.setStorageError}
        />

        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ItemsPanel
            items={list.items}
            total={list.total}
            persistable={list.persistable}
            busy={list.busy || list.loading}
            storageError={list.storageError}
            onExport={list.exportItems}
            onImportFile={(file) => {
              void file.text().then((raw) => {
                list.prepareImport(raw)
              }).catch(() => {
                list.setStorageError("Não foi possível ler o arquivo de backup.")
              })
            }}
            onRequestRemove={setItemToRemove}
          />

          {list.items.length > 0 ? (
            <PurchaseBreakdown items={list.items} />
          ) : null}
        </div>
      </div>

      {itemToRemove ? (
        <RemoveItemModal
          item={itemToRemove}
          onCancel={() => setItemToRemove(null)}
          onConfirm={handleConfirmRemove}
        />
      ) : null}

      {confirmClear ? (
        <ClearListModal
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            void list.clearItems().then(() => {
              setConfirmClear(false)
            })
          }}
        />
      ) : null}

      {list.pendingImport ? (
        <ImportBackupModal
          itemCount={list.pendingImport.length}
          onCancel={list.cancelImport}
          onConfirm={() => {
            void list.confirmImport()
          }}
        />
      ) : null}
    </AppShell>
  )
}
