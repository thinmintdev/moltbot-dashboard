"use client"

import { useState, useRef, useEffect } from "react"
import { X, Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
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
  Server,
  Eye,
} from "lucide-react"

export type ViewType =
  | "kanban"
  | "agents"
  | "preview"
  | "insights"
  | "roadmap"
  | "ideation"
  | "changelog"
  | "context"
  | "mcp"
  | "worktrees"
  | "github-issues"
  | "github-prs"
  | "infrastructure"

export interface ViewTab {
  id: string
  type: ViewType
  label: string
}

// View definitions with icons
export const VIEW_DEFINITIONS: Record<ViewType, { label: string; icon: React.ReactNode; shortcut: string; category: "project" | "system" }> = {
  kanban: { label: "Kanban Board", icon: <LayoutGrid size={14} />, shortcut: "K", category: "project" },
  agents: { label: "Agent Terminals", icon: <Terminal size={14} />, shortcut: "A", category: "project" },
  preview: { label: "Preview", icon: <Eye size={14} />, shortcut: "V", category: "project" },
  insights: { label: "Insights", icon: <Sparkles size={14} />, shortcut: "N", category: "project" },
  roadmap: { label: "Roadmap", icon: <Map size={14} />, shortcut: "D", category: "project" },
  ideation: { label: "Ideation", icon: <Lightbulb size={14} />, shortcut: "I", category: "project" },
  changelog: { label: "Changelog", icon: <FileText size={14} />, shortcut: "L", category: "project" },
  context: { label: "Context", icon: <BookOpen size={14} />, shortcut: "C", category: "project" },
  worktrees: { label: "Worktrees", icon: <GitBranch size={14} />, shortcut: "W", category: "project" },
  "github-issues": { label: "GitHub Issues", icon: <CircleDot size={14} />, shortcut: "G", category: "project" },
  "github-prs": { label: "GitHub PRs", icon: <GitPullRequest size={14} />, shortcut: "P", category: "project" },
  mcp: { label: "MCP Overview", icon: <Wrench size={14} />, shortcut: "M", category: "system" },
  infrastructure: { label: "Infrastructure", icon: <Server size={14} />, shortcut: "F", category: "system" },
}

interface ViewTabsProps {
  tabs: ViewTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onAddTab: (type: ViewType) => void
}

export function ViewTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
}: ViewTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Get available views (not already open)
  const openTypes = new Set(tabs.map(t => t.type))
  const availableViews = (Object.entries(VIEW_DEFINITIONS) as [ViewType, typeof VIEW_DEFINITIONS[ViewType]][])
    .filter(([type]) => !openTypes.has(type))

  const projectViews = availableViews.filter(([, def]) => def.category === "project")
  const systemViews = availableViews.filter(([, def]) => def.category === "system")

  // Check scroll state
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      )
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [tabs])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  return (
    <div className="h-9 bg-[#0a0a0b] border-b border-[#27272a] flex items-stretch">
      {/* Scroll left button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="px-2 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex-1 flex items-stretch overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => {
          const viewDef = VIEW_DEFINITIONS[tab.type]
          return (
            <div
              key={tab.id}
              className={classNames(
                "group flex items-center gap-2 px-3 min-w-[100px] max-w-[180px] border-r border-[#27272a] cursor-pointer transition-colors",
                tab.id === activeTabId
                  ? "bg-[#18181b] text-[#fafafa]"
                  : "bg-transparent text-[#71717a] hover:bg-[#111113] hover:text-[#a1a1aa]"
              )}
              onClick={() => onSelectTab(tab.id)}
            >
              {/* View icon */}
              <span className={tab.id === activeTabId ? "text-orange-500" : "text-[#71717a]"}>
                {viewDef?.icon}
              </span>

              {/* Tab name */}
              <span className="flex-1 truncate text-xs font-medium">
                {tab.label}
              </span>

              {/* Close button (visible on hover or when active) */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className={classNames(
                  "p-0.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#fafafa] transition-all",
                  tab.id === activeTabId ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Scroll right button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="px-2 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Add View Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="px-3 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] border-l border-[#27272a] transition-colors flex items-center gap-1"
            title="Add view"
          >
            <Plus className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[220px] bg-[#18181b] border border-[#27272a] rounded-lg p-1 shadow-xl z-50 max-h-[400px] overflow-y-auto"
            sideOffset={5}
            align="end"
          >
            {/* Project Views */}
            {projectViews.length > 0 && (
              <>
                <DropdownMenu.Label className="px-3 py-1.5 text-xs text-[#71717a] font-medium">
                  Project Views
                </DropdownMenu.Label>
                {projectViews.map(([type, def]) => (
                  <DropdownMenu.Item
                    key={type}
                    className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none"
                    onSelect={() => onAddTab(type)}
                  >
                    <span className="text-[#71717a]">{def.icon}</span>
                    <span className="text-[#fafafa] text-sm flex-1">{def.label}</span>
                    <span className="text-[#71717a] text-xs bg-[#27272a] px-1.5 py-0.5 rounded">
                      {def.shortcut}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </>
            )}

            {/* System Views */}
            {systemViews.length > 0 && (
              <>
                <DropdownMenu.Separator className="h-px bg-[#27272a] my-1" />
                <DropdownMenu.Label className="px-3 py-1.5 text-xs text-[#71717a] font-medium">
                  System Views
                </DropdownMenu.Label>
                {systemViews.map(([type, def]) => (
                  <DropdownMenu.Item
                    key={type}
                    className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none"
                    onSelect={() => onAddTab(type)}
                  >
                    <span className="text-[#71717a]">{def.icon}</span>
                    <span className="text-[#fafafa] text-sm flex-1">{def.label}</span>
                    <span className="text-[#71717a] text-xs bg-[#27272a] px-1.5 py-0.5 rounded">
                      {def.shortcut}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </>
            )}

            {availableViews.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-[#71717a]">
                All views are open
              </div>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

export default ViewTabs
