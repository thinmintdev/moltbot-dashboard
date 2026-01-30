/**
 * Supabase Database Types
 * Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          preferences?: Json
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          github_repo: string | null
          color: string
          icon: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          github_repo?: string | null
          color?: string
          icon?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          github_repo?: string | null
          color?: string
          icon?: string | null
          settings?: Json
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          labels: string[]
          assignee_id: string | null
          due_date: string | null
          order_index: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          labels?: string[]
          assignee_id?: string | null
          due_date?: string | null
          order_index?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          labels?: string[]
          assignee_id?: string | null
          due_date?: string | null
          order_index?: number
          metadata?: Json
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          model: string
          skills: string[]
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          model?: string
          skills?: string[]
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: string
          model?: string
          skills?: string[]
          config?: Json
          updated_at?: string
        }
      }
      agent_runs: {
        Row: {
          id: string
          agent_id: string
          task_id: string | null
          project_id: string | null
          status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
          progress: number
          current_step: string | null
          result: Json | null
          error: string | null
          tokens_used: number
          duration_ms: number | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          task_id?: string | null
          project_id?: string | null
          status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          current_step?: string | null
          result?: Json | null
          error?: string | null
          tokens_used?: number
          duration_ms?: number | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          current_step?: string | null
          result?: Json | null
          error?: string | null
          tokens_used?: number
          duration_ms?: number | null
          completed_at?: string | null
        }
      }
      agent_logs: {
        Row: {
          id: string
          run_id: string
          level: 'debug' | 'info' | 'warn' | 'error'
          message: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          level?: 'debug' | 'info' | 'warn' | 'error'
          message: string
          metadata?: Json | null
          created_at?: string
        }
        Update: never
      }
      roadmaps: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          milestones: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          milestones?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          milestones?: Json
          settings?: Json
          updated_at?: string
        }
      }
      contexts: {
        Row: {
          id: string
          project_id: string
          name: string
          type: 'document' | 'code' | 'url' | 'custom'
          content: string
          embedding: number[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type?: 'document' | 'code' | 'url' | 'custom'
          content: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: 'document' | 'code' | 'url' | 'custom'
          content?: string
          embedding?: number[] | null
          metadata?: Json
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      task_status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      agent_run_status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
      log_level: 'debug' | 'info' | 'warn' | 'error'
      context_type: 'document' | 'code' | 'url' | 'custom'
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type AgentRun = Database['public']['Tables']['agent_runs']['Row']
export type AgentLog = Database['public']['Tables']['agent_logs']['Row']
export type Roadmap = Database['public']['Tables']['roadmaps']['Row']
export type Context = Database['public']['Tables']['contexts']['Row']

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']
export type AgentRunStatus = AgentRun['status']
export type LogLevel = AgentLog['level']
export type ContextType = Context['type']
