"use client"

import classNames from "classnames"
import { ThumbsUp, ThumbsDown, Tag, Clock, User, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import { useState } from "react"
import type { Idea, IdeaCategory, IdeaStatus } from "@/lib/stores/ideation-store"
import { CATEGORY_COLORS, STATUS_COLORS } from "@/lib/stores/ideation-store"

interface IdeaCardProps {
  idea: Idea
  onVote: (id: string, delta: 1 | -1) => void
  onEdit?: (idea: Idea) => void
  onDelete?: (id: string) => void
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
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Category display names
const categoryLabels: Record<IdeaCategory, string> = {
  feature: "Feature",
  improvement: "Improvement",
  bugfix: "Bug Fix",
  research: "Research",
  other: "Other",
}

// Status display names
const statusLabels: Record<IdeaStatus, string> = {
  new: "New",
  considering: "Considering",
  planned: "Planned",
  rejected: "Rejected",
}

export function IdeaCard({ idea, onVote, onEdit, onDelete }: IdeaCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const categoryColor = CATEGORY_COLORS[idea.category]
  const statusColor = STATUS_COLORS[idea.status]

  return (
    <div
      className={classNames(
        "bg-[#18181b] border border-[#27272a] rounded-lg p-4 hover:border-[#3f3f46] transition-all group"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category badge */}
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {categoryLabels[idea.category]}
          </span>
          {/* Status badge */}
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {statusLabels[idea.status]}
          </span>
        </div>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272a] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(idea)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(idea.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#ef4444] hover:bg-[#27272a] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[#fafafa] font-medium text-sm mb-2 line-clamp-2">
        {idea.title}
      </h3>

      {/* Description */}
      {idea.description && (
        <p className="text-[#71717a] text-xs mb-3 line-clamp-3">
          {idea.description}
        </p>
      )}

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {idea.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[#27272a] text-[#a1a1aa]"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {idea.tags.length > 4 && (
            <span className="text-[#71717a] text-xs">+{idea.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
        {/* Vote buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onVote(idea.id, 1)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#71717a] hover:text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <span
            className={classNames(
              "text-sm font-semibold min-w-[24px] text-center",
              idea.votes > 0 ? "text-[#22c55e]" : idea.votes < 0 ? "text-[#ef4444]" : "text-[#71717a]"
            )}
          >
            {idea.votes}
          </span>
          <button
            onClick={() => onVote(idea.id, -1)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#71717a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-[#52525b] text-xs">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{idea.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(idea.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdeaCard
