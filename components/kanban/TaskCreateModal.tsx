"use client"

import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import { format } from "date-fns"
import { Calendar, Tag, X, Plus, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import type { Task } from "./TaskCard"

interface Project {
  id: string
  name: string
}

interface TaskCreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (task: Partial<Task>) => void
  task?: Task | null
  projects?: Project[]
  defaultStatus?: Task["status"]
}

const statusOptions: { value: Task["status"]; label: string }[] = [
  { value: "error", label: "Error" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "AI Review" },
  { value: "done", label: "Done" },
]

const priorityOptions: { value: Task["priority"]; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

export function TaskCreateModal({
  open,
  onClose,
  onSubmit,
  task,
  projects = [],
  defaultStatus = "planning",
}: TaskCreateModalProps) {
  const isEditing = !!task

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<Task["status"]>(defaultStatus)
  const [priority, setPriority] = useState<Task["priority"]>("medium")
  const [projectId, setProjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [labels, setLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [assignedAgent, setAssignedAgent] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when opening/closing or when task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setPriority(task.priority)
        setProjectId(task.projectId || "")
        setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "")
        setLabels(task.labels || [])
        setAssignedAgent(task.assignedAgent || "")
      } else {
        setTitle("")
        setDescription("")
        setStatus(defaultStatus)
        setPriority("medium")
        setProjectId("")
        setDueDate("")
        setLabels([])
        setAssignedAgent("")
      }
      setErrors({})
    }
  }, [open, task, defaultStatus])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.length > 200) {
      newErrors.title = "Title must be less than 200 characters"
    }

    if (description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const projectName = projects.find((p) => p.id === projectId)?.name

    onSubmit({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      labels,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      assignedAgent: assignedAgent.trim() || undefined,
      subtasks: task?.subtasks || [],
    })

    onClose()
  }

  const addLabel = () => {
    const trimmed = newLabel.trim()
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed])
      setNewLabel("")
    }
  }

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-theme-800 rounded-xl border border-theme-700 w-full max-w-xl max-h-[90vh] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-theme-700 shrink-0">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isEditing ? "Edit Task" : "Create Task"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-theme-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className={classNames(
                    "w-full px-3 py-2 bg-theme-900 border rounded-lg text-white placeholder-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-500",
                    errors.title ? "border-rose-500" : "border-theme-700"
                  )}
                />
                {errors.title && (
                  <p className="text-rose-400 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className={classNames(
                    "w-full px-3 py-2 bg-theme-900 border rounded-lg text-white placeholder-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-500 resize-none",
                    errors.description ? "border-rose-500" : "border-theme-700"
                  )}
                />
                {errors.description && (
                  <p className="text-rose-400 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Status and Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Task["status"])}
                    className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-theme-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task["priority"])}
                    className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-theme-500"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Project and Due Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-300 mb-1">
                    Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-theme-500"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-300 mb-1">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-500" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-theme-500 [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Agent */}
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-1">
                  Assigned Agent
                </label>
                <input
                  type="text"
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  placeholder="e.g., coder, researcher, planner"
                  className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-500"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-1">
                  Labels
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-500" />
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addLabel()
                        }
                      }}
                      placeholder="Add a label"
                      className="w-full pl-10 pr-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-500"
                    />
                  </div>
                  <Button type="button" variant="secondary" size="md" onClick={addLabel}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-theme-700 text-theme-300 rounded text-sm"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="text-theme-500 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-theme-700 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit}>
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
