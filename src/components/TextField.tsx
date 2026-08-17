import type { InputHTMLAttributes } from "react"
import { fieldClass } from "../lib/ui"

type TextFieldProps = {
  id: string
  label: string
  error: string | null
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">

export function TextField({
  id,
  label,
  error,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[13px] leading-5 text-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error !== null}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass(error !== null, className)}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
