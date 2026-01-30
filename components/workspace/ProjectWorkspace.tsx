"use client"

import * as Tabs from "@radix-ui/react-tabs"
import classNames from "classnames"
import {
  Kanban,
  MessageSquare,
  Bot,
  Map,
  GitBranch,
  Settings,
  FileText,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { useState } from "react"
import { ProjectSidebar, type Project } from "./ProjectSidebar"
import { ProjectHeader } from "./ProjectHeader"

export interface WorkspaceTab {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const workspaceTabs: WorkspaceTab[] = [
  { id: "kanban", label: "Kanban", icon: <Kanban className="w-4 h-4" /> },
  { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "agents", label: "Agents", icon: <Bot className="w-4 h-4" /> },
  { id: "roadmap", label: "Roadmap", icon: <Map className="w-4 h-4" /> },
  { id: "git", label: "Git", icon: <GitBranch className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  { id: "logs", label: "Logs", icon: <FileText className="w-4 h-4" /> },
]

// Demo projects data
const demoProjects: Project[] = [
  {
    id: "proj-1",
    name: "MoltBot Core",
    description: "Main MoltBot orchestration and agent system",
    status: "active",
    color: "#22c55e",
    path: "/home/user/projects/moltbot",
    gitUrl: "https://github.com/user/moltbot",
    model: "claude-3-opus",
    stats: {
      totalTasks: 24,
      completedTasks: 18,
      activeAgents: 3,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-2",
    name: "Dashboard",
    description: "Web dashboard for monitoring and managing MoltBot",
    status: "active",
    color: "#3b82f6",
    path: "/home/user/projects/moltbot-dashboard",
    model: "claude-3-sonnet",
    stats: {
      totalTasks: 12,
      completedTasks: 5,
      activeAgents: 1,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-3",
    name: "Agent Tools",
    description: "MCP tools and utilities for AI agents",
    status: "paused",
    color: "#f59e0b",
    path: "/home/user/projects/agent-tools",
    gitUrl: "https://github.com/user/agent-tools",
    model: "claude-3-opus",
    stats: {
      totalTasks: 8,
      completedTasks: 8,
      activeAgents: 0,
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-4",
    name: "Documentation",
    description: "Project documentation and guides",
    status: "completed",
    color: "#8b5cf6",
    path: "/home/user/projects/docs",
    model: "claude-3-haiku",
    stats: {
      totalTasks: 15,
      completedTasks: 15,
      activeAgents: 0,
      lastActivity: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const modelOptions = [
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
]

interface ProjectWorkspaceProps {
  initialProjects?: Project[]
}

export function ProjectWorkspace({ initialProjects = demoProjects }: ProjectWorkspaceProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjects[0]?.id || null)
  const [activeTab, setActiveTab] = useState("kanban")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId) || null

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId)
  }

  const handleCreateProject = (projectData: Partial<Project>) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name || "Untitled Project",
      description: projectData.description || "",
      status: "active",
      color: projectData.color || "#6072a1",
      path: projectData.path || "",
      gitUrl: projectData.gitUrl,
      model: projectData.model || "claude-3-sonnet",
      autoAssign: projectData.autoAssign,
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        activeAgents: 0,
        lastActivity: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setProjects((prev) => [...prev, newProject])
    setActiveProjectId(newProject.id)
  }

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    )
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    if (activeProjectId === projectId) {
      setActiveProjectId(projects.find((p) => p.id !== projectId)?.id || null)
    }
  }

  const handleArchiveProject = (projectId: string) => {
    handleUpdateProject(projectId, { status: "archived" })
  }

  const handleReorderProjects = (reorderedProjects: Project[]) => {
    setProjects(reorderedProjects)
  }

  const handleToggleProjectStatus = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const newStatus = project.status === "active" ? "paused" : "active"
    handleUpdateProject(projectId, { status: newStatus })
  }

  const handleModelChange = (projectId: string, model: string) => {
    handleUpdateProject(projectId, { model })
  }

  const handleProjectNameChange = (projectId: string, name: string) => {
    handleUpdateProject(projectId, { name })
  }

  return (
    <div className="flex h-full bg-theme-950">
      {/* Sidebar */}
      <div
        className={classNames(
          "shrink-0 border-r border-theme-800 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-64"
        )}
      >
        <ProjectSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onArchiveProject={handleArchiveProject}
          onReorderProjects={handleReorderProjects}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sidebar toggle + Header */}
        <div className="shrink-0 border-b border-theme-800">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-3 text-theme-400 hover:text-white hover:bg-theme-800 transition-colors"
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {activeProject && (
              <ProjectHeader
                project={activeProject}
                models={modelOptions}
                onToggleStatus={() => handleToggleProjectStatus(activeProject.id)}
                onModelChange={(model) => handleModelChange(activeProject.id, model)}
                onNameChange={(name) => handleProjectNameChange(activeProject.id, name)}
                onOpenSettings={() => setActiveTab("settings")}
              />
            )}
          </div>
        </div>

        {/* Tabbed content area */}
        {activeProject ? (
          <Tabs.Root
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Tab list */}
            <Tabs.List className="shrink-0 flex border-b border-theme-800 bg-theme-900/50 px-2 overflow-x-auto">
              {workspaceTabs.map((tab) => (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={classNames(
                    "px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
                    "data-[state=active]:border-theme-500 data-[state=active]:text-white",
                    "data-[state=inactive]:border-transparent data-[state=inactive]:text-theme-400",
                    "hover:text-white hover:bg-theme-800/50"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-theme-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              <Tabs.Content value="kanban" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<Kanban className="w-12 h-12" />}
                  title="Kanban Board"
                  description={`Task management for ${activeProject.name}`}
                  stats={`${activeProject.stats.completedTasks}/${activeProject.stats.totalTasks} tasks completed`}
                />
              </Tabs.Content>

              <Tabs.Content value="chat" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<MessageSquare className="w-12 h-12" />}
                  title="Project Chat"
                  description="Communicate with AI agents about this project"
                  stats={`Model: ${modelOptions.find(m => m.id === activeProject.model)?.name || activeProject.model}`}
                />
              </Tabs.Content>

              <Tabs.Content value="agents" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<Bot className="w-12 h-12" />}
                  title="Agents"
                  description="Manage AI agents assigned to this project"
                  stats={`${activeProject.stats.activeAgents} active agents`}
                />
              </Tabs.Content>

              <Tabs.Content value="roadmap" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<Map className="w-12 h-12" />}
                  title="Roadmap"
                  description="View project timeline and milestones"
                  stats="Coming soon"
                />
              </Tabs.Content>

              <Tabs.Content value="git" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<GitBranch className="w-12 h-12" />}
                  title="Git"
                  description="View commits, branches, and repository status"
                  stats={activeProject.gitUrl || "No repository linked"}
                />
              </Tabs.Content>

              <Tabs.Content value="settings" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<Settings className="w-12 h-12" />}
                  title="Settings"
                  description="Configure project settings and preferences"
                  stats={activeProject.path || "No path set"}
                />
              </Tabs.Content>

              <Tabs.Content value="logs" className="h-full outline-none">
                <WorkspaceTabPlaceholder
                  icon={<FileText className="w-12 h-12" />}
                  title="Logs"
                  description="View project activity and agent logs"
                  stats="Real-time logs"
                />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-theme-500">
              <PanelLeft className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No project selected</p>
              <p className="text-sm mt-2">
                Select a project from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Placeholder component for tab content
interface WorkspaceTabPlaceholderProps {
  icon: React.ReactNode
  title: string
  description: string
  stats?: string
}

function WorkspaceTabPlaceholder({ icon, title, description, stats }: WorkspaceTabPlaceholderProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-theme-500">
        <div className="mb-4 opacity-50">{icon}</div>
        <p className="text-lg font-medium text-white">{title}</p>
        <p className="text-sm mt-2">{description}</p>
        {stats && <p className="text-xs mt-4 text-theme-600">{stats}</p>}
      </div>
    </div>
  )
}

export default ProjectWorkspace
