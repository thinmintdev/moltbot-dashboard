"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CircleDot,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Tag,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import classNames from "classnames"
import { fetchIssues, getRateLimitInfo, type GitHubIssue } from "@/lib/api/github"
import { issueToTask, getPriorityColor } from "@/lib/utils/github-to-task"
import { useToast } from "@/components/common/Toast"
import type { Task } from "@/lib/stores/task-store"

interface GitHubIssuesViewProps {
  owner?: string
  repo?: string
  projectId?: string
  onSyncToKanban?: (tasks: Task[]) => void
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

// Issue card component
function IssueCard({
  issue,
  onSync,
}: {
  issue: GitHubIssue
  onSync?: () => void
}) {
  const task = issueToTask(issue)
  const priorityColor = getPriorityColor(task.priority)

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 hover:border-[#3f3f46] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <CircleDot
            size={16}
            className={issue.state === "open" ? "text-[#22c55e]" : "text-[#a855f7]"}
          />
          <span className="text-[#71717a] text-sm font-mono">#{issue.number}</span>
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
          <a
            href={issue.html_url}
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
        {issue.title}
      </h3>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {issue.labels.slice(0, 4).map((label) => (
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
          {issue.labels.length > 4 && (
            <span className="text-[#71717a] text-xs">+{issue.labels.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#71717a] text-xs">
          {issue.assignee && (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{issue.assignee.login}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatRelativeTime(issue.updated_at)}</span>
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

export function GitHubIssuesView({
  owner,
  repo,
  projectId,
  onSyncToKanban,
}: GitHubIssuesViewProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null)

  const { success, error: showError, info } = useToast()

  const loadIssues = useCallback(async () => {
    if (!owner || !repo) return

    setLoading(true)
    setError(null)

    try {
      const data = await fetchIssues(owner, repo)
      // Filter out PRs (GitHub includes PRs in issues endpoint)
      const issuesOnly = data.filter(
        (item) => !("pull_request" in item)
      )
      setIssues(issuesOnly)

      const rateLimit = getRateLimitInfo()
      setRateLimitRemaining(rateLimit.remaining)

      if (rateLimit.remaining < 10) {
        info("Rate limit warning", `Only ${rateLimit.remaining} API requests remaining`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch issues"
      setError(message)
      showError("GitHub API Error", message)
    } finally {
      setLoading(false)
    }
  }, [owner, repo, info, showError])

  useEffect(() => {
    if (owner && repo) {
      loadIssues()
    }
  }, [owner, repo, loadIssues])

  const handleSyncIssue = (issue: GitHubIssue) => {
    const task = issueToTask(issue, projectId)
    onSyncToKanban?.([task])
    success("Issue synced", `"${issue.title}" added to Kanban`)
  }

  const handleSyncAll = () => {
    const tasks = issues.map((issue) => issueToTask(issue, projectId))
    onSyncToKanban?.(tasks)
    success("Issues synced", `${tasks.length} issues added to Kanban`)
  }

  // No project selected
  if (!owner || !repo) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
          <CircleDot className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">GitHub Issues</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Select a project with a GitHub source to view and sync issues.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[#fafafa] text-lg font-semibold">GitHub Issues</h2>
          <span className="text-[#71717a] text-sm">
            {owner}/{repo}
          </span>
          {rateLimitRemaining !== null && (
            <span
              className={classNames(
                "px-2 py-0.5 rounded text-xs",
                rateLimitRemaining > 30
                  ? "bg-[#22c55e]/10 text-[#22c55e]"
                  : rateLimitRemaining > 10
                  ? "bg-[#f97316]/10 text-[#f97316]"
                  : "bg-[#ef4444]/10 text-[#ef4444]"
              )}
            >
              {rateLimitRemaining} API calls left
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {issues.length > 0 && onSyncToKanban && (
            <button
              onClick={handleSyncAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] transition-colors"
            >
              <ArrowUpRight size={14} />
              Sync All ({issues.length})
            </button>
          )}
          <button
            onClick={loadIssues}
            disabled={loading}
            className={classNames(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] border border-[#27272a] transition-colors",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={classNames("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && issues.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#f97316] animate-spin mx-auto mb-3" />
              <p className="text-[#71717a]">Loading issues...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-[#fafafa] font-medium mb-2">Failed to load issues</h3>
              <p className="text-[#71717a] text-sm mb-4">{error}</p>
              <button
                onClick={loadIssues}
                className="px-4 py-2 bg-[#27272a] text-[#fafafa] rounded-lg hover:bg-[#3f3f46] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#22c55e]" />
              </div>
              <h3 className="text-[#fafafa] font-medium mb-2">No open issues</h3>
              <p className="text-[#71717a] text-sm">
                Great work! This repository has no open issues.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onSync={onSyncToKanban ? () => handleSyncIssue(issue) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GitHubIssuesView
