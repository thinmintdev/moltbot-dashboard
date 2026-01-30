"use client"

import { useState, useMemo } from "react"
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
  Play,
  Square,
  RefreshCw,
  Clock,
  Zap,
  Activity,
  Cpu,
  MemoryStick,
} from "lucide-react"
import { Modal } from "../ui/Modal"
import { Button } from "../ui/Button"
import { LogViewer } from "./LogViewer"
import { Agent, AgentType, AgentStatus, LogEntry } from "./types"

interface AgentDetailModalProps {
  open: boolean
  onClose: () => void
  agent: Agent | null
  logs: LogEntry[]
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  onReassign?: () => void
}

const typeIcons: Record<AgentType, React.ReactNode> = {
  orchestrator: <Crown className="w-6 h-6" />,
  coder: <Code2 className="w-6 h-6" />,
  researcher: <Search className="w-6 h-6" />,
  planner: <Map className="w-6 h-6" />,
  tester: <FlaskConical className="w-6 h-6" />,
  reviewer: <CheckCircle className="w-6 h-6" />,
  custom: <Sparkles className="w-6 h-6" />,
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

const statusConfig: Record<AgentStatus, { bg: string; text: string; label: string }> = {
  running: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Running" },
  paused: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Paused" },
  error: { bg: "bg-rose-500/20", text: "text-rose-400", label: "Error" },
  idle: { bg: "bg-theme-500/20", text: "text-theme-400", label: "Idle" },
}

// Mock resource data - would come from real monitoring in production
const mockResourceData = {
  cpuUsage: 45,
  memoryUsage: 62,
  requestsPerMin: 12,
}

export function AgentDetailModal({
  open,
  onClose,
  agent,
  logs,
  onPause,
  onResume,
  onStop,
  onReassign,
}: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "resources">("details")

  // Filter logs for this agent
  const agentLogs = useMemo(() => {
    if (!agent) return []
    return logs.filter((log) => log.agentId === agent.id)
  }, [logs, agent])

  if (!agent) return null

  const status = statusConfig[agent.status]
  const tokenPercent = Math.round((agent.tokensUsed / agent.maxTokens) * 100)

  return (
    <Modal open={open} onClose={onClose} title="Agent Details" size="lg">
      <div className="flex flex-col gap-4">
        {/* Agent Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={classNames(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                typeColors[agent.type]
              )}
            >
              {typeIcons[agent.type]}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-theme-400 capitalize">{agent.type}</span>
                <span className="text-theme-600">|</span>
                <span className="text-sm text-theme-400">{agent.model}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={classNames(
              "px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2",
              status.bg,
              status.text
            )}
          >
            <span
              className={classNames(
                "w-2 h-2 rounded-full",
                agent.status === "running" ? "bg-emerald-400 animate-pulse" : status.text.replace("text-", "bg-")
              )}
            />
            {status.label}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {agent.status === "running" && (
            <Button variant="secondary" size="sm" onClick={onPause}>
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          {agent.status === "paused" && (
            <Button variant="success" size="sm" onClick={onResume}>
              <Play className="w-4 h-4" />
              Resume
            </Button>
          )}
          {(agent.status === "running" || agent.status === "paused") && (
            <Button variant="danger" size="sm" onClick={onStop}>
              <Square className="w-4 h-4" />
              Stop
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onReassign}>
            <RefreshCw className="w-4 h-4" />
            Reassign Task
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-theme-700">
          {(["details", "logs", "resources"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={classNames(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                activeTab === tab
                  ? "border-theme-500 text-white"
                  : "border-transparent text-theme-400 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "details" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Current Task */}
              <div className="col-span-2 bg-theme-900/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-theme-400 mb-2">Current Task</h4>
                {agent.currentTask ? (
                  <div>
                    <p className="text-white">{agent.currentTask}</p>
                    {agent.status === "running" && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-theme-400">Progress</span>
                          <span className="text-white">{agent.progress}%</span>
                        </div>
                        <div className="h-2 bg-theme-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-theme-400 italic">No task assigned</p>
                )}
              </div>

              {/* Token Usage */}
              <div className="bg-theme-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-theme-400" />
                  <h4 className="text-sm font-medium text-theme-400">Token Usage</h4>
                </div>
                <p className="text-2xl font-semibold text-white">
                  {agent.tokensUsed.toLocaleString()}
                  <span className="text-sm text-theme-400 font-normal">
                    {" "}
                    / {agent.maxTokens.toLocaleString()}
                  </span>
                </p>
                <div className="mt-2 h-2 bg-theme-700 rounded-full overflow-hidden">
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
              </div>

              {/* Uptime */}
              <div className="bg-theme-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-theme-400" />
                  <h4 className="text-sm font-medium text-theme-400">Created</h4>
                </div>
                <p className="text-lg text-white">
                  {new Date(agent.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Skills */}
              <div className="col-span-2 bg-theme-900/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-theme-400 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-theme-700 rounded-lg text-sm text-theme-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <LogViewer
              logs={agentLogs}
              maxHeight="350px"
              showFilters={true}
            />
          )}

          {activeTab === "resources" && (
            <div className="grid grid-cols-3 gap-4">
              {/* CPU Usage */}
              <div className="bg-theme-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-theme-400" />
                  <h4 className="text-sm font-medium text-theme-400">CPU Usage</h4>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold text-white">
                    {mockResourceData.cpuUsage}
                  </span>
                  <span className="text-theme-400 pb-1">%</span>
                </div>
                <div className="mt-3 h-2 bg-theme-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${mockResourceData.cpuUsage}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="bg-theme-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MemoryStick className="w-4 h-4 text-theme-400" />
                  <h4 className="text-sm font-medium text-theme-400">Memory</h4>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold text-white">
                    {mockResourceData.memoryUsage}
                  </span>
                  <span className="text-theme-400 pb-1">%</span>
                </div>
                <div className="mt-3 h-2 bg-theme-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${mockResourceData.memoryUsage}%` }}
                  />
                </div>
              </div>

              {/* Requests/min */}
              <div className="bg-theme-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-theme-400" />
                  <h4 className="text-sm font-medium text-theme-400">Requests/min</h4>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold text-white">
                    {mockResourceData.requestsPerMin}
                  </span>
                </div>
              </div>

              {/* Resource graph placeholder */}
              <div className="col-span-3 bg-theme-900/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-theme-400 mb-4">
                  Resource Usage Over Time
                </h4>
                <div className="h-32 flex items-center justify-center border border-theme-700 border-dashed rounded-lg">
                  <span className="text-theme-400 text-sm">
                    Graph visualization would appear here
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
