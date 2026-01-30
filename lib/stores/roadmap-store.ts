/**
 * Roadmap Store
 * Manages milestones and timeline visualization for project planning
 */

import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

export interface Milestone {
  id: string
  title: string
  description: string
  status: 'planned' | 'in_progress' | 'completed' | 'blocked'
  dueDate: string
  progress: number
  projectId: string
  tasks: string[] // task IDs linked
  createdAt: string
  updatedAt: string
}

interface RoadmapStore {
  milestones: Milestone[]
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMilestone: (id: string, updates: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  getMilestonesByProject: (projectId: string) => Milestone[]
}

// ============================================================================
// Demo Data
// ============================================================================

const demoMilestones: Milestone[] = [
  // MoltBot Dashboard (proj-1) milestones
  {
    id: 'ms-1',
    title: 'Core Infrastructure',
    description: 'Setup foundational components including WebSocket, state management, and API layer',
    status: 'completed',
    dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 100,
    projectId: 'proj-1',
    tasks: ['molten-1'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ms-2',
    title: 'Kanban Board MVP',
    description: 'Implement drag-and-drop Kanban board with task management and agent integration',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 75,
    projectId: 'proj-1',
    tasks: ['molten-2', 'molten-3'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ms-3',
    title: 'MCP Integration',
    description: 'Connect to Model Context Protocol servers for agent tool access and homelab control',
    status: 'planned',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    projectId: 'proj-1',
    tasks: ['molten-4'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ms-4',
    title: 'Agent Monitoring',
    description: 'Build real-time agent terminal views with log streaming and interaction capabilities',
    status: 'planned',
    dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    projectId: 'proj-1',
    tasks: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // MoltenCalc (proj-2) milestones
  {
    id: 'ms-5',
    title: 'Project Setup',
    description: 'Initialize React TypeScript project with Tailwind CSS and configure development environment',
    status: 'completed',
    dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 100,
    projectId: 'proj-2',
    tasks: ['calc-1'],
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ms-6',
    title: 'Calculator UI',
    description: 'Design and implement the main calculator interface with responsive layout',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 45,
    projectId: 'proj-2',
    tasks: ['calc-2', 'calc-7'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ms-7',
    title: 'Core Operations',
    description: 'Implement all arithmetic operations with proper error handling',
    status: 'blocked',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 20,
    projectId: 'proj-2',
    tasks: ['calc-3', 'calc-8'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ms-8',
    title: 'Advanced Features',
    description: 'Add memory functions, keyboard support, and calculation history',
    status: 'planned',
    dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    projectId: 'proj-2',
    tasks: ['calc-4', 'calc-5', 'calc-6'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================================================
// Store Implementation
// ============================================================================

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
  milestones: demoMilestones,

  addMilestone: (milestoneData) => {
    const now = new Date().toISOString()
    const newMilestone: Milestone = {
      ...milestoneData,
      id: `ms-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      milestones: [...state.milestones, newMilestone],
    }))
  },

  updateMilestone: (id, updates) => {
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id
          ? { ...m, ...updates, updatedAt: new Date().toISOString() }
          : m
      ),
    }))
  },

  deleteMilestone: (id) => {
    set((state) => ({
      milestones: state.milestones.filter((m) => m.id !== id),
    }))
  },

  getMilestonesByProject: (projectId) => {
    return get().milestones.filter((m) => m.projectId === projectId)
  },
}))

// ============================================================================
// Hooks
// ============================================================================

export function useProjectMilestones(projectId: string | null | undefined) {
  const milestones = useRoadmapStore((s) => s.milestones)

  if (!projectId) return []
  return milestones.filter((m) => m.projectId === projectId)
}

export function useMilestoneStats(projectId: string | null | undefined) {
  const milestones = useProjectMilestones(projectId)

  const total = milestones.length
  const completed = milestones.filter((m) => m.status === 'completed').length
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length
  const blocked = milestones.filter((m) => m.status === 'blocked').length
  const planned = milestones.filter((m) => m.status === 'planned').length

  const overallProgress = total > 0
    ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / total)
    : 0

  return {
    total,
    completed,
    inProgress,
    blocked,
    planned,
    overallProgress,
  }
}
