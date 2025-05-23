import { cn } from "@/lib/utils"

interface DCALogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "simple"
  showText?: boolean
}

export function DCALogo({ className, size = "md", variant = "default", showText = true }: DCALogoProps) {
  // Size mapping
  const sizeMap = {
    sm: { logo: 24, text: "text-sm" },
    md: { logo: 32, text: "text-base" },
    lg: { logo: 48, text: "text-xl" },
    xl: { logo: 64, text: "text-2xl" },
  }

  const logoSize = sizeMap[size].logo
  const textSize = sizeMap[size].text

  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative">
        <svg
          width={logoSize}
          height={logoSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          {/* Base shape - circular background */}
          <circle cx="32" cy="32" r="30" fill="currentColor" fillOpacity="0.1" />

          {/* Dike representation */}
          <path
            d="M10 40L22 28L32 38L42 28L54 40"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Water representation */}
          <path
            d="M10 44C14 42 18 46 22 44C26 42 30 46 34 44C38 42 42 46 46 44C50 42 54 46 58 44"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points/grid */}
          {variant === "default" && (
            <>
              <circle cx="22" cy="28" r="2" fill="currentColor" />
              <circle cx="32" cy="38" r="2" fill="currentColor" />
              <circle cx="42" cy="28" r="2" fill="currentColor" />
              <circle cx="16" cy="34" r="1.5" fill="currentColor" />
              <circle cx="28" cy="32" r="1.5" fill="currentColor" />
              <circle cx="38" cy="32" r="1.5" fill="currentColor" />
              <circle cx="48" cy="34" r="1.5" fill="currentColor" />
            </>
          )}

          {/* Checkmark element */}
          <path
            d="M20 20L26 26L36 16"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="ml-2 flex flex-col">
          <span className={cn("font-bold tracking-tight leading-none", textSize)}>DCA</span>
          {size !== "sm" && (
            <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Dike Checklist Analyzer</span>
          )}
        </div>
      )}
    </div>
  )
}
