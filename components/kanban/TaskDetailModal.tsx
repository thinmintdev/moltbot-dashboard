"use client"

import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import { format } from "date-fns"
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Activity,
  AlertCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import type { Task } from "./TaskCard"

interface TaskDetailModalProps {
  open: boolean
  onClose: () => void
  task: Task | null
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onUpdateSubtasks: (taskId: string, subtasks: Task["subtasks"]) => void
}

const priorityConfig = {
  low: { color: "text-slate-400", bgColor: "bg-slate-500/20", label: "Low" },
  medium: { color: "text-blue-400", bgColor: "bg-blue-500/20", label: "Medium" },
  high: { color: "text-amber-400", bgColor: "bg-amber-500/20", label: "High" },
  urgent: { color: "text-rose-400", bgColor: "bg-rose-500/20", label: "Urgent" },
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  error: { color: "text-[#ef4444]", bgColor: "bg-[#ef4444]/20", label: "Error" },
  planning: { color: "text-[#ef4444]", bgColor: "bg-[#ef4444]/20", label: "Planning" },
  backlog: { color: "text-slate-400", bgColor: "bg-slate-500/20", label: "Backlog" },
  todo: { color: "text-blue-400", bgColor: "bg-blue-500/20", label: "Todo" },
  in_progress: { color: "text-[#3b82f6]", bgColor: "bg-[#3b82f6]/20", label: "In Progress" },
  review: { color: "text-[#a855f7]", bgColor: "bg-[#a855f7]/20", label: "AI Review" },
  done: { color: "text-[#22c55e]", bgColor: "bg-[#22c55e]/20", label: "Done" },
}

// Mock activity log data
const mockActivityLog = [
  { id: "1", action: "Task created", user: "System", timestamp: new Date().toISOString() },
  { id: "2", action: "Status changed to In Progress", user: "coder", timestamp: new Date().toISOString() },
]

export function TaskDetailModal({
  open,
  onClose,
  task,
  onEdit,
  onDelete,
  onUpdateSubtasks,
}: TaskDetailModalProps) {
  const [subtasks, setSubtasks] = useState<Task["subtasks"]>([])
  const [newSubtask, setNewSubtask] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (task) {
      setSubtasks(task.subtasks || [])
    }
  }, [task])

  if (!task) return null

  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status] || statusConfig.planning

  const completedSubtasks = subtasks?.filter((s) => s.completed).length || 0
  const totalSubtasks = subtasks?.length || 0
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const toggleSubtask = (subtaskId: string) => {
    const updated = subtasks?.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    setSubtasks(updated)
    onUpdateSubtasks(task.id, updated)
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    const newItem = {
      id: `subtask-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    }
    const updated = [...(subtasks || []), newItem]
    setSubtasks(updated)
    setNewSubtask("")
    onUpdateSubtasks(task.id, updated)
  }

  const deleteSubtask = (subtaskId: string) => {
    const updated = subtasks?.filter((s) => s.id !== subtaskId)
    setSubtasks(updated)
    onUpdateSubtasks(task.id, updated)
  }

  const handleDelete = () => {
    onDelete(task.id)
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-theme-800 rounded-xl border border-theme-700 w-full max-w-2xl max-h-[90vh] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-theme-700 shrink-0">
            <div className="flex items-center gap-3">
              <span
                className={classNames(
                  "px-2 py-1 rounded text-xs font-medium",
                  status.bgColor,
                  status.color
                )}
              >
                {status.label}
              </span>
              <span
                className={classNames(
                  "px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1",
                  priority.bgColor,
                  priority.color
                )}
              >
                {(task.priority === "high" || task.priority === "urgent") && (
                  <AlertCircle className="w-3 h-3" />
                )}
                {priority.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Dialog.Close asChild>
                <button className="text-theme-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-xl font-semibold text-white">{task.title}</h2>
                {task.projectName && (
                  <p className="text-sm text-theme-400 mt-1">
                    Project: <span className="text-theme-300">{task.projectName}</span>
                  </p>
                )}
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-theme-500" />
                    <span className="text-theme-300">
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {task.assignedAgent && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-theme-500" />
                    <span className="text-theme-300">{task.assignedAgent}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-theme-500" />
                  <span className="text-theme-300">
                    Created {format(new Date(task.createdAt), "MMM d")}
                  </span>
                </div>
              </div>

              {/* Labels */}
              {task.labels.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-theme-400 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Labels
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-1 bg-theme-700 text-theme-300 rounded text-sm"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-theme-400 mb-2">Description</h4>
                {task.description ? (
                  <p className="text-theme-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-theme-600 text-sm italic">No description provided</p>
                )}
              </div>

              {/* Subtasks */}
              <div>
                <h4 className="text-sm font-medium text-theme-400 mb-2 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Subtasks
                  {totalSubtasks > 0 && (
                    <span className="text-theme-500">
                      ({completedSubtasks}/{totalSubtasks})
                    </span>
                  )}
                </h4>

                {/* Progress bar */}
                {totalSubtasks > 0 && (
                  <div className="w-full bg-theme-700 rounded-full h-1.5 mb-3">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Subtask list */}
                <div className="space-y-2 mb-3">
                  {subtasks?.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-2 bg-theme-900/50 rounded-lg group"
                    >
                      <button
                        onClick={() => toggleSubtask(subtask.id)}
                        className="text-theme-400 hover:text-emerald-400"
                      >
                        {subtask.completed ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <span
                        className={classNames(
                          "flex-1 text-sm",
                          subtask.completed
                            ? "text-theme-500 line-through"
                            : "text-theme-200"
                        )}
                      >
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(subtask.id)}
                        className="text-theme-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add subtask */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSubtask()
                      }
                    }}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 text-sm focus:outline-none focus:ring-2 focus:ring-theme-500"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={addSubtask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h4 className="text-sm font-medium text-theme-400 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity
                </h4>
                <div className="space-y-3 border-l-2 border-theme-700 pl-4 ml-2">
                  {mockActivityLog.map((activity) => (
                    <div key={activity.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-theme-700 border-2 border-theme-800" />
                      <p className="text-sm text-theme-300">{activity.action}</p>
                      <p className="text-xs text-theme-500">
                        by {activity.user} - {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-theme-700 shrink-0">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-rose-400">Delete this task?</span>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Confirm Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Task
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
