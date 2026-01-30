"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  GitBranch,
  Plus,
  RefreshCw,
  Filter,
  FolderTree,
  Lock,
  Terminal,
} from "lucide-react"
import { WorktreeCard } from "./WorktreeCard"
import { WorktreeModal } from "./WorktreeModal"
import {
  useWorktreeStore,
  useProjectWorktrees,
  useWorktreeStats,
  type Worktree,
} from "@/lib/stores/worktree-store"

// ============================================================================
// Types
// ============================================================================

interface WorktreesViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string; path?: string }[]
}

type FilterType = "all" | "main" | "feature" | "bugfix" | "locked"

// ============================================================================
// Main Component
// ============================================================================

export function WorktreesView({
  projectId,
  projectName,
  projects = [],
}: WorktreesViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")

  // Store actions
  const addWorktree = useWorktreeStore((s) => s.addWorktree)
  const removeWorktree = useWorktreeStore((s) => s.removeWorktree)
  const lockWorktree = useWorktreeStore((s) => s.lockWorktree)
  const unlockWorktree = useWorktreeStore((s) => s.unlockWorktree)
  const updateLastAccessed = useWorktreeStore((s) => s.updateLastAccessed)

  // Get project worktrees and stats
  const worktrees = useProjectWorktrees(projectId)
  const stats = useWorktreeStats(projectId)

  // Get project path for generating worktree paths
  const currentProject = projects.find((p) => p.id === projectId)
  const projectPath = currentProject?.path || '/mnt/dev/repos/project'

  // Filter worktrees
  const filteredWorktrees = useMemo(() => {
    switch (filter) {
      case "main":
        return worktrees.filter((w) => w.isMain)
      case "feature":
        return worktrees.filter((w) => w.branch.startsWith("feature/"))
      case "bugfix":
        return worktrees.filter(
          (w) => w.branch.startsWith("bugfix/") || w.branch.startsWith("fix/")
        )
      case "locked":
        return worktrees.filter((w) => w.isLocked)
      default:
        return worktrees
    }
  }, [worktrees, filter])

  // Sort worktrees: main first, then by last accessed
  const sortedWorktrees = useMemo(() => {
    return [...filteredWorktrees].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1
      if (!a.isMain && b.isMain) return 1
      return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    })
  }, [filteredWorktrees])

  // Handlers
  const handleAddWorktree = () => {
    setShowModal(true)
  }

  const handleCreateWorktree = (data: Omit<Worktree, 'id' | 'lastAccessed'>) => {
    addWorktree(data)
    setShowModal(false)
  }

  const handleOpenTerminal = (worktree: Worktree) => {
    updateLastAccessed(worktree.id)
    // In a real app, this would open a terminal at the worktree path
    console.log(`Opening terminal at: ${worktree.path}`)
  }

  const handleLock = (id: string) => {
    lockWorktree(id)
  }

  const handleUnlock = (id: string) => {
    unlockWorktree(id)
  }

  const handleDelete = (id: string) => {
    removeWorktree(id)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Empty state when no project selected
  if (!projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#0a0a0b]">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
          <GitBranch className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">Select a Project</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Choose a project from the tabs above to view and manage its Git worktrees.
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
            <h2 className="text-[#fafafa] text-lg font-semibold">Git Worktrees</h2>
            {projectName && (
              <span className="px-2 py-0.5 bg-[#27272a] text-[#a1a1aa] rounded text-sm">
                {projectName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={classNames(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] border border-[#27272a] transition-colors",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={classNames("w-4 h-4", isRefreshing && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handleAddWorktree}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
            >
              <Plus size={16} />
              New Worktree
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fafafa]">{stats.total}</div>
            <div className="text-xs text-[#71717a]">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{stats.main}</div>
            <div className="text-xs text-[#71717a]">Main</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3b82f6]">{stats.feature}</div>
            <div className="text-xs text-[#71717a]">Feature</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f97316]">{stats.bugfix}</div>
            <div className="text-xs text-[#71717a]">Bugfix</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#ef4444]">{stats.locked}</div>
            <div className="text-xs text-[#71717a]">Locked</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 px-6 py-3 border-b border-[#27272a] flex items-center justify-between">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#52525b]" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
          >
            <option value="all">All Worktrees</option>
            <option value="main">Main Branch</option>
            <option value="feature">Feature Branches</option>
            <option value="bugfix">Bugfix Branches</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-[#52525b]">
          <span className="flex items-center gap-1">
            <FolderTree size={12} />
            {sortedWorktrees.length} worktree{sortedWorktrees.length !== 1 && "s"}
          </span>
          {stats.locked > 0 && (
            <span className="flex items-center gap-1 text-[#f97316]">
              <Lock size={12} />
              {stats.locked} locked
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedWorktrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
              <GitBranch size={32} className="text-[#52525b]" />
            </div>
            <h3 className="text-[#fafafa] font-medium mb-1">No worktrees found</h3>
            <p className="text-[#71717a] text-sm mb-4">
              {filter === "all"
                ? "Create your first worktree to enable parallel development"
                : `No ${filter} worktrees found`}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-sm text-[#f97316] hover:underline"
              >
                Show all worktrees
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedWorktrees.map((worktree) => (
              <WorktreeCard
                key={worktree.id}
                worktree={worktree}
                onOpenTerminal={handleOpenTerminal}
                onLock={handleLock}
                onUnlock={handleUnlock}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Worktree Modal */}
      <WorktreeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateWorktree}
        projectId={projectId}
        existingWorktrees={worktrees}
        projectPath={projectPath}
      />
    </div>
  )
}

export default WorktreesView
