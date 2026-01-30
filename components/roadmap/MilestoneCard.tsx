"use client"

import { format, formatDistanceToNow, isPast, isToday } from "date-fns"
import classNames from "classnames"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Target,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit2,
  Trash2,
  LinkIcon,
} from "lucide-react"
import { useState } from "react"
import type { Milestone } from "@/lib/stores/roadmap-store"

// ============================================================================
// Types
// ============================================================================

interface MilestoneCardProps {
  milestone: Milestone
  onEdit?: (milestone: Milestone) => void
  onDelete?: (id: string) => void
  onClick?: (milestone: Milestone) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusConfig(status: Milestone["status"]) {
  switch (status) {
    case "planned":
      return {
        color: "#71717a",
        bgColor: "bg-[#71717a]/10",
        textColor: "text-[#71717a]",
        borderColor: "border-[#71717a]/30",
        label: "Planned",
        Icon: Target,
      }
    case "in_progress":
      return {
        color: "#f97316",
        bgColor: "bg-[#f97316]/10",
        textColor: "text-[#f97316]",
        borderColor: "border-[#f97316]/30",
        label: "In Progress",
        Icon: Loader2,
      }
    case "completed":
      return {
        color: "#22c55e",
        bgColor: "bg-[#22c55e]/10",
        textColor: "text-[#22c55e]",
        borderColor: "border-[#22c55e]/30",
        label: "Completed",
        Icon: CheckCircle,
      }
    case "blocked":
      return {
        color: "#ef4444",
        bgColor: "bg-[#ef4444]/10",
        textColor: "text-[#ef4444]",
        borderColor: "border-[#ef4444]/30",
        label: "Blocked",
        Icon: AlertTriangle,
      }
  }
}

function getDueDateStatus(dueDate: string, status: Milestone["status"]) {
  if (status === "completed") return "completed"
  const date = new Date(dueDate)
  if (isPast(date) && !isToday(date)) return "overdue"
  if (isToday(date)) return "today"
  return "upcoming"
}

// ============================================================================
// Component
// ============================================================================

export function MilestoneCard({
  milestone,
  onEdit,
  onDelete,
  onClick,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const statusConfig = getStatusConfig(milestone.status)
  const dueDateStatus = getDueDateStatus(milestone.dueDate, milestone.status)
  const StatusIcon = statusConfig.Icon
  const isActive = milestone.status === "in_progress"
  const isBlocked = milestone.status === "blocked"

  const handleCardClick = () => {
    if (onClick) {
      onClick(milestone)
    } else {
      setExpanded(!expanded)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit?.(milestone)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.(milestone.id)
  }

  return (
    <div
      className={classNames(
        "bg-[#18181b] border rounded-lg overflow-hidden transition-all cursor-pointer",
        isActive && "border-[#f97316]/40 shadow-lg shadow-[#f97316]/5",
        isBlocked && "border-[#ef4444]/40",
        !isActive && !isBlocked && "border-[#27272a] hover:border-[#3f3f46]"
      )}
      onClick={handleCardClick}
    >
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Status indicator and content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Status Icon */}
            <div
              className={classNames(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                statusConfig.bgColor
              )}
            >
              <StatusIcon
                size={16}
                className={classNames(
                  statusConfig.textColor,
                  isActive && "animate-spin"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[#fafafa] font-medium text-sm truncate">
                {milestone.title}
              </h3>
              <p className="text-[#71717a] text-xs mt-0.5 line-clamp-2">
                {milestone.description}
              </p>
            </div>
          </div>

          {/* Right: Actions and expand */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badge */}
            <span
              className={classNames(
                "px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1",
                statusConfig.bgColor,
                statusConfig.textColor,
                `border ${statusConfig.borderColor}`
              )}
            >
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
              )}
              {statusConfig.label}
            </span>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1 rounded text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-[#18181b] border border-[#27272a] rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#ef4444] hover:bg-[#ef4444]/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Expand Toggle */}
            {expanded ? (
              <ChevronDown size={16} className="text-[#52525b]" />
            ) : (
              <ChevronRight size={16} className="text-[#52525b]" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#52525b]">Progress</span>
            <span
              className={classNames(
                "text-xs font-medium",
                milestone.progress === 100 ? "text-[#22c55e]" : isActive ? "text-[#f97316]" : "text-[#71717a]"
              )}
            >
              {milestone.progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
            <div
              className={classNames(
                "h-full rounded-full transition-all",
                milestone.status === "completed" && "bg-[#22c55e]",
                milestone.status === "in_progress" && "bg-gradient-to-r from-[#ef4444] to-[#f97316]",
                milestone.status === "blocked" && "bg-[#ef4444]",
                milestone.status === "planned" && "bg-[#71717a]"
              )}
              style={{ width: `${milestone.progress}%` }}
            />
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center justify-between mt-3">
          {/* Due Date */}
          <div
            className={classNames(
              "flex items-center gap-1.5 text-xs",
              dueDateStatus === "overdue" && "text-[#ef4444]",
              dueDateStatus === "today" && "text-[#f97316]",
              dueDateStatus === "completed" && "text-[#22c55e]",
              dueDateStatus === "upcoming" && "text-[#71717a]"
            )}
          >
            <Calendar size={12} />
            <span>
              {dueDateStatus === "overdue" && "Overdue: "}
              {dueDateStatus === "today" && "Due today"}
              {dueDateStatus !== "today" && format(new Date(milestone.dueDate), "MMM d, yyyy")}
            </span>
          </div>

          {/* Linked Tasks */}
          {milestone.tasks.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-[#52525b]">
              <LinkIcon size={12} />
              <span>{milestone.tasks.length} task{milestone.tasks.length !== 1 && "s"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#27272a] pt-3">
          {/* Full Description */}
          <div className="mb-3">
            <h4 className="text-xs text-[#71717a] font-medium mb-1">Description</h4>
            <p className="text-sm text-[#a1a1aa]">{milestone.description}</p>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-[#52525b]">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Created {formatDistanceToNow(new Date(milestone.createdAt))} ago</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Updated {formatDistanceToNow(new Date(milestone.updatedAt))} ago</span>
            </div>
          </div>

          {/* Linked Task IDs */}
          {milestone.tasks.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs text-[#71717a] font-medium mb-1.5">Linked Tasks</h4>
              <div className="flex flex-wrap gap-1.5">
                {milestone.tasks.map((taskId) => (
                  <span
                    key={taskId}
                    className="px-2 py-0.5 bg-[#27272a] text-[#a1a1aa] rounded text-xs font-mono"
                  >
                    {taskId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MilestoneCard
