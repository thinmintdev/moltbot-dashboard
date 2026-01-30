"use client"

import { useState, useEffect, useCallback } from "react"
import {
  GitPullRequest,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowUpRight,
  ArrowUpDown,
} from "lucide-react"
import classNames from "classnames"
import {
  fetchPullRequests,
  getRateLimitInfo,
  type GitHubPullRequest,
  type PRState,
  type PRSort,
} from "@/lib/api/github"
import { prToTask } from "@/lib/utils/github-to-task"
import { useToast } from "@/components/common/Toast"
import { PRCard, type CIStatus } from "./PRCard"
import type { Task } from "@/lib/stores/task-store"

interface GitHubPRsViewProps {
  owner?: string
  repo?: string
  projectId?: string
  onSyncToKanban?: (tasks: Task[]) => void
}

// Filter tabs configuration
const filterTabs: { key: PRState; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
]

// Sort options configuration
const sortOptions: { key: PRSort; label: string }[] = [
  { key: "updated", label: "Updated" },
  { key: "created", label: "Created" },
  { key: "popularity", label: "Comments" },
]

export function GitHubPRsView({
  owner,
  repo,
  projectId,
  onSyncToKanban,
}: GitHubPRsViewProps) {
  const [prs, setPRs] = useState<GitHubPullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null)

  // Filter and sort state
  const [activeFilter, setActiveFilter] = useState<PRState>("open")
  const [activeSort, setActiveSort] = useState<PRSort>("updated")

  const { success, error: showError, info } = useToast()

  const loadPRs = useCallback(async () => {
    if (!owner || !repo) return

    setLoading(true)
    setError(null)

    try {
      const data = await fetchPullRequests(owner, repo, {
        state: activeFilter,
        sort: activeSort,
        direction: "desc",
      })
      setPRs(data)

      const rateLimit = getRateLimitInfo()
      setRateLimitRemaining(rateLimit.remaining)

      if (rateLimit.remaining < 10) {
        info("Rate limit warning", `Only ${rateLimit.remaining} API requests remaining`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch pull requests"
      setError(message)
      showError("GitHub API Error", message)
    } finally {
      setLoading(false)
    }
  }, [owner, repo, activeFilter, activeSort, info, showError])

  useEffect(() => {
    if (owner && repo) {
      loadPRs()
    }
  }, [owner, repo, activeFilter, activeSort, loadPRs])

  const handleSyncPR = (pr: GitHubPullRequest) => {
    const task = prToTask(pr, projectId)
    onSyncToKanban?.([task])
    success("PR synced", `"${pr.title}" added to Kanban`)
  }

  const handleSyncAll = () => {
    const tasks = prs.map((pr) => prToTask(pr, projectId))
    onSyncToKanban?.(tasks)
    success("PRs synced", `${tasks.length} pull requests added to Kanban`)
  }

  // Mock CI status (in real implementation, this would come from API)
  const getCIStatus = (pr: GitHubPullRequest): CIStatus => {
    // For demo purposes, derive status from PR properties
    if (pr.merged_at) return "passed"
    if (pr.draft) return "pending"
    // Randomly assign for demo (in production, fetch from checks API)
    const hash = pr.id % 10
    if (hash < 6) return "passed"
    if (hash < 8) return "pending"
    return "failed"
  }

  // Count PRs by state for display
  const openCount = prs.filter((pr) => pr.state === "open" && !pr.merged_at).length
  const closedCount = prs.filter((pr) => pr.state === "closed" || pr.merged_at).length

  // No project selected
  if (!owner || !repo) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
          <GitPullRequest className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">GitHub Pull Requests</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Select a project with a GitHub source to view and manage pull requests.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[#fafafa] text-lg font-semibold">GitHub Pull Requests</h2>
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
            {prs.length > 0 && onSyncToKanban && (
              <button
                onClick={handleSyncAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] transition-colors"
              >
                <ArrowUpRight size={14} />
                Sync All ({prs.length})
              </button>
            )}
            <button
              onClick={loadPRs}
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

        {/* Filter tabs and sort */}
        <div className="flex items-center justify-between">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#18181b] rounded-lg border border-[#27272a]">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={classNames(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeFilter === tab.key
                    ? "bg-[#27272a] text-[#fafafa]"
                    : "text-[#71717a] hover:text-[#a1a1aa]"
                )}
              >
                {tab.label}
                {tab.key === "open" && prs.length > 0 && activeFilter === "open" && (
                  <span className="ml-1.5 text-xs text-[#71717a]">({prs.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-[#71717a]" />
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as PRSort)}
              className="bg-[#18181b] border border-[#27272a] rounded-md px-2 py-1.5 text-sm text-[#a1a1aa] focus:outline-none focus:border-[#3f3f46]"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && prs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#f97316] animate-spin mx-auto mb-3" />
              <p className="text-[#71717a]">Loading pull requests...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-[#fafafa] font-medium mb-2">Failed to load pull requests</h3>
              <p className="text-[#71717a] text-sm mb-4">{error}</p>
              <button
                onClick={loadPRs}
                className="px-4 py-2 bg-[#27272a] text-[#fafafa] rounded-lg hover:bg-[#3f3f46] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : prs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#22c55e]" />
              </div>
              <h3 className="text-[#fafafa] font-medium mb-2">
                {activeFilter === "open"
                  ? "No open pull requests"
                  : activeFilter === "closed"
                  ? "No closed pull requests"
                  : "No pull requests"}
              </h3>
              <p className="text-[#71717a] text-sm">
                {activeFilter === "open"
                  ? "All pull requests have been merged or closed."
                  : "This repository has no pull requests matching the filter."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {prs.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                ciStatus={getCIStatus(pr)}
                onSync={onSyncToKanban ? () => handleSyncPR(pr) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GitHubPRsView
