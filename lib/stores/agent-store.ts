import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Agent types
export type AgentType = 'orchestrator' | 'coder' | 'researcher' | 'reviewer' | 'tester' | 'planner' | 'custom';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed';
export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Agent execution state
export interface AgentExecution {
  startedAt?: string;
  progress: number; // 0-100
  currentStep?: string;
  error?: string;
}

// Agent resource usage
export interface AgentResources {
  tokensUsed: number;
  tokensRemaining: number;
  estimatedCost: number;
}

// Agent interface
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  currentTaskId?: string;
  projectId?: string;
  model: string;
  skills: string[];

  // Execution state
  execution: AgentExecution;

  // Resource usage
  resources: AgentResources;

  createdAt: string;
  updatedAt: string;
}

// Agent log entry
export interface AgentLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

// Agent run (execution instance)
export interface AgentRun {
  id: string;
  agentId: string;
  taskId: string;
  projectId: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string;
  logs: AgentLog[];
  result?: unknown;
  error?: string;
}

// Agent creation input
export type AgentInput = Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'execution' | 'resources' | 'status'> & {
  status?: AgentStatus;
  execution?: Partial<AgentExecution>;
  resources?: Partial<AgentResources>;
};

// Agent run creation input
export type AgentRunInput = Omit<AgentRun, 'id' | 'startedAt' | 'logs' | 'status'> & {
  status?: AgentRunStatus;
};

// Agent store state interface
interface AgentState {
  agents: Agent[];
  runs: AgentRun[];
  activeAgentId: string | null;

  // Agent CRUD actions
  addAgent: (agent: AgentInput) => Agent;
  updateAgent: (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => void;
  deleteAgent: (id: string) => void;

  // Agent lifecycle actions
  spawnAgent: (agentInput: AgentInput, taskId?: string, projectId?: string) => Agent;
  stopAgent: (id: string, error?: string) => void;
  pauseAgent: (id: string) => void;
  resumeAgent: (id: string) => void;

  // Task assignment
  assignTask: (agentId: string, taskId: string) => void;
  unassignTask: (agentId: string) => void;

  // Progress tracking
  updateProgress: (agentId: string, progress: number, currentStep?: string) => void;
  setAgentError: (agentId: string, error: string) => void;
  clearAgentError: (agentId: string) => void;

  // Resource tracking
  updateResources: (agentId: string, resources: Partial<AgentResources>) => void;
  consumeTokens: (agentId: string, tokens: number, cost: number) => void;

  // Run management
  createRun: (runInput: AgentRunInput) => AgentRun;
  updateRun: (runId: string, updates: Partial<Omit<AgentRun, 'id' | 'startedAt'>>) => void;
  completeRun: (runId: string, result?: unknown) => void;
  failRun: (runId: string, error: string) => void;
  cancelRun: (runId: string) => void;

  // Logging
  addLog: (runId: string, level: LogLevel, message: string, metadata?: Record<string, unknown>) => AgentLog;
  getAgentLogs: (agentId: string) => AgentLog[];
  getRunLogs: (runId: string) => AgentLog[];

  // Queries
  getAgentById: (id: string) => Agent | undefined;
  getAgentsByStatus: (status: AgentStatus) => Agent[];
  getAgentsByType: (type: AgentType) => Agent[];
  getAgentsByProject: (projectId: string) => Agent[];
  getRunsByTask: (taskId: string) => AgentRun[];
  getRunsByAgent: (agentId: string) => AgentRun[];
  getRunsByProject: (projectId: string) => AgentRun[];
  getActiveRuns: () => AgentRun[];

  // Active agent management
  setActiveAgent: (id: string | null) => void;
  getActiveAgent: () => Agent | null;
}

// Generate unique ID for agents
const generateAgentId = (): string => {
  return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Generate unique ID for runs
const generateRunId = (): string => {
  return `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Generate unique ID for logs
const generateLogId = (): string => {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString();

// Default execution state
const getDefaultExecution = (): AgentExecution => ({
  progress: 0,
});

// Default resource state
const getDefaultResources = (): AgentResources => ({
  tokensUsed: 0,
  tokensRemaining: 100000, // Default token limit
  estimatedCost: 0,
});

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      runs: [],
      activeAgentId: null,

      // Add a new agent
      addAgent: (agentData) => {
        const newAgent: Agent = {
          ...agentData,
          id: generateAgentId(),
          status: agentData.status || 'idle',
          execution: {
            ...getDefaultExecution(),
            ...agentData.execution,
          },
          resources: {
            ...getDefaultResources(),
            ...agentData.resources,
          },
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        };

        set((state) => ({
          agents: [...state.agents, newAgent],
        }));

        return newAgent;
      },

      // Update an existing agent
      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? { ...agent, ...updates, updatedAt: getTimestamp() }
              : agent
          ),
        }));
      },

      // Delete an agent
      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
          activeAgentId: state.activeAgentId === id ? null : state.activeAgentId,
        }));
      },

      // Spawn a new agent (create and optionally assign to task/project)
      spawnAgent: (agentInput, taskId, projectId) => {
        const agent = get().addAgent({
          ...agentInput,
          status: 'running',
          execution: {
            ...getDefaultExecution(),
            startedAt: getTimestamp(),
            ...agentInput.execution,
          },
        });

        // Assign task and project if provided
        if (taskId) {
          get().assignTask(agent.id, taskId);
        }
        if (projectId) {
          get().updateAgent(agent.id, { projectId });
        }

        return agent;
      },

      // Stop an agent
      stopAgent: (id, error) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? {
                  ...agent,
                  status: error ? 'error' : 'completed',
                  execution: {
                    ...agent.execution,
                    progress: error ? agent.execution.progress : 100,
                    error,
                  },
                  currentTaskId: undefined,
                  updatedAt: getTimestamp(),
                }
              : agent
          ),
        }));
      },

      // Pause an agent
      pauseAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id && agent.status === 'running'
              ? { ...agent, status: 'paused', updatedAt: getTimestamp() }
              : agent
          ),
        }));
      },

      // Resume a paused agent
      resumeAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id && agent.status === 'paused'
              ? { ...agent, status: 'running', updatedAt: getTimestamp() }
              : agent
          ),
        }));
      },

      // Assign a task to an agent
      assignTask: (agentId, taskId) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? { ...agent, currentTaskId: taskId, updatedAt: getTimestamp() }
              : agent
          ),
        }));
      },

      // Unassign task from an agent
      unassignTask: (agentId) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? { ...agent, currentTaskId: undefined, updatedAt: getTimestamp() }
              : agent
          ),
        }));
      },

      // Update agent progress
      updateProgress: (agentId, progress, currentStep) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  execution: {
                    ...agent.execution,
                    progress: Math.min(100, Math.max(0, progress)),
                    currentStep: currentStep ?? agent.execution.currentStep,
                  },
                  updatedAt: getTimestamp(),
                }
              : agent
          ),
        }));
      },

      // Set agent error
      setAgentError: (agentId, error) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  status: 'error',
                  execution: { ...agent.execution, error },
                  updatedAt: getTimestamp(),
                }
              : agent
          ),
        }));
      },

      // Clear agent error
      clearAgentError: (agentId) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  status: 'idle',
                  execution: { ...agent.execution, error: undefined },
                  updatedAt: getTimestamp(),
                }
              : agent
          ),
        }));
      },

      // Update agent resources
      updateResources: (agentId, resources) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  resources: { ...agent.resources, ...resources },
                  updatedAt: getTimestamp(),
                }
              : agent
          ),
        }));
      },

      // Consume tokens (add to used, subtract from remaining)
      consumeTokens: (agentId, tokens, cost) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  resources: {
                    ...agent.resources,
                    tokensUsed: agent.resources.tokensUsed + tokens,
                    tokensRemaining: Math.max(0, agent.resources.tokensRemaining - tokens),
                    estimatedCost: agent.resources.estimatedCost + cost,
                  },
                  updatedAt: getTimestamp(),
                }
              : agent
          ),
        }));
      },

      // Create a new run
      createRun: (runInput) => {
        const newRun: AgentRun = {
          ...runInput,
          id: generateRunId(),
          status: runInput.status || 'queued',
          startedAt: getTimestamp(),
          logs: [],
        };

        set((state) => ({
          runs: [...state.runs, newRun],
        }));

        return newRun;
      },

      // Update a run
      updateRun: (runId, updates) => {
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === runId ? { ...run, ...updates } : run
          ),
        }));
      },

      // Complete a run successfully
      completeRun: (runId, result) => {
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === runId
              ? {
                  ...run,
                  status: 'completed',
                  completedAt: getTimestamp(),
                  result,
                }
              : run
          ),
        }));
      },

      // Fail a run
      failRun: (runId, error) => {
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === runId
              ? {
                  ...run,
                  status: 'failed',
                  completedAt: getTimestamp(),
                  error,
                }
              : run
          ),
        }));
      },

      // Cancel a run
      cancelRun: (runId) => {
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === runId
              ? {
                  ...run,
                  status: 'cancelled',
                  completedAt: getTimestamp(),
                }
              : run
          ),
        }));
      },

      // Add a log entry to a run
      addLog: (runId, level, message, metadata) => {
        const newLog: AgentLog = {
          id: generateLogId(),
          timestamp: getTimestamp(),
          level,
          message,
          metadata,
        };

        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === runId
              ? { ...run, logs: [...run.logs, newLog] }
              : run
          ),
        }));

        return newLog;
      },

      // Get all logs for an agent (from all runs)
      getAgentLogs: (agentId) => {
        const { runs } = get();
        const agentRuns = runs.filter((run) => run.agentId === agentId);
        return agentRuns.flatMap((run) => run.logs).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      },

      // Get logs for a specific run
      getRunLogs: (runId) => {
        const run = get().runs.find((r) => r.id === runId);
        return run?.logs || [];
      },

      // Get agent by ID
      getAgentById: (id) => {
        return get().agents.find((agent) => agent.id === id);
      },

      // Get agents by status
      getAgentsByStatus: (status) => {
        return get().agents.filter((agent) => agent.status === status);
      },

      // Get agents by type
      getAgentsByType: (type) => {
        return get().agents.filter((agent) => agent.type === type);
      },

      // Get agents by project
      getAgentsByProject: (projectId) => {
        return get().agents.filter((agent) => agent.projectId === projectId);
      },

      // Get runs by task
      getRunsByTask: (taskId) => {
        return get().runs.filter((run) => run.taskId === taskId);
      },

      // Get runs by agent
      getRunsByAgent: (agentId) => {
        return get().runs.filter((run) => run.agentId === agentId);
      },

      // Get runs by project
      getRunsByProject: (projectId) => {
        return get().runs.filter((run) => run.projectId === projectId);
      },

      // Get active (running or queued) runs
      getActiveRuns: () => {
        return get().runs.filter(
          (run) => run.status === 'running' || run.status === 'queued'
        );
      },

      // Set active agent
      setActiveAgent: (id) => {
        set({ activeAgentId: id });
      },

      // Get active agent
      getActiveAgent: () => {
        const { agents, activeAgentId } = get();
        if (!activeAgentId) return null;
        return agents.find((a) => a.id === activeAgentId) || null;
      },
    }),
    {
      name: 'moltbot-agent-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        agents: state.agents,
        runs: state.runs,
        activeAgentId: state.activeAgentId,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useActiveAgent = () =>
  useAgentStore((state) => {
    if (!state.activeAgentId) return null;
    return state.agents.find((a) => a.id === state.activeAgentId) || null;
  });

export const useAgentById = (id: string) =>
  useAgentStore((state) => state.agents.find((a) => a.id === id));

export const useAgentsByStatus = (status: AgentStatus) =>
  useAgentStore((state) => state.agents.filter((a) => a.status === status));

export const useAgentsByProject = (projectId: string) =>
  useAgentStore((state) => state.agents.filter((a) => a.projectId === projectId));

export const useRunningAgents = () =>
  useAgentStore((state) => state.agents.filter((a) => a.status === 'running'));

export const useIdleAgents = () =>
  useAgentStore((state) => state.agents.filter((a) => a.status === 'idle'));

export const useRunsByTask = (taskId: string) =>
  useAgentStore((state) => state.runs.filter((r) => r.taskId === taskId));

export const useRunsByAgent = (agentId: string) =>
  useAgentStore((state) => state.runs.filter((r) => r.agentId === agentId));

export const useActiveRuns = () =>
  useAgentStore((state) =>
    state.runs.filter((r) => r.status === 'running' || r.status === 'queued')
  );
