"use client"

import { useState, useCallback, useEffect, ReactNode } from "react"
import { Navbar } from "./Navbar"
import { ViewTabs, ViewTab, ViewType, VIEW_DEFINITIONS } from "./ViewTabs"
import { StatusBar } from "./StatusBar"
import { Modal } from "@/components/ui/Modal"

// Re-export types for backwards compatibility
export type { ViewType, ViewTab }
export { VIEW_DEFINITIONS }

export interface ProjectData {
  id: string
  name: string
  color: string
  sourceType?: string
  path?: string
}

interface RunningAgent {
  id: string
  name: string
  type: string
  taskName: string
  progress: number
  tokensUsed: number
  startedAt: string
  status: "running" | "paused"
}

interface AppLayoutProps {
  children?: ReactNode
  // Project management
  projects: ProjectData[]
  activeProjectId: string | null
  onProjectChange: (projectId: string) => void
  onNewProject: () => void
  // View tabs management
  viewTabs: ViewTab[]
  activeViewTabId: string | null
  onSelectViewTab: (tabId: string) => void
  onCloseViewTab: (tabId: string) => void
  onAddViewTab: (type: ViewType) => void
  // Actions
  onNewTask: () => void
  // Optional
  hasUpdate?: boolean
  version?: string
  isConnected?: boolean
  currentModel?: string | null
  runningAgents?: RunningAgent[]
}

export function AppLayout({
  children,
  projects,
  activeProjectId,
  onProjectChange,
  onNewProject,
  viewTabs,
  activeViewTabId,
  onSelectViewTab,
  onCloseViewTab,
  onAddViewTab,
  onNewTask,
  hasUpdate,
  version,
  isConnected = true,
  currentModel = null,
  runningAgents = [],
}: AppLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [agentPanelExpanded, setAgentPanelExpanded] = useState(false)

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  // Keyboard shortcuts for views
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Map shortcuts to view types
      const shortcuts: Record<string, ViewType> = {
        k: "kanban",
        a: "agents",
        v: "preview",
        n: "insights",
        d: "roadmap",
        i: "ideation",
        l: "changelog",
        c: "context",
        m: "mcp",
        f: "infrastructure",
        w: "worktrees",
        g: "github-issues",
        p: "github-prs",
      }

      const key = e.key.toLowerCase()
      if (shortcuts[key]) {
        e.preventDefault()
        // Check if view is already open
        const existingTab = viewTabs.find(t => t.type === shortcuts[key])
        if (existingTab) {
          onSelectViewTab(existingTab.id)
        } else {
          onAddViewTab(shortcuts[key])
        }
      } else if (key === "t") {
        e.preventDefault()
        onNewTask()
      } else if (key === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setSettingsOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [viewTabs, onSelectViewTab, onAddViewTab, onNewTask])

  // Agent handlers (placeholder - connect to actual agent store)
  const handlePauseAgent = useCallback((agentId: string) => {
    console.log("Pause agent:", agentId)
  }, [])

  const handleResumeAgent = useCallback((agentId: string) => {
    console.log("Resume agent:", agentId)
  }, [])

  const handleStopAgent = useCallback((agentId: string) => {
    console.log("Stop agent:", agentId)
  }, [])

  const handleOpenLogs = useCallback((agentId: string) => {
    console.log("Open logs for:", agentId)
    // Open agents tab
    const existingTab = viewTabs.find(t => t.type === "agents")
    if (existingTab) {
      onSelectViewTab(existingTab.id)
    } else {
      onAddViewTab("agents")
    }
  }, [viewTabs, onSelectViewTab, onAddViewTab])

  const handleExpandAgentPanel = useCallback(() => {
    setAgentPanelExpanded(true)
    // Open agents tab
    const existingTab = viewTabs.find(t => t.type === "agents")
    if (existingTab) {
      onSelectViewTab(existingTab.id)
    } else {
      onAddViewTab("agents")
    }
  }, [viewTabs, onSelectViewTab, onAddViewTab])

  return (
    <div className="h-screen w-screen bg-[#0a0a0b] flex flex-col overflow-hidden">
      {/* Top: Navbar with project dropdown */}
      <Navbar
        projects={projects.map(p => ({ id: p.id, name: p.name, color: p.color || "#ef4444" }))}
        activeProjectId={activeProjectId}
        onProjectChange={onProjectChange}
        onNewProject={onNewProject}
        onNewTask={onNewTask}
        onOpenSettings={handleOpenSettings}
        isConnected={isConnected}
        currentModel={currentModel}
      />

      {/* View Tabs */}
      <ViewTabs
        tabs={viewTabs}
        activeTabId={activeViewTabId}
        onSelectTab={onSelectViewTab}
        onCloseTab={onCloseViewTab}
        onAddTab={onAddViewTab}
      />

      {/* Main content area - full width, no sidebar */}
      <main className="flex-1 bg-[#0a0a0b] overflow-hidden">
        {children}
      </main>

      {/* Bottom: Status Bar */}
      <StatusBar
        runningAgents={runningAgents}
        onPauseAgent={handlePauseAgent}
        onResumeAgent={handleResumeAgent}
        onStopAgent={handleStopAgent}
        onOpenLogs={handleOpenLogs}
        onExpandPanel={handleExpandAgentPanel}
      />

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-[#fafafa] mb-4">Connection</h3>
            <div className="bg-[#18181b] rounded-lg p-4 border border-[#27272a]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#71717a]">Status</span>
                <span className={isConnected ? "text-[#22c55e]" : "text-[#ef4444]"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#71717a]">Model</span>
                <span className="text-[#fafafa]">{currentModel || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71717a]">Version</span>
                <span className="text-[#fafafa]">{version || "1.0.0"}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#fafafa] mb-4">Keyboard Shortcuts</h3>
            <div className="bg-[#18181b] rounded-lg p-4 border border-[#27272a] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#71717a]">Kanban Board</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Agent Terminals</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">A</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Preview</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">V</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Infrastructure</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">F</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">MCP Overview</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">M</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">New Task</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">T</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Settings</span>
                <kbd className="px-2 py-0.5 bg-[#27272a] rounded text-[#a1a1aa] font-mono">S</kbd>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#fafafa] mb-4">Infrastructure</h3>
            <div className="bg-[#18181b] rounded-lg p-4 border border-[#27272a] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#71717a]">AI VM</span>
                <span className="text-[#fafafa]">100.73.167.86</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Dev VM</span>
                <span className="text-[#fafafa]">100.104.67.12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Infra VM</span>
                <span className="text-[#fafafa]">100.112.252.61</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717a]">Proxmox</span>
                <span className="text-[#fafafa]">100.75.100.113</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AppLayout
