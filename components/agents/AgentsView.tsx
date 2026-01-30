"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AgentPanel } from "./AgentPanel"
import { SpawnAgentConfig } from "./SpawnAgentModal"
import { Agent, LogEntry, AgentStatus, AgentType } from "./types"
import { useMoltBot } from "@/hooks/useMoltBot"
import { useAgentStore } from "@/lib/stores/agent-store"
import { MoltBotMessage } from "@/lib/api/moltbot"
import { useToast } from "@/components/common/Toast"
import { Loader2, WifiOff, RefreshCw } from "lucide-react"

interface AgentsViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string }[]
  tasks?: { id: string; name: string }[]
}

// Map store agent to component agent type
function mapStoreAgentToAgent(storeAgent: ReturnType<typeof useAgentStore.getState>['agents'][0]): Agent {
  return {
    id: storeAgent.id,
    name: storeAgent.name,
    type: storeAgent.type as AgentType,
    status: storeAgent.status as AgentStatus,
    model: storeAgent.model,
    currentTask: storeAgent.execution.currentStep,
    taskId: storeAgent.currentTaskId,
    progress: storeAgent.execution.progress,
    tokensUsed: storeAgent.resources.tokensUsed,
    maxTokens: storeAgent.resources.tokensRemaining + storeAgent.resources.tokensUsed,
    createdAt: new Date(storeAgent.createdAt),
    projectId: storeAgent.projectId,
    skills: storeAgent.skills,
  }
}

// Map store log to component log type
function mapStoreLogToLogEntry(
  log: { id: string; timestamp: string; level: string; message: string; metadata?: Record<string, unknown> },
  agentId: string,
  agentName: string,
  taskId?: string
): LogEntry {
  return {
    id: log.id,
    timestamp: new Date(log.timestamp),
    level: log.level as LogEntry['level'],
    agentId,
    agentName,
    taskId,
    message: log.message,
  }
}

export function AgentsView({ projectId, projectName, projects = [], tasks = [] }: AgentsViewProps) {
  const { success, error: showError, info } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  // Message handler for MoltBot
  const handleMoltBotMessage = useCallback((message: MoltBotMessage) => {
    // Handle real-time agent messages
    if (message.type === 'agent_spawned' && message.data) {
      const { agentType } = message.data as { agentId: string; agentType: string }
      info("Agent Spawned", `${agentType} agent is now running`)
    } else if (message.type === 'agent_progress' && message.data) {
      const { agentId, progress } = message.data as { agentId: string; progress: number }
      useAgentStore.getState().updateProgress(agentId, progress)
    } else if (message.type === 'agent_completed' && message.data) {
      const { agentId } = message.data as { agentId: string }
      useAgentStore.getState().stopAgent(agentId)
      success("Agent Completed", "Task completed successfully")
    } else if (message.type === 'agent_error' && message.data) {
      const { agentId, error } = message.data as { agentId: string; error: string }
      useAgentStore.getState().setAgentError(agentId, error)
      showError("Agent Error", error)
    } else if (message.type === 'agent_log' && message.data) {
      const { runId, level, message: logMessage } = message.data as {
        agentId: string
        runId: string
        level: string
        message: string
      }
      if (runId) {
        useAgentStore.getState().addLog(runId, level as 'debug' | 'info' | 'warn' | 'error', logMessage)
      }
    }
  }, [info, success, showError])

  // Error handler for MoltBot
  const handleMoltBotError = useCallback((err: Error) => {
    showError("Connection Error", err.message)
  }, [showError])

  // MoltBot connection
  const moltbot = useMoltBot({
    autoConnect: true,
    onMessage: handleMoltBotMessage,
    onError: handleMoltBotError,
  })

  // Agent store
  const agents = useAgentStore((state) => state.agents)
  const runs = useAgentStore((state) => state.runs)
  const spawnStoreAgent = useAgentStore((state) => state.spawnAgent)
  const pauseStoreAgent = useAgentStore((state) => state.pauseAgent)
  const resumeStoreAgent = useAgentStore((state) => state.resumeAgent)
  const stopStoreAgent = useAgentStore((state) => state.stopAgent)

  // Filter agents by project if specified
  const filteredAgents = useMemo(() => {
    const agentList = projectId
      ? agents.filter((a) => a.projectId === projectId || !a.projectId)
      : agents
    return agentList.map(mapStoreAgentToAgent)
  }, [agents, projectId])

  // Collect all logs from runs
  const allLogs = useMemo(() => {
    const logs: LogEntry[] = []
    runs.forEach((run) => {
      const agent = agents.find((a) => a.id === run.agentId)
      run.logs.forEach((log) => {
        logs.push(mapStoreLogToLogEntry(log, run.agentId, agent?.name || 'Unknown', run.taskId))
      })
    })
    // Sort by timestamp descending (newest first)
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [runs, agents])

  // Initialize
  useEffect(() => {
    // Simulate initial loading / sync
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Spawn agent handler
  const handleSpawnAgent = useCallback(async (config: SpawnAgentConfig) => {
    try {
      // Create agent in local store
      spawnStoreAgent(
        {
          name: config.name,
          type: config.type,
          model: config.model,
          skills: config.skills,
          projectId: config.projectId || projectId || undefined,
        },
        config.taskId,
        config.projectId || projectId || undefined
      )

      // Spawn via MoltBot API
      if (config.taskId) {
        await moltbot.spawnAgent({
          taskId: config.taskId,
          agentType: config.type,
          projectId: config.projectId || projectId || undefined,
          config: {
            name: config.name,
            model: config.model,
            skills: config.skills,
          },
        })
      }

      success("Agent Spawned", `${config.name} is now running`)
    } catch (err) {
      showError("Spawn Failed", err instanceof Error ? err.message : "Failed to spawn agent")
    }
  }, [moltbot, spawnStoreAgent, projectId, success, showError])

  // Pause agent handler
  const handlePauseAgent = useCallback(async (agentId: string) => {
    try {
      pauseStoreAgent(agentId)
      await moltbot.pauseAgent(agentId)
      info("Agent Paused", "Agent execution has been paused")
    } catch (err) {
      showError("Pause Failed", err instanceof Error ? err.message : "Failed to pause agent")
    }
  }, [moltbot, pauseStoreAgent, info, showError])

  // Resume agent handler
  const handleResumeAgent = useCallback(async (agentId: string) => {
    try {
      resumeStoreAgent(agentId)
      await moltbot.resumeAgent(agentId)
      info("Agent Resumed", "Agent execution has resumed")
    } catch (err) {
      showError("Resume Failed", err instanceof Error ? err.message : "Failed to resume agent")
    }
  }, [moltbot, resumeStoreAgent, info, showError])

  // Stop agent handler
  const handleStopAgent = useCallback(async (agentId: string) => {
    try {
      stopStoreAgent(agentId)
      await moltbot.stopAgent(agentId)
      info("Agent Stopped", "Agent has been stopped")
    } catch (err) {
      showError("Stop Failed", err instanceof Error ? err.message : "Failed to stop agent")
    }
  }, [moltbot, stopStoreAgent, info, showError])

  // Refresh handler - sync with MoltBot
  const handleRefresh = useCallback(async () => {
    try {
      // For now, just reconnect if not connected
      if (!moltbot.isConnected) {
        await moltbot.connect()
      }
      info("Refreshed", "Agent list has been refreshed")
    } catch (err) {
      showError("Refresh Failed", err instanceof Error ? err.message : "Failed to refresh")
    }
  }, [moltbot, info, showError])

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin mx-auto mb-3" />
          <p className="text-[#71717a]">Loading agents...</p>
        </div>
      </div>
    )
  }

  // Disconnected state
  if (!moltbot.isConnected && !moltbot.isConnecting) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#27272a] flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-[#71717a]" />
          </div>
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Not Connected</h2>
          <p className="text-[#71717a] mb-6">
            Unable to connect to MoltBot. Agent features require an active connection.
          </p>
          <button
            onClick={() => moltbot.connect()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white rounded-lg font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-hidden">
      <AgentPanel
        agents={filteredAgents}
        logs={allLogs}
        projects={projects}
        tasks={tasks}
        onSpawnAgent={handleSpawnAgent}
        onPauseAgent={handlePauseAgent}
        onResumeAgent={handleResumeAgent}
        onStopAgent={handleStopAgent}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
