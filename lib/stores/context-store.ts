/**
 * Context Store
 * Manages project context documents for AI agents
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ContextDocumentType = 'file' | 'snippet' | 'note' | 'link';

export interface ContextDocument {
  id: string;
  title: string;
  content: string;
  type: ContextDocumentType;
  path?: string; // for file type
  url?: string; // for link type
  isActive: boolean; // whether included in AI context
  projectId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Store Interface
// ============================================================================

interface ContextStore {
  documents: ContextDocument[];

  // Actions
  addDocument: (doc: Omit<ContextDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, updates: Partial<ContextDocument>) => void;
  deleteDocument: (id: string) => void;
  toggleActive: (id: string) => void;

  // Selectors
  getDocumentsByProject: (projectId: string) => ContextDocument[];
  getActiveContext: (projectId: string) => ContextDocument[];
  getDocumentById: (id: string) => ContextDocument | undefined;
  getDocumentsByType: (projectId: string, type: ContextDocumentType) => ContextDocument[];
  searchDocuments: (projectId: string, query: string) => ContextDocument[];
}

// ============================================================================
// Demo Data
// ============================================================================

const DEMO_DOCUMENTS: ContextDocument[] = [
  // Project 1: MoltBot Dashboard (molten)
  {
    id: 'ctx-1',
    title: 'Project Architecture',
    content: `# MoltBot Dashboard Architecture

## Overview
The MoltBot Dashboard is a Next.js 14 application that provides a unified interface for managing AI agents, tasks, and project workflows.

## Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide icons

## Key Features
1. Kanban board for task management
2. Agent spawning and monitoring
3. MCP server integrations
4. Real-time WebSocket communication

## Directory Structure
\`\`\`
app/           - Next.js app router pages
components/    - React components
lib/           - Utilities, stores, API clients
hooks/         - Custom React hooks
\`\`\``,
    type: 'note',
    isActive: true,
    projectId: 'proj-1',
    tags: ['architecture', 'documentation'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ctx-2',
    title: 'API Design Guidelines',
    content: `# MoltBot API Guidelines

## REST Endpoints
- Use kebab-case for URLs
- Return JSON responses
- Include proper error handling

## WebSocket Protocol
Messages follow the OpenClaw format:
\`\`\`json
{
  "type": "agent_progress",
  "data": {
    "runId": "...",
    "progress": 50
  }
}
\`\`\`

## Authentication
All endpoints require session authentication via Supabase.`,
    type: 'note',
    isActive: true,
    projectId: 'proj-1',
    tags: ['api', 'guidelines'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ctx-3',
    title: 'tailwind.config.ts',
    content: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fire: {
          500: "#ef4444",
          600: "#dc2626",
        },
        ember: {
          500: "#f97316",
          600: "#ea580c",
        },
      },
    },
  },
  plugins: [],
};

export default config;`,
    type: 'file',
    path: '/mnt/dev/repos/moltbot-dashboard/tailwind.config.ts',
    isActive: true,
    projectId: 'proj-1',
    tags: ['config', 'tailwind'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ctx-4',
    title: 'Color Palette Snippet',
    content: `// Fire theme colors
const colors = {
  background: '#0a0a0b',
  card: '#18181b',
  section: '#111113',
  border: '#27272a',
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
  fire: {
    red: '#ef4444',
    orange: '#f97316',
  },
  status: {
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#ef4444',
    info: '#3b82f6',
    purple: '#a855f7',
  },
};`,
    type: 'snippet',
    isActive: true,
    projectId: 'proj-1',
    tags: ['colors', 'design', 'theme'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ctx-5',
    title: 'Zustand Documentation',
    content: 'Official Zustand documentation for state management best practices.',
    type: 'link',
    url: 'https://docs.pmnd.rs/zustand/getting-started/introduction',
    isActive: false,
    projectId: 'proj-1',
    tags: ['zustand', 'state', 'reference'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Project 2: MoltenCalc
  {
    id: 'ctx-6',
    title: 'Calculator Requirements',
    content: `# MoltenCalc Requirements

## Core Features
1. Basic arithmetic operations (+, -, *, /)
2. Memory functions (M+, M-, MR, MC)
3. Keyboard input support
4. Calculation history

## UI Requirements
- Clean, modern interface
- Fire theme consistent with MoltBot
- Responsive design
- Accessible keyboard navigation

## Technical Requirements
- React with TypeScript
- Unit test coverage > 80%
- Error handling for edge cases (division by zero, overflow)`,
    type: 'note',
    isActive: true,
    projectId: 'proj-2',
    tags: ['requirements', 'features'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ctx-7',
    title: 'Calculator State Logic',
    content: `// Calculator state management
interface CalculatorState {
  display: string;
  previousValue: number | null;
  operator: string | null;
  waitingForOperand: boolean;
  memory: number;
}

type CalculatorAction =
  | { type: 'DIGIT'; digit: string }
  | { type: 'OPERATOR'; operator: string }
  | { type: 'EQUALS' }
  | { type: 'CLEAR' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'MEMORY_ADD' }
  | { type: 'MEMORY_SUBTRACT' }
  | { type: 'MEMORY_RECALL' }
  | { type: 'MEMORY_CLEAR' };

function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  // Implementation...
}`,
    type: 'snippet',
    isActive: true,
    projectId: 'proj-2',
    tags: ['state', 'logic', 'typescript'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ctx-8',
    title: 'React Calculator Tutorial',
    content: 'Reference tutorial for building a calculator in React.',
    type: 'link',
    url: 'https://react.dev/learn/tutorial-tic-tac-toe',
    isActive: false,
    projectId: 'proj-2',
    tags: ['react', 'tutorial', 'reference'],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useContextStore = create<ContextStore>()(
  persist(
    (set, get) => ({
      documents: DEMO_DOCUMENTS,

      addDocument: (doc) => {
        const now = new Date().toISOString();
        const newDoc: ContextDocument = {
          ...doc,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          documents: [...state.documents, newDoc],
        }));
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
              : doc
          ),
        }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        }));
      },

      toggleActive: (id) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? { ...doc, isActive: !doc.isActive, updatedAt: new Date().toISOString() }
              : doc
          ),
        }));
      },

      getDocumentsByProject: (projectId) => {
        return get().documents.filter((doc) => doc.projectId === projectId);
      },

      getActiveContext: (projectId) => {
        return get().documents.filter(
          (doc) => doc.projectId === projectId && doc.isActive
        );
      },

      getDocumentById: (id) => {
        return get().documents.find((doc) => doc.id === id);
      },

      getDocumentsByType: (projectId, type) => {
        return get().documents.filter(
          (doc) => doc.projectId === projectId && doc.type === type
        );
      },

      searchDocuments: (projectId, query) => {
        const lowerQuery = query.toLowerCase();
        return get().documents.filter(
          (doc) =>
            doc.projectId === projectId &&
            (doc.title.toLowerCase().includes(lowerQuery) ||
              doc.content.toLowerCase().includes(lowerQuery) ||
              doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
        );
      },
    }),
    {
      name: 'moltbot-context-store',
      version: 1,
    }
  )
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Estimate token count for a string
 * Rough approximation: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get total token estimate for active context
 */
export function getActiveContextTokens(projectId: string): number {
  const documents = useContextStore.getState().getActiveContext(projectId);
  return documents.reduce((total, doc) => {
    const contentTokens = estimateTokens(doc.content);
    const titleTokens = estimateTokens(doc.title);
    return total + contentTokens + titleTokens + 10; // 10 for metadata overhead
  }, 0);
}

/**
 * Format context documents for AI prompt
 */
export function formatContextForPrompt(projectId: string): string {
  const documents = useContextStore.getState().getActiveContext(projectId);

  if (documents.length === 0) {
    return '';
  }

  return documents
    .map((doc) => {
      const header = `### ${doc.title} (${doc.type})`;
      const metadata = doc.path
        ? `Path: ${doc.path}`
        : doc.url
        ? `URL: ${doc.url}`
        : '';
      const tags = doc.tags.length > 0 ? `Tags: ${doc.tags.join(', ')}` : '';

      return [header, metadata, tags, '', doc.content].filter(Boolean).join('\n');
    })
    .join('\n\n---\n\n');
}
