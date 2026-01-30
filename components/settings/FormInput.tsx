"use client"

import { useState } from "react"
import classNames from "classnames"
import { Eye, EyeOff } from "lucide-react"

interface FormInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "password" | "number" | "url" | "email"
  placeholder?: string
  description?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  description,
  error,
  disabled = false,
  required = false,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={classNames(
            "w-full bg-theme-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-theme-500",
            "focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-rose-500" : "border-theme-700",
            isPassword && "pr-10"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-400 hover:text-white"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {description && !error && (
        <span className="text-xs text-theme-400">{description}</span>
      )}
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  )
}

interface FormSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  description?: string
  disabled?: boolean
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  description,
  disabled = false,
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={classNames(
          "w-full bg-theme-800 border border-theme-700 rounded-lg px-3 py-2 text-sm text-white",
          "focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && (
        <span className="text-xs text-theme-400">{description}</span>
      )}
    </div>
  )
}

interface FormNumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  description?: string
  disabled?: boolean
}

export function FormNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  description,
  disabled = false,
}: FormNumberInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={classNames(
            "w-full bg-theme-800 border border-theme-700 rounded-lg px-3 py-2 text-sm text-white",
            "focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        {unit && <span className="text-sm text-theme-400 whitespace-nowrap">{unit}</span>}
      </div>
      {description && (
        <span className="text-xs text-theme-400">{description}</span>
      )}
    </div>
  )
}
