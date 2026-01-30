'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface SupabaseContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | null>(null)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const client = getSupabaseClient()

    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient()
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const client = getSupabaseClient()
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const client = getSupabaseClient()
    const { error } = await client.auth.signOut()
    if (error) throw error
  }

  const signInWithOAuth = async (provider: 'github' | 'google') => {
    const client = getSupabaseClient()
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  return (
    <SupabaseContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useAuth must be used within a SupabaseProvider')
  }
  return context
}
