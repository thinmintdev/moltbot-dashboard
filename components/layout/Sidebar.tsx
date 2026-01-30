"use client"

import { useEffect, useCallback } from "react"
import classNames from "classnames"
import {
  LayoutGrid,
  Terminal,
  Sparkles,
  Map,
  Lightbulb,
  FileText,
  BookOpen,
  Wrench,
  GitBranch,
  CircleDot,
  GitPullRequest,
  Settings,
  HelpCircle,
  Plus,
  Zap,
} from "lucide-react"

export type NavigationView =
  | "kanban"
  | "terminals"
  | "insights"
  | "roadmap"
  | "ideation"
  | "changelog"
  | "context"
  | "mcp"
  | "worktrees"
  | "issues"
  | "prs"
  | "settings"

interface NavItem {
  id: NavigationView
  label: string
  icon: React.ReactNode
  shortcut: string
}

const navItems: NavItem[] = [
  { id: "kanban", label: "Kanban Board", icon: <LayoutGrid className="w-4 h-4" />, shortcut: "K" },
  { id: "terminals", label: "Agent Terminals", icon: <Terminal className="w-4 h-4" />, shortcut: "A" },
  { id: "insights", label: "Insights", icon: <Sparkles className="w-4 h-4" />, shortcut: "N" },
  { id: "roadmap", label: "Roadmap", icon: <Map className="w-4 h-4" />, shortcut: "D" },
  { id: "ideation", label: "Ideation", icon: <Lightbulb className="w-4 h-4" />, shortcut: "I" },
  { id: "changelog", label: "Changelog", icon: <FileText className="w-4 h-4" />, shortcut: "L" },
  { id: "context", label: "Context", icon: <BookOpen className="w-4 h-4" />, shortcut: "C" },
  { id: "mcp", label: "MCP Overview", icon: <Wrench className="w-4 h-4" />, shortcut: "M" },
  { id: "worktrees", label: "Worktrees", icon: <GitBranch className="w-4 h-4" />, shortcut: "W" },
  { id: "issues", label: "GitHub Issues", icon: <CircleDot className="w-4 h-4" />, shortcut: "G" },
  { id: "prs", label: "GitHub PRs", icon: <GitPullRequest className="w-4 h-4" />, shortcut: "P" },
]

interface SidebarProps {
  activeView: NavigationView
  onViewChange: (view: NavigationView) => void
  onNewTask: () => void
  onOpenSettings: () => void
  hasUpdate?: boolean
  version?: string
}

export function Sidebar({
  activeView,
  onViewChange,
  onNewTask,
  onOpenSettings,
  hasUpdate = false,
  version = "1.0.0",
}: SidebarProps) {
  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return
      }

      const key = event.key.toUpperCase()
      const navItem = navItems.find((item) => item.shortcut === key)

      if (navItem) {
        event.preventDefault()
        onViewChange(navItem.id)
      }

      // S for settings
      if (key === "S") {
        event.preventDefault()
        onOpenSettings()
      }

      // T for new task
      if (key === "T") {
        event.preventDefault()
        onNewTask()
      }
    },
    [onViewChange, onOpenSettings, onNewTask]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="w-[240px] h-full bg-[#111113] border-r border-[#27272a] flex flex-col">
      {/* Branding */}
      <div className="p-4 border-b border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#ca8a04] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0a0a0b]" />
          </div>
          <div>
            <h1 className="text-[#fafafa] font-semibold text-lg leading-tight">MoltBot</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Project section header */}
        <div className="px-4 mb-2">
          <span className="text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">
            Project
          </span>
        </div>

        {/* Navigation items */}
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={classNames(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors group",
                activeView === item.id
                  ? "bg-[#ef4444]/10 text-[#ef4444]"
                  : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa]"
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={classNames(
                    activeView === item.id ? "text-[#ef4444]" : "text-[#71717a] group-hover:text-[#a1a1aa]"
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </span>
              <span
                className={classNames(
                  "text-xs font-mono",
                  activeView === item.id ? "text-[#ef4444]/60" : "text-[#52525b]"
                )}
              >
                {item.shortcut}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="border-t border-[#27272a] p-3 space-y-2">
        {/* MoltBot status with update badge */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa] transition-colors"
        >
          <span className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-[#71717a]" />
            <span>MoltBot</span>
          </span>
          {hasUpdate ? (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#ef4444] text-[#0a0a0b]">
              Update
            </span>
          ) : (
            <span className="text-xs text-[#52525b]">v{version}</span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa] transition-colors"
        >
          <Settings className="w-4 h-4 text-[#71717a]" />
          <span>Settings</span>
          <HelpCircle className="w-3.5 h-3.5 text-[#52525b] ml-auto" />
        </button>

        {/* New Task button */}
        <button
          onClick={onNewTask}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium bg-[#ef4444] text-[#0a0a0b] hover:bg-[#ca8a04] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
