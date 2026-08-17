import { Cancel01Icon, ShoppingBasket01Icon } from "@hugeicons/core-free-icons"
import { useEffect, useRef, type ReactNode } from "react"
import { formatBRL, itemSubtotal, type ShoppingItem } from "../lib/items"
import { btnDanger, btnPrimary, btnSecondary } from "../lib/ui"
import { Icon } from "./Icon"

type ConfirmDialogProps = {
  titleId: string
  descriptionId: string
  children: ReactNode
  onCancel: () => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function ConfirmDialog({
  titleId,
  descriptionId,
  children,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement

    function focusableNodes() {
      if (!dialog) {
        return []
      }

      return Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((node) => !node.hasAttribute("disabled"))
    }

    const initial = focusableNodes()[0] ?? dialog
    initial?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== "Tab" || !dialog) {
        return
      }

      const nodes = focusableNodes()

      if (nodes.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)

      if (previous instanceof HTMLElement) {
        previous.focus()
      }
    }
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="max-h-[90svh] w-full max-w-md overflow-y-auto border-t border-line/70 bg-surface px-5 py-6 outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:rounded-lg sm:border sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

type RemoveItemModalProps = {
  item: ShoppingItem
  onCancel: () => void
  onConfirm: () => void
}

export function RemoveItemModal({
  item,
  onCancel,
  onConfirm,
}: RemoveItemModalProps) {
  return (
    <ConfirmDialog
      titleId="remove-item-title"
      descriptionId="remove-item-description"
      onCancel={onCancel}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="remove-item-title" className="text-[1.25rem] tracking-tight">
          Remover item
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar"
          className="flex size-10 items-center justify-center text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Icon icon={Cancel01Icon} size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3 border-y border-line/70 py-4">
        <span className="mt-0.5 text-brand">
          <Icon icon={ShoppingBasket01Icon} size={18} />
        </span>
        <div className="min-w-0">
          <p>{item.name}</p>
          <p className="mt-1 text-sm text-muted">
            {formatBRL(item.priceCents)} · {item.quantity} un.
          </p>
          <p className="mt-2 text-sm text-brand">
            Subtotal: {formatBRL(itemSubtotal(item))}
          </p>
        </div>
      </div>

      <p id="remove-item-description" className="mt-4 text-[15px] text-muted">
        Tem certeza que deseja remover este item da lista?
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={btnDanger}>
          Remover
        </button>
      </div>
    </ConfirmDialog>
  )
}

type ClearListModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

type ImportBackupModalProps = {
  itemCount: number
  onCancel: () => void
  onConfirm: () => void
}

export function ImportBackupModal({
  itemCount,
  onCancel,
  onConfirm,
}: ImportBackupModalProps) {
  return (
    <ConfirmDialog
      titleId="import-backup-title"
      descriptionId="import-backup-description"
      onCancel={onCancel}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="import-backup-title" className="text-[1.25rem] tracking-tight">
          Importar backup
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar"
          className="flex size-10 items-center justify-center text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Icon icon={Cancel01Icon} size={18} />
        </button>
      </div>
      <p id="import-backup-description" className="mt-4 text-[15px] text-muted">
        Isso substitui a lista atual por {itemCount}{" "}
        {itemCount === 1 ? "item" : "itens"} do arquivo.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={btnPrimary}>
          Importar
        </button>
      </div>
    </ConfirmDialog>
  )
}

export function ClearListModal({ onCancel, onConfirm }: ClearListModalProps) {
  return (
    <ConfirmDialog
      titleId="clear-list-title"
      descriptionId="clear-list-description"
      onCancel={onCancel}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="clear-list-title" className="text-[1.25rem] tracking-tight">
          Limpar lista
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar"
          className="flex size-10 items-center justify-center text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Icon icon={Cancel01Icon} size={18} />
        </button>
      </div>
      <p id="clear-list-description" className="mt-4 text-[15px] text-muted">
        Tem certeza que deseja remover todos os itens da lista?
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={btnDanger}>
          Remover
        </button>
      </div>
    </ConfirmDialog>
  )
}
