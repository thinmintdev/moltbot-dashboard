"use client"

import {
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Clock,
  User,
  MessageSquare,
  FileCode,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowUpRight,
} from "lucide-react"
import { prToTask, getPriorityColor } from "@/lib/utils/github-to-task"
import type { GitHubPullRequest } from "@/lib/api/github"

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

export type CIStatus = "passed" | "failed" | "pending" | "unknown"

interface PRCardProps {
  pr: GitHubPullRequest
  ciStatus?: CIStatus
  onSync?: () => void
}

export function PRCard({ pr, ciStatus = "unknown", onSync }: PRCardProps) {
  const task = prToTask(pr)
  const priorityColor = getPriorityColor(task.priority)

  // Determine PR state for display
  const isMerged = pr.merged_at !== null || pr.merged === true
  const isDraft = pr.draft
  const isClosed = pr.state === "closed" && !isMerged

  // Get state badge config
  const getStateBadge = () => {
    if (isMerged) {
      return {
        icon: GitMerge,
        label: "Merged",
        bgColor: "bg-[#a855f7]/10",
        textColor: "text-[#a855f7]",
        iconColor: "text-[#a855f7]",
      }
    }
    if (isDraft) {
      return {
        icon: GitPullRequest,
        label: "Draft",
        bgColor: "bg-[#71717a]/10",
        textColor: "text-[#71717a]",
        iconColor: "text-[#71717a]",
      }
    }
    if (isClosed) {
      return {
        icon: GitPullRequest,
        label: "Closed",
        bgColor: "bg-[#ef4444]/10",
        textColor: "text-[#ef4444]",
        iconColor: "text-[#ef4444]",
      }
    }
    return {
      icon: GitPullRequest,
      label: "Open",
      bgColor: "bg-[#22c55e]/10",
      textColor: "text-[#22c55e]",
      iconColor: "text-[#22c55e]",
    }
  }

  const stateBadge = getStateBadge()
  const StateIcon = stateBadge.icon

  // CI status indicator
  const getCIStatusConfig = () => {
    switch (ciStatus) {
      case "passed":
        return {
          icon: CheckCircle2,
          color: "text-[#22c55e]",
          label: "Checks passed",
        }
      case "failed":
        return {
          icon: XCircle,
          color: "text-[#ef4444]",
          label: "Checks failed",
        }
      case "pending":
        return {
          icon: Circle,
          color: "text-[#eab308]",
          label: "Checks pending",
        }
      default:
        return null
    }
  }

  const ciConfig = getCIStatusConfig()

  // Card styling based on draft status
  const cardClasses = isDraft
    ? "bg-[#18181b]/70 border border-[#27272a]/70 rounded-lg p-4 hover:border-[#3f3f46]/70 transition-all opacity-70"
    : "bg-[#18181b] border border-[#27272a] rounded-lg p-4 hover:border-[#3f3f46] transition-all"

  return (
    <div className={cardClasses}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <StateIcon size={16} className={stateBadge.iconColor} />
          <span className="text-[#71717a] text-sm font-mono">#{pr.number}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${stateBadge.bgColor} ${stateBadge.textColor}`}
          >
            {stateBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${priorityColor}20`,
              color: priorityColor,
            }}
          >
            {task.priority}
          </span>
          {ciConfig && (
            <div
              className="flex items-center gap-1"
              title={ciConfig.label}
            >
              <ciConfig.icon size={14} className={ciConfig.color} />
            </div>
          )}
          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a]"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[#fafafa] font-medium text-sm mb-2 line-clamp-2">
        {pr.title}
      </h3>

      {/* Branch info */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="px-1.5 py-0.5 bg-[#27272a] text-[#a1a1aa] rounded font-mono truncate max-w-[120px]">
          {pr.head.ref}
        </span>
        <span className="text-[#71717a]">-&gt;</span>
        <span className="px-1.5 py-0.5 bg-[#27272a] text-[#a1a1aa] rounded font-mono truncate max-w-[120px]">
          {pr.base.ref}
        </span>
      </div>

      {/* Labels */}
      {pr.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pr.labels.slice(0, 4).map((label) => (
            <span
              key={label.id}
              className="px-1.5 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `#${label.color}20`,
                color: `#${label.color}`,
                borderColor: `#${label.color}40`,
                borderWidth: 1,
              }}
            >
              {label.name}
            </span>
          ))}
          {pr.labels.length > 4 && (
            <span className="text-[#71717a] text-xs">+{pr.labels.length - 4}</span>
          )}
        </div>
      )}

      {/* Author and Reviewers */}
      <div className="flex items-center gap-3 mb-3">
        {/* Author */}
        <div className="flex items-center gap-1.5">
          {pr.user.avatar_url ? (
            <img
              src={pr.user.avatar_url}
              alt={pr.user.login}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <User size={14} className="text-[#71717a]" />
          )}
          <span className="text-[#a1a1aa] text-xs">{pr.user.login}</span>
        </div>

        {/* Reviewers */}
        {pr.requested_reviewers && pr.requested_reviewers.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[#71717a] text-xs">Reviewers:</span>
            <div className="flex -space-x-1.5">
              {pr.requested_reviewers.slice(0, 3).map((reviewer) => (
                <div
                  key={reviewer.login}
                  title={reviewer.login}
                  className="w-5 h-5 rounded-full bg-[#27272a] border border-[#18181b] flex items-center justify-center overflow-hidden"
                >
                  {reviewer.avatar_url ? (
                    <img
                      src={reviewer.avatar_url}
                      alt={reviewer.login}
                      className="w-full h-full"
                    />
                  ) : (
                    <span className="text-[10px] text-[#71717a]">
                      {reviewer.login.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {pr.requested_reviewers.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-[#27272a] border border-[#18181b] flex items-center justify-center">
                  <span className="text-[10px] text-[#71717a]">
                    +{pr.requested_reviewers.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#71717a] text-xs">
          {/* Files changed */}
          {pr.changed_files !== undefined && (
            <div className="flex items-center gap-1" title="Files changed">
              <FileCode size={12} />
              <span>{pr.changed_files} files</span>
            </div>
          )}

          {/* Comments */}
          {(pr.comments !== undefined || pr.review_comments !== undefined) && (
            <div className="flex items-center gap-1" title="Comments">
              <MessageSquare size={12} />
              <span>{(pr.comments || 0) + (pr.review_comments || 0)}</span>
            </div>
          )}

          {/* Updated time */}
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatRelativeTime(pr.updated_at)}</span>
          </div>
        </div>

        {onSync && (
          <button
            onClick={onSync}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#f97316] hover:bg-[#f97316]/10 transition-colors"
          >
            <ArrowUpRight size={12} />
            Add to Kanban
          </button>
        )}
      </div>
    </div>
  )
}

export default PRCard
