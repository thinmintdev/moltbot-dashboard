"use client"

import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import { format } from "date-fns"
import { X, Calendar, Plus, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import {
  type ChangelogEntry,
  type Change,
  type ChangeType,
  getChangeTypeConfig,
} from "@/lib/stores/changelog-store"

// ============================================================================
// Types
// ============================================================================

interface ChangelogModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (entry: Omit<ChangelogEntry, "id" | "createdAt" | "updatedAt">) => void
  entry?: ChangelogEntry | null
  projectId: string
}

// ============================================================================
// Change Type Options
// ============================================================================

const changeTypeOptions: { value: ChangeType; label: string }[] = [
  { value: "added", label: "Added" },
  { value: "changed", label: "Changed" },
  { value: "fixed", label: "Fixed" },
  { value: "removed", label: "Removed" },
  { value: "security", label: "Security" },
]

// ============================================================================
// Component
// ============================================================================

export function ChangelogModal({
  open,
  onClose,
  onSubmit,
  entry,
  projectId,
}: ChangelogModalProps) {
  const isEditing = !!entry

  const [version, setVersion] = useState("")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [changes, setChanges] = useState<Change[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // New change form state
  const [newChangeType, setNewChangeType] = useState<ChangeType>("added")
  const [newChangeDescription, setNewChangeDescription] = useState("")

  // Reset form when opening/closing or when entry changes
  useEffect(() => {
    if (open) {
      if (entry) {
        setVersion(entry.version)
        setTitle(entry.title)
        setDate(format(new Date(entry.date), "yyyy-MM-dd"))
        setChanges(entry.changes)
      } else {
        setVersion("")
        setTitle("")
        setDate(format(new Date(), "yyyy-MM-dd"))
        setChanges([])
      }
      setNewChangeType("added")
      setNewChangeDescription("")
      setErrors({})
    }
  }, [open, entry])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Version validation (semver format)
    const semverRegex = /^\d+\.\d+\.\d+$/
    if (!version.trim()) {
      newErrors.version = "Version is required"
    } else if (!semverRegex.test(version.trim())) {
      newErrors.version = "Version must be in semver format (e.g., 1.2.3)"
    }

    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.length > 100) {
      newErrors.title = "Title must be less than 100 characters"
    }

    if (!date) {
      newErrors.date = "Date is required"
    }

    if (changes.length === 0) {
      newErrors.changes = "At least one change is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddChange = () => {
    if (!newChangeDescription.trim()) return

    setChanges((prev) => [
      ...prev,
      { type: newChangeType, description: newChangeDescription.trim() },
    ])
    setNewChangeDescription("")
    setErrors((prev) => ({ ...prev, changes: "" }))
  }

  const handleRemoveChange = (index: number) => {
    setChanges((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      version: version.trim(),
      title: title.trim(),
      date: new Date(date).toISOString(),
      changes,
      projectId: entry?.projectId || projectId,
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
              {isEditing ? "Edit Version" : "Add Version"}
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
              {/* Version and Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Version <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className={classNames(
                      "w-full px-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] font-mono focus:outline-none focus:ring-2 focus:ring-[#f97316]/50",
                      errors.version ? "border-[#ef4444]" : "border-[#27272a]"
                    )}
                  />
                  {errors.version && (
                    <p className="text-[#ef4444] text-xs mt-1">{errors.version}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                    Date <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={classNames(
                        "w-full pl-10 pr-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 [&::-webkit-calendar-picker-indicator]:invert",
                        errors.date ? "border-[#ef4444]" : "border-[#27272a]"
                      )}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-[#ef4444] text-xs mt-1">{errors.date}</p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Title <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Release title (e.g., 'Bug Fixes & Performance')"
                  className={classNames(
                    "w-full px-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50",
                    errors.title ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                />
                {errors.title && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Changes Section */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Changes <span className="text-[#ef4444]">*</span>
                </label>

                {/* Add Change Form */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={newChangeType}
                    onChange={(e) => setNewChangeType(e.target.value as ChangeType)}
                    className="px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                  >
                    {changeTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newChangeDescription}
                    onChange={(e) => setNewChangeDescription(e.target.value)}
                    placeholder="Describe the change..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddChange()
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddChange}
                    disabled={!newChangeDescription.trim()}
                    className="p-2 rounded-lg bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Changes List */}
                {changes.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {changes.map((change, index) => {
                      const config = getChangeTypeConfig(change.type)
                      return (
                        <li
                          key={index}
                          className="flex items-start gap-2 p-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg group"
                        >
                          <span
                            className="shrink-0 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide"
                            style={{ backgroundColor: config.bgColor, color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span className="flex-1 text-sm text-[#a1a1aa]">
                            {change.description}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChange(index)}
                            className="shrink-0 p-1 rounded text-[#52525b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="p-4 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-center">
                    <p className="text-[#52525b] text-sm">
                      No changes added yet. Add at least one change above.
                    </p>
                  </div>
                )}

                {errors.changes && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.changes}</p>
                )}
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
              {isEditing ? "Save Changes" : "Add Version"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default ChangelogModal
