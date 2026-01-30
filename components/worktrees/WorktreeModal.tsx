"use client"

import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import { X, GitBranch, FolderOpen, AlertCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "../ui/Button"
import type { Worktree } from "@/lib/stores/worktree-store"

// ============================================================================
// Types
// ============================================================================

interface WorktreeModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (worktree: Omit<Worktree, 'id' | 'lastAccessed'>) => void
  projectId: string
  existingWorktrees: Worktree[]
  projectPath?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function isValidBranchName(name: string): boolean {
  // Git branch name rules:
  // - Cannot start with dot
  // - Cannot contain consecutive dots, spaces, ~, ^, :, \, ?, *, [
  // - Cannot end with .lock
  // - Cannot contain @{
  if (!name || name.length === 0) return false
  if (name.startsWith('.')) return false
  if (name.endsWith('.lock')) return false
  if (name.includes('..')) return false
  if (name.includes('@{')) return false
  if (/[\s~^:?*\[\]\\]/.test(name)) return false
  if (name.startsWith('-')) return false
  return true
}

function generateWorktreePath(basePath: string, branchName: string): string {
  // Convert branch name to folder-safe format
  const safeName = branchName.replace(/\//g, '-')
  const baseDir = basePath.replace(/\/[^/]+$/, '') // Remove last segment
  return `${baseDir}/${basePath.split('/').pop()}-${safeName}`
}

// ============================================================================
// Component
// ============================================================================

export function WorktreeModal({
  open,
  onClose,
  onSubmit,
  projectId,
  existingWorktrees,
  projectPath = '/mnt/dev/repos/project',
}: WorktreeModalProps) {
  const [branchName, setBranchName] = useState("")
  const [baseBranch, setBaseBranch] = useState("main")
  const [customPath, setCustomPath] = useState("")
  const [useCustomPath, setUseCustomPath] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get existing branches from worktrees
  const existingBranches = useMemo(() => {
    return existingWorktrees.map((w) => w.branch)
  }, [existingWorktrees])

  // Auto-generate path suggestion
  const suggestedPath = useMemo(() => {
    if (!branchName) return ''
    return generateWorktreePath(projectPath, branchName)
  }, [projectPath, branchName])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setBranchName("")
      setBaseBranch("main")
      setCustomPath("")
      setUseCustomPath(false)
      setErrors({})
    }
  }, [open])

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Branch name validation
    if (!branchName.trim()) {
      newErrors.branchName = "Branch name is required"
    } else if (!isValidBranchName(branchName.trim())) {
      newErrors.branchName = "Invalid branch name. Cannot contain spaces, ~, ^, :, ?, *, [, or \\"
    } else if (existingBranches.includes(branchName.trim())) {
      newErrors.branchName = "A worktree for this branch already exists"
    }

    // Path validation
    const pathToUse = useCustomPath ? customPath : suggestedPath
    if (!pathToUse) {
      newErrors.path = "Path is required"
    } else if (existingWorktrees.some((w) => w.path === pathToUse)) {
      newErrors.path = "A worktree already exists at this path"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const pathToUse = useCustomPath ? customPath.trim() : suggestedPath

    onSubmit({
      path: pathToUse,
      branch: branchName.trim(),
      isMain: false,
      isBare: false,
      isLocked: false,
      projectId,
    })

    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#18181b] rounded-xl border border-[#27272a] w-full max-w-lg max-h-[90vh] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#27272a] shrink-0">
            <Dialog.Title className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#f97316]" />
              Create New Worktree
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
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Branch Name <span className="text-[#ef4444]">*</span>
                </label>
                <div className="relative">
                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="feature/my-feature"
                    className={classNames(
                      "w-full pl-10 pr-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 font-mono text-sm",
                      errors.branchName ? "border-[#ef4444]" : "border-[#27272a]"
                    )}
                  />
                </div>
                {errors.branchName ? (
                  <p className="text-[#ef4444] text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.branchName}
                  </p>
                ) : (
                  <p className="text-[#52525b] text-xs mt-1">
                    Use prefixes like feature/, bugfix/, hotfix/, release/
                  </p>
                )}
              </div>

              {/* Base Branch */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Base Branch
                </label>
                <select
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                >
                  {existingBranches.length > 0 ? (
                    existingBranches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="main">main</option>
                      <option value="master">master</option>
                      <option value="develop">develop</option>
                    </>
                  )}
                </select>
                <p className="text-[#52525b] text-xs mt-1">
                  The new worktree will be created from this branch
                </p>
              </div>

              {/* Path */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-[#a1a1aa]">
                    Worktree Path <span className="text-[#ef4444]">*</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#71717a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomPath}
                      onChange={(e) => setUseCustomPath(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#27272a] bg-[#0a0a0b] text-[#f97316] focus:ring-[#f97316]/50"
                    />
                    Custom path
                  </label>
                </div>
                {useCustomPath ? (
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                    <input
                      type="text"
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      placeholder="/path/to/worktree"
                      className={classNames(
                        "w-full pl-10 pr-3 py-2 bg-[#0a0a0b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 font-mono text-sm",
                        errors.path ? "border-[#ef4444]" : "border-[#27272a]"
                      )}
                    />
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#52525b] shrink-0" />
                      <span className="text-[#a1a1aa] font-mono text-sm truncate">
                        {suggestedPath || 'Enter branch name to generate path'}
                      </span>
                    </div>
                  </div>
                )}
                {errors.path && (
                  <p className="text-[#ef4444] text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.path}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-[#f97316]/5 border border-[#f97316]/20 rounded-lg p-3">
                <p className="text-xs text-[#a1a1aa]">
                  <span className="font-medium text-[#f97316]">Note:</span> Creating a worktree will
                  create a new directory at the specified path with a checkout of the branch. This
                  allows parallel development without stashing or committing changes.
                </p>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
            >
              <GitBranch size={16} />
              Create Worktree
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default WorktreeModal
