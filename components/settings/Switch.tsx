"use client"

import * as SwitchPrimitive from "@radix-ui/react-switch"
import classNames from "classnames"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
  label?: string
  description?: string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  label,
  description,
}: SwitchProps) {
  const sizes = {
    sm: {
      root: "w-8 h-5",
      thumb: "w-4 h-4 data-[state=checked]:translate-x-3",
    },
    md: {
      root: "w-11 h-6",
      thumb: "w-5 h-5 data-[state=checked]:translate-x-5",
    },
  }

  const switchElement = (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={classNames(
        "relative rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2 focus:ring-offset-theme-900",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-theme-500" : "bg-theme-700",
        sizes[size].root
      )}
    >
      <SwitchPrimitive.Thumb
        className={classNames(
          "block rounded-full bg-white transition-transform",
          "translate-x-0.5",
          sizes[size].thumb
        )}
      />
    </SwitchPrimitive.Root>
  )

  if (label || description) {
    return (
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{switchElement}</div>
        <div className="flex flex-col">
          {label && (
            <label className="text-sm font-medium text-white cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-theme-400">{description}</span>
          )}
        </div>
      </div>
    )
  }

  return switchElement
}
