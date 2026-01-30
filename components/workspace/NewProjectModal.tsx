"use client"

import * as Dialog from "@radix-ui/react-dialog"
import * as Select from "@radix-ui/react-select"
import classNames from "classnames"
import {
  Check,
  ChevronDown,
  FolderOpen,
  GitBranch,
  Loader2,
  Sparkles,
  X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/Button"
import type { Project } from "./ProjectSidebar"

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (project: Partial<Project>) => void
}

const modelOptions = [
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
]

const colorOptions = [
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#6072a1", label: "Theme" },
]

export function NewProjectModal({ open, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [path, setPath] = useState("")
  const [gitUrl, setGitUrl] = useState("")
  const [model, setModel] = useState("claude-3-sonnet")
  const [color, setColor] = useState("#3b82f6")
  const [autoAssign, setAutoAssign] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setDescription("")
    setPath("")
    setGitUrl("")
    setModel("claude-3-sonnet")
    setColor("#3b82f6")
    setAutoAssign(true)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    setIsCreating(true)

    try {
      // Simulate async operation (clone repo, create workspace files, etc.)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const projectData: Partial<Project> = {
        name: name.trim(),
        description: description.trim() || undefined,
        path: path.trim() || undefined,
        gitUrl: gitUrl.trim() || undefined,
        model,
        color,
        autoAssign,
      }

      onSubmit(projectData)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  const handleBrowsePath = () => {
    // In a real implementation, this would open a file picker
    // For now, we'll just set a placeholder path
    setPath("/home/user/projects/new-project")
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-theme-800 border border-theme-700 rounded-xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-theme-700">
            <Dialog.Title className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-theme-400" />
              New Project
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-theme-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-1.5">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this project..."
                rows={2}
                className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Path */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-1.5">
                Project Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/path/to/project"
                  className="flex-1 px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBrowsePath}
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-theme-500 mt-1">
                Local directory where project files are stored
              </p>
            </div>

            {/* Git URL */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  Git Repository URL
                </span>
              </label>
              <input
                type="text"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="w-full px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-white placeholder-theme-600 text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              />
              <p className="text-xs text-theme-500 mt-1">
                Optional. Link to existing repo or clone a new one
              </p>
            </div>

            {/* Model & Color row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-1.5">
                  Default Model
                </label>
                <Select.Root value={model} onValueChange={setModel}>
                  <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 bg-theme-900 border border-theme-700 rounded-lg text-sm text-white hover:bg-theme-800 transition-colors outline-none focus:ring-2 focus:ring-theme-500">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="w-4 h-4 text-theme-400" />
                    </Select.Icon>
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Content
                      className="bg-theme-800 border border-theme-700 rounded-lg shadow-xl overflow-hidden z-[60]"
                      position="popper"
                      sideOffset={4}
                    >
                      <Select.Viewport className="p-1">
                        {modelOptions.map((m) => (
                          <Select.Item
                            key={m.id}
                            value={m.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 rounded cursor-pointer outline-none data-[highlighted]:bg-theme-700 data-[highlighted]:text-white"
                          >
                            <Select.ItemIndicator className="w-4">
                              <Check className="w-4 h-4 text-theme-400" />
                            </Select.ItemIndicator>
                            <Select.ItemText>{m.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-1.5">
                  Color
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-theme-900 border border-theme-700 rounded-lg">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={classNames(
                        "w-6 h-6 rounded-full transition-all",
                        color === c.value && "ring-2 ring-white ring-offset-2 ring-offset-theme-900"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-assign toggle */}
            <div className="flex items-center justify-between p-3 bg-theme-900 border border-theme-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Auto-assign agents</p>
                <p className="text-xs text-theme-500">
                  Automatically assign available agents to new tasks
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoAssign(!autoAssign)}
                className={classNames(
                  "relative w-11 h-6 rounded-full transition-colors",
                  autoAssign ? "bg-theme-500" : "bg-theme-700"
                )}
              >
                <span
                  className={classNames(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    autoAssign ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default NewProjectModal
