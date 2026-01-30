"use client"

import { ReactNode } from "react"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { ToastProvider } from "@/components/common/Toast"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ToastProvider position="top-right" maxToasts={5}>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}
