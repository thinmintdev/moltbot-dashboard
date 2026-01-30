/**
 * Multi-Agent Swarm System
 * Exports all agent-related functionality
 */

// Types
export * from './types';

// Agent templates
export {
  SWARM_AGENT_TEMPLATES,
  getAgentTemplate,
  getAgentsByTier,
  getAgentsByRole,
} from './templates';

// Execution backends
export {
  type ExecutionBackend,
  LocalExecutor,
  DockerExecutor,
  createExecutor,
} from './executor';

// Swarm store
export {
  useSwarmStore,
  useSwarmAgents,
  useSwarmRunning,
  useSwarmStats,
  useRunningAgents,
} from './swarm-store';

// Orchestrator functions
export {
  analyzeTask,
  routeTask,
  estimateTaskCost,
  getAgentForSkill,
  initializeSwarmForProject,
  executeTaskWithSwarm,
  getSwarmHealth,
} from './orchestrator';

// Task Manager - completion detection and decision making
export {
  logTaskEvent,
  decideTaskFate,
  executeTaskDecision,
  startTaskMonitoring,
  stopTaskMonitoring,
  updateTaskMonitoringProgress,
  markTaskComplete,
  executeSubtask,
  getMonitoredTasks,
  clearAllMonitoring,
  DEFAULT_COMPLETION_SETTINGS,
  type TaskCompletionSettings,
  type TaskDecision,
  type TaskDecisionResult,
} from './task-manager';
