import classNames from "classnames"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-theme-500 hover:bg-theme-600 text-white",
    secondary: "bg-theme-700 hover:bg-theme-600 text-white",
    ghost: "hover:bg-theme-700 text-theme-400",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  }
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={classNames(
        "rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <span className="animate-spin">↻</span>}
      {children}
    </button>
  )
}
