/**
 * Worktree Store
 * Manages Git worktrees for parallel development workflows
 */

import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

export interface Worktree {
  id: string
  path: string
  branch: string
  isMain: boolean
  isBare: boolean
  isLocked: boolean
  lastAccessed: string
  projectId: string
}

interface WorktreeStore {
  worktrees: Worktree[]
  addWorktree: (worktree: Omit<Worktree, 'id' | 'lastAccessed'>) => void
  removeWorktree: (id: string) => void
  lockWorktree: (id: string) => void
  unlockWorktree: (id: string) => void
  updateLastAccessed: (id: string) => void
  getWorktreesByProject: (projectId: string) => Worktree[]
}

// ============================================================================
// Demo Data
// ============================================================================

const demoWorktrees: Worktree[] = [
  // MoltBot Dashboard (proj-1) worktrees
  {
    id: 'wt-1',
    path: '/mnt/dev/repos/moltbot-dashboard',
    branch: 'main',
    isMain: true,
    isBare: false,
    isLocked: false,
    lastAccessed: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    projectId: 'proj-1',
  },
  {
    id: 'wt-2',
    path: '/mnt/dev/repos/moltbot-dashboard-feature-auth',
    branch: 'feature/auth',
    isMain: false,
    isBare: false,
    isLocked: false,
    lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    projectId: 'proj-1',
  },
  {
    id: 'wt-3',
    path: '/mnt/dev/repos/moltbot-dashboard-bugfix-login',
    branch: 'bugfix/login',
    isMain: false,
    isBare: false,
    isLocked: true,
    lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    projectId: 'proj-1',
  },
  // MoltenCalc (proj-2) worktrees
  {
    id: 'wt-4',
    path: '/mnt/dev/repos/moltencalc',
    branch: 'main',
    isMain: true,
    isBare: false,
    isLocked: false,
    lastAccessed: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    projectId: 'proj-2',
  },
  {
    id: 'wt-5',
    path: '/mnt/dev/repos/moltencalc-feature-history',
    branch: 'feature/history',
    isMain: false,
    isBare: false,
    isLocked: false,
    lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    projectId: 'proj-2',
  },
]

// ============================================================================
// Store Implementation
// ============================================================================

export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
  worktrees: demoWorktrees,

  addWorktree: (worktreeData) => {
    const now = new Date().toISOString()
    const newWorktree: Worktree = {
      ...worktreeData,
      id: `wt-${Date.now()}`,
      lastAccessed: now,
    }
    set((state) => ({
      worktrees: [...state.worktrees, newWorktree],
    }))
  },

  removeWorktree: (id) => {
    set((state) => ({
      worktrees: state.worktrees.filter((w) => w.id !== id),
    }))
  },

  lockWorktree: (id) => {
    set((state) => ({
      worktrees: state.worktrees.map((w) =>
        w.id === id ? { ...w, isLocked: true } : w
      ),
    }))
  },

  unlockWorktree: (id) => {
    set((state) => ({
      worktrees: state.worktrees.map((w) =>
        w.id === id ? { ...w, isLocked: false } : w
      ),
    }))
  },

  updateLastAccessed: (id) => {
    set((state) => ({
      worktrees: state.worktrees.map((w) =>
        w.id === id ? { ...w, lastAccessed: new Date().toISOString() } : w
      ),
    }))
  },

  getWorktreesByProject: (projectId) => {
    return get().worktrees.filter((w) => w.projectId === projectId)
  },
}))

// ============================================================================
// Hooks
// ============================================================================

export function useProjectWorktrees(projectId: string | null | undefined) {
  const worktrees = useWorktreeStore((s) => s.worktrees)

  if (!projectId) return []
  return worktrees.filter((w) => w.projectId === projectId)
}

export function useWorktreeStats(projectId: string | null | undefined) {
  const worktrees = useProjectWorktrees(projectId)

  const total = worktrees.length
  const main = worktrees.filter((w) => w.isMain).length
  const feature = worktrees.filter((w) => !w.isMain && w.branch.startsWith('feature/')).length
  const bugfix = worktrees.filter((w) => w.branch.startsWith('bugfix/')).length
  const locked = worktrees.filter((w) => w.isLocked).length

  return {
    total,
    main,
    feature,
    bugfix,
    locked,
  }
}
