import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Log level types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  agentId?: string;
  taskId?: string;
  projectId?: string;
  runId?: string;
  source?: string; // Component or module that generated the log
  metadata?: Record<string, unknown>;
}

// Log filter interface
export interface LogFilter {
  levels?: LogLevel[];
  agentId?: string;
  taskId?: string;
  projectId?: string;
  runId?: string;
  source?: string;
  startTime?: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  searchQuery?: string;
}

// Log subscription callback type
export type LogSubscriber = (log: LogEntry) => void;

// Log store state interface
interface LogState {
  logs: LogEntry[];
  filter: LogFilter;
  maxLogs: number; // Maximum number of logs to retain
  subscribers: Map<string, LogSubscriber>;

  // Log actions
  addLog: (
    level: LogLevel,
    message: string,
    options?: {
      agentId?: string;
      taskId?: string;
      projectId?: string;
      runId?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ) => LogEntry;

  // Convenience log methods
  debug: (message: string, options?: Omit<Parameters<LogState['addLog']>[2], never>) => LogEntry;
  info: (message: string, options?: Omit<Parameters<LogState['addLog']>[2], never>) => LogEntry;
  warn: (message: string, options?: Omit<Parameters<LogState['addLog']>[2], never>) => LogEntry;
  error: (message: string, options?: Omit<Parameters<LogState['addLog']>[2], never>) => LogEntry;

  // Log management
  clearLogs: () => void;
  clearLogsByAgent: (agentId: string) => void;
  clearLogsByTask: (taskId: string) => void;
  clearLogsByProject: (projectId: string) => void;
  clearLogsByRun: (runId: string) => void;
  setMaxLogs: (max: number) => void;
  pruneOldLogs: () => void;

  // Filter actions
  setLogFilter: (filter: LogFilter) => void;
  clearLogFilter: () => void;
  updateLogFilter: (updates: Partial<LogFilter>) => void;

  // Subscription for real-time streaming
  subscribeToLogs: (id: string, callback: LogSubscriber) => () => void;
  unsubscribeFromLogs: (id: string) => void;

  // Getters
  getLogById: (id: string) => LogEntry | undefined;
  getLogsByAgent: (agentId: string) => LogEntry[];
  getLogsByTask: (taskId: string) => LogEntry[];
  getLogsByProject: (projectId: string) => LogEntry[];
  getLogsByRun: (runId: string) => LogEntry[];
  getLogsByLevel: (level: LogLevel) => LogEntry[];
  getLogsByTimeRange: (startTime: string, endTime: string) => LogEntry[];
  getFilteredLogs: () => LogEntry[];
  getRecentLogs: (count: number) => LogEntry[];
}

// Generate unique ID for logs
const generateLogId = (): string => {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString();

// Default max logs
const DEFAULT_MAX_LOGS = 10000;

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],
      filter: {},
      maxLogs: DEFAULT_MAX_LOGS,
      subscribers: new Map(),

      // Add a new log entry
      addLog: (level, message, options = {}) => {
        const newLog: LogEntry = {
          id: generateLogId(),
          timestamp: getTimestamp(),
          level,
          message,
          ...options,
        };

        set((state) => {
          const updatedLogs = [...state.logs, newLog];

          // Prune if exceeding max logs
          if (updatedLogs.length > state.maxLogs) {
            return { logs: updatedLogs.slice(-state.maxLogs) };
          }

          return { logs: updatedLogs };
        });

        // Notify subscribers
        const { subscribers } = get();
        subscribers.forEach((callback) => {
          try {
            callback(newLog);
          } catch (err) {
            console.error('Log subscriber error:', err);
          }
        });

        return newLog;
      },

      // Convenience log methods
      debug: (message, options) => get().addLog('debug', message, options),
      info: (message, options) => get().addLog('info', message, options),
      warn: (message, options) => get().addLog('warn', message, options),
      error: (message, options) => get().addLog('error', message, options),

      // Clear all logs
      clearLogs: () => {
        set({ logs: [] });
      },

      // Clear logs by agent
      clearLogsByAgent: (agentId) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.agentId !== agentId),
        }));
      },

      // Clear logs by task
      clearLogsByTask: (taskId) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.taskId !== taskId),
        }));
      },

      // Clear logs by project
      clearLogsByProject: (projectId) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.projectId !== projectId),
        }));
      },

      // Clear logs by run
      clearLogsByRun: (runId) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.runId !== runId),
        }));
      },

      // Set maximum number of logs to retain
      setMaxLogs: (max) => {
        set({ maxLogs: max });
        get().pruneOldLogs();
      },

      // Prune old logs to stay within maxLogs limit
      pruneOldLogs: () => {
        set((state) => {
          if (state.logs.length > state.maxLogs) {
            return { logs: state.logs.slice(-state.maxLogs) };
          }
          return state;
        });
      },

      // Set log filter
      setLogFilter: (filter) => {
        set({ filter });
      },

      // Clear log filter
      clearLogFilter: () => {
        set({ filter: {} });
      },

      // Update log filter (merge with existing)
      updateLogFilter: (updates) => {
        set((state) => ({
          filter: { ...state.filter, ...updates },
        }));
      },

      // Subscribe to log stream
      subscribeToLogs: (id, callback) => {
        set((state) => {
          const newSubscribers = new Map(state.subscribers);
          newSubscribers.set(id, callback);
          return { subscribers: newSubscribers };
        });

        // Return unsubscribe function
        return () => get().unsubscribeFromLogs(id);
      },

      // Unsubscribe from log stream
      unsubscribeFromLogs: (id) => {
        set((state) => {
          const newSubscribers = new Map(state.subscribers);
          newSubscribers.delete(id);
          return { subscribers: newSubscribers };
        });
      },

      // Get log by ID
      getLogById: (id) => {
        return get().logs.find((log) => log.id === id);
      },

      // Get logs by agent
      getLogsByAgent: (agentId) => {
        return get().logs.filter((log) => log.agentId === agentId);
      },

      // Get logs by task
      getLogsByTask: (taskId) => {
        return get().logs.filter((log) => log.taskId === taskId);
      },

      // Get logs by project
      getLogsByProject: (projectId) => {
        return get().logs.filter((log) => log.projectId === projectId);
      },

      // Get logs by run
      getLogsByRun: (runId) => {
        return get().logs.filter((log) => log.runId === runId);
      },

      // Get logs by level
      getLogsByLevel: (level) => {
        return get().logs.filter((log) => log.level === level);
      },

      // Get logs by time range
      getLogsByTimeRange: (startTime, endTime) => {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();

        return get().logs.filter((log) => {
          const logTime = new Date(log.timestamp).getTime();
          return logTime >= start && logTime <= end;
        });
      },

      // Get logs matching current filter
      getFilteredLogs: () => {
        const { logs, filter } = get();

        return logs.filter((log) => {
          // Level filter
          if (filter.levels && filter.levels.length > 0) {
            if (!filter.levels.includes(log.level)) return false;
          }

          // Agent filter
          if (filter.agentId && log.agentId !== filter.agentId) {
            return false;
          }

          // Task filter
          if (filter.taskId && log.taskId !== filter.taskId) {
            return false;
          }

          // Project filter
          if (filter.projectId && log.projectId !== filter.projectId) {
            return false;
          }

          // Run filter
          if (filter.runId && log.runId !== filter.runId) {
            return false;
          }

          // Source filter
          if (filter.source && log.source !== filter.source) {
            return false;
          }

          // Time range filter
          if (filter.startTime || filter.endTime) {
            const logTime = new Date(log.timestamp).getTime();

            if (filter.startTime) {
              const startTime = new Date(filter.startTime).getTime();
              if (logTime < startTime) return false;
            }

            if (filter.endTime) {
              const endTime = new Date(filter.endTime).getTime();
              if (logTime > endTime) return false;
            }
          }

          // Search query filter
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            const matchesMessage = log.message.toLowerCase().includes(query);
            const matchesSource = log.source?.toLowerCase().includes(query);
            const matchesMetadata = log.metadata
              ? JSON.stringify(log.metadata).toLowerCase().includes(query)
              : false;

            if (!matchesMessage && !matchesSource && !matchesMetadata) {
              return false;
            }
          }

          return true;
        });
      },

      // Get most recent logs
      getRecentLogs: (count) => {
        const { logs } = get();
        return logs.slice(-count);
      },
    }),
    {
      name: 'moltbot-log-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        logs: state.logs.slice(-1000), // Only persist last 1000 logs
        filter: state.filter,
        maxLogs: state.maxLogs,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useFilteredLogs = () =>
  useLogStore((state) => state.getFilteredLogs());

export const useLogsByAgent = (agentId: string) =>
  useLogStore((state) => state.logs.filter((l) => l.agentId === agentId));

export const useLogsByTask = (taskId: string) =>
  useLogStore((state) => state.logs.filter((l) => l.taskId === taskId));

export const useLogsByProject = (projectId: string) =>
  useLogStore((state) => state.logs.filter((l) => l.projectId === projectId));

export const useLogsByRun = (runId: string) =>
  useLogStore((state) => state.logs.filter((l) => l.runId === runId));

export const useLogsByLevel = (level: LogLevel) =>
  useLogStore((state) => state.logs.filter((l) => l.level === level));

export const useRecentLogs = (count: number = 50) =>
  useLogStore((state) => state.logs.slice(-count));

export const useLogFilter = () =>
  useLogStore((state) => state.filter);

export const useErrorLogs = () =>
  useLogStore((state) => state.logs.filter((l) => l.level === 'error'));

export const useWarningLogs = () =>
  useLogStore((state) => state.logs.filter((l) => l.level === 'warn' || l.level === 'error'));
