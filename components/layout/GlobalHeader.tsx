"use client"

import { useState, useRef, useEffect } from "react"
import classNames from "classnames"
import {
  Search,
  Settings,
  Plus,
  Bot,
  ListTodo,
  FolderPlus,
  User,
  ChevronDown,
  Zap,
  Activity,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

interface GlobalHeaderProps {
  connected: boolean
  currentModel?: string | null
  onOpenSettings: () => void
  onSpawnAgent?: () => void
  onNewTask?: () => void
  onNewProject?: () => void
  onSearch?: (query: string) => void
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  shortcut?: string
}

export function GlobalHeader({
  connected,
  currentModel,
  onOpenSettings,
  onSpawnAgent,
  onNewTask,
  onNewProject,
  onSearch,
}: GlobalHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const quickActionsRef = useRef<HTMLDivElement>(null)

  const quickActions: QuickAction[] = [
    {
      id: "spawn-agent",
      label: "Spawn Agent",
      icon: <Bot className="w-4 h-4" />,
      onClick: () => {
        onSpawnAgent?.()
        setQuickActionsOpen(false)
      },
      shortcut: "Ctrl+Shift+A",
    },
    {
      id: "new-task",
      label: "New Task",
      icon: <ListTodo className="w-4 h-4" />,
      onClick: () => {
        onNewTask?.()
        setQuickActionsOpen(false)
      },
      shortcut: "Ctrl+Shift+T",
    },
    {
      id: "new-project",
      label: "New Project",
      icon: <FolderPlus className="w-4 h-4" />,
      onClick: () => {
        onNewProject?.()
        setQuickActionsOpen(false)
      },
      shortcut: "Ctrl+Shift+P",
    },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Global search: Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        document.getElementById("global-search")?.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim())
    }
  }

  return (
    <header className="h-14 bg-theme-900 border-b border-theme-800 shrink-0">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Logo and branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-theme-500 to-theme-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">MoltBot</span>
          </div>
          <StatusBadge online={connected} />
        </div>

        {/* Center: Global search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-4">
          <div
            className={classNames(
              "relative rounded-lg border transition-all",
              searchFocused
                ? "border-theme-500 bg-theme-800"
                : "border-theme-700 bg-theme-800/50 hover:border-theme-600"
            )}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-500" />
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search tasks, projects, agents..."
              className="w-full bg-transparent pl-10 pr-16 py-2 text-sm text-white placeholder-theme-500 outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-theme-600 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-theme-700 rounded text-theme-400">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-theme-700 rounded text-theme-400">K</kbd>
            </div>
          </div>
        </form>

        {/* Right: Status, quick actions, settings, user */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Current model indicator */}
          {currentModel && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-800/50 border border-theme-700">
              <Activity className="w-4 h-4 text-theme-500" />
              <span className="text-xs text-theme-400">
                Model: <span className="text-theme-300">{currentModel}</span>
              </span>
            </div>
          )}

          {/* Quick actions dropdown */}
          <div className="relative" ref={quickActionsRef}>
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className={classNames(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-theme-500 hover:bg-theme-600 text-white"
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Actions</span>
              <ChevronDown
                className={classNames(
                  "w-4 h-4 transition-transform",
                  quickActionsOpen && "rotate-180"
                )}
              />
            </button>

            {quickActionsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-theme-800 border border-theme-700 rounded-lg shadow-lg overflow-hidden z-50">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-theme-300 hover:bg-theme-700 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      {action.icon}
                      {action.label}
                    </span>
                    {action.shortcut && (
                      <span className="text-xs text-theme-600">{action.shortcut}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-theme-400 hover:text-white hover:bg-theme-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User avatar placeholder */}
          <button className="w-8 h-8 rounded-full bg-theme-700 hover:bg-theme-600 transition-colors flex items-center justify-center">
            <User className="w-4 h-4 text-theme-400" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default GlobalHeader
