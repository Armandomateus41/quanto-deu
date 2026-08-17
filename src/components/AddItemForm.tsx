import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { useState, type FormEvent } from "react"
import {
  MAX_ITEM_NAME_LENGTH,
  MAX_ITEMS,
  MAX_PRICE_CENTS,
  MAX_QUANTITY,
  formatBRL,
  inspectPrice,
  inspectQuantity,
  type ShoppingItem,
} from "../lib/items"
import { btnPrimary, card } from "../lib/ui"
import { Icon } from "./Icon"
import { TextField } from "./TextField"

type FieldErrors = {
  name: string | null
  price: string | null
  quantity: string | null
}

const emptyFieldErrors: FieldErrors = {
  name: null,
  price: null,
  quantity: null,
}

function nameErrorMessage(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return "Informe o nome do produto."
  }

  if (trimmed.length > MAX_ITEM_NAME_LENGTH) {
    return `O nome deve ter no máximo ${MAX_ITEM_NAME_LENGTH} caracteres.`
  }

  return null
}

function priceErrorMessage(value: string): string | null {
  const result = inspectPrice(value)

  if (result.status === "ok") {
    return null
  }

  if (result.status === "empty") {
    return "Informe o preço."
  }

  if (result.status === "non-positive") {
    return "O preço deve ser maior que zero."
  }

  if (result.status === "too-large") {
    return `O preço deve ser no máximo ${formatBRL(MAX_PRICE_CENTS)}.`
  }

  return "Informe um preço válido."
}

function quantityErrorMessage(value: string): string | null {
  const result = inspectQuantity(value)

  if (result.status === "ok") {
    return null
  }

  if (result.status === "empty") {
    return "Informe a quantidade."
  }

  if (result.status === "non-positive") {
    return "A quantidade deve ser maior que zero."
  }

  if (result.status === "too-large") {
    return `A quantidade deve ser no máximo ${MAX_QUANTITY}.`
  }

  return "Informe uma quantidade válida."
}

type AddItemFormProps = {
  persistable: boolean
  busy?: boolean
  itemCount: number
  onAdd: (item: ShoppingItem) => boolean | Promise<boolean>
  onBlocked: (message: string) => void
}

export function AddItemForm({
  persistable,
  busy = false,
  itemCount,
  onAdd,
  onBlocked,
}: AddItemFormProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy || submitting) {
      return
    }

    if (!persistable) {
      onBlocked(
        "Os itens salvos não puderam ser lidos. Nada será gravado para não apagar seus dados.",
      )
      return
    }

    if (itemCount >= MAX_ITEMS) {
      onBlocked(`A lista pode ter no máximo ${MAX_ITEMS} itens.`)
      return
    }

    const nextErrors: FieldErrors = {
      name: nameErrorMessage(name),
      price: priceErrorMessage(price),
      quantity: quantityErrorMessage(quantity),
    }

    setFieldErrors(nextErrors)

    const priceResult = inspectPrice(price)
    const quantityResult = inspectQuantity(quantity)

    if (
      nextErrors.name ||
      priceResult.status !== "ok" ||
      quantityResult.status !== "ok"
    ) {
      return
    }

    setSubmitting(true)

    try {
      const saved = await onAdd({
        id: crypto.randomUUID(),
        name: name.trim(),
        priceCents: priceResult.cents,
        quantity: quantityResult.quantity,
      })

      if (!saved) {
        return
      }

      setName("")
      setPrice("")
      setQuantity("1")
      setFieldErrors(emptyFieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={card}>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="text-brand">
          <Icon icon={PlusSignIcon} size={18} />
        </span>
        <h2 className="text-[15px] tracking-tight text-ink/90">
          Adicionar item
        </h2>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 items-start gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_minmax(6.75rem,8.5rem)_auto]">
          <div className="sm:col-span-2 lg:col-span-1">
            <TextField
              id="product-name"
              name="product"
              type="text"
              autoComplete="off"
              label="Item"
              placeholder="Ex.: Café"
              className="bg-page"
              value={name}
              error={fieldErrors.name}
              onChange={(event) => {
                const value = event.target.value
                setName(value)
                setFieldErrors((current) =>
                  current.name === null
                    ? current
                    : { ...current, name: nameErrorMessage(value) },
                )
              }}
            />
          </div>
          <TextField
            id="product-price"
            name="price"
            type="text"
            inputMode="decimal"
            label="Preço (R$)"
            placeholder="Ex.: 12,50"
            className="bg-page"
            value={price}
            error={fieldErrors.price}
            onChange={(event) => {
              const value = event.target.value
              setPrice(value)
              setFieldErrors((current) =>
                current.price === null
                  ? current
                  : { ...current, price: priceErrorMessage(value) },
              )
            }}
          />
          <TextField
            id="product-quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            label="Quantidade"
            className="bg-page"
            value={quantity}
            error={fieldErrors.quantity}
            onChange={(event) => {
              const value = event.target.value
              setQuantity(value)
              setFieldErrors((current) =>
                current.quantity === null
                  ? current
                  : { ...current, quantity: quantityErrorMessage(value) },
              )
            }}
          />
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <span
              className="hidden text-[13px] leading-5 text-muted lg:block"
              aria-hidden
            >
              &nbsp;
            </span>
            <button
              type="submit"
              disabled={!persistable || busy || submitting || itemCount >= MAX_ITEMS}
              className={`${btnPrimary} w-full lg:min-w-[11.5rem] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <Icon icon={PlusSignIcon} size={16} />
              Adicionar item
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
