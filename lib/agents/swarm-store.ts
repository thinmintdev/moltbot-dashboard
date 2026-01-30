/**
 * Swarm Agent Store
 * Manages runtime state of the multi-agent swarm
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  SwarmAgent,
  SwarmAgentTemplate,
  SwarmMessage,
  SwarmMessageType,
  MODEL_TIERS,
} from './types';
import { SWARM_AGENT_TEMPLATES, getAgentTemplate } from './templates';

// Generate unique IDs
const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const getTimestamp = (): string => new Date().toISOString();

interface SwarmState {
  // Active agent instances
  agents: SwarmAgent[];

  // Message queue for inter-agent communication
  messages: SwarmMessage[];

  // Task assignments
  taskAssignments: Record<string, string>; // taskId -> agentInstanceId

  // Swarm status
  isRunning: boolean;

  // Agent lifecycle
  spawnAgent: (templateId: string, projectId?: string, parentAgentId?: string) => SwarmAgent | null;
  despawnAgent: (instanceId: string) => void;
  updateAgentStatus: (instanceId: string, status: SwarmAgent['status'], error?: string) => void;
  updateAgentProgress: (instanceId: string, tokensUsed: number, estimatedCost: number) => void;

  // Task management
  assignTask: (instanceId: string, taskId: string) => void;
  unassignTask: (instanceId: string) => void;
  getAgentForTask: (taskId: string) => SwarmAgent | undefined;

  // Inter-agent messaging
  sendMessage: (
    type: SwarmMessageType,
    fromAgentId: string,
    toAgentId: string | 'broadcast',
    payload: Record<string, unknown>,
    taskId?: string
  ) => SwarmMessage;
  getMessagesForAgent: (instanceId: string) => SwarmMessage[];
  clearMessages: (instanceId?: string) => void;

  // Swarm control
  startSwarm: () => void;
  stopSwarm: () => void;
  resetSwarm: () => void;

  // Queries
  getAgentByInstanceId: (instanceId: string) => SwarmAgent | undefined;
  getAgentsByType: (type: SwarmAgent['type']) => SwarmAgent[];
  getAgentsByTier: (tier: SwarmAgent['tier']) => SwarmAgent[];
  getAgentsByStatus: (status: SwarmAgent['status']) => SwarmAgent[];
  getAgentsByProject: (projectId: string) => SwarmAgent[];
  getRunningAgents: () => SwarmAgent[];
  getIdleAgents: () => SwarmAgent[];

  // Stats
  getTotalTokensUsed: () => number;
  getTotalEstimatedCost: () => number;
  getAgentStats: () => {
    total: number;
    running: number;
    idle: number;
    byTier: Record<string, number>;
  };
}

export const useSwarmStore = create<SwarmState>()(
  persist(
    (set, get) => ({
      agents: [],
      messages: [],
      taskAssignments: {},
      isRunning: false,

      // Spawn a new agent instance from a template
      spawnAgent: (templateId, projectId, parentAgentId) => {
        const template = getAgentTemplate(templateId);
        if (!template) {
          console.error(`Agent template not found: ${templateId}`);
          return null;
        }

        const newAgent: SwarmAgent = {
          ...template,
          instanceId: generateId('swarm'),
          status: 'idle',
          projectId,
          parentAgentId,
          childAgentIds: [],
          tokensUsed: 0,
          estimatedCost: 0,
        };

        set((state) => {
          const agents = [...state.agents, newAgent];

          // If parent specified, add this as child
          if (parentAgentId) {
            const parentIdx = agents.findIndex(a => a.instanceId === parentAgentId);
            if (parentIdx !== -1) {
              agents[parentIdx] = {
                ...agents[parentIdx],
                childAgentIds: [...agents[parentIdx].childAgentIds, newAgent.instanceId],
              };
            }
          }

          return { agents };
        });

        return newAgent;
      },

      // Remove an agent instance
      despawnAgent: (instanceId) => {
        set((state) => {
          const agent = state.agents.find(a => a.instanceId === instanceId);
          if (!agent) return state;

          // Remove from parent's children
          let agents = state.agents.filter(a => a.instanceId !== instanceId);
          if (agent.parentAgentId) {
            const parentIdx = agents.findIndex(a => a.instanceId === agent.parentAgentId);
            if (parentIdx !== -1) {
              agents[parentIdx] = {
                ...agents[parentIdx],
                childAgentIds: agents[parentIdx].childAgentIds.filter(id => id !== instanceId),
              };
            }
          }

          // Clean up task assignments
          const taskAssignments = { ...state.taskAssignments };
          Object.keys(taskAssignments).forEach(taskId => {
            if (taskAssignments[taskId] === instanceId) {
              delete taskAssignments[taskId];
            }
          });

          return { agents, taskAssignments };
        });
      },

      // Update agent status
      updateAgentStatus: (instanceId, status, error) => {
        set((state) => ({
          agents: state.agents.map(a =>
            a.instanceId === instanceId
              ? {
                  ...a,
                  status,
                  error,
                  startedAt: status === 'running' && !a.startedAt ? getTimestamp() : a.startedAt,
                  completedAt: ['completed', 'error'].includes(status) ? getTimestamp() : a.completedAt,
                }
              : a
          ),
        }));
      },

      // Update agent token usage
      updateAgentProgress: (instanceId, tokensUsed, estimatedCost) => {
        set((state) => ({
          agents: state.agents.map(a =>
            a.instanceId === instanceId
              ? {
                  ...a,
                  tokensUsed: a.tokensUsed + tokensUsed,
                  estimatedCost: a.estimatedCost + estimatedCost,
                }
              : a
          ),
        }));
      },

      // Assign a task to an agent
      assignTask: (instanceId, taskId) => {
        set((state) => ({
          agents: state.agents.map(a =>
            a.instanceId === instanceId
              ? { ...a, currentTaskId: taskId, status: 'running' as const, startedAt: getTimestamp() }
              : a
          ),
          taskAssignments: { ...state.taskAssignments, [taskId]: instanceId },
        }));
      },

      // Unassign task from agent
      unassignTask: (instanceId) => {
        set((state) => {
          const agent = state.agents.find(a => a.instanceId === instanceId);
          if (!agent?.currentTaskId) return state;

          const taskAssignments = { ...state.taskAssignments };
          delete taskAssignments[agent.currentTaskId];

          return {
            agents: state.agents.map(a =>
              a.instanceId === instanceId
                ? { ...a, currentTaskId: undefined, status: 'idle' as const }
                : a
            ),
            taskAssignments,
          };
        });
      },

      // Get agent assigned to a task
      getAgentForTask: (taskId) => {
        const { agents, taskAssignments } = get();
        const instanceId = taskAssignments[taskId];
        return instanceId ? agents.find(a => a.instanceId === instanceId) : undefined;
      },

      // Send inter-agent message
      sendMessage: (type, fromAgentId, toAgentId, payload, taskId) => {
        const message: SwarmMessage = {
          id: generateId('msg'),
          type,
          fromAgentId,
          toAgentId,
          payload,
          taskId,
          timestamp: getTimestamp(),
        };

        set((state) => ({
          messages: [...state.messages, message],
        }));

        return message;
      },

      // Get messages for an agent
      getMessagesForAgent: (instanceId) => {
        const { messages } = get();
        return messages.filter(
          m => m.toAgentId === instanceId || m.toAgentId === 'broadcast'
        );
      },

      // Clear messages
      clearMessages: (instanceId) => {
        set((state) => ({
          messages: instanceId
            ? state.messages.filter(m => m.toAgentId !== instanceId)
            : [],
        }));
      },

      // Start the swarm
      startSwarm: () => {
        set({ isRunning: true });
      },

      // Stop the swarm
      stopSwarm: () => {
        set((state) => ({
          isRunning: false,
          agents: state.agents.map(a =>
            a.status === 'running' ? { ...a, status: 'paused' as const } : a
          ),
        }));
      },

      // Reset entire swarm
      resetSwarm: () => {
        set({
          agents: [],
          messages: [],
          taskAssignments: {},
          isRunning: false,
        });
      },

      // Query helpers
      getAgentByInstanceId: (instanceId) =>
        get().agents.find(a => a.instanceId === instanceId),

      getAgentsByType: (type) =>
        get().agents.filter(a => a.type === type),

      getAgentsByTier: (tier) =>
        get().agents.filter(a => a.tier === tier),

      getAgentsByStatus: (status) =>
        get().agents.filter(a => a.status === status),

      getAgentsByProject: (projectId) =>
        get().agents.filter(a => a.projectId === projectId),

      getRunningAgents: () =>
        get().agents.filter(a => a.status === 'running'),

      getIdleAgents: () =>
        get().agents.filter(a => a.status === 'idle'),

      // Stats
      getTotalTokensUsed: () =>
        get().agents.reduce((sum, a) => sum + a.tokensUsed, 0),

      getTotalEstimatedCost: () =>
        get().agents.reduce((sum, a) => sum + a.estimatedCost, 0),

      getAgentStats: () => {
        const { agents } = get();
        return {
          total: agents.length,
          running: agents.filter(a => a.status === 'running').length,
          idle: agents.filter(a => a.status === 'idle').length,
          byTier: {
            T1: agents.filter(a => a.tier === 'T1').length,
            T2: agents.filter(a => a.tier === 'T2').length,
            T3: agents.filter(a => a.tier === 'T3').length,
          },
        };
      },
    }),
    {
      name: 'moltbot-swarm-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        agents: state.agents,
        messages: state.messages.slice(-100), // Keep last 100 messages
        taskAssignments: state.taskAssignments,
      }),
    }
  )
);

// Selector hooks
export const useSwarmAgents = () => useSwarmStore((state) => state.agents);
export const useSwarmRunning = () => useSwarmStore((state) => state.isRunning);
export const useSwarmStats = () => useSwarmStore((state) => state.getAgentStats());
export const useRunningAgents = () => useSwarmStore((state) => state.agents.filter(a => a.status === 'running'));
