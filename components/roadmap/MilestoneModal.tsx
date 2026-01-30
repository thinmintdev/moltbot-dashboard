"use client"

import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import { format } from "date-fns"
import { X, Calendar, Target, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import type { Milestone } from "@/lib/stores/roadmap-store"

// ============================================================================
// Types
// ============================================================================

interface MilestoneModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (milestone: Omit<Milestone, "id" | "createdAt" | "updatedAt">) => void
  milestone?: Milestone | null
  projectId: string
}

// ============================================================================
// Status Options
// ============================================================================

const statusOptions: { value: Milestone["status"]; label: string; Icon: React.ElementType; color: string }[] = [
  { value: "planned", label: "Planned", Icon: Target, color: "#71717a" },
  { value: "in_progress", label: "In Progress", Icon: Loader2, color: "#f97316" },
  { value: "completed", label: "Completed", Icon: CheckCircle, color: "#22c55e" },
  { value: "blocked", label: "Blocked", Icon: AlertTriangle, color: "#ef4444" },
]

// ============================================================================
// Component
// ============================================================================

export function MilestoneModal({
  open,
  onClose,
  onSubmit,
  milestone,
  projectId,
}: MilestoneModalProps) {
  const isEditing = !!milestone

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<Milestone["status"]>("planned")
  const [dueDate, setDueDate] = useState("")
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when opening/closing or when milestone changes
  useEffect(() => {
    if (open) {
      if (milestone) {
        setTitle(milestone.title)
        setDescription(milestone.description)
        setStatus(milestone.status)
        setDueDate(format(new Date(milestone.dueDate), "yyyy-MM-dd"))
        setProgress(milestone.progress)
      } else {
        setTitle("")
        setDescription("")
        setStatus("planned")
        setDueDate(format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
        setProgress(0)
      }
      setErrors({})
    }
  }, [open, milestone])

  // Auto-update progress based on status
  useEffect(() => {
    if (status === "completed" && progress < 100) {
      setProgress(100)
    }
  }, [status, progress])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.length > 100) {
      newErrors.title = "Title must be less than 100 characters"
    }

    if (!description.trim()) {
      newErrors.description = "Description is required"
    } else if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters"
    }

    if (!dueDate) {
      newErrors.dueDate = "Due date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      dueDate: new Date(dueDate).toISOString(),
      progress,
      projectId: milestone?.projectId || projectId,
      tasks: milestone?.tasks || [],
    })

    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#18181b] rounded-xl border border-[#27272a] w-full max-w-lg max-h-[90vh] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#27272a] shrink-0">
            <Dialog.Title className="text-lg font-semibold text-[#fafafa]">
              {isEditing ? "Edit Milestone" : "Create Milestone"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-[#71717a] hover:text-[#fafafa] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Title <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter milestone title"
                  className={classNames(
                    "w-full px-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50",
                    errors.title ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                />
                {errors.title && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Description <span className="text-[#ef4444]">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this milestone..."
                  rows={3}
                  className={classNames(
                    "w-full px-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 resize-none",
                    errors.description ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                />
                {errors.description && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => {
                    const Icon = option.Icon
                    const isSelected = status === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        className={classNames(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                          isSelected
                            ? "border-[#f97316] bg-[#f97316]/10 text-[#fafafa]"
                            : "border-[#27272a] bg-[#0a0a0b] text-[#71717a] hover:border-[#3f3f46]"
                        )}
                      >
                        <Icon
                          size={16}
                          style={{ color: isSelected ? option.color : "#71717a" }}
                          className={option.value === "in_progress" && isSelected ? "animate-spin" : ""}
                        />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Due Date and Progress row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Due Date <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={classNames(
                        "w-full pl-10 pr-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 [&::-webkit-calendar-picker-indicator]:invert",
                        errors.dueDate ? "border-[#ef4444]" : "border-[#27272a]"
                      )}
                    />
                  </div>
                  {errors.dueDate && (
                    <p className="text-[#ef4444] text-xs mt-1">{errors.dueDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Progress
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="flex-1 h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#f97316]"
                    />
                    <span className="text-sm font-mono text-[#fafafa] w-10 text-right">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Preview */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Progress Preview
                </label>
                <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
                  <div
                    className={classNames(
                      "h-full rounded-full transition-all",
                      status === "completed" && "bg-[#22c55e]",
                      status === "in_progress" && "bg-gradient-to-r from-[#ef4444] to-[#f97316]",
                      status === "blocked" && "bg-[#ef4444]",
                      status === "planned" && "bg-[#71717a]"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#27272a] shrink-0">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
            >
              {isEditing ? "Save Changes" : "Create Milestone"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default MilestoneModal
