"use client"

import { formatDistanceToNow } from "date-fns"
import classNames from "classnames"
import {
  GitBranch,
  Lock,
  Unlock,
  Terminal,
  Trash2,
  FolderOpen,
  Clock,
  MoreHorizontal,
} from "lucide-react"
import { useState } from "react"
import type { Worktree } from "@/lib/stores/worktree-store"

// ============================================================================
// Types
// ============================================================================

interface WorktreeCardProps {
  worktree: Worktree
  onOpenTerminal?: (worktree: Worktree) => void
  onLock?: (id: string) => void
  onUnlock?: (id: string) => void
  onDelete?: (id: string) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

function getBranchType(branch: string): { type: string; color: string; bgColor: string; borderColor: string } {
  if (branch === 'main' || branch === 'master') {
    return {
      type: 'Main',
      color: '#22c55e',
      bgColor: 'bg-[#22c55e]/10',
      borderColor: 'border-[#22c55e]/30',
    }
  }
  if (branch.startsWith('feature/')) {
    return {
      type: 'Feature',
      color: '#3b82f6',
      bgColor: 'bg-[#3b82f6]/10',
      borderColor: 'border-[#3b82f6]/30',
    }
  }
  if (branch.startsWith('bugfix/') || branch.startsWith('fix/')) {
    return {
      type: 'Bugfix',
      color: '#f97316',
      bgColor: 'bg-[#f97316]/10',
      borderColor: 'border-[#f97316]/30',
    }
  }
  if (branch.startsWith('hotfix/')) {
    return {
      type: 'Hotfix',
      color: '#ef4444',
      bgColor: 'bg-[#ef4444]/10',
      borderColor: 'border-[#ef4444]/30',
    }
  }
  if (branch.startsWith('release/')) {
    return {
      type: 'Release',
      color: '#a855f7',
      bgColor: 'bg-[#a855f7]/10',
      borderColor: 'border-[#a855f7]/30',
    }
  }
  return {
    type: 'Branch',
    color: '#71717a',
    bgColor: 'bg-[#71717a]/10',
    borderColor: 'border-[#71717a]/30',
  }
}

function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path
  const parts = path.split('/')
  const filename = parts.pop() || ''
  const remaining = maxLength - filename.length - 4 // 4 for ".../"
  if (remaining <= 0) return '.../' + filename
  let prefix = parts.join('/')
  if (prefix.length > remaining) {
    prefix = prefix.substring(0, remaining) + '...'
  }
  return prefix + '/' + filename
}

// ============================================================================
// Component
// ============================================================================

export function WorktreeCard({
  worktree,
  onOpenTerminal,
  onLock,
  onUnlock,
  onDelete,
}: WorktreeCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const branchConfig = getBranchType(worktree.branch)
  const truncatedPath = truncatePath(worktree.path)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showDeleteConfirm) {
      onDelete?.(worktree.id)
      setShowDeleteConfirm(false)
      setShowMenu(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const handleOpenTerminal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onOpenTerminal?.(worktree)
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    if (worktree.isLocked) {
      onUnlock?.(worktree.id)
    } else {
      onLock?.(worktree.id)
    }
  }

  return (
    <div
      className={classNames(
        "bg-[#18181b] border rounded-lg overflow-hidden transition-all hover:border-[#3f3f46]",
        worktree.isMain && "border-[#22c55e]/30",
        worktree.isLocked && !worktree.isMain && "border-[#f97316]/30",
        !worktree.isMain && !worktree.isLocked && "border-[#27272a]"
      )}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Branch icon and content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Branch Icon */}
            <div
              className={classNames(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                branchConfig.bgColor
              )}
            >
              <GitBranch
                size={20}
                style={{ color: branchConfig.color }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Branch Name */}
              <div className="flex items-center gap-2">
                <h3 className="text-[#fafafa] font-medium text-sm truncate font-mono">
                  {worktree.branch}
                </h3>
                {worktree.isLocked && (
                  <Lock size={14} className="text-[#f97316] shrink-0" />
                )}
              </div>

              {/* Path with tooltip */}
              <div className="mt-1 group relative">
                <div className="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <FolderOpen size={12} />
                  <span className="truncate" title={worktree.path}>
                    {truncatedPath}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Badges and menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Branch Type Badge */}
            <span
              className={classNames(
                "px-2 py-0.5 rounded text-xs font-medium",
                branchConfig.bgColor,
                `border ${branchConfig.borderColor}`
              )}
              style={{ color: branchConfig.color }}
            >
              {branchConfig.type}
            </span>

            {/* Lock Badge */}
            {worktree.isLocked && (
              <span
                className="px-2 py-0.5 rounded text-xs font-medium bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30"
              >
                Locked
              </span>
            )}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                  setShowDeleteConfirm(false)
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
                      setShowDeleteConfirm(false)
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-[#18181b] border border-[#27272a] rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={handleOpenTerminal}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                    >
                      <Terminal size={14} />
                      Open Terminal
                    </button>
                    <button
                      onClick={handleToggleLock}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                    >
                      {worktree.isLocked ? (
                        <>
                          <Unlock size={14} />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Lock
                        </>
                      )}
                    </button>
                    {!worktree.isMain && (
                      <button
                        onClick={handleDelete}
                        className={classNames(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-sm",
                          showDeleteConfirm
                            ? "bg-[#ef4444]/10 text-[#ef4444]"
                            : "text-[#ef4444] hover:bg-[#ef4444]/10"
                        )}
                      >
                        <Trash2 size={14} />
                        {showDeleteConfirm ? "Confirm Delete" : "Delete"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Last Accessed */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#27272a]">
          <div className="flex items-center gap-1.5 text-xs text-[#52525b]">
            <Clock size={12} />
            <span>
              Last accessed {formatDistanceToNow(new Date(worktree.lastAccessed))} ago
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={handleOpenTerminal}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#fafafa] transition-colors"
        >
          <Terminal size={14} />
          Terminal
        </button>
        <button
          onClick={handleToggleLock}
          className={classNames(
            "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors",
            worktree.isLocked
              ? "bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20"
              : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#fafafa]"
          )}
        >
          {worktree.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          {worktree.isLocked ? "Unlock" : "Lock"}
        </button>
      </div>
    </div>
  )
}

export default WorktreeCard
