"use client"

import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import { X, Plus, Tag } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import type { Idea, IdeaCategory, IdeaStatus } from "@/lib/stores/ideation-store"
import { CATEGORY_COLORS, STATUS_COLORS } from "@/lib/stores/ideation-store"

interface Project {
  id: string
  name: string
}

interface IdeaModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'votes'>) => void
  idea?: Idea | null
  projects?: Project[]
  defaultProjectId?: string | null
}

const categoryOptions: { value: IdeaCategory; label: string }[] = [
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bugfix", label: "Bug Fix" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
]

const statusOptions: { value: IdeaStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "considering", label: "Considering" },
  { value: "planned", label: "Planned" },
  { value: "rejected", label: "Rejected" },
]

export function IdeaModal({
  open,
  onClose,
  onSubmit,
  idea,
  projects = [],
  defaultProjectId,
}: IdeaModalProps) {
  const isEditing = !!idea

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<IdeaCategory>("feature")
  const [status, setStatus] = useState<IdeaStatus>("new")
  const [projectId, setProjectId] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [author, setAuthor] = useState("system")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when opening/closing or when idea changes
  useEffect(() => {
    if (open) {
      if (idea) {
        setTitle(idea.title)
        setDescription(idea.description || "")
        setCategory(idea.category)
        setStatus(idea.status)
        setProjectId(idea.projectId || "")
        setTags(idea.tags || [])
        setAuthor(idea.author || "system")
      } else {
        setTitle("")
        setDescription("")
        setCategory("feature")
        setStatus("new")
        setProjectId(defaultProjectId || "")
        setTags([])
        setAuthor("system")
      }
      setNewTag("")
      setErrors({})
    }
  }, [open, idea, defaultProjectId])

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

    if (!projectId) {
      newErrors.projectId = "Project is required"
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
      category,
      status,
      projectId,
      tags,
      author: author.trim() || "system",
    })

    onClose()
  }

  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#18181b] rounded-xl border border-[#27272a] w-full max-w-xl max-h-[90vh] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#27272a] shrink-0">
            <Dialog.Title className="text-lg font-semibold text-[#fafafa]">
              {isEditing ? "Edit Idea" : "New Idea"}
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
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                  Title <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your idea?"
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
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your idea in detail..."
                  rows={4}
                  className={classNames(
                    "w-full px-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 resize-none",
                    errors.description ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                />
                {errors.description && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Category and Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                    className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {/* Category color preview */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                    />
                    <span className="text-xs text-[#71717a]">Category color</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IdeaStatus)}
                    className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {/* Status color preview */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    <span className="text-xs text-[#71717a]">Status color</span>
                  </div>
                </div>
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                  Project <span className="text-[#ef4444]">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={classNames(
                    "w-full px-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50",
                    errors.projectId ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="text-[#ef4444] text-xs mt-1">{errors.projectId}</p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name or alias"
                  className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      placeholder="Add a tag"
                      className="w-full pl-10 pr-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                    />
                  </div>
                  <Button type="button" variant="secondary" size="md" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#27272a] text-[#a1a1aa] rounded text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-[#52525b] hover:text-[#ef4444] transition-colors"
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
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#27272a] shrink-0">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white rounded-lg font-medium hover:from-[#dc2626] hover:to-[#ea580c] transition-colors"
            >
              {isEditing ? "Save Changes" : "Add Idea"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default IdeaModal
