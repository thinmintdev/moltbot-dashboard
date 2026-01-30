"use client"

import { useState } from "react"
import { X, FolderOpen, Github, ChevronRight, AlertCircle } from "lucide-react"
import classNames from "classnames"

interface ProjectCreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (project: ProjectData) => void
}

export interface ProjectData {
  name: string
  description?: string
  color: string
  sourceType: "local" | "github"
  localPath?: string
  githubRepo?: string
  githubOwner?: string
}

const colorOptions = [
  { id: "red", value: "#ef4444", label: "Red" },
  { id: "orange", value: "#f97316", label: "Orange" },
  { id: "yellow", value: "#fbbf24", label: "Yellow" },
  { id: "green", value: "#22c55e", label: "Green" },
  { id: "blue", value: "#3b82f6", label: "Blue" },
  { id: "purple", value: "#a855f7", label: "Purple" },
  { id: "pink", value: "#ec4899", label: "Pink" },
]

export function ProjectCreateModal({ open, onClose, onSubmit }: ProjectCreateModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#ef4444")
  const [sourceType, setSourceType] = useState<"local" | "github" | null>(null)
  const [localPath, setLocalPath] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [githubOwner, setGithubOwner] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Project name is required"
    }

    if (!sourceType) {
      newErrors.sourceType = "Please select a source type (Local Directory or GitHub)"
    } else if (sourceType === "local" && !localPath.trim()) {
      newErrors.localPath = "Local path is required"
    } else if (sourceType === "github") {
      if (!githubOwner.trim()) {
        newErrors.githubOwner = "GitHub owner/org is required"
      }
      if (!githubRepo.trim()) {
        newErrors.githubRepo = "Repository name is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      sourceType: sourceType!,
      localPath: sourceType === "local" ? localPath.trim() : undefined,
      githubRepo: sourceType === "github" ? githubRepo.trim() : undefined,
      githubOwner: sourceType === "github" ? githubOwner.trim() : undefined,
    })

    // Reset form
    setName("")
    setDescription("")
    setColor("#ef4444")
    setSourceType(null)
    setLocalPath("")
    setGithubRepo("")
    setGithubOwner("")
    setErrors({})
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#111113] border border-[#27272a] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <h2 className="text-lg font-semibold text-[#fafafa]">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
              Project Name <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className={classNames(
                "w-full px-3 py-2 bg-[#18181b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 transition-colors",
                errors.name ? "border-[#ef4444]" : "border-[#27272a]"
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your project"
              rows={2}
              className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 transition-colors resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={classNames(
                    "w-8 h-8 rounded-full transition-all",
                    color === opt.value
                      ? "ring-2 ring-offset-2 ring-offset-[#111113] ring-white scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* Source Type Selection - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Project Source <span className="text-[#ef4444]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Local Directory */}
              <button
                type="button"
                onClick={() => setSourceType("local")}
                className={classNames(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                  sourceType === "local"
                    ? "border-[#f97316] bg-[#f97316]/10 text-[#f97316]"
                    : "border-[#27272a] bg-[#18181b] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]"
                )}
              >
                <FolderOpen size={24} />
                <span className="text-sm font-medium">Local Directory</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => setSourceType("github")}
                className={classNames(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                  sourceType === "github"
                    ? "border-[#f97316] bg-[#f97316]/10 text-[#f97316]"
                    : "border-[#27272a] bg-[#18181b] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]"
                )}
              >
                <Github size={24} />
                <span className="text-sm font-medium">GitHub Repository</span>
              </button>
            </div>
            {errors.sourceType && (
              <p className="mt-2 text-xs text-[#ef4444] flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.sourceType}
              </p>
            )}
          </div>

          {/* Local Path Input */}
          {sourceType === "local" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                Local Path <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/home/user/repos/my-project"
                className={classNames(
                  "w-full px-3 py-2 bg-[#18181b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 transition-colors font-mono text-sm",
                  errors.localPath ? "border-[#ef4444]" : "border-[#27272a]"
                )}
              />
              {errors.localPath && (
                <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.localPath}
                </p>
              )}
              <p className="mt-1.5 text-xs text-[#52525b]">
                Enter the full path to your local project directory
              </p>
            </div>
          )}

          {/* GitHub Inputs */}
          {sourceType === "github" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Owner / Organization <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  placeholder="username or org-name"
                  className={classNames(
                    "w-full px-3 py-2 bg-[#18181b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 transition-colors",
                    errors.githubOwner ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                />
                {errors.githubOwner && (
                  <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.githubOwner}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                  Repository Name <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="my-repo"
                  className={classNames(
                    "w-full px-3 py-2 bg-[#18181b] border rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 transition-colors",
                    errors.githubRepo ? "border-[#ef4444]" : "border-[#27272a]"
                  )}
                />
                {errors.githubRepo && (
                  <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.githubRepo}
                  </p>
                )}
              </div>
              <p className="text-xs text-[#52525b]">
                The repository will be cloned or linked: github.com/{githubOwner || "owner"}/{githubRepo || "repo"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-lg shadow-[#ef4444]/25 transition-all"
            >
              Create Project
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectCreateModal
