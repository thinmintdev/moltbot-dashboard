'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type {
  Project,
  Task,
  AgentRun,
  AgentLog,
  Roadmap,
  Context,
  TaskStatus,
} from '@/lib/supabase/types'

// Generic insert/update types
type ProjectInsert = Partial<Project> & { user_id: string; name: string }
type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
type TaskInsert = Partial<Task> & { project_id: string; title: string }
type TaskUpdate = Partial<Omit<Task, 'id' | 'project_id' | 'created_at'>>
type AgentRunInsert = Partial<AgentRun> & { agent_id: string }
type AgentRunUpdate = Partial<Omit<AgentRun, 'id' | 'agent_id' | 'created_at'>>
type AgentLogInsert = Partial<AgentLog> & { run_id: string; message: string }
type RoadmapInsert = Partial<Roadmap> & { project_id: string; name: string }
type RoadmapUpdate = Partial<Omit<Roadmap, 'id' | 'project_id' | 'created_at'>>
type ContextInsert = Partial<Context> & { project_id: string; name: string; content: string }
type ContextUpdate = Partial<Omit<Context, 'id' | 'project_id' | 'created_at'>>

// =============================================================================
// Core Supabase Hook
// =============================================================================

export function useSupabase() {
  const [isReady, setIsReady] = useState(false)
  const clientRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null)

  useEffect(() => {
    clientRef.current = getSupabaseClient()
    setIsReady(true)
  }, [])

  return { client: clientRef.current, isReady }
}

// =============================================================================
// Projects Hook
// =============================================================================

export function useProjects() {
  const { client, isReady } = useSupabase()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!client) return
    setIsLoading(true)
    try {
      const { data, error } = await client
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'))
    } finally {
      setIsLoading(false)
    }
  }, [client])

  const createProject = useCallback(async (project: ProjectInsert) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('projects').insert(project).select().single()
    if (error) throw error
    setProjects((prev) => [data as Project, ...prev])
    return data as Project
  }, [client])

  const updateProject = useCallback(async (id: string, updates: ProjectUpdate) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('projects').update(updates).eq('id', id).select().single()
    if (error) throw error
    setProjects((prev) => prev.map((p) => (p.id === id ? (data as Project) : p)))
    return data as Project
  }, [client])

  const deleteProject = useCallback(async (id: string) => {
    if (!client) throw new Error('Client not ready')
    const { error } = await client.from('projects').delete().eq('id', id)
    if (error) throw error
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [client])

  useEffect(() => {
    if (isReady) fetchProjects()
  }, [isReady, fetchProjects])

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  }
}

// =============================================================================
// Tasks Hook with Realtime
// =============================================================================

export function useTasks(projectId?: string) {
  const { client, isReady } = useSupabase()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!client) return
    setIsLoading(true)
    try {
      let query = client.from('tasks').select('*').order('order_index', { ascending: true })
      if (projectId) query = query.eq('project_id', projectId)

      const { data, error } = await query
      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
    } finally {
      setIsLoading(false)
    }
  }, [client, projectId])

  const createTask = useCallback(async (task: TaskInsert) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('tasks').insert(task).select().single()
    if (error) throw error
    return data as Task
  }, [client])

  const updateTask = useCallback(async (id: string, updates: TaskUpdate) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('tasks').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data as Task
  }, [client])

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    return updateTask(id, { status })
  }, [updateTask])

  const deleteTask = useCallback(async (id: string) => {
    if (!client) throw new Error('Client not ready')
    const { error } = await client.from('tasks').delete().eq('id', id)
    if (error) throw error
  }, [client])

  const reorderTasks = useCallback(async (taskIds: string[]) => {
    if (!client) throw new Error('Client not ready')
    for (let i = 0; i < taskIds.length; i++) {
      await client.from('tasks').update({ order_index: i }).eq('id', taskIds[i])
    }
  }, [client])

  // Realtime subscription
  useEffect(() => {
    if (!client || !isReady) return

    const channel = client
      .channel(`tasks-${projectId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        (payload: RealtimePostgresChangesPayload<Task>) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, payload.new as Task].sort((a, b) => a.order_index - b.order_index))
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t))
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [client, isReady, projectId])

  useEffect(() => {
    if (isReady) fetchTasks()
  }, [isReady, fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    reorderTasks,
  }
}

// =============================================================================
// Agent Runs Hook with Realtime (for live agent updates)
// =============================================================================

export function useAgentRuns(agentId?: string) {
  const { client, isReady } = useSupabase()
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRuns = useCallback(async () => {
    if (!client) return
    setIsLoading(true)
    try {
      let query = client.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(50)
      if (agentId) query = query.eq('agent_id', agentId)

      const { data, error } = await query
      if (error) throw error
      setRuns(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agent runs'))
    } finally {
      setIsLoading(false)
    }
  }, [client, agentId])

  const createRun = useCallback(async (run: AgentRunInsert) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('agent_runs').insert(run).select().single()
    if (error) throw error
    return data as AgentRun
  }, [client])

  const updateRun = useCallback(async (id: string, updates: AgentRunUpdate) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('agent_runs').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data as AgentRun
  }, [client])

  // Realtime subscription for agent runs
  useEffect(() => {
    if (!client || !isReady) return

    const channel = client
      .channel(`agent-runs-${agentId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_runs',
          filter: agentId ? `agent_id=eq.${agentId}` : undefined,
        },
        (payload: RealtimePostgresChangesPayload<AgentRun>) => {
          if (payload.eventType === 'INSERT') {
            setRuns((prev) => [payload.new as AgentRun, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setRuns((prev) =>
              prev.map((r) => (r.id === (payload.new as AgentRun).id ? (payload.new as AgentRun) : r))
            )
          } else if (payload.eventType === 'DELETE') {
            setRuns((prev) => prev.filter((r) => r.id !== (payload.old as AgentRun).id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [client, isReady, agentId])

  useEffect(() => {
    if (isReady) fetchRuns()
  }, [isReady, fetchRuns])

  return {
    runs,
    isLoading,
    error,
    fetchRuns,
    createRun,
    updateRun,
  }
}

// =============================================================================
// Agent Logs Hook with Realtime (for streaming logs)
// =============================================================================

export function useAgentLogs(runId: string) {
  const { client, isReady } = useSupabase()
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!client || !runId) return
    setIsLoading(true)
    try {
      const { data, error } = await client
        .from('agent_logs')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [client, runId])

  const addLog = useCallback(async (log: AgentLogInsert) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('agent_logs').insert(log).select().single()
    if (error) throw error
    return data as AgentLog
  }, [client])

  // Realtime subscription for streaming logs
  useEffect(() => {
    if (!client || !isReady || !runId) return

    const channel = client
      .channel(`agent-logs-${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_logs',
          filter: `run_id=eq.${runId}`,
        },
        (payload: RealtimePostgresChangesPayload<AgentLog>) => {
          if (payload.eventType === 'INSERT') {
            setLogs((prev) => [...prev, payload.new as AgentLog])
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [client, isReady, runId])

  useEffect(() => {
    if (isReady && runId) fetchLogs()
  }, [isReady, runId, fetchLogs])

  return { logs, isLoading, addLog }
}

// =============================================================================
// Roadmaps Hook
// =============================================================================

export function useRoadmaps(projectId?: string) {
  const { client, isReady } = useSupabase()
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRoadmaps = useCallback(async () => {
    if (!client) return
    setIsLoading(true)
    try {
      let query = client.from('roadmaps').select('*').order('created_at', { ascending: false })
      if (projectId) query = query.eq('project_id', projectId)

      const { data, error } = await query
      if (error) throw error
      setRoadmaps(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch roadmaps'))
    } finally {
      setIsLoading(false)
    }
  }, [client, projectId])

  const createRoadmap = useCallback(async (roadmap: RoadmapInsert) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('roadmaps').insert(roadmap).select().single()
    if (error) throw error
    setRoadmaps((prev) => [data as Roadmap, ...prev])
    return data as Roadmap
  }, [client])

  const updateRoadmap = useCallback(async (id: string, updates: RoadmapUpdate) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('roadmaps').update(updates).eq('id', id).select().single()
    if (error) throw error
    setRoadmaps((prev) => prev.map((r) => (r.id === id ? (data as Roadmap) : r)))
    return data as Roadmap
  }, [client])

  const deleteRoadmap = useCallback(async (id: string) => {
    if (!client) throw new Error('Client not ready')
    const { error } = await client.from('roadmaps').delete().eq('id', id)
    if (error) throw error
    setRoadmaps((prev) => prev.filter((r) => r.id !== id))
  }, [client])

  useEffect(() => {
    if (isReady) fetchRoadmaps()
  }, [isReady, fetchRoadmaps])

  return {
    roadmaps,
    isLoading,
    error,
    fetchRoadmaps,
    createRoadmap,
    updateRoadmap,
    deleteRoadmap,
  }
}

// =============================================================================
// Contexts Hook
// =============================================================================

export function useContexts(projectId?: string) {
  const { client, isReady } = useSupabase()
  const [contexts, setContexts] = useState<Context[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchContexts = useCallback(async () => {
    if (!client) return
    setIsLoading(true)
    try {
      let query = client.from('contexts').select('*').order('created_at', { ascending: false })
      if (projectId) query = query.eq('project_id', projectId)

      const { data, error } = await query
      if (error) throw error
      setContexts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contexts'))
    } finally {
      setIsLoading(false)
    }
  }, [client, projectId])

  const createContext = useCallback(async (context: ContextInsert) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('contexts').insert(context).select().single()
    if (error) throw error
    setContexts((prev) => [data as Context, ...prev])
    return data as Context
  }, [client])

  const updateContext = useCallback(async (id: string, updates: ContextUpdate) => {
    if (!client) throw new Error('Client not ready')
    const { data, error } = await client.from('contexts').update(updates).eq('id', id).select().single()
    if (error) throw error
    setContexts((prev) => prev.map((c) => (c.id === id ? (data as Context) : c)))
    return data as Context
  }, [client])

  const deleteContext = useCallback(async (id: string) => {
    if (!client) throw new Error('Client not ready')
    const { error } = await client.from('contexts').delete().eq('id', id)
    if (error) throw error
    setContexts((prev) => prev.filter((c) => c.id !== id))
  }, [client])

  useEffect(() => {
    if (isReady) fetchContexts()
  }, [isReady, fetchContexts])

  return {
    contexts,
    isLoading,
    error,
    fetchContexts,
    createContext,
    updateContext,
    deleteContext,
  }
}
