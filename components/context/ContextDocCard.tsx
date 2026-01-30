"use client"

import { File, Code, FileText, Link as LinkIcon, Eye, EyeOff, Edit2, Trash2, Tag } from "lucide-react"
import classNames from "classnames"
import type { ContextDocument, ContextDocumentType } from "@/lib/stores/context-store"

// ============================================================================
// Helper Functions
// ============================================================================

function getTypeIcon(type: ContextDocumentType) {
  switch (type) {
    case "file":
      return File
    case "snippet":
      return Code
    case "note":
      return FileText
    case "link":
      return LinkIcon
    default:
      return FileText
  }
}

function getTypeColor(type: ContextDocumentType) {
  switch (type) {
    case "file":
      return {
        bg: "bg-[#3b82f6]/10",
        text: "text-[#3b82f6]",
        border: "border-[#3b82f6]/30",
      }
    case "snippet":
      return {
        bg: "bg-[#a855f7]/10",
        text: "text-[#a855f7]",
        border: "border-[#a855f7]/30",
      }
    case "note":
      return {
        bg: "bg-[#22c55e]/10",
        text: "text-[#22c55e]",
        border: "border-[#22c55e]/30",
      }
    case "link":
      return {
        bg: "bg-[#f97316]/10",
        text: "text-[#f97316]",
        border: "border-[#f97316]/30",
      }
    default:
      return {
        bg: "bg-[#71717a]/10",
        text: "text-[#71717a]",
        border: "border-[#71717a]/30",
      }
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function truncateContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength).trim() + "..."
}

// ============================================================================
// Component Props
// ============================================================================

interface ContextDocCardProps {
  document: ContextDocument
  onToggleActive: (id: string) => void
  onEdit: (doc: ContextDocument) => void
  onDelete: (id: string) => void
  compact?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function ContextDocCard({
  document,
  onToggleActive,
  onEdit,
  onDelete,
  compact = false,
}: ContextDocCardProps) {
  const Icon = getTypeIcon(document.type)
  const colors = getTypeColor(document.type)

  return (
    <div
      className={classNames(
        "bg-[#18181b] border rounded-lg transition-all",
        document.isActive
          ? "border-[#27272a] hover:border-[#3f3f46]"
          : "border-[#27272a]/50 opacity-60 hover:opacity-80"
      )}
    >
      <div className={classNames("p-4", compact && "p-3")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Type Icon */}
            <div
              className={classNames(
                "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                colors.bg
              )}
            >
              <Icon size={18} className={colors.text} />
            </div>

            {/* Title and Meta */}
            <div className="min-w-0 flex-1">
              <h4 className="text-[#fafafa] font-medium text-sm truncate">
                {document.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={classNames(
                    "px-1.5 py-0.5 rounded text-[10px] uppercase font-medium border",
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  {document.type}
                </span>
                <span className="text-[#52525b] text-xs">
                  {formatDate(document.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleActive(document.id)
            }}
            className={classNames(
              "shrink-0 p-1.5 rounded-md transition-colors",
              document.isActive
                ? "bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                : "bg-[#27272a] text-[#52525b] hover:text-[#71717a] hover:bg-[#3f3f46]"
            )}
            title={document.isActive ? "Included in context" : "Not included in context"}
          >
            {document.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Path/URL */}
        {(document.path || document.url) && (
          <div className="mb-2">
            {document.path && (
              <code className="text-[10px] text-[#52525b] font-mono block truncate">
                {document.path}
              </code>
            )}
            {document.url && (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#3b82f6] font-mono block truncate hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {document.url}
              </a>
            )}
          </div>
        )}

        {/* Content Preview */}
        {!compact && (
          <p className="text-[#71717a] text-xs line-clamp-2 mb-3">
            {truncateContent(document.content)}
          </p>
        )}

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <Tag size={10} className="text-[#52525b]" />
            {document.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a] text-[10px]"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 4 && (
              <span className="text-[#52525b] text-[10px]">
                +{document.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#27272a]/50">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(document)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors"
          >
            <Edit2 size={12} />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(document.id)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#71717a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContextDocCard
