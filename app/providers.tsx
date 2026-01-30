"use client"

import { ReactNode } from "react"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { ToastProvider } from "@/components/common/Toast"
import { SupabaseProvider } from "@/components/providers/SupabaseProvider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Check if Supabase is configured
  const isSupabaseConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return (
    <ErrorBoundary>
      <ToastProvider position="top-right" maxToasts={5}>
        {isSupabaseConfigured ? (
          <SupabaseProvider>{children}</SupabaseProvider>
        ) : (
          children
        )}
      </ToastProvider>
    </ErrorBoundary>
  )
}
