"use client"

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react"
import classNames from "classnames"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface ToastData {
  id: string
  variant: ToastVariant
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    containerClass: "bg-emerald-500/10 border-emerald-500/30",
    iconClass: "text-emerald-400",
    titleClass: "text-emerald-300",
  },
  error: {
    icon: AlertCircle,
    containerClass: "bg-rose-500/10 border-rose-500/30",
    iconClass: "text-rose-400",
    titleClass: "text-rose-300",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "bg-amber-500/10 border-amber-500/30",
    iconClass: "text-amber-400",
    titleClass: "text-amber-300",
  },
  info: {
    icon: Info,
    containerClass: "bg-blue-500/10 border-blue-500/30",
    iconClass: "text-blue-400",
    titleClass: "text-blue-300",
  },
}

function Toast({ id, variant, title, message, duration = 5000, dismissible = true, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onDismiss(id), 200)
  }, [id, onDismiss])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, handleDismiss])

  return (
    <div
      className={classNames(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-200",
        config.containerClass,
        isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      )}
      role="alert"
    >
      <Icon className={classNames("w-5 h-5 shrink-0 mt-0.5", config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className={classNames("font-medium text-sm", config.titleClass)}>{title}</p>
        {message && (
          <p className="text-theme-400 text-sm mt-1">{message}</p>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="text-theme-500 hover:text-white transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Toast Container component
interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
}

const positionClasses = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
}

export function ToastContainer({ toasts, onDismiss, position = "top-right" }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className={classNames(
        "fixed z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none",
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

// Toast Context for global toast management
interface ToastContextType {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, "id">) => string
  removeToast: (id: string) => void
  clearAll: () => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
  position?: ToastContainerProps["position"]
  maxToasts?: number
}

export function ToastProvider({ children, position = "top-right", maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id }]
      // Limit the number of toasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts)
      }
      return newToasts
    })
    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const success = useCallback((title: string, message?: string) => {
    return addToast({ variant: "success", title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    return addToast({ variant: "error", title, message, duration: 8000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    return addToast({ variant: "warning", title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    return addToast({ variant: "info", title, message })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} position={position} />
    </ToastContext.Provider>
  )
}

export default Toast
