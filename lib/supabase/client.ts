/**
 * Supabase Client - Browser/Client-side
 * Used for realtime subscriptions and client-side data fetching
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton for client-side usage
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() should only be called on the client side')
  }
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
