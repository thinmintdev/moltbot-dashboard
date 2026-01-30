"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import classNames from "classnames"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import {
  Calendar,
  GripVertical,
  Tag,
  User,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"

export interface Task {
  id: string
  title: string
  description?: string
  status: "backlog" | "todo" | "in_progress" | "review" | "done" | "error" | "planning"
  priority: "low" | "medium" | "high" | "urgent"
  projectId?: string
  projectName?: string
  labels: string[]
  dueDate?: string
  assignedAgent?: string
  progress?: number
  subtasks?: { id: string; title: string; completed: boolean }[]
  createdAt: string
  updatedAt: string
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
  compact?: boolean
}

const priorityConfig = {
  low: {
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    icon: null,
  },
  medium: {
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: null,
  },
  high: {
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: AlertCircle,
  },
  urgent: {
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    icon: AlertCircle,
  },
}

const labelColors = [
  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-orange-500/20 text-orange-400 border-orange-500/30",
]

function getLabelColor(label: string): string {
  const hash = label.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return labelColors[hash % labelColors.length]
}

function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isUrgent: boolean } {
  const date = new Date(dateStr)
  const isOverdue = isPast(date) && !isToday(date)
  const isUrgent = isToday(date) || isTomorrow(date)

  if (isToday(date)) {
    return { text: "Today", isOverdue: false, isUrgent: true }
  }
  if (isTomorrow(date)) {
    return { text: "Tomorrow", isOverdue: false, isUrgent: true }
  }
  if (isOverdue) {
    return { text: format(date, "MMM d"), isOverdue: true, isUrgent: false }
  }
  return { text: format(date, "MMM d"), isOverdue: false, isUrgent: false }
}

export function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  const [expanded, setExpanded] = useState(!compact)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = priorityConfig[task.priority]
  const PriorityIcon = priority.icon

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(
        "group bg-theme-800 rounded-lg border border-theme-700 p-3 transition-all cursor-pointer",
        "hover:border-theme-500 hover:shadow-lg hover:shadow-theme-950/50",
        isDragging && "opacity-50 shadow-2xl rotate-2 scale-105 border-theme-500"
      )}
      onClick={onClick}
    >
      {/* Header with drag handle and priority */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-theme-600 hover:text-theme-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-medium text-white truncate pr-2">
            {task.title}
          </h4>

          {/* Priority and Project badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={classNames(
                "px-2 py-0.5 rounded text-xs font-medium border inline-flex items-center gap-1",
                priority.color
              )}
            >
              {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
              {task.priority}
            </span>

            {task.projectName && (
              <span className="px-2 py-0.5 rounded text-xs bg-theme-700 text-theme-300 truncate max-w-[120px]">
                {task.projectName}
              </span>
            )}
          </div>

          {/* Expanded content */}
          {expanded && (
            <>
              {/* Description */}
              {task.description && (
                <p className="text-xs text-theme-400 mt-2 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Labels */}
              {task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.labels.slice(0, 3).map((label) => (
                    <span
                      key={label}
                      className={classNames(
                        "px-1.5 py-0.5 rounded text-xs border inline-flex items-center gap-1",
                        getLabelColor(label)
                      )}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {label}
                    </span>
                  ))}
                  {task.labels.length > 3 && (
                    <span className="px-1.5 py-0.5 text-xs text-theme-500">
                      +{task.labels.length - 3}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer: due date, subtasks, agent */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center gap-3 text-theme-500">
              {dueDateInfo && (
                <span
                  className={classNames(
                    "inline-flex items-center gap-1",
                    dueDateInfo.isOverdue && "text-rose-400",
                    dueDateInfo.isUrgent && !dueDateInfo.isOverdue && "text-amber-400"
                  )}
                >
                  {dueDateInfo.isOverdue ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {dueDateInfo.text}
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span
                    className={classNames(
                      completedSubtasks === totalSubtasks
                        ? "text-emerald-400"
                        : "text-theme-500"
                    )}
                  >
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {task.assignedAgent && (
                <span className="inline-flex items-center gap-1 text-theme-400 bg-theme-700/50 px-1.5 py-0.5 rounded">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[60px]">{task.assignedAgent}</span>
                </span>
              )}

              {compact && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(!expanded)
                  }}
                  className="text-theme-500 hover:text-theme-300"
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
