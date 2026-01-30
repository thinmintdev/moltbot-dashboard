"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import classNames from "classnames"
import { RefreshCw, Play, Pause, MoreHorizontal, Clock } from "lucide-react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { KanbanColumn, type ColumnConfig } from "./KanbanColumn"
import { TaskCard, type Task } from "./TaskCard"
import { TaskCreateModal } from "./TaskCreateModal"
import { TaskDetailModal } from "./TaskDetailModal"
import { AgentSelectModal } from "../agents/AgentSelectModal"
import { useMoltBot } from "@/hooks/useMoltBot"
import { useToast } from "@/components/common/Toast"
import type { MoltBotMessage } from "@/lib/api/moltbot"

interface Project {
  id: string
  name: string
}

interface KanbanBoardProps {
  projectId?: string | null
  projectName?: string
  initialTasksByProject?: Record<string, Task[]>
  projects?: Project[]
  onTaskCreate?: (task: Partial<Task>) => void
  onTaskUpdate?: (task: Partial<Task>) => void
  onTaskDelete?: (taskId: string) => void
  onRefresh?: () => void
}

// AutoClaude-style columns with fire theme
const columns: ColumnConfig[] = [
  { id: "error", title: "Error", color: "border-t-[#ef4444]", bgColor: "bg-[#ef4444]" },
  { id: "planning", title: "Planning", color: "border-t-[#f97316]", bgColor: "bg-[#f97316]" },
  { id: "in_progress", title: "In Progress", color: "border-t-[#fbbf24]", bgColor: "bg-[#fbbf24]" },
  { id: "review", title: "AI Review", color: "border-t-[#a855f7]", bgColor: "bg-[#a855f7]" },
  { id: "done", title: "Done", color: "border-t-[#22c55e]", bgColor: "bg-[#22c55e]" },
]

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

// Demo tasks organized by project ID
const demoTasksByProject: Record<string, Task[]> = {
  // MoltBot Dashboard (proj-1) - Dashboard infrastructure tasks
  "proj-1": [
    {
      id: "molten-1",
      title: "Setup WebSocket connection",
      description: "Implement WebSocket client for real-time agent communication",
      status: "done",
      priority: "high",
      projectId: "proj-1",
      projectName: "molten",
      labels: ["infrastructure", "websocket"],
      progress: 100,
      subtasks: [
        { id: "mst-1", title: "Create WebSocket hook", completed: true },
        { id: "mst-2", title: "Handle reconnection logic", completed: true },
        { id: "mst-3", title: "Add message queue", completed: true },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "molten-2",
      title: "Implement Kanban board",
      description: "Create drag-and-drop Kanban board component with DnD Kit",
      status: "in_progress",
      priority: "high",
      projectId: "proj-1",
      projectName: "molten",
      labels: ["ui", "feature"],
      assignedAgent: "coder",
      progress: 75,
      subtasks: [
        { id: "mst-4", title: "Setup DnD Kit", completed: true },
        { id: "mst-5", title: "Create column components", completed: true },
        { id: "mst-6", title: "Create task cards", completed: true },
        { id: "mst-7", title: "Add project scoping", completed: false },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "molten-3",
      title: "Add toast notifications",
      description: "Implement toast notification system for user feedback",
      status: "review",
      priority: "medium",
      projectId: "proj-1",
      projectName: "molten",
      labels: ["ui", "ux"],
      assignedAgent: "tester",
      progress: 90,
      subtasks: [
        { id: "mst-8", title: "Create Toast component", completed: true },
        { id: "mst-9", title: "Add toast context", completed: true },
        { id: "mst-10", title: "Style variants", completed: true },
        { id: "mst-11", title: "Test accessibility", completed: false },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "molten-4",
      title: "Configure MCP integration",
      description: "Setup Model Context Protocol for agent tool access",
      status: "planning",
      priority: "high",
      projectId: "proj-1",
      projectName: "molten",
      labels: ["backend", "mcp"],
      progress: 0,
      subtasks: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
  // MoltenCalc (proj-2) - Calculator project tasks
  "proj-2": [
    {
      id: "calc-1",
      title: "Setup React project structure",
      description: "Initialize React with TypeScript, configure build tools, and setup project structure for the calculator app",
      status: "done",
      priority: "high",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["setup", "frontend"],
      progress: 100,
      subtasks: [
        { id: "st-1", title: "Create React app with TypeScript", completed: true },
        { id: "st-2", title: "Setup Tailwind CSS", completed: true },
        { id: "st-3", title: "Configure ESLint/Prettier", completed: true },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-2",
      title: "Implement basic calculator UI",
      description: "Create the main calculator interface with number pad, operators, and display",
      status: "in_progress",
      priority: "high",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["ui", "frontend"],
      assignedAgent: "coder",
      progress: 45,
      subtasks: [
        { id: "st-4", title: "Design calculator layout", completed: true },
        { id: "st-5", title: "Create number buttons", completed: true },
        { id: "st-6", title: "Create operator buttons", completed: false },
        { id: "st-7", title: "Implement display component", completed: false },
      ],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-3",
      title: "Implement arithmetic operations",
      description: "Add core calculation logic for addition, subtraction, multiplication, and division",
      status: "planning",
      priority: "high",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["logic", "core"],
      progress: 0,
      subtasks: [
        { id: "st-8", title: "Addition operation", completed: false },
        { id: "st-9", title: "Subtraction operation", completed: false },
        { id: "st-10", title: "Multiplication operation", completed: false },
        { id: "st-11", title: "Division operation", completed: false },
        { id: "st-12", title: "Handle division by zero", completed: false },
      ],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-4",
      title: "Add memory functions",
      description: "Implement memory operations: M+, M-, MR (Memory Recall), and MC (Memory Clear)",
      status: "planning",
      priority: "medium",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["feature", "memory"],
      progress: 0,
      subtasks: [
        { id: "st-13", title: "Memory Add (M+)", completed: false },
        { id: "st-14", title: "Memory Subtract (M-)", completed: false },
        { id: "st-15", title: "Memory Recall (MR)", completed: false },
        { id: "st-16", title: "Memory Clear (MC)", completed: false },
      ],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-5",
      title: "Add keyboard support",
      description: "Enable keyboard input for numbers and operations, including Enter for equals",
      status: "planning",
      priority: "medium",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["accessibility", "ux"],
      progress: 0,
      subtasks: [],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-6",
      title: "Implement calculation history",
      description: "Add a panel showing recent calculations with ability to reuse results",
      status: "planning",
      priority: "low",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["feature", "ux"],
      progress: 0,
      subtasks: [
        { id: "st-17", title: "Create history data structure", completed: false },
        { id: "st-18", title: "Build history UI panel", completed: false },
        { id: "st-19", title: "Add click-to-reuse functionality", completed: false },
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-7",
      title: "Fix display overflow bug",
      description: "Long numbers are overflowing the display area, need to implement text truncation or scientific notation",
      status: "error",
      priority: "urgent",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["bug", "ui"],
      progress: 20,
      subtasks: [
        { id: "st-20", title: "Identify overflow scenarios", completed: true },
        { id: "st-21", title: "Implement scientific notation", completed: false },
      ],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "calc-8",
      title: "Write unit tests for calculations",
      description: "Comprehensive test suite for all arithmetic operations and edge cases",
      status: "review",
      priority: "high",
      projectId: "proj-2",
      projectName: "moltencalc",
      labels: ["testing", "quality"],
      assignedAgent: "tester",
      progress: 85,
      subtasks: [
        { id: "st-22", title: "Basic operation tests", completed: true },
        { id: "st-23", title: "Edge case tests", completed: true },
        { id: "st-24", title: "Memory function tests", completed: true },
        { id: "st-25", title: "Integration tests", completed: false },
      ],
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ],
  // React (proj-3) - GitHub project example tasks
  "proj-3": [
    {
      id: "react-1",
      title: "Review React 19 concurrent features",
      description: "Study and document the new concurrent rendering features in React 19",
      status: "in_progress",
      priority: "high",
      projectId: "proj-3",
      projectName: "react",
      labels: ["research", "documentation"],
      assignedAgent: "researcher",
      progress: 60,
      subtasks: [
        { id: "rst-1", title: "Read React 19 RFC", completed: true },
        { id: "rst-2", title: "Test Suspense improvements", completed: true },
        { id: "rst-3", title: "Document use() hook", completed: false },
        { id: "rst-4", title: "Write migration guide", completed: false },
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "react-2",
      title: "Analyze Server Components patterns",
      description: "Document best practices for React Server Components usage",
      status: "planning",
      priority: "medium",
      projectId: "proj-3",
      projectName: "react",
      labels: ["research", "server-components"],
      progress: 0,
      subtasks: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "react-3",
      title: "Track open issues for hooks",
      description: "Monitor and categorize open GitHub issues related to React hooks",
      status: "done",
      priority: "low",
      projectId: "proj-3",
      projectName: "react",
      labels: ["tracking", "hooks"],
      progress: 100,
      subtasks: [
        { id: "rst-5", title: "useState issues", completed: true },
        { id: "rst-6", title: "useEffect issues", completed: true },
        { id: "rst-7", title: "Custom hooks issues", completed: true },
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  return date.toLocaleDateString()
}

// Get status display text
function getStatusText(status: string): string {
  switch (status) {
    case "error":
      return "Error"
    case "planning":
      return "Pending"
    case "in_progress":
      return "Running"
    case "review":
      return "Reviewing"
    case "done":
      return "Complete"
    default:
      return status
  }
}

// Get status badge color - fire theme for active states
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "error":
      return "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
    case "planning":
      return "bg-[#f97316]/10 text-[#f97316]"
    case "in_progress":
      return "bg-gradient-to-r from-[#ef4444]/20 to-[#f97316]/20 text-[#f97316] border border-[#f97316]/30"
    case "review":
      return "bg-[#a855f7]/20 text-[#a855f7]"
    case "done":
      return "bg-[#22c55e]/20 text-[#22c55e]"
    default:
      return "bg-[#71717a]/20 text-[#71717a]"
  }
}

// AutoClaude-style Task Card
interface AutoClaudeTaskCardProps {
  task: Task
  onClick?: () => void
  onStart?: () => void
  onPause?: () => void
}

function AutoClaudeTaskCard({ task, onClick, onStart, onPause }: AutoClaudeTaskCardProps) {
  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const progress = task.progress ?? (totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0)

  // Subtask dots - show up to 10, then +N
  const maxDots = 10
  const showExtraCount = totalSubtasks > maxDots

  const isActive = task.status === "in_progress"
  const isError = task.status === "error"

  return (
    <div
      className={classNames(
        "bg-[#18181b] border rounded-lg p-4 cursor-pointer transition-all",
        isActive && "border-[#ef4444]/50 shadow-lg shadow-[#ef4444]/10",
        isError && "border-[#ef4444]/30",
        !isActive && !isError && "border-[#27272a] hover:border-[#3f3f46]"
      )}
      onClick={onClick}
    >
      {/* Title */}
      <h3 className="text-[#fafafa] font-medium text-sm mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-[#71717a] text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Status badge and progress */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={classNames(
            "px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1.5",
            getStatusBadgeColor(task.status)
          )}
        >
          {task.status === "in_progress" && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
          )}
          {task.status === "error" && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
          )}
          {getStatusText(task.status)}
        </span>
        {progress > 0 && (
          <span className={classNames(
            "text-xs",
            task.status === "in_progress" ? "text-[#f97316]" : "text-[#71717a]"
          )}>
            {progress}%
          </span>
        )}
      </div>

      {/* Progress bar with fire gradient for active tasks */}
      {progress > 0 && (
        <div className="w-full h-1.5 bg-[#27272a] rounded-full mb-3 overflow-hidden">
          <div
            className={classNames(
              "h-full rounded-full transition-all",
              task.status === "error" && "bg-[#ef4444]",
              task.status === "done" && "bg-[#22c55e]",
              task.status === "in_progress" && "bg-gradient-to-r from-[#ef4444] to-[#f97316] animate-pulse",
              task.status === "review" && "bg-[#a855f7]",
              task.status !== "error" && task.status !== "done" && task.status !== "in_progress" && task.status !== "review" && "bg-[#3b82f6]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtask indicators */}
      {totalSubtasks > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {task.subtasks?.slice(0, maxDots).map((st, idx) => (
            <div
              key={st.id || idx}
              className={classNames(
                "w-2 h-2 rounded-full",
                st.completed ? "bg-[#22c55e]" : "bg-[#27272a]"
              )}
            />
          ))}
          {showExtraCount && (
            <span className="text-[#71717a] text-xs ml-1">
              +{totalSubtasks - maxDots}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Timestamp */}
        <div className="flex items-center gap-1 text-[#52525b] text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(task.updatedAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {task.status !== "done" && task.status !== "in_progress" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStart?.()
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
            >
              <Play className="w-3 h-3 fill-current" />
              Start
            </button>
          )}
          {task.status === "in_progress" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPause?.()
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#27272a] text-[#fbbf24] hover:bg-[#3f3f46] border border-[#fbbf24]/30 transition-all"
            >
              <Pause className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard({
  projectId,
  projectName,
  initialTasksByProject = {},
  projects = [
    { id: "proj-1", name: "MoltBot Core" },
    { id: "proj-2", name: "Dashboard" },
    { id: "proj-3", name: "Agents" },
  ],
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onRefresh,
}: KanbanBoardProps) {
  // Store all tasks by project ID - merge initial tasks with demo tasks
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>(() => {
    // Start with demo tasks, then overlay any initialTasksByProject
    const merged = { ...demoTasksByProject }
    Object.entries(initialTasksByProject).forEach(([pid, tasks]) => {
      merged[pid] = tasks
    })
    return merged
  })

  // Get tasks for the current project
  const tasks = projectId ? (tasksByProject[projectId] || []) : []

  // Helper to update tasks for a specific project
  const setTasks = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
    if (!projectId) return
    setTasksByProject((prev) => {
      const currentTasks = prev[projectId] || []
      const newTasks = typeof updater === "function" ? updater(currentTasks) : updater
      return { ...prev, [projectId]: newTasks }
    })
  }, [projectId])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalStatus, setCreateModalStatus] = useState<Task["status"]>("planning")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [agentSelectTask, setAgentSelectTask] = useState<Task | null>(null)
  const [activeAgents, setActiveAgents] = useState<Record<string, string>>({}) // taskId -> agentId mapping

  const { success, error: showError, info } = useToast()

  // Helper function to update a task across all projects
  const updateTaskInAllProjects = useCallback((
    taskId: string,
    updater: (task: Task) => Task
  ) => {
    setTasksByProject((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((pid) => {
        updated[pid] = updated[pid].map((t) =>
          t.id === taskId ? updater(t) : t
        )
      })
      return updated
    })
  }, [])

  // MoltBot integration for live agent execution
  const moltbot = useMoltBot({
    autoConnect: true,
    onMessage: useCallback((message: MoltBotMessage) => {
      // Handle real-time agent updates
      if (message.type === 'agent_progress' && message.data) {
        const { agentId, progress, taskId } = message.data as { agentId: string; progress: number; taskId?: string }
        // Update task progress if we know which task this agent is working on
        const taskIdFromAgent = taskId || Object.entries(activeAgents).find(([, aId]) => aId === agentId)?.[0]
        if (taskIdFromAgent) {
          updateTaskInAllProjects(taskIdFromAgent, (t) => ({
            ...t,
            progress,
            updatedAt: new Date().toISOString()
          }))
        }
      } else if (message.type === 'agent_completed' && message.data) {
        const { agentId, taskId } = message.data as { agentId: string; taskId?: string }
        const taskIdFromAgent = taskId || Object.entries(activeAgents).find(([, aId]) => aId === agentId)?.[0]
        if (taskIdFromAgent) {
          updateTaskInAllProjects(taskIdFromAgent, (t) => ({
            ...t,
            status: 'review' as Task['status'],
            progress: 100,
            updatedAt: new Date().toISOString()
          }))
          setActiveAgents((prev) => {
            const next = { ...prev }
            delete next[taskIdFromAgent]
            return next
          })
          success('Agent completed', `Task moved to AI Review`)
        }
      } else if (message.type === 'agent_error' && message.data) {
        const { agentId, error, taskId } = message.data as { agentId: string; error: string; taskId?: string }
        const taskIdFromAgent = taskId || Object.entries(activeAgents).find(([, aId]) => aId === agentId)?.[0]
        if (taskIdFromAgent) {
          updateTaskInAllProjects(taskIdFromAgent, (t) => ({
            ...t,
            status: 'error' as Task['status'],
            updatedAt: new Date().toISOString()
          }))
          setActiveAgents((prev) => {
            const next = { ...prev }
            delete next[taskIdFromAgent]
            return next
          })
          showError('Agent error', error || 'Unknown error occurred')
        }
      }
    }, [activeAgents, success, showError, updateTaskInAllProjects]),
    onError: useCallback((err: Error) => {
      console.error('MoltBot connection error:', err)
    }, []),
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach((col) => {
      grouped[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    })
    return grouped
  }, [tasks])

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Check if dropped on a column
    const targetColumn = columns.find((c) => c.id === overId)
    if (targetColumn) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: targetColumn.id as Task["status"], updatedAt: new Date().toISOString() }
            : t
        )
      )

      const updatedTask = tasks.find((t) => t.id === taskId)
      if (updatedTask && onTaskUpdate) {
        onTaskUpdate({ ...updatedTask, status: targetColumn.id as Task["status"] })
      }
      return
    }

    // Check if dropped on another task (reorder within column)
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask) {
      const activeTaskData = tasks.find((t) => t.id === taskId)
      if (activeTaskData && activeTaskData.status !== overTask.status) {
        // Move to new column
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: overTask.status, updatedAt: new Date().toISOString() }
              : t
          )
        )

        if (onTaskUpdate) {
          onTaskUpdate({ ...activeTaskData, status: overTask.status })
        }
      }
    }
  }

  // Task handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleStartTask = (task: Task) => {
    setAgentSelectTask(task)
  }

  const handleAgentSelected = async (agentId: string) => {
    if (!agentSelectTask) return

    const selectedAgent = agentId === "auto" ? "orchestrator" : agentId

    // Update UI immediately for responsiveness
    setTasks((prev) =>
      prev.map((t) =>
        t.id === agentSelectTask.id
          ? {
              ...t,
              status: "in_progress" as Task["status"],
              assignedAgent: selectedAgent,
              progress: 0,
              updatedAt: new Date().toISOString()
            }
          : t
      )
    )

    // Spawn agent via MoltBot API
    try {
      const response = await moltbot.spawnAgent({
        taskId: agentSelectTask.id,
        agentType: selectedAgent,
        projectId: agentSelectTask.projectId,
        config: {
          title: agentSelectTask.title,
          description: agentSelectTask.description,
          labels: agentSelectTask.labels,
        }
      })

      // Track the agent for this task
      if (response.agentId) {
        setActiveAgents((prev) => ({ ...prev, [agentSelectTask.id]: response.agentId }))
        info('Agent spawned', `${selectedAgent} is working on "${agentSelectTask.title}"`)
      }

      onTaskUpdate?.({ ...agentSelectTask, status: "in_progress", assignedAgent: selectedAgent })
    } catch (err) {
      // Revert on failure
      console.error('Failed to spawn agent:', err)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === agentSelectTask.id
            ? { ...t, status: agentSelectTask.status, assignedAgent: undefined, updatedAt: new Date().toISOString() }
            : t
        )
      )
      showError('Failed to start agent', err instanceof Error ? err.message : 'Connection error')
    }

    setAgentSelectTask(null)
  }

  const handlePauseTask = async (task: Task) => {
    const agentId = activeAgents[task.id]

    // Update UI immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: "planning" as Task["status"], updatedAt: new Date().toISOString() }
          : t
      )
    )

    // Pause agent if one is running
    if (agentId) {
      try {
        await moltbot.pauseAgent(agentId)
        info('Agent paused', `Task "${task.title}" has been paused`)
      } catch (err) {
        console.error('Failed to pause agent:', err)
        // Still allow the UI update even if pause fails
      }
    }

    onTaskUpdate?.({ ...task, status: "planning" })
  }

  const handleAddTaskToColumn = (status: Task["status"]) => {
    setCreateModalStatus(status)
    setShowCreateModal(true)
  }

  const handleCreateTask = (taskData: Partial<Task>) => {
    // Use the current project context if not explicitly set
    const taskProjectId = taskData.projectId || projectId
    const taskProjectName = taskData.projectName || projectName || projects.find(p => p.id === taskProjectId)?.name

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title || "Untitled Task",
      description: taskData.description,
      status: taskData.status || "planning",
      priority: taskData.priority || "medium",
      projectId: taskProjectId || undefined,
      projectName: taskProjectName,
      labels: taskData.labels || [],
      dueDate: taskData.dueDate,
      assignedAgent: taskData.assignedAgent,
      progress: 0,
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add task to the appropriate project's task list
    const targetProjectId = taskProjectId || projectId || undefined
    if (targetProjectId) {
      setTasksByProject((prev) => ({
        ...prev,
        [targetProjectId]: [...(prev[targetProjectId] || []), newTask],
      }))
    }

    onTaskCreate?.(newTask)
    setShowCreateModal(false)
    setEditingTask(null)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(null)
    setEditingTask(task)
    setShowCreateModal(true)
  }

  const handleUpdateTask = (taskData: Partial<Task>) => {
    if (!taskData.id) return

    // Update the task in whichever project contains it
    setTasksByProject((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((pid) => {
        updated[pid] = updated[pid].map((t) =>
          t.id === taskData.id
            ? { ...t, ...taskData, updatedAt: new Date().toISOString() }
            : t
        )
      })
      return updated
    })

    onTaskUpdate?.(taskData)
    setShowCreateModal(false)
    setEditingTask(null)
  }

  const handleDeleteTask = (taskId: string) => {
    // Find which project this task belongs to and remove it
    setTasksByProject((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((pid) => {
        updated[pid] = updated[pid].filter((t) => t.id !== taskId)
      })
      return updated
    })
    onTaskDelete?.(taskId)
  }

  const handleUpdateSubtasks = (taskId: string, subtasks: Task["subtasks"]) => {
    let foundTask: Task | undefined

    setTasksByProject((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((pid) => {
        updated[pid] = updated[pid].map((t) => {
          if (t.id === taskId) {
            foundTask = t
            return { ...t, subtasks, updatedAt: new Date().toISOString() }
          }
          return t
        })
      })
      return updated
    })

    if (foundTask && onTaskUpdate) {
      onTaskUpdate({ ...foundTask, subtasks })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[#fafafa] text-lg font-semibold">Kanban Board</h2>
          {/* MoltBot connection status */}
          <div className={classNames(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
            moltbot.isConnected
              ? "bg-[#22c55e]/10 text-[#22c55e]"
              : moltbot.isConnecting
              ? "bg-[#f97316]/10 text-[#f97316]"
              : "bg-[#ef4444]/10 text-[#ef4444]"
          )}>
            <span className={classNames(
              "w-1.5 h-1.5 rounded-full",
              moltbot.isConnected
                ? "bg-[#22c55e]"
                : moltbot.isConnecting
                ? "bg-[#f97316] animate-pulse"
                : "bg-[#ef4444]"
            )} />
            {moltbot.isConnected ? "MoltBot" : moltbot.isConnecting ? "Connecting..." : "Offline"}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={classNames(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] border border-[#27272a] transition-colors",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={classNames("w-4 h-4", isRefreshing && "animate-spin")} />
          Refresh Tasks
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <div
                key={column.id}
                className="w-[320px] flex flex-col bg-[#111113] rounded-lg border border-[#27272a] overflow-hidden"
              >
                {/* Column header with colored top border */}
                <div className={classNames("border-t-2", column.color)}>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#fafafa] font-medium text-sm">{column.title}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#27272a] text-[#71717a] text-xs">
                        {tasksByStatus[column.id]?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {tasksByStatus[column.id]?.map((task) => (
                    <AutoClaudeTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task)}
                      onStart={() => handleStartTask(task)}
                      onPause={() => handlePauseTask(task)}
                    />
                  ))}

                  {/* Empty state */}
                  {(!tasksByStatus[column.id] || tasksByStatus[column.id].length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-[#52525b] text-sm">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="w-[320px]">
                <AutoClaudeTaskCard task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <TaskCreateModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingTask(null)
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        projects={projects}
        defaultStatus={createModalStatus}
      />

      <TaskDetailModal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onUpdateSubtasks={handleUpdateSubtasks}
      />

      <AgentSelectModal
        open={!!agentSelectTask}
        onClose={() => setAgentSelectTask(null)}
        onSelect={handleAgentSelected}
        taskTitle={agentSelectTask?.title || ""}
        recommended={agentSelectTask?.labels.includes("testing") ? "tester" : agentSelectTask?.labels.includes("documentation") ? "researcher" : "coder"}
      />
    </div>
  )
}
