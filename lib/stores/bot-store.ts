import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Connection status types
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// Agent status types
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed';

// Health status types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Model information interface
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength?: number;
  isDefault?: boolean;
}

// Session information interface
export interface Session {
  id: string;
  name: string;
  status: AgentStatus;
  startedAt: string;
  lastActiveAt: string;
  model: string;
  taskId?: string;
  logs: SessionLog[];
}

// Session log entry
export interface SessionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

// Gateway information
export interface GatewayInfo {
  url: string;
  version?: string;
  uptime?: number;
  lastPing?: string;
  latency?: number;
}

// Health check result
export interface HealthCheck {
  status: HealthStatus;
  lastChecked: string;
  details: {
    api: HealthStatus;
    gateway: HealthStatus;
    memory: HealthStatus;
    database?: HealthStatus;
  };
  message?: string;
}

// Agent information
export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  currentTask?: string;
  capabilities: string[];
}

// Bot store state interface
interface BotState {
  // Connection state
  connectionStatus: ConnectionStatus;
  connectionError?: string;

  // Model state
  currentModel: string | null;
  availableModels: ModelInfo[];

  // Session state
  sessions: Session[];
  activeSessionId: string | null;

  // Agent state
  agents: AgentInfo[];

  // Gateway state
  gateway: GatewayInfo | null;

  // Health state
  health: HealthCheck | null;

  // Connection actions
  setConnected: (status: ConnectionStatus, error?: string) => void;
  connect: () => void;
  disconnect: () => void;

  // Model actions
  setModel: (modelId: string) => void;
  setAvailableModels: (models: ModelInfo[]) => void;
  getModelById: (id: string) => ModelInfo | undefined;

  // Session actions
  createSession: (name: string, model?: string) => Session;
  updateSession: (id: string, updates: Partial<Omit<Session, 'id'>>) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  getActiveSession: () => Session | null;
  addSessionLog: (sessionId: string, log: Omit<SessionLog, 'id' | 'timestamp'>) => void;
  clearSessionLogs: (sessionId: string) => void;

  // Agent actions
  setAgents: (agents: AgentInfo[]) => void;
  updateAgent: (id: string, updates: Partial<Omit<AgentInfo, 'id'>>) => void;
  getAgentById: (id: string) => AgentInfo | undefined;

  // Gateway actions
  setGateway: (gateway: GatewayInfo | null) => void;
  updateGatewayLatency: (latency: number) => void;

  // Health actions
  updateHealth: (health: HealthCheck) => void;
  getHealthStatus: () => HealthStatus;

  // Utility actions
  reset: () => void;
}

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString();

// Default models
const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextLength: 200000,
    isDefault: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextLength: 200000,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    contextLength: 200000,
  },
];

// Initial state
const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  connectionError: undefined,
  currentModel: 'claude-sonnet-4-20250514',
  availableModels: DEFAULT_MODELS,
  sessions: [],
  activeSessionId: null,
  agents: [],
  gateway: null,
  health: null,
};

export const useBotStore = create<BotState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Set connection status
      setConnected: (status, error) => {
        set({
          connectionStatus: status,
          connectionError: error,
        });
      },

      // Initiate connection
      connect: () => {
        set({ connectionStatus: 'connecting', connectionError: undefined });
      },

      // Disconnect
      disconnect: () => {
        set({ connectionStatus: 'disconnected', connectionError: undefined });
      },

      // Set current model
      setModel: (modelId) => {
        const model = get().availableModels.find((m) => m.id === modelId);
        if (model) {
          set({ currentModel: modelId });
        }
      },

      // Set available models
      setAvailableModels: (models) => {
        set({ availableModels: models });
        // Set default model if current model is not in the new list
        const currentModel = get().currentModel;
        if (currentModel && !models.find((m) => m.id === currentModel)) {
          const defaultModel = models.find((m) => m.isDefault) || models[0];
          if (defaultModel) {
            set({ currentModel: defaultModel.id });
          }
        }
      },

      // Get model by ID
      getModelById: (id) => {
        return get().availableModels.find((m) => m.id === id);
      },

      // Create a new session
      createSession: (name, model) => {
        const newSession: Session = {
          id: `session_${generateId()}`,
          name,
          status: 'idle',
          startedAt: getTimestamp(),
          lastActiveAt: getTimestamp(),
          model: model || get().currentModel || 'claude-sonnet-4-20250514',
          logs: [],
        };

        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id,
        }));

        return newSession;
      },

      // Update session
      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, ...updates, lastActiveAt: getTimestamp() }
              : session
          ),
        }));
      },

      // Delete session
      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        }));
      },

      // Set active session
      setActiveSession: (id) => {
        set({ activeSessionId: id });
      },

      // Get active session
      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return null;
        return sessions.find((s) => s.id === activeSessionId) || null;
      },

      // Add log to session
      addSessionLog: (sessionId, log) => {
        const newLog: SessionLog = {
          ...log,
          id: `log_${generateId()}`,
          timestamp: getTimestamp(),
        };

        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  logs: [...session.logs, newLog],
                  lastActiveAt: getTimestamp(),
                }
              : session
          ),
        }));
      },

      // Clear session logs
      clearSessionLogs: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, logs: [] }
              : session
          ),
        }));
      },

      // Set agents
      setAgents: (agents) => {
        set({ agents });
      },

      // Update agent
      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        }));
      },

      // Get agent by ID
      getAgentById: (id) => {
        return get().agents.find((a) => a.id === id);
      },

      // Set gateway info
      setGateway: (gateway) => {
        set({ gateway });
      },

      // Update gateway latency
      updateGatewayLatency: (latency) => {
        set((state) => ({
          gateway: state.gateway
            ? { ...state.gateway, latency, lastPing: getTimestamp() }
            : null,
        }));
      },

      // Update health status
      updateHealth: (health) => {
        set({ health });
      },

      // Get overall health status
      getHealthStatus: () => {
        const { health } = get();
        return health?.status || 'unknown';
      },

      // Reset store to initial state
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'moltbot-bot-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentModel: state.currentModel,
        availableModels: state.availableModels,
        sessions: state.sessions.map((s) => ({
          ...s,
          logs: s.logs.slice(-100), // Only persist last 100 logs per session
        })),
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useConnectionStatus = () =>
  useBotStore((state) => state.connectionStatus);

export const useCurrentModel = () =>
  useBotStore((state) => {
    const model = state.availableModels.find((m) => m.id === state.currentModel);
    return model || null;
  });

export const useActiveSession = () =>
  useBotStore((state) => {
    if (!state.activeSessionId) return null;
    return state.sessions.find((s) => s.id === state.activeSessionId) || null;
  });

export const useHealthStatus = () =>
  useBotStore((state) => state.health?.status || 'unknown');

export const useIsConnected = () =>
  useBotStore((state) => state.connectionStatus === 'connected');
