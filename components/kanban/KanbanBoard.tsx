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
import { useTaskStore } from "@/lib/stores/task-store"
import { useLogStore } from "@/lib/stores/log-store"
import {
  startTaskMonitoring,
  stopTaskMonitoring,
  updateTaskMonitoringProgress,
  markTaskComplete,
  logTaskEvent,
} from "@/lib/agents/task-manager"
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

// Status mapping from task-store to kanban columns
const statusToColumn: Record<string, Task["status"]> = {
  backlog: "planning",
  todo: "planning",
  inProgress: "in_progress",
  review: "review",
  done: "done",
}

const columnToStatus: Record<string, string> = {
  error: "backlog",
  planning: "todo",
  backlog: "backlog",
  todo: "todo",
  in_progress: "inProgress",
  review: "review",
  done: "done",
}

// Priority mapping
const priorityMap: Record<string, Task["priority"]> = {
  critical: "urgent",
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
}

// NOTE: Demo tasks removed - now using task-store with localStorage persistence
// Tasks are created via the UI and persist across sessions

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
  // Use persistent task store instead of local state with demo data
  const storeTasks = useTaskStore((state) => state.tasks)
  const storeAddTask = useTaskStore((state) => state.addTask)
  const storeUpdateTask = useTaskStore((state) => state.updateTask)
  const storeDeleteTask = useTaskStore((state) => state.deleteTask)
  const storeMoveTask = useTaskStore((state) => state.moveTask)
  const assignAgentToTask = useTaskStore((state) => state.assignAgentToTask)
  const updateTaskProgress = useTaskStore((state) => state.updateTaskProgress)
  const completeAgentTask = useTaskStore((state) => state.completeAgentTask)
  const failAgentTask = useTaskStore((state) => state.failAgentTask)
  const findTaskByRunId = useTaskStore((state) => state.findTaskByRunId)

  // Map store tasks to kanban format and filter by project
  const tasks = useMemo(() => {
    return storeTasks
      .filter((t) => !projectId || t.projectId === projectId || !t.projectId)
      .map((t) => ({
        ...t,
        // Map store status to kanban status
        status: (statusToColumn[t.status] || t.status) as Task["status"],
        // Map store priority to kanban priority
        priority: (priorityMap[t.priority] || t.priority) as Task["priority"],
        description: t.description || "",
      }))
  }, [storeTasks, projectId])

  // Helper to update tasks - now uses store
  const setTasks = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
    // This is for compatibility - ideally use store actions directly
    console.warn("setTasks called - use store actions instead")
  }, [])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalStatus, setCreateModalStatus] = useState<Task["status"]>("planning")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [agentSelectTask, setAgentSelectTask] = useState<Task | null>(null)
  const [activeAgents, setActiveAgents] = useState<Record<string, string>>({}) // taskId -> agentId mapping

  const { success, error: showError, info } = useToast()

  // Get log store for activity logging
  const addLog = useLogStore((state) => state.addLog)

  // Helper to find task by various IDs
  const findTask = useCallback((
    taskId?: string,
    runId?: string,
    agentId?: string
  ) => {
    if (taskId) return storeTasks.find(t => t.id === taskId)
    if (runId) return findTaskByRunId(runId)
    if (agentId) {
      const entry = Object.entries(activeAgents).find(([, aId]) => aId === agentId)
      if (entry) return storeTasks.find(t => t.id === entry[0])
    }
    return undefined
  }, [storeTasks, findTaskByRunId, activeAgents])

  // MoltBot integration for live agent execution - uses task store directly
  const moltbot = useMoltBot({
    autoConnect: true,
    onMessage: useCallback((message: MoltBotMessage) => {
      // Handle real-time agent updates via task store
      if (message.type === 'agent_progress' && message.data) {
        const { progress, taskId, runId } = message.data as { agentId: string; progress: number; taskId?: string; runId?: string }
        const task = findTask(taskId, runId, message.agentId)
        if (task) {
          updateTaskProgress(task.id, progress)
          updateTaskMonitoringProgress(task.id)

          // Log progress milestones
          if (progress === 25 || progress === 50 || progress === 75 || progress === 100) {
            addLog('info', `Task "${task.title}" progress: ${progress}%`, {
              taskId: task.id,
              agentId: message.agentId,
              runId,
              source: 'KanbanBoard',
              metadata: { progress },
            })
          }

          // Auto-complete at 100%
          if (progress >= 100) {
            markTaskComplete(task.id, { reason: 'Agent reported 100% progress' })
            setActiveAgents((prev) => {
              const next = { ...prev }
              delete next[task.id]
              return next
            })
            success('Task completed', `"${task.title}" moved to Review`)
          }
        }
      } else if (message.type === 'agent_completed' && message.data) {
        const { taskId, runId } = message.data as { agentId: string; taskId?: string; runId?: string }
        const task = findTask(taskId, runId, message.agentId)
        if (task) {
          markTaskComplete(task.id, { reason: 'Agent completed signal received' })
          setActiveAgents((prev) => {
            const next = { ...prev }
            delete next[task.id]
            return next
          })
          success('Agent completed', `Task "${task.title}" moved to Review`)
        }
      } else if (message.type === 'agent_error' && message.data) {
        const { error, taskId, runId } = message.data as { agentId: string; error: string; taskId?: string; runId?: string }
        const task = findTask(taskId, runId, message.agentId)
        if (task) {
          failAgentTask(task.id)
          stopTaskMonitoring(task.id)
          setActiveAgents((prev) => {
            const next = { ...prev }
            delete next[task.id]
            return next
          })
          addLog('error', `Task "${task.title}" failed: ${error}`, {
            taskId: task.id,
            agentId: message.agentId,
            runId,
            source: 'KanbanBoard',
            metadata: { error },
          })
          showError('Agent error', error || 'Unknown error occurred')
        }
      } else if (message.type === 'agent_log' && message.data) {
        // Log agent output to activity log
        const { log, taskId, runId } = message.data as { log: string; taskId?: string; runId?: string }
        const task = findTask(taskId, runId, message.agentId)
        if (task) {
          addLog('debug', log, {
            taskId: task.id,
            agentId: message.agentId,
            runId,
            source: 'AgentOutput',
          })
        }
      }
    }, [findTask, success, showError, addLog, updateTaskProgress, failAgentTask]),
    onError: useCallback((err: Error) => {
      console.error('MoltBot connection error:', err)
      addLog('error', `MoltBot connection error: ${err.message}`, {
        source: 'KanbanBoard',
        metadata: { error: err.message },
      })
    }, [addLog]),
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
      // Map kanban column to store status
      const newStatus = columnToStatus[targetColumn.id as Task["status"]] || targetColumn.id
      storeMoveTask(taskId, newStatus as any)

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
        // Move to new column - map to store status
        const newStatus = columnToStatus[overTask.status] || overTask.status
        storeMoveTask(taskId, newStatus as any)

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

    // Log task start
    addLog('info', `Starting task "${agentSelectTask.title}" with agent: ${selectedAgent}`, {
      taskId: agentSelectTask.id,
      agentId: selectedAgent,
      source: 'KanbanBoard',
      metadata: { action: 'task_started' },
    })

    // Update UI immediately for responsiveness
    // Spawn task via MoltBot API (OpenClaw compliant)
    try {
      const response = await moltbot.spawnTask({
        taskTitle: agentSelectTask.title,
        taskDescription: agentSelectTask.description || agentSelectTask.title,
        sessionId: agentSelectTask.projectId || 'default',
        labels: agentSelectTask.labels,
      })

      // Track the run for this task using actual runId from MoltBot
      if (response.runId) {
        // Use store to assign agent - this persists the change
        assignAgentToTask(agentSelectTask.id, response.runId, selectedAgent)
        setActiveAgents((prev) => ({ ...prev, [agentSelectTask.id]: response.runId }))

        // Start monitoring for auto-completion
        startTaskMonitoring(agentSelectTask.id, {
          autoComplete: true,
          autoCompleteTimeout: 30000, // 30 seconds for simple tasks
          requiresReview: true,
        })

        addLog('info', `Agent started for task "${agentSelectTask.title}"`, {
          taskId: agentSelectTask.id,
          runId: response.runId,
          agentId: selectedAgent,
          source: 'KanbanBoard',
          metadata: { action: 'agent_spawned', runId: response.runId },
        })

        info('Task started', `Agent is working on "${agentSelectTask.title}"`)
      }

      onTaskUpdate?.({ ...agentSelectTask, status: "in_progress", assignedAgent: selectedAgent })
    } catch (err) {
      console.error('Failed to spawn agent:', err)
      addLog('error', `Failed to start agent for task "${agentSelectTask.title}": ${err instanceof Error ? err.message : 'Unknown error'}`, {
        taskId: agentSelectTask.id,
        source: 'KanbanBoard',
        metadata: { error: err instanceof Error ? err.message : String(err) },
      })
      showError('Failed to start agent', err instanceof Error ? err.message : 'Connection error')
    }

    setAgentSelectTask(null)
  }

  const handlePauseTask = async (task: Task) => {
    // Update via store - move back to planning/todo
    storeMoveTask(task.id, 'todo')

    // Note: OpenClaw doesn't have pause/resume - tasks run to completion
    // The UI reflects the paused state but the agent run continues
    if (activeAgents[task.id]) {
      info('Task paused', `Task "${task.title}" marked as paused (agent run continues)`)
    }

    onTaskUpdate?.({ ...task, status: "planning" })
  }

  const handleAddTaskToColumn = (status: Task["status"]) => {
    setCreateModalStatus(status)
    setShowCreateModal(true)
  }

  const handleCreateTask = (taskData: Partial<Task>) => {
    // Use the current project context if not explicitly set, fall back to first project or "default"
    const fallbackProjectId = projects[0]?.id || "default"
    const taskProjectId = taskData.projectId || projectId || fallbackProjectId
    const taskProjectName = taskData.projectName || projectName || projects.find(p => p.id === taskProjectId)?.name || "Default"

    // Map kanban status to store status
    const storeStatus = columnToStatus[taskData.status || "planning"] || "todo"

    // Use store to create task (persists to localStorage)
    const newTask = storeAddTask({
      title: taskData.title || "Untitled Task",
      description: taskData.description || "",
      status: storeStatus as any,
      priority: (taskData.priority || "medium") as any,
      projectId: taskProjectId,
      projectName: taskProjectName,
      labels: taskData.labels || [],
      dueDate: taskData.dueDate,
      assignedAgent: taskData.assignedAgent,
      progress: 0,
      subtasks: [],
    })

    onTaskCreate?.(newTask as any)
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

    // Map status if provided
    const updates: any = { ...taskData }
    if (taskData.status) {
      updates.status = columnToStatus[taskData.status] || taskData.status
    }
    delete updates.id
    delete updates.createdAt

    // Use store to update task (persists to localStorage)
    storeUpdateTask(taskData.id, updates)

    onTaskUpdate?.(taskData)
    setShowCreateModal(false)
    setEditingTask(null)
  }

  const handleDeleteTask = (taskId: string) => {
    // Use store to delete task (persists to localStorage)
    storeDeleteTask(taskId)
    onTaskDelete?.(taskId)
  }

  const handleUpdateSubtasks = (taskId: string, subtasks: Task["subtasks"]) => {
    const task = storeTasks.find(t => t.id === taskId)
    if (!task) return

    // Use store to update subtasks
    storeUpdateTask(taskId, { subtasks })

    if (onTaskUpdate) {
      onTaskUpdate({ ...task, subtasks } as any)
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
        onMarkComplete={(taskId, moveToDone) => {
          // Clear active agent tracking when task is marked complete
          if (activeAgents[taskId]) {
            setActiveAgents(prev => {
              const { [taskId]: _, ...rest } = prev
              return rest
            })
          }
          success(moveToDone ? 'Task marked as done' : 'Task moved to review')
        }}
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
