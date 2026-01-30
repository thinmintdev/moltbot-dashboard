"use client"

import { useState, useEffect, useCallback } from "react"
import { AppLayout, type NavigationView, type ProjectTab } from "@/components/layout"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { ProjectCreateModal, type ProjectData } from "@/components/project/ProjectCreateModal"
import { LiveInfrastructureView } from "@/components/infrastructure"
import { GitHubIssuesView } from "@/components/github"
import { MCPOverview } from "@/components/mcp"
import { AgentsView } from "@/components/agents"
import { useToast } from "@/components/common/Toast"
import { Loader2, Terminal, Sparkles, Map, Lightbulb, FileText, BookOpen, Wrench, GitBranch, CircleDot, GitPullRequest, Server } from "lucide-react"

const API_BASE = "/api/moltbot"

// Parse GitHub owner/repo from path like "github.com/owner/repo"
function parseGitHubPath(path?: string): { owner: string; repo: string } | null {
  if (!path) return null
  const match = path.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (match) {
    return { owner: match[1], repo: match[2] }
  }
  return null
}

// Placeholder views for non-Kanban navigation
function PlaceholderView({ title, icon: Icon, description }: { title: string; icon: React.ElementType; description: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-[#71717a]" />
      </div>
      <h2 className="text-[#fafafa] text-xl font-semibold mb-2">{title}</h2>
      <p className="text-[#71717a] text-center max-w-md">{description}</p>
    </div>
  )
}

// View components map - keys must match ViewType from Navbar
const viewComponents: Record<NavigationView, { icon: React.ElementType; title: string; description: string }> = {
  kanban: { icon: () => null, title: "", description: "" }, // Special case - actual component
  agents: { icon: Terminal, title: "Agent Terminals", description: "Monitor and interact with running AI agents in real-time." },
  insights: { icon: Sparkles, title: "Insights", description: "AI-powered analytics and project intelligence." },
  roadmap: { icon: Map, title: "Roadmap", description: "Plan and visualize your project milestones and timeline." },
  ideation: { icon: Lightbulb, title: "Ideation", description: "Brainstorm and capture ideas for your project." },
  changelog: { icon: FileText, title: "Changelog", description: "Track changes and version history." },
  context: { icon: BookOpen, title: "Context", description: "Manage project context and documentation for AI agents." },
  mcp: { icon: Wrench, title: "MCP Overview", description: "Monitor Model Context Protocol connections and tools." },
  infrastructure: { icon: Server, title: "Infrastructure", description: "Monitor and control your homelab infrastructure." },
  worktrees: { icon: GitBranch, title: "Worktrees", description: "Manage Git worktrees for parallel development." },
  "github-issues": { icon: CircleDot, title: "GitHub Issues", description: "View and manage GitHub issues for this project." },
  "github-prs": { icon: GitPullRequest, title: "GitHub PRs", description: "Review and manage pull requests." },
}

export default function MoltbotPage() {
  // Project tabs state with sourceType info
  const [tabs, setTabs] = useState<(ProjectTab & { sourceType?: string; path?: string })[]>([
    { id: "proj-1", name: "molten", color: "#ef4444", sourceType: "local", path: "/mnt/dev/repos/moltbot-dashboard" },
    { id: "proj-2", name: "moltencalc", color: "#f97316", sourceType: "local", path: "/mnt/dev/repos/moltencalc" },
    { id: "proj-3", name: "react", color: "#22c55e", sourceType: "github", path: "github.com/facebook/react" },
  ])
  const [activeTabId, setActiveTabId] = useState<string | null>("proj-2") // Start on moltencalc for testing

  // Navigation state
  const [activeView, setActiveView] = useState<NavigationView>("kanban")

  // App state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)

  const { success, error: showError, info } = useToast()

  // Initialize
  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Tab handlers
  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId)
      // If closing active tab, select another
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id)
      } else if (newTabs.length === 0) {
        setActiveTabId(null)
      }
      return newTabs
    })
  }, [activeTabId])

  const handleAddTab = useCallback(() => {
    setNewProjectModalOpen(true)
  }, [])

  const handleCreateProject = useCallback((project: ProjectData) => {
    const newTab: ProjectTab & { sourceType?: string; path?: string } = {
      id: `proj-${Date.now()}`,
      name: project.name,
      color: project.color,
      sourceType: project.sourceType,
      path: project.sourceType === "local"
        ? project.localPath
        : `github.com/${project.githubOwner}/${project.githubRepo}`,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
    setNewProjectModalOpen(false)
    success("Project created", `${project.name} has been added from ${project.sourceType === "local" ? project.localPath : `GitHub: ${project.githubOwner}/${project.githubRepo}`}`)
  }, [success])

  // Navigation handler
  const handleViewChange = useCallback((view: NavigationView) => {
    setActiveView(view)
  }, [])

  // New task handler
  const handleNewTask = useCallback(() => {
    if (activeView !== "kanban") {
      setActiveView("kanban")
    }
    setCreateTaskModalOpen(true)
  }, [activeView])

  // Get active project for context-aware views
  const activeProject = tabs.find((t) => t.id === activeTabId)
  const githubInfo = activeProject?.sourceType === "github"
    ? parseGitHubPath(activeProject.path)
    : null

  // Render current view
  const renderView = () => {
    if (activeView === "kanban") {
      return (
        <KanbanBoard
          projectId={activeTabId}
          projectName={activeProject?.name}
          projects={tabs.map(t => ({ id: t.id, name: t.name }))}
        />
      )
    }

    if (activeView === "infrastructure") {
      return <LiveInfrastructureView enableLiveData={true} />
    }

    if (activeView === "github-issues") {
      return (
        <GitHubIssuesView
          owner={githubInfo?.owner}
          repo={githubInfo?.repo}
          projectId={activeProject?.id}
          onSyncToKanban={(tasks) => {
            info("Sync", `${tasks.length} issue(s) ready to sync to Kanban`)
            // TODO: Integrate with KanbanBoard task state
          }}
        />
      )
    }

    if (activeView === "mcp") {
      return <MCPOverview />
    }

    if (activeView === "agents") {
      return (
        <AgentsView
          projectId={activeTabId}
          projectName={activeProject?.name}
          projects={tabs.map(t => ({ id: t.id, name: t.name }))}
          tasks={[]} // Tasks will be populated from Kanban state when integrated
        />
      )
    }

    const viewConfig = viewComponents[activeView]
    if (viewConfig && viewConfig.icon) {
      return (
        <PlaceholderView
          title={viewConfig.title}
          icon={viewConfig.icon}
          description={viewConfig.description}
        />
      )
    }

    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ef4444] animate-spin mx-auto mb-4" />
          <p className="text-[#71717a]">Loading MoltBot...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Connection Error</h2>
          <p className="text-[#71717a] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-[#0a0a0b] rounded-lg font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppLayout
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onAddTab={handleAddTab}
        activeView={activeView}
        onViewChange={handleViewChange}
        onNewTask={handleNewTask}
        hasUpdate={false}
        version="1.2.0"
      >
        {renderView()}
      </AppLayout>

      {/* New Project Modal - requires GitHub/Directory selection */}
      <ProjectCreateModal
        open={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </>
  )
}
