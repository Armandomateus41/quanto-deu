import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons"
import { useState } from "react"
import { fieldClass } from "../lib/ui"
import { Icon } from "./Icon"

type PasswordFieldProps = {
  id: string
  label: string
  placeholder: string
  value: string
  error: string | null
  autoComplete: string
  onChange: (value: string) => void
}

export function PasswordField({
  id,
  label,
  placeholder,
  value,
  error,
  autoComplete,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[13px] text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          aria-invalid={error !== null}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClass(error !== null, "pr-11")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          <Icon icon={visible ? ViewOffSlashIcon : ViewIcon} size={18} />
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
