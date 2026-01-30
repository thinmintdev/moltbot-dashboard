"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  Plus,
  Filter,
  Search,
  Grid,
  List,
  RefreshCw,
  ChevronDown,
  Check,
} from "lucide-react"
import { Button } from "../ui/Button"
import { AgentCard } from "./AgentCard"
import { AgentDetailModal } from "./AgentDetailModal"
import { SpawnAgentModal, SpawnAgentConfig } from "./SpawnAgentModal"
import { LogViewer } from "./LogViewer"
import { Agent, AgentStatus, AgentType, LogEntry } from "./types"

interface AgentPanelProps {
  agents: Agent[]
  logs: LogEntry[]
  projects?: { id: string; name: string }[]
  tasks?: { id: string; name: string }[]
  onSpawnAgent?: (config: SpawnAgentConfig) => void
  onPauseAgent?: (agentId: string) => void
  onResumeAgent?: (agentId: string) => void
  onStopAgent?: (agentId: string) => void
  onRefresh?: () => void
}

type ViewMode = "grid" | "list" | "logs"
type StatusFilter = AgentStatus | "all"
type TypeFilter = AgentType | "all"

export function AgentPanel({
  agents,
  logs,
  projects = [],
  tasks = [],
  onSpawnAgent,
  onPauseAgent,
  onResumeAgent,
  onStopAgent,
  onRefresh,
}: AgentPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showSpawnModal, setShowSpawnModal] = useState(false)
  const [logAgentFilter, setLogAgentFilter] = useState<string>("")

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !agent.name.toLowerCase().includes(query) &&
          !agent.type.toLowerCase().includes(query) &&
          !agent.currentTask?.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all" && agent.status !== statusFilter) {
        return false
      }

      // Type filter
      if (typeFilter !== "all" && agent.type !== typeFilter) {
        return false
      }

      return true
    })
  }, [agents, searchQuery, statusFilter, typeFilter])

  // Agent stats
  const stats = useMemo(() => {
    return {
      total: agents.length,
      running: agents.filter((a) => a.status === "running").length,
      paused: agents.filter((a) => a.status === "paused").length,
      error: agents.filter((a) => a.status === "error").length,
      idle: agents.filter((a) => a.status === "idle").length,
    }
  }, [agents])

  // Handle agent click
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowDetailModal(true)
  }

  // Handle spawn
  const handleSpawn = (config: SpawnAgentConfig) => {
    onSpawnAgent?.(config)
    setShowSpawnModal(false)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Agent Management</h2>
          <p className="text-sm text-theme-400">
            {stats.total} agents | {stats.running} running | {stats.paused} paused
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowSpawnModal(true)}>
            <Plus className="w-4 h-4" />
            Spawn Agent
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter(statusFilter === "running" ? "all" : "running")}
          className={classNames(
            "bg-theme-800 rounded-xl p-3 border cursor-pointer transition-all",
            statusFilter === "running"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-theme-700 hover:border-theme-600"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-theme-400">Running</span>
          </div>
          <span className="text-2xl font-semibold text-white">{stats.running}</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "paused" ? "all" : "paused")}
          className={classNames(
            "bg-theme-800 rounded-xl p-3 border cursor-pointer transition-all",
            statusFilter === "paused"
              ? "border-amber-500 bg-amber-500/10"
              : "border-theme-700 hover:border-theme-600"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm text-theme-400">Paused</span>
          </div>
          <span className="text-2xl font-semibold text-white">{stats.paused}</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "error" ? "all" : "error")}
          className={classNames(
            "bg-theme-800 rounded-xl p-3 border cursor-pointer transition-all",
            statusFilter === "error"
              ? "border-rose-500 bg-rose-500/10"
              : "border-theme-700 hover:border-theme-600"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-sm text-theme-400">Error</span>
          </div>
          <span className="text-2xl font-semibold text-white">{stats.error}</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "idle" ? "all" : "idle")}
          className={classNames(
            "bg-theme-800 rounded-xl p-3 border cursor-pointer transition-all",
            statusFilter === "idle"
              ? "border-theme-500 bg-theme-500/10"
              : "border-theme-700 hover:border-theme-600"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-theme-400" />
            <span className="text-sm text-theme-400">Idle</span>
          </div>
          <span className="text-2xl font-semibold text-white">{stats.idle}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-theme-800 border border-theme-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-theme-400 focus:outline-none focus:border-theme-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-theme-800 border border-theme-700 rounded-lg text-sm text-theme-300 hover:border-theme-500"
            >
              <Filter className="w-4 h-4" />
              <span className="capitalize">{typeFilter === "all" ? "All Types" : typeFilter}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTypeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTypeDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-theme-800 border border-theme-700 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  {(["all", "orchestrator", "coder", "researcher", "planner", "tester", "reviewer", "custom"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setTypeFilter(type)
                          setShowTypeDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-theme-700 text-left capitalize"
                      >
                        {typeFilter === type && <Check className="w-4 h-4 text-theme-400" />}
                        <span className={typeFilter === type ? "text-white" : "text-theme-300"}>
                          {type === "all" ? "All Types" : type}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* View Mode */}
          <div className="flex bg-theme-800 border border-theme-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={classNames(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" ? "bg-theme-600 text-white" : "text-theme-400 hover:text-white"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={classNames(
                "p-2 rounded-md transition-colors",
                viewMode === "list" ? "bg-theme-600 text-white" : "text-theme-400 hover:text-white"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-theme-700">
        <button
          onClick={() => setViewMode("grid")}
          className={classNames(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            viewMode !== "logs"
              ? "border-theme-500 text-white"
              : "border-transparent text-theme-400 hover:text-white"
          )}
        >
          Agents
        </button>
        <button
          onClick={() => setViewMode("logs")}
          className={classNames(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            viewMode === "logs"
              ? "border-theme-500 text-white"
              : "border-transparent text-theme-400 hover:text-white"
          )}
        >
          Live Logs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "logs" ? (
          <div className="flex flex-col gap-3">
            {/* Agent filter for logs */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-theme-400">Filter by agent:</label>
              <select
                value={logAgentFilter}
                onChange={(e) => setLogAgentFilter(e.target.value)}
                className="bg-theme-800 border border-theme-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-theme-500"
              >
                <option value="">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <LogViewer
              logs={logs}
              agentFilter={logAgentFilter || undefined}
              maxHeight="calc(100vh - 400px)"
            />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-theme-800 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-theme-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No agents found</h3>
            <p className="text-theme-400 mb-4">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Spawn your first agent to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Button variant="primary" onClick={() => setShowSpawnModal(true)}>
                <Plus className="w-4 h-4" />
                Spawn Agent
              </Button>
            )}
          </div>
        ) : (
          <div
            className={classNames(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-2"
            )}
          >
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => handleAgentClick(agent)}
                onPause={() => onPauseAgent?.(agent.id)}
                onStop={() => onStopAgent?.(agent.id)}
                onViewLogs={() => {
                  setLogAgentFilter(agent.id)
                  setViewMode("logs")
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAgent(null)
        }}
        agent={selectedAgent}
        logs={logs}
        onPause={() => selectedAgent && onPauseAgent?.(selectedAgent.id)}
        onResume={() => selectedAgent && onResumeAgent?.(selectedAgent.id)}
        onStop={() => selectedAgent && onStopAgent?.(selectedAgent.id)}
      />

      {/* Spawn Agent Modal */}
      <SpawnAgentModal
        open={showSpawnModal}
        onClose={() => setShowSpawnModal(false)}
        onSpawn={handleSpawn}
        projects={projects}
        tasks={tasks}
      />
    </div>
  )
}
