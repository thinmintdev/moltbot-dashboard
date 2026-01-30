"use client"

import classNames from "classnames"
import {
  Crown,
  Code2,
  Search,
  Map,
  FlaskConical,
  CheckCircle,
  Sparkles,
  Pause,
  Square,
  FileText,
  MoreVertical,
} from "lucide-react"
import { Agent, AgentStatus, AgentType } from "./types"

interface AgentCardProps {
  agent: Agent
  onClick?: () => void
  onPause?: () => void
  onStop?: () => void
  onViewLogs?: () => void
}

const statusConfig: Record<
  AgentStatus,
  { bg: string; text: string; dot: string; label: string; animate?: string }
> = {
  running: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Running",
    animate: "animate-pulse",
  },
  paused: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    dot: "bg-amber-400",
    label: "Paused",
  },
  error: {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    dot: "bg-rose-400",
    label: "Error",
  },
  idle: {
    bg: "bg-theme-500/20",
    text: "text-theme-400",
    dot: "bg-theme-400",
    label: "Idle",
  },
}

const typeIcons: Record<AgentType, React.ReactNode> = {
  orchestrator: <Crown className="w-5 h-5" />,
  coder: <Code2 className="w-5 h-5" />,
  researcher: <Search className="w-5 h-5" />,
  planner: <Map className="w-5 h-5" />,
  tester: <FlaskConical className="w-5 h-5" />,
  reviewer: <CheckCircle className="w-5 h-5" />,
  custom: <Sparkles className="w-5 h-5" />,
}

const typeColors: Record<AgentType, string> = {
  orchestrator: "bg-purple-500/20 text-purple-400",
  coder: "bg-blue-500/20 text-blue-400",
  researcher: "bg-cyan-500/20 text-cyan-400",
  planner: "bg-orange-500/20 text-orange-400",
  tester: "bg-green-500/20 text-green-400",
  reviewer: "bg-pink-500/20 text-pink-400",
  custom: "bg-theme-500/20 text-theme-400",
}

// Default fallback for unknown statuses
const defaultStatus = {
  bg: "bg-theme-500/20",
  text: "text-theme-400",
  dot: "bg-theme-400",
  label: "Unknown",
}

export function AgentCard({
  agent,
  onClick,
  onPause,
  onStop,
  onViewLogs,
}: AgentCardProps) {
  const status = statusConfig[agent.status] || defaultStatus
  const tokenPercent = Math.round((agent.tokensUsed / agent.maxTokens) * 100)

  return (
    <div
      onClick={onClick}
      className={classNames(
        "bg-theme-800 rounded-xl border border-theme-700 p-4 cursor-pointer",
        "hover:border-theme-600 transition-all duration-200 hover:shadow-lg",
        "flex flex-col gap-3"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Agent Avatar */}
          <div
            className={classNames(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              typeColors[agent.type]
            )}
          >
            {typeIcons[agent.type]}
          </div>

          <div>
            <h4 className="text-white font-medium">{agent.name}</h4>
            <span className="text-xs text-theme-400 capitalize">{agent.type}</span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={classNames(
            "px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5",
            status.bg,
            status.text
          )}
        >
          <span
            className={classNames(
              "w-1.5 h-1.5 rounded-full",
              status.dot,
              status.animate
            )}
          />
          {status.label}
        </span>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="bg-theme-900/50 rounded-lg px-3 py-2">
          <span className="text-xs text-theme-400">Current Task</span>
          <p className="text-sm text-white truncate">{agent.currentTask}</p>
        </div>
      )}

      {/* Progress Bar */}
      {agent.status === "running" && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-theme-400">Progress</span>
            <span className="text-white">{agent.progress}%</span>
          </div>
          <div className="h-1.5 bg-theme-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Model & Tokens */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-theme-400">{agent.model}</span>
        <span
          className={classNames(
            "text-theme-400",
            tokenPercent > 80 && "text-amber-400",
            tokenPercent > 95 && "text-rose-400"
          )}
        >
          {agent.tokensUsed.toLocaleString()} / {agent.maxTokens.toLocaleString()} tokens
        </span>
      </div>

      {/* Token Usage Bar */}
      <div className="h-1 bg-theme-700 rounded-full overflow-hidden">
        <div
          className={classNames(
            "h-full rounded-full transition-all duration-300",
            tokenPercent <= 80 && "bg-theme-500",
            tokenPercent > 80 && tokenPercent <= 95 && "bg-amber-500",
            tokenPercent > 95 && "bg-rose-500"
          )}
          style={{ width: `${tokenPercent}%` }}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-end gap-1 pt-1 border-t border-theme-700">
        {agent.status === "running" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPause?.()
            }}
            className="p-1.5 rounded-lg hover:bg-theme-700 text-theme-400 hover:text-amber-400 transition-colors"
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        {(agent.status === "running" || agent.status === "paused") && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStop?.()
            }}
            className="p-1.5 rounded-lg hover:bg-theme-700 text-theme-400 hover:text-rose-400 transition-colors"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewLogs?.()
          }}
          className="p-1.5 rounded-lg hover:bg-theme-700 text-theme-400 hover:text-white transition-colors"
          title="View Logs"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
