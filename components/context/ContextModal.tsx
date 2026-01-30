"use client"

import { useState, useEffect } from "react"
import { X, File, Code, FileText, Link as LinkIcon, Plus, Tag } from "lucide-react"
import classNames from "classnames"
import type { ContextDocument, ContextDocumentType } from "@/lib/stores/context-store"

// ============================================================================
// Type Options
// ============================================================================

const TYPE_OPTIONS: { value: ContextDocumentType; label: string; icon: typeof File; color: string }[] = [
  { value: "file", label: "File", icon: File, color: "#3b82f6" },
  { value: "snippet", label: "Snippet", icon: Code, color: "#a855f7" },
  { value: "note", label: "Note", icon: FileText, color: "#22c55e" },
  { value: "link", label: "Link", icon: LinkIcon, color: "#f97316" },
]

// ============================================================================
// Component Props
// ============================================================================

interface ContextModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<ContextDocument, "id" | "createdAt" | "updatedAt">) => void
  document?: ContextDocument | null
  projectId: string
}

// ============================================================================
// Component
// ============================================================================

export function ContextModal({
  open,
  onClose,
  onSubmit,
  document,
  projectId,
}: ContextModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<ContextDocumentType>("note")
  const [path, setPath] = useState("")
  const [url, setUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const isEditing = !!document

  // Reset form when modal opens/closes or document changes
  useEffect(() => {
    if (open) {
      if (document) {
        setTitle(document.title)
        setContent(document.content)
        setType(document.type)
        setPath(document.path || "")
        setUrl(document.url || "")
        setIsActive(document.isActive)
        setTags(document.tags)
      } else {
        setTitle("")
        setContent("")
        setType("note")
        setPath("")
        setUrl("")
        setIsActive(true)
        setTags([])
      }
      setTagInput("")
    }
  }, [open, document])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      type,
      path: type === "file" ? path.trim() : undefined,
      url: type === "link" ? url.trim() : undefined,
      isActive,
      projectId,
      tags,
    })

    onClose()
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#18181b] rounded-xl border border-[#27272a] w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272a] shrink-0">
          <h3 className="text-lg font-semibold text-[#fafafa]">
            {isEditing ? "Edit Context Document" : "Add Context Document"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-[#fafafa] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={classNames(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                        type === option.value
                          ? "border-[#ef4444] bg-[#ef4444]/10"
                          : "border-[#27272a] hover:border-[#3f3f46] bg-[#111113]"
                      )}
                    >
                      <Icon
                        size={20}
                        style={{ color: type === option.value ? option.color : "#71717a" }}
                      />
                      <span
                        className={classNames(
                          "text-xs font-medium",
                          type === option.value ? "text-[#fafafa]" : "text-[#71717a]"
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Title <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title..."
                className="w-full px-3 py-2 bg-[#111113] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-[#ef4444] transition-colors"
                required
              />
            </div>

            {/* Path (for file type) */}
            {type === "file" && (
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  File Path
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/path/to/file.ts"
                  className="w-full px-3 py-2 bg-[#111113] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] font-mono text-sm focus:outline-none focus:border-[#ef4444] transition-colors"
                />
              </div>
            )}

            {/* URL (for link type) */}
            {type === "link" && (
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-[#111113] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] font-mono text-sm focus:outline-none focus:border-[#ef4444] transition-colors"
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Content <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === "snippet"
                    ? "// Paste your code snippet here..."
                    : type === "link"
                    ? "Description of the linked resource..."
                    : "Enter document content..."
                }
                rows={10}
                className={classNames(
                  "w-full px-3 py-2 bg-[#111113] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-[#ef4444] transition-colors resize-none",
                  (type === "snippet" || type === "file") && "font-mono text-sm"
                )}
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#27272a] text-[#a1a1aa] rounded text-xs"
                  >
                    <Tag size={10} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-[#52525b] hover:text-[#ef4444] transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 bg-[#111113] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] text-sm focus:outline-none focus:border-[#ef4444] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#3f3f46] rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#111113] border border-[#27272a] rounded-lg">
              <div>
                <p className="text-[#fafafa] text-sm font-medium">Include in AI Context</p>
                <p className="text-[#52525b] text-xs">
                  Active documents are sent to AI agents as context
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={classNames(
                  "relative w-11 h-6 rounded-full transition-colors",
                  isActive ? "bg-[#22c55e]" : "bg-[#27272a]"
                )}
              >
                <span
                  className={classNames(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    isActive ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#27272a] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className={classNames(
                "px-4 py-2 rounded-lg font-medium transition-all",
                title.trim() && content.trim()
                  ? "bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20"
                  : "bg-[#27272a] text-[#52525b] cursor-not-allowed"
              )}
            >
              {isEditing ? "Save Changes" : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContextModal
