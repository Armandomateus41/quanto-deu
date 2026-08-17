import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

type IconProps = {
  icon: IconSvgElement
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({
  icon,
  size = 18,
  strokeWidth = 1.5,
  className,
}: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  )
}
