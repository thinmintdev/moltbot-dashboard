"use client"

import { useState, useCallback, useEffect, ReactNode } from "react"
import { ProjectTabs, type ProjectTab } from "./ProjectTabs"
import { Navbar, type ViewType } from "./Navbar"
import { StatusBar } from "./StatusBar"
import { Modal } from "@/components/ui/Modal"
// SettingsPanel will be used when we wire up all the settings logic
// import { SettingsPanel } from "@/components/settings/SettingsPanel"

// Re-export types for backwards compatibility
export type NavigationView = ViewType

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
  // Tab management
  tabs: ProjectTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onAddTab: () => void
  // Navigation
  activeView: NavigationView
  onViewChange: (view: NavigationView) => void
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
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  activeView,
  onViewChange,
  onNewTask,
  hasUpdate,
  version,
  isConnected = true,
  currentModel = null,
  runningAgents = [],
}: AppLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [agentPanelExpanded, setAgentPanelExpanded] = useState(false)

  // Convert tabs to projects format for Navbar
  const projects = tabs.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color || "#ef4444"
  }))

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const handleProjectChange = useCallback((projectId: string) => {
    onSelectTab(projectId)
  }, [onSelectTab])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const shortcuts: Record<string, NavigationView> = {
        k: "kanban",
        a: "agents",
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
        onViewChange(shortcuts[key])
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
  }, [onViewChange, onNewTask])

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
    onViewChange("agents")
  }, [onViewChange])

  const handleExpandAgentPanel = useCallback(() => {
    setAgentPanelExpanded(true)
    onViewChange("agents")
  }, [onViewChange])

  return (
    <div className="h-screen w-screen bg-[#0a0a0b] flex flex-col overflow-hidden">
      {/* Top: Navbar */}
      <Navbar
        currentView={activeView}
        onViewChange={onViewChange}
        projects={projects}
        activeProjectId={activeTabId}
        onProjectChange={handleProjectChange}
        onNewProject={onAddTab}
        onNewTask={onNewTask}
        onOpenSettings={handleOpenSettings}
        isConnected={isConnected}
        currentModel={currentModel}
      />

      {/* Project Tabs */}
      <ProjectTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onAddTab={onAddTab}
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
