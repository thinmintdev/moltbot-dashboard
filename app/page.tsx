"use client"

import { useState, useEffect, useCallback } from "react"
import { AppLayout, type ViewType, type ViewTab, type ProjectData, VIEW_DEFINITIONS } from "@/components/layout"
import { KanbanBoard, TaskCreateModal } from "@/components/kanban"
import { useTaskStore } from "@/lib/stores/task-store"
import { ProjectCreateModal, type ProjectData as CreateProjectData } from "@/components/project/ProjectCreateModal"
import { LiveInfrastructureView } from "@/components/infrastructure"
import { GitHubIssuesView, GitHubPRsView } from "@/components/github"
import { MCPOverview } from "@/components/mcp"
import { AgentsView } from "@/components/agents"
import { RoadmapView } from "@/components/roadmap"
import { IdeationView } from "@/components/ideation"
import { ContextView } from "@/components/context"
import { InsightsView } from "@/components/insights"
import { ChangelogView } from "@/components/changelog"
import { WorktreesView } from "@/components/worktrees"
import { PreviewView } from "@/components/preview/PreviewView"
import { useToast } from "@/components/common/Toast"
import { Loader2, Terminal, Sparkles, Map, Lightbulb, FileText, BookOpen, Wrench, GitBranch, CircleDot, GitPullRequest, Server, Eye } from "lucide-react"

// Parse GitHub owner/repo from path like "github.com/owner/repo"
function parseGitHubPath(path?: string): { owner: string; repo: string } | null {
  if (!path) return null
  const match = path.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (match) {
    return { owner: match[1], repo: match[2] }
  }
  return null
}

// Placeholder views for non-implemented views
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

// View components map
const viewComponents: Record<ViewType, { icon: React.ElementType; title: string; description: string }> = {
  kanban: { icon: () => null, title: "", description: "" },
  agents: { icon: Terminal, title: "Agent Terminals", description: "Monitor and interact with running AI agents in real-time." },
  preview: { icon: Eye, title: "Preview", description: "Live preview of your running development server." },
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
  // Projects state (previously "tabs")
  const [projects, setProjects] = useState<ProjectData[]>([
    { id: "proj-1", name: "molten", color: "#ef4444", sourceType: "local", path: "/mnt/dev/repos/moltbot-dashboard" },
    { id: "proj-2", name: "moltencalc", color: "#f97316", sourceType: "local", path: "/mnt/dev/repos/moltencalc" },
    { id: "proj-3", name: "react", color: "#22c55e", sourceType: "github", path: "github.com/facebook/react" },
  ])
  const [activeProjectId, setActiveProjectId] = useState<string | null>("proj-1")

  // View tabs state - each project can have multiple view tabs
  const [viewTabs, setViewTabs] = useState<ViewTab[]>([
    { id: "view-kanban-1", type: "kanban", label: "Kanban Board" },
  ])
  const [activeViewTabId, setActiveViewTabId] = useState<string | null>("view-kanban-1")

  // App state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)

  const { success, error: showError, info } = useToast()
  const addTask = useTaskStore((state) => state.addTask)

  // Initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Project handlers
  const handleProjectChange = useCallback((projectId: string) => {
    setActiveProjectId(projectId)
  }, [])

  const handleNewProject = useCallback(() => {
    setNewProjectModalOpen(true)
  }, [])

  const handleCreateProject = useCallback((project: CreateProjectData) => {
    const newProject: ProjectData = {
      id: `proj-${Date.now()}`,
      name: project.name,
      color: project.color,
      sourceType: project.sourceType,
      path: project.sourceType === "local"
        ? project.localPath
        : `github.com/${project.githubOwner}/${project.githubRepo}`,
    }
    setProjects((prev) => [...prev, newProject])
    setActiveProjectId(newProject.id)
    setNewProjectModalOpen(false)
    success("Project created", `${project.name} has been added`)
  }, [success])

  // View tab handlers
  const handleSelectViewTab = useCallback((tabId: string) => {
    setActiveViewTabId(tabId)
  }, [])

  const handleCloseViewTab = useCallback((tabId: string) => {
    setViewTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId)
      // If closing active tab, select another
      if (activeViewTabId === tabId && newTabs.length > 0) {
        setActiveViewTabId(newTabs[newTabs.length - 1].id)
      } else if (newTabs.length === 0) {
        // Always keep at least the kanban tab
        const kanbanTab: ViewTab = { id: "view-kanban-default", type: "kanban", label: "Kanban Board" }
        setActiveViewTabId(kanbanTab.id)
        return [kanbanTab]
      }
      return newTabs
    })
  }, [activeViewTabId])

  const handleAddViewTab = useCallback((type: ViewType) => {
    const viewDef = VIEW_DEFINITIONS[type]
    const newTab: ViewTab = {
      id: `view-${type}-${Date.now()}`,
      type,
      label: viewDef?.label || type,
    }
    setViewTabs((prev) => [...prev, newTab])
    setActiveViewTabId(newTab.id)
  }, [])

  // New task handler
  const handleNewTask = useCallback(() => {
    // Make sure kanban tab is open
    const kanbanTab = viewTabs.find(t => t.type === "kanban")
    if (kanbanTab) {
      setActiveViewTabId(kanbanTab.id)
    } else {
      handleAddViewTab("kanban")
    }
    setCreateTaskModalOpen(true)
  }, [viewTabs, handleAddViewTab])

  // Create task handler
  const handleCreateTask = useCallback((taskData: Partial<{ title: string; description: string; status: string; priority: string; projectId: string; labels: string[]; dueDate: string; subtasks: { id: string; title: string; completed: boolean }[]; progress: number }>) => {
    const task = addTask({
      title: taskData.title || "Untitled Task",
      description: taskData.description || "",
      status: (taskData.status as "backlog" | "todo" | "inProgress" | "review" | "done") || "todo",
      priority: (taskData.priority as "low" | "medium" | "high" | "critical") || "medium",
      projectId: taskData.projectId || activeProjectId || undefined,
      labels: taskData.labels || [],
      dueDate: taskData.dueDate,
      subtasks: taskData.subtasks || [],
      progress: taskData.progress ?? 0,
    })
    setCreateTaskModalOpen(false)
    success("Task created", `"${task.title}" has been added`)
  }, [addTask, activeProjectId, success])

  // Get active project and view
  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeViewTab = viewTabs.find((t) => t.id === activeViewTabId)
  const activeViewType = activeViewTab?.type || "kanban"

  const githubInfo = activeProject?.sourceType === "github"
    ? parseGitHubPath(activeProject.path)
    : null

  // Render current view based on active tab type
  const renderView = () => {
    if (activeViewType === "kanban") {
      return (
        <KanbanBoard
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
        />
      )
    }

    if (activeViewType === "preview") {
      return (
        <PreviewView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projectPath={activeProject?.path}
        />
      )
    }

    if (activeViewType === "infrastructure") {
      return <LiveInfrastructureView enableLiveData={true} />
    }

    if (activeViewType === "github-issues") {
      return (
        <GitHubIssuesView
          owner={githubInfo?.owner}
          repo={githubInfo?.repo}
          projectId={activeProject?.id}
          onSyncToKanban={(tasks) => {
            info("Sync", `${tasks.length} issue(s) ready to sync to Kanban`)
          }}
        />
      )
    }

    if (activeViewType === "github-prs") {
      return (
        <GitHubPRsView
          owner={githubInfo?.owner}
          repo={githubInfo?.repo}
          projectId={activeProject?.id}
          onSyncToKanban={(tasks) => {
            info("Sync", `${tasks.length} PR(s) ready to sync to Kanban`)
          }}
        />
      )
    }

    if (activeViewType === "mcp") {
      return <MCPOverview />
    }

    if (activeViewType === "agents") {
      return (
        <AgentsView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
          tasks={[]}
        />
      )
    }

    if (activeViewType === "roadmap") {
      return (
        <RoadmapView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
        />
      )
    }

    if (activeViewType === "ideation") {
      return (
        <IdeationView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
        />
      )
    }

    if (activeViewType === "context") {
      return (
        <ContextView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
        />
      )
    }

    if (activeViewType === "insights") {
      return (
        <InsightsView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
        />
      )
    }

    if (activeViewType === "changelog") {
      return (
        <ChangelogView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
        />
      )
    }

    if (activeViewType === "worktrees") {
      return (
        <WorktreesView
          projectId={activeProjectId}
          projectName={activeProject?.name}
          projects={projects.map(p => ({ id: p.id, name: p.name, path: p.path }))}
        />
      )
    }

    // All views are now implemented - return null for safety
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
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectChange={handleProjectChange}
        onNewProject={handleNewProject}
        viewTabs={viewTabs}
        activeViewTabId={activeViewTabId}
        onSelectViewTab={handleSelectViewTab}
        onCloseViewTab={handleCloseViewTab}
        onAddViewTab={handleAddViewTab}
        onNewTask={handleNewTask}
        hasUpdate={false}
        version="1.2.0"
      >
        {renderView()}
      </AppLayout>

      {/* New Project Modal */}
      <ProjectCreateModal
        open={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* New Task Modal */}
      <TaskCreateModal
        open={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        defaultStatus="planning"
      />
    </>
  )
}
