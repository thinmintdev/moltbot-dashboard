"use client"

import { useState } from "react"
import classNames from "classnames"
import {
  FolderPlus,
  GitBranch,
  Clock,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/Button"

interface RecentProject {
  id: string
  name: string
  path: string
  lastOpened: string
  color?: string
}

interface EmptyProjectStateProps {
  recentProjects?: RecentProject[]
  onCreateProject: () => void
  onCloneFromGit: () => void
  onOpenRecent?: (projectId: string) => void
}

const tips = [
  {
    icon: Sparkles,
    title: "Auto-assign agents",
    description: "Enable auto-assign in project settings to let MoltBot automatically assign agents to tasks.",
  },
  {
    icon: Zap,
    title: "Keyboard shortcuts",
    description: "Press Ctrl+K to search, Ctrl+Shift+T for new task, Ctrl+Shift+A to spawn an agent.",
  },
  {
    icon: BookOpen,
    title: "Project templates",
    description: "Start from templates for common project types like web apps, APIs, or documentation.",
  },
]

export function EmptyProjectState({
  recentProjects = [],
  onCreateProject,
  onCloneFromGit,
  onOpenRecent,
}: EmptyProjectStateProps) {
  const [activeTipIndex, setActiveTipIndex] = useState(0)
  const activeTip = tips[activeTipIndex]
  const TipIcon = activeTip.icon

  const formatLastOpened = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Welcome message */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-theme-500 to-theme-600 flex items-center justify-center shadow-lg shadow-theme-500/20">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Welcome to MoltBot</h1>
          <p className="text-theme-400 text-lg max-w-md mx-auto">
            Your AI-powered project management and agent orchestration platform
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <QuickActionCard
            icon={<FolderPlus className="w-6 h-6" />}
            title="Create Project"
            description="Start a new project from scratch"
            onClick={onCreateProject}
            primary
          />
          <QuickActionCard
            icon={<GitBranch className="w-6 h-6" />}
            title="Clone from Git"
            description="Import an existing repository"
            onClick={onCloneFromGit}
          />
          <QuickActionCard
            icon={<Clock className="w-6 h-6" />}
            title="Open Recent"
            description={recentProjects.length > 0 ? `${recentProjects.length} recent projects` : "No recent projects"}
            onClick={() => {
              if (recentProjects.length > 0 && onOpenRecent) {
                onOpenRecent(recentProjects[0].id)
              }
            }}
            disabled={recentProjects.length === 0}
          />
        </div>

        {/* Recent projects list */}
        {recentProjects.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-theme-400 uppercase tracking-wider mb-4">
              Recent Projects
            </h2>
            <div className="bg-theme-900 rounded-xl border border-theme-800 overflow-hidden">
              {recentProjects.slice(0, 5).map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => onOpenRecent?.(project.id)}
                  className={classNames(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-theme-800/50 transition-colors text-left",
                    index !== recentProjects.length - 1 && index !== 4 && "border-b border-theme-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color || "#6072a1" }}
                    />
                    <div>
                      <p className="text-white font-medium">{project.name}</p>
                      <p className="text-xs text-theme-500 truncate max-w-xs">{project.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-theme-500">{formatLastOpened(project.lastOpened)}</span>
                    <ChevronRight className="w-4 h-4 text-theme-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tips section */}
        <div className="bg-theme-900/50 rounded-xl border border-theme-800 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-theme-800 flex items-center justify-center shrink-0">
              <TipIcon className="w-5 h-5 text-theme-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Tip</span>
              </div>
              <h3 className="text-white font-medium mb-1">{activeTip.title}</h3>
              <p className="text-sm text-theme-400">{activeTip.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme-800">
            <div className="flex gap-1.5">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTipIndex(index)}
                  className={classNames(
                    "w-2 h-2 rounded-full transition-colors",
                    index === activeTipIndex ? "bg-theme-400" : "bg-theme-700 hover:bg-theme-600"
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveTipIndex((prev) => (prev + 1) % tips.length)}
              className="text-xs text-theme-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Next tip
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}

function QuickActionCard({ icon, title, description, onClick, primary, disabled }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "p-6 rounded-xl border text-left transition-all group",
        primary
          ? "bg-theme-500/10 border-theme-500/30 hover:bg-theme-500/20 hover:border-theme-500/50"
          : "bg-theme-900 border-theme-800 hover:bg-theme-800/50 hover:border-theme-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={classNames(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
          primary
            ? "bg-theme-500/20 text-theme-400 group-hover:bg-theme-500/30"
            : "bg-theme-800 text-theme-400 group-hover:bg-theme-700"
        )}
      >
        {icon}
      </div>
      <h3 className={classNames("font-semibold mb-1", primary ? "text-theme-300" : "text-white")}>
        {title}
      </h3>
      <p className="text-sm text-theme-500">{description}</p>
    </button>
  )
}

export default EmptyProjectState
