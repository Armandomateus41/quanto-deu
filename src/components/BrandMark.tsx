type BrandMarkProps = {
  caption?: string
  size?: "sm" | "md" | "lg"
  align?: "left" | "center"
}

const heightClass = {
  sm: "h-14",
  md: "h-16",
  lg: "h-20 sm:h-24",
}

export function BrandMark({
  caption,
  size = "sm",
  align = "left",
}: BrandMarkProps) {
  return (
    <div className={align === "center" ? "flex flex-col items-center" : "min-w-0"}>
      <img
        src="/logo.png"
        alt="Quanto Deu?"
        className={`${heightClass[size]} w-auto max-w-full object-contain ${align === "center" ? "" : "object-left"}`}
      />
      {caption ? (
        <p
          className={
            align === "center"
              ? "mt-2 text-[13px] text-muted"
              : "mt-1 truncate text-[13px] text-muted"
          }
        >
          {caption}
        </p>
      ) : null}
    </div>
  )
}
