"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Select from "@radix-ui/react-select"
import classNames from "classnames"
import { formatDistanceToNow } from "date-fns"
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Settings,
  Target,
  Archive,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { Project } from "./ProjectSidebar"

interface Model {
  id: string
  name: string
}

interface ProjectHeaderProps {
  project: Project
  models: Model[]
  onToggleStatus: () => void
  onModelChange: (model: string) => void
  onNameChange: (name: string) => void
  onOpenSettings: () => void
}

const statusConfig = {
  active: {
    icon: <Play className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    label: "Active",
    toggleIcon: <Pause className="w-4 h-4" />,
    toggleLabel: "Pause Project",
  },
  paused: {
    icon: <Pause className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    label: "Paused",
    toggleIcon: <Play className="w-4 h-4" />,
    toggleLabel: "Resume Project",
  },
  completed: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    label: "Completed",
    toggleIcon: <Play className="w-4 h-4" />,
    toggleLabel: "Reopen Project",
  },
  archived: {
    icon: <Archive className="w-3.5 h-3.5" />,
    color: "text-theme-500",
    bg: "bg-theme-500/20",
    border: "border-theme-500/30",
    label: "Archived",
    toggleIcon: <Play className="w-4 h-4" />,
    toggleLabel: "Unarchive Project",
  },
}

export function ProjectHeader({
  project,
  models,
  onToggleStatus,
  onModelChange,
  onNameChange,
  onOpenSettings,
}: ProjectHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(project.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const status = statusConfig[project.status]
  const lastActivity = formatDistanceToNow(new Date(project.stats.lastActivity), {
    addSuffix: true,
  })

  const taskProgress =
    project.stats.totalTasks > 0
      ? Math.round((project.stats.completedTasks / project.stats.totalTasks) * 100)
      : 0

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  useEffect(() => {
    setEditedName(project.name)
  }, [project.name])

  const handleNameSubmit = () => {
    if (editedName.trim() && editedName !== project.name) {
      onNameChange(editedName.trim())
    } else {
      setEditedName(project.name)
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit()
    } else if (e.key === "Escape") {
      setEditedName(project.name)
      setIsEditingName(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-between px-4 py-2 min-w-0">
      {/* Left section - Project info */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Project color indicator */}
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: project.color }}
        />

        {/* Project name (editable) */}
        <div className="min-w-0">
          {isEditingName ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              className="text-lg font-semibold text-white bg-transparent border-b-2 border-theme-500 outline-none px-1 -ml-1"
              style={{ width: `${Math.max(editedName.length, 10)}ch` }}
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="group flex items-center gap-2 text-lg font-semibold text-white hover:text-theme-300 transition-colors"
            >
              <span className="truncate max-w-[300px]">{project.name}</span>
              <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Status badge */}
        <button
          onClick={onToggleStatus}
          className={classNames(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105",
            status.bg,
            status.border,
            status.color
          )}
          title={status.toggleLabel}
        >
          {status.icon}
          {status.label}
        </button>

        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-4 text-sm text-theme-400">
          <div className="flex items-center gap-1.5" title="Tasks completed">
            <Target className="w-4 h-4" />
            <span>
              {project.stats.completedTasks}/{project.stats.totalTasks}
            </span>
            <div className="w-16 h-1.5 bg-theme-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-theme-500 rounded-full transition-all"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5" title="Active agents">
            <Bot className="w-4 h-4" />
            <span>{project.stats.activeAgents} active</span>
          </div>

          <div className="flex items-center gap-1.5" title="Last activity">
            <Clock className="w-4 h-4" />
            <span>{lastActivity}</span>
          </div>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Model selector */}
        <Select.Root value={project.model} onValueChange={onModelChange}>
          <Select.Trigger className="flex items-center gap-2 px-3 py-1.5 bg-theme-800 border border-theme-700 rounded-lg text-sm text-white hover:bg-theme-700 transition-colors outline-none">
            <Select.Value />
            <Select.Icon>
              <ChevronDown className="w-4 h-4 text-theme-400" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="bg-theme-800 border border-theme-700 rounded-lg shadow-xl overflow-hidden z-50"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport className="p-1">
                {models.map((model) => (
                  <Select.Item
                    key={model.id}
                    value={model.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 rounded cursor-pointer outline-none data-[highlighted]:bg-theme-700 data-[highlighted]:text-white"
                  >
                    <Select.ItemIndicator>
                      <Check className="w-4 h-4 text-theme-400" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{model.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Play/Pause button */}
        <button
          onClick={onToggleStatus}
          className={classNames(
            "p-2 rounded-lg transition-colors",
            project.status === "active"
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          )}
          title={status.toggleLabel}
        >
          {status.toggleIcon}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
          title="Project Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* More menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[180px] bg-theme-800 border border-theme-700 rounded-lg shadow-xl py-1 z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 cursor-pointer outline-none"
                onClick={() => navigator.clipboard.writeText(project.path || "")}
              >
                <Copy className="w-4 h-4" />
                Copy Path
              </DropdownMenu.Item>

              {project.gitUrl && (
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 cursor-pointer outline-none"
                  onClick={() => window.open(project.gitUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Repository
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="my-1 border-t border-theme-700" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 cursor-pointer outline-none"
                onClick={onOpenSettings}
              >
                <Settings className="w-4 h-4" />
                Project Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 border-t border-theme-700" />

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 cursor-pointer outline-none">
                <Archive className="w-4 h-4" />
                Archive Project
              </DropdownMenu.Item>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-theme-700 cursor-pointer outline-none">
                <Trash2 className="w-4 h-4" />
                Delete Project
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}

export default ProjectHeader
