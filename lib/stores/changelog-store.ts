/**
 * Changelog Store
 * Manages version history and change tracking for projects
 */

import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

export type ChangeType = 'added' | 'changed' | 'fixed' | 'removed' | 'security'

export interface Change {
  type: ChangeType
  description: string
}

export interface ChangelogEntry {
  id: string
  version: string
  title: string
  date: string
  changes: Change[]
  projectId: string
  createdAt: string
  updatedAt: string
}

interface ChangelogStore {
  entries: ChangelogEntry[]
  addEntry: (entry: Omit<ChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEntry: (id: string, updates: Partial<ChangelogEntry>) => void
  deleteEntry: (id: string) => void
  getEntriesByProject: (projectId: string) => ChangelogEntry[]
}

// ============================================================================
// Demo Data
// ============================================================================

const demoEntries: ChangelogEntry[] = [
  // MoltBot Dashboard (proj-1) changelog
  {
    id: 'cl-1',
    version: '1.2.0',
    title: 'Agent Monitoring & MCP Integration',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    changes: [
      { type: 'added', description: 'Real-time agent terminal views with log streaming' },
      { type: 'added', description: 'MCP server connection status monitoring' },
      { type: 'added', description: 'Infrastructure dashboard for homelab control' },
      { type: 'changed', description: 'Improved WebSocket reconnection handling' },
      { type: 'fixed', description: 'Agent output buffering causing memory issues' },
      { type: 'security', description: 'Updated dependencies to patch XSS vulnerability' },
    ],
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cl-2',
    version: '1.1.0',
    title: 'Kanban Board & Project Management',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    changes: [
      { type: 'added', description: 'Drag-and-drop Kanban board with swimlanes' },
      { type: 'added', description: 'Task assignment to AI agents' },
      { type: 'added', description: 'Project tabs with color coding' },
      { type: 'changed', description: 'Redesigned navigation sidebar' },
      { type: 'fixed', description: 'Task state not persisting on refresh' },
    ],
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cl-3',
    version: '1.0.0',
    title: 'Initial Release',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    changes: [
      { type: 'added', description: 'Core dashboard infrastructure with Next.js 14' },
      { type: 'added', description: 'WebSocket connection to MoltBot backend' },
      { type: 'added', description: 'Basic task management interface' },
      { type: 'added', description: 'Fire theme with dark mode design' },
    ],
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // MoltenCalc (proj-2) changelog
  {
    id: 'cl-4',
    version: '1.2.0',
    title: 'Advanced Functions',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    changes: [
      { type: 'added', description: 'Scientific calculator mode with trig functions' },
      { type: 'added', description: 'Calculation history panel' },
      { type: 'changed', description: 'Improved precision for floating point operations' },
      { type: 'fixed', description: 'Division by zero error handling' },
    ],
    projectId: 'proj-2',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cl-5',
    version: '1.1.0',
    title: 'Keyboard Support & Memory',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    changes: [
      { type: 'added', description: 'Full keyboard navigation support' },
      { type: 'added', description: 'Memory functions (M+, M-, MR, MC)' },
      { type: 'changed', description: 'Button ripple effect animations' },
      { type: 'removed', description: 'Deprecated percentage mode' },
    ],
    projectId: 'proj-2',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cl-6',
    version: '1.0.0',
    title: 'Calculator Launch',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    changes: [
      { type: 'added', description: 'Basic arithmetic operations (+, -, *, /)' },
      { type: 'added', description: 'Responsive calculator UI' },
      { type: 'added', description: 'Fire theme styling to match MoltBot' },
    ],
    projectId: 'proj-2',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================================================
// Store Implementation
// ============================================================================

export const useChangelogStore = create<ChangelogStore>((set, get) => ({
  entries: demoEntries,

  addEntry: (entryData) => {
    const now = new Date().toISOString()
    const newEntry: ChangelogEntry = {
      ...entryData,
      id: `cl-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      entries: [newEntry, ...state.entries],
    }))
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, ...updates, updatedAt: new Date().toISOString() }
          : e
      ),
    }))
  },

  deleteEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))
  },

  getEntriesByProject: (projectId) => {
    return get().entries.filter((e) => e.projectId === projectId)
  },
}))

// ============================================================================
// Hooks
// ============================================================================

export function useProjectChangelog(projectId: string | null | undefined) {
  const entries = useChangelogStore((s) => s.entries)

  if (!projectId) return []
  return entries
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function useChangelogStats(projectId: string | null | undefined) {
  const entries = useProjectChangelog(projectId)

  const total = entries.length
  const totalChanges = entries.reduce((sum, e) => sum + e.changes.length, 0)

  const changesByType = entries.reduce((acc, e) => {
    e.changes.forEach((c) => {
      acc[c.type] = (acc[c.type] || 0) + 1
    })
    return acc
  }, {} as Record<ChangeType, number>)

  const latestVersion = entries[0]?.version || 'N/A'

  return {
    total,
    totalChanges,
    changesByType,
    latestVersion,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.replace(/^v/, '').split('.').map(Number)
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  }
}

export function getVersionType(version: string): 'major' | 'minor' | 'patch' {
  const { minor, patch } = parseVersion(version)
  if (minor === 0 && patch === 0) return 'major'
  if (patch === 0) return 'minor'
  return 'patch'
}

export function getChangeTypeConfig(type: ChangeType) {
  switch (type) {
    case 'added':
      return { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', label: 'Added' }
    case 'changed':
      return { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', label: 'Changed' }
    case 'fixed':
      return { color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)', label: 'Fixed' }
    case 'removed':
      return { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Removed' }
    case 'security':
      return { color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)', label: 'Security' }
  }
}
