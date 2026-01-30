/**
 * Ideation Store
 * Manages ideas and brainstorming for projects
 */

import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

export type IdeaCategory = 'feature' | 'improvement' | 'bugfix' | 'research' | 'other'
export type IdeaStatus = 'new' | 'considering' | 'planned' | 'rejected'

export interface Idea {
  id: string
  title: string
  description: string
  category: IdeaCategory
  status: IdeaStatus
  votes: number
  projectId: string
  tags: string[]
  author: string
  createdAt: string
  updatedAt: string
}

export interface IdeationStore {
  ideas: Idea[]
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'votes'>) => void
  updateIdea: (id: string, updates: Partial<Idea>) => void
  deleteIdea: (id: string) => void
  voteIdea: (id: string, delta: 1 | -1) => void
  getIdeasByProject: (projectId: string) => Idea[]
}

// ============================================================================
// Category Colors
// ============================================================================

export const CATEGORY_COLORS: Record<IdeaCategory, string> = {
  feature: '#3b82f6',
  improvement: '#22c55e',
  bugfix: '#ef4444',
  research: '#a855f7',
  other: '#71717a',
}

export const STATUS_COLORS: Record<IdeaStatus, string> = {
  new: '#f97316',
  considering: '#3b82f6',
  planned: '#22c55e',
  rejected: '#71717a',
}

// ============================================================================
// Demo Ideas
// ============================================================================

const demoIdeas: Idea[] = [
  // MoltBot Dashboard (proj-1) ideas
  {
    id: 'idea-1',
    title: 'Add dark/light theme toggle',
    description: 'Allow users to switch between dark and light themes for better accessibility and personal preference.',
    category: 'feature',
    status: 'considering',
    votes: 12,
    projectId: 'proj-1',
    tags: ['ui', 'accessibility', 'settings'],
    author: 'system',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-2',
    title: 'Real-time collaboration features',
    description: 'Enable multiple users to work on the same project simultaneously with live cursors and presence indicators.',
    category: 'feature',
    status: 'new',
    votes: 8,
    projectId: 'proj-1',
    tags: ['collaboration', 'real-time', 'multiplayer'],
    author: 'system',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-3',
    title: 'Improve agent response time',
    description: 'Optimize the WebSocket connection and message queue to reduce latency in agent communications.',
    category: 'improvement',
    status: 'planned',
    votes: 15,
    projectId: 'proj-1',
    tags: ['performance', 'agents', 'websocket'],
    author: 'system',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-4',
    title: 'Add keyboard shortcuts documentation',
    description: 'Create a help modal showing all available keyboard shortcuts for power users.',
    category: 'improvement',
    status: 'new',
    votes: 5,
    projectId: 'proj-1',
    tags: ['documentation', 'ux', 'shortcuts'],
    author: 'system',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-5',
    title: 'Fix modal focus trap',
    description: 'Tab navigation escapes modals when it should stay within the modal content.',
    category: 'bugfix',
    status: 'planned',
    votes: 7,
    projectId: 'proj-1',
    tags: ['accessibility', 'bug', 'modal'],
    author: 'system',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-6',
    title: 'Research vector database integration',
    description: 'Investigate using Pinecone or Qdrant for semantic search across project context and documentation.',
    category: 'research',
    status: 'considering',
    votes: 9,
    projectId: 'proj-1',
    tags: ['ai', 'search', 'database'],
    author: 'system',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // MoltenCalc (proj-2) ideas
  {
    id: 'idea-7',
    title: 'Scientific calculator mode',
    description: 'Add advanced math functions like sin, cos, tan, log, sqrt, and power operations.',
    category: 'feature',
    status: 'new',
    votes: 18,
    projectId: 'proj-2',
    tags: ['feature', 'math', 'scientific'],
    author: 'system',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-8',
    title: 'Unit conversion feature',
    description: 'Allow converting between different units (length, weight, temperature, etc.).',
    category: 'feature',
    status: 'considering',
    votes: 11,
    projectId: 'proj-2',
    tags: ['feature', 'conversion', 'units'],
    author: 'system',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-9',
    title: 'Improve button animations',
    description: 'Add subtle press animations and haptic feedback support for a more satisfying user experience.',
    category: 'improvement',
    status: 'new',
    votes: 6,
    projectId: 'proj-2',
    tags: ['ui', 'animation', 'ux'],
    author: 'system',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-10',
    title: 'Fix decimal precision issues',
    description: 'Some calculations with decimals produce floating point errors (e.g., 0.1 + 0.2 = 0.30000000000000004).',
    category: 'bugfix',
    status: 'planned',
    votes: 14,
    projectId: 'proj-2',
    tags: ['bug', 'precision', 'math'],
    author: 'system',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-11',
    title: 'Research gesture-based input',
    description: 'Explore implementing swipe gestures for operations and handwriting recognition for number input.',
    category: 'research',
    status: 'new',
    votes: 3,
    projectId: 'proj-2',
    tags: ['research', 'gestures', 'input'],
    author: 'system',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'idea-12',
    title: 'Export calculation history',
    description: 'Allow exporting calculation history as CSV or PDF for record keeping.',
    category: 'other',
    status: 'rejected',
    votes: 2,
    projectId: 'proj-2',
    tags: ['export', 'history', 'data'],
    author: 'system',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================================================
// Store Implementation
// ============================================================================

export const useIdeationStore = create<IdeationStore>((set, get) => ({
  ideas: demoIdeas,

  addIdea: (ideaData) => {
    const newIdea: Idea = {
      ...ideaData,
      id: `idea-${Date.now()}`,
      votes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      ideas: [newIdea, ...state.ideas],
    }))
  },

  updateIdea: (id, updates) => {
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id
          ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
          : idea
      ),
    }))
  },

  deleteIdea: (id) => {
    set((state) => ({
      ideas: state.ideas.filter((idea) => idea.id !== id),
    }))
  },

  voteIdea: (id, delta) => {
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id
          ? { ...idea, votes: Math.max(0, idea.votes + delta), updatedAt: new Date().toISOString() }
          : idea
      ),
    }))
  },

  getIdeasByProject: (projectId) => {
    return get().ideas.filter((idea) => idea.projectId === projectId)
  },
}))
