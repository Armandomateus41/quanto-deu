import {
  Delete02Icon,
  FileExportIcon,
  FileImportIcon,
  ShoppingBasket01Icon,
} from "@hugeicons/core-free-icons"
import { useRef, type ChangeEvent } from "react"
import { useIsDesktopList } from "../hooks/useMediaQuery"
import { formatBRL, itemSubtotal, type ShoppingItem } from "../lib/items"
import { btnIconDanger, btnQuiet, card } from "../lib/ui"
import { Icon } from "./Icon"

type ItemsPanelProps = {
  items: ShoppingItem[]
  total: number
  persistable: boolean
  busy?: boolean
  storageError: string | null
  onExport: () => void
  onImportFile: (file: File) => void
  onRequestRemove: (item: ShoppingItem) => void
}

export function ItemsPanel({
  items,
  total,
  persistable,
  busy = false,
  storageError,
  onExport,
  onImportFile,
  onRequestRemove,
}: ItemsPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null)
  const isDesktopList = useIsDesktopList()

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (file) {
      onImportFile(file)
    }
  }

  return (
    <section
      className={`${card} flex min-h-[16rem] flex-col ${items.length > 0 ? "xl:min-h-[22rem]" : ""}`}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span className="text-brand">
          <Icon icon={ShoppingBasket01Icon} size={18} />
        </span>
        <h2 className="text-[15px] tracking-tight text-ink/90">
          Itens adicionados
          {items.length > 0 ? ` (${items.length})` : ""}
        </h2>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={onExport}
            className={btnQuiet}
            aria-label="Exportar lista"
          >
            <Icon icon={FileExportIcon} size={16} />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={!persistable || busy}
            className={btnQuiet}
            aria-label="Importar lista"
          >
            <Icon icon={FileImportIcon} size={16} />
            Importar
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>
      </div>

      {storageError ? (
        <p className="mb-5 text-sm text-red-400">{storageError}</p>
      ) : null}

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <img
            src="/growth-icon.png"
            alt=""
            className="mb-4 h-28 w-28 object-contain sm:h-32 sm:w-32"
          />
          <p className="text-[15px]">Nenhum item adicionado ainda.</p>
          <p className="mt-1 text-[15px] text-muted">
            Comece adicionando um item acima.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {isDesktopList ? (
            <table className="w-full table-fixed text-left text-[15px]">
              <thead>
                <tr className="border-b border-line text-[12px] text-muted">
                  <th className="w-[36%] pb-3 font-normal">Item</th>
                  <th className="w-[18%] pb-3 text-right font-normal">Preço</th>
                  <th className="w-[12%] pb-3 text-right font-normal">Qtd.</th>
                  <th className="w-[22%] pb-3 text-right font-normal">
                    Subtotal
                  </th>
                  <th className="w-[12%] pb-3 text-right font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-line/70">
                    <td className="py-3.5 pr-4">{item.name}</td>
                    <td className="py-3.5 pr-4 text-right text-muted tabular-nums">
                      {formatBRL(item.priceCents)}
                    </td>
                    <td className="py-3.5 pr-4 text-right text-muted tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 pr-4 text-right tabular-nums">
                      {formatBRL(itemSubtotal(item))}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onRequestRemove(item)}
                        disabled={!persistable || busy}
                        aria-label={`Excluir ${item.name}`}
                        className={`${btnIconDanger} ml-auto`}
                      >
                        <Icon icon={Delete02Icon} size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ul className="divide-y divide-line/70">
              {items.map((item) => (
                <li key={item.id} className="py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[15px]">{item.name}</p>
                    <button
                      type="button"
                      onClick={() => onRequestRemove(item)}
                      disabled={!persistable || busy}
                      aria-label={`Excluir ${item.name}`}
                      className={btnIconDanger}
                    >
                      <Icon icon={Delete02Icon} size={18} />
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted">Preço</dt>
                      <dd className="tabular-nums">
                        {formatBRL(item.priceCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Qtd.</dt>
                      <dd className="tabular-nums">{item.quantity}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted">Subtotal</dt>
                      <dd className="tabular-nums">
                        {formatBRL(itemSubtotal(item))}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-line pt-5">
            <p className="text-[13px] text-muted">Total geral</p>
            <p className="text-xl tracking-tight text-brand tabular-nums">
              {formatBRL(total)}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
