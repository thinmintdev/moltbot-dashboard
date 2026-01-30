/**
 * Task Manager - Handles task lifecycle, completion detection, and decision making
 *
 * This module provides:
 * 1. Auto-completion detection for tasks without explicit completion signals
 * 2. Decision agent logic to determine task fate (complete/fail/retry)
 * 3. Subtask execution triggering
 * 4. Activity logging integration
 */

import { useTaskStore, Task, TaskStatus } from '../stores/task-store';
import { useLogStore } from '../stores/log-store';
import { useAgentStore } from '../stores/agent-store';

// Task completion settings that can be overridden per-task
export interface TaskCompletionSettings {
  autoComplete: boolean;           // Auto-complete when conditions met
  autoCompleteTimeout: number;     // ms to wait before auto-completing (default: 30000)
  requiresReview: boolean;         // Move to review vs done
  requiresVerification: boolean;   // Require explicit verification
  maxRetries: number;              // Max retry attempts on failure
  executeSubtasks: boolean;        // Execute subtasks as separate agent runs
}

export const DEFAULT_COMPLETION_SETTINGS: TaskCompletionSettings = {
  autoComplete: true,
  autoCompleteTimeout: 30000,      // 30 seconds
  requiresReview: true,            // Default to review column
  requiresVerification: false,
  maxRetries: 2,
  executeSubtasks: false,          // Default: subtasks are manual checkboxes
};

// Task decision types
export type TaskDecision =
  | 'complete'      // Task finished successfully
  | 'fail'          // Task failed
  | 'retry'         // Retry the task
  | 'escalate'      // Needs human intervention
  | 'timeout'       // Task timed out
  | 'pending';      // Still waiting

// Decision result from the decision agent
export interface TaskDecisionResult {
  decision: TaskDecision;
  reason: string;
  nextStatus?: TaskStatus;
  metadata?: Record<string, unknown>;
}

// Active task monitoring state
interface MonitoredTask {
  taskId: string;
  startedAt: number;
  lastProgressAt: number;
  settings: TaskCompletionSettings;
  retryCount: number;
}

// Task manager singleton state
let monitoredTasks: Map<string, MonitoredTask> = new Map();
let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Log a task event to the activity log
 */
export function logTaskEvent(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  taskId: string,
  options?: {
    agentId?: string;
    runId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const logStore = useLogStore.getState();
  const taskStore = useTaskStore.getState();
  const task = taskStore.getTaskById(taskId);

  logStore.addLog(level, message, {
    taskId,
    projectId: task?.projectId,
    agentId: options?.agentId || task?.assignedAgent,
    runId: options?.runId || task?.agentRunId,
    source: 'TaskManager',
    metadata: {
      taskTitle: task?.title,
      taskStatus: task?.status,
      ...options?.metadata,
    },
  });
}

/**
 * Decision Agent - Determines what should happen to a task
 */
export function decideTaskFate(
  taskId: string,
  settings: TaskCompletionSettings = DEFAULT_COMPLETION_SETTINGS
): TaskDecisionResult {
  const taskStore = useTaskStore.getState();
  const agentStore = useAgentStore.getState();
  const task = taskStore.getTaskById(taskId);

  if (!task) {
    return { decision: 'fail', reason: 'Task not found' };
  }

  const monitored = monitoredTasks.get(taskId);
  const now = Date.now();

  // Check if task is still in progress
  if (task.status !== 'inProgress') {
    return { decision: 'pending', reason: 'Task not in progress' };
  }

  // Check progress - if at 100%, it's complete
  if (task.progress >= 100) {
    return {
      decision: 'complete',
      reason: 'Task reached 100% progress',
      nextStatus: settings.requiresReview ? 'review' : 'done',
    };
  }

  // Check for associated agent run
  if (task.agentRunId) {
    const runs = agentStore.runs.filter(r => r.id === task.agentRunId);
    const latestRun = runs[runs.length - 1];

    if (latestRun) {
      if (latestRun.status === 'completed') {
        return {
          decision: 'complete',
          reason: 'Agent run completed',
          nextStatus: settings.requiresReview ? 'review' : 'done',
          metadata: { runId: latestRun.id, result: latestRun.result },
        };
      }

      if (latestRun.status === 'failed') {
        const retryCount = monitored?.retryCount || 0;
        if (retryCount < settings.maxRetries) {
          return {
            decision: 'retry',
            reason: `Agent run failed, retry ${retryCount + 1}/${settings.maxRetries}`,
            metadata: { error: latestRun.error },
          };
        }
        return {
          decision: 'fail',
          reason: `Agent run failed after ${settings.maxRetries} retries`,
          nextStatus: 'backlog',
          metadata: { error: latestRun.error },
        };
      }
    }
  }

  // Check for timeout
  if (monitored && settings.autoComplete) {
    const elapsed = now - monitored.startedAt;
    const sincLastProgress = now - monitored.lastProgressAt;

    // If no progress for 2x the timeout, consider it stalled
    if (sincLastProgress > settings.autoCompleteTimeout * 2) {
      return {
        decision: 'timeout',
        reason: `No progress for ${Math.round(sincLastProgress / 1000)}s`,
        nextStatus: 'backlog',
        metadata: { elapsed, lastProgress: monitored.lastProgressAt },
      };
    }

    // If task has been running long enough and has some progress, auto-complete
    if (elapsed > settings.autoCompleteTimeout && task.progress > 0) {
      return {
        decision: 'complete',
        reason: `Auto-completing after ${Math.round(elapsed / 1000)}s with ${task.progress}% progress`,
        nextStatus: settings.requiresReview ? 'review' : 'done',
      };
    }
  }

  return { decision: 'pending', reason: 'Task still in progress' };
}

/**
 * Execute the decision for a task
 */
export function executeTaskDecision(taskId: string, decision: TaskDecisionResult): void {
  const taskStore = useTaskStore.getState();
  const task = taskStore.getTaskById(taskId);

  if (!task) return;

  switch (decision.decision) {
    case 'complete':
      taskStore.completeAgentTask(taskId);
      logTaskEvent('info', `Task completed: ${decision.reason}`, taskId, {
        metadata: decision.metadata,
      });
      monitoredTasks.delete(taskId);
      break;

    case 'fail':
      taskStore.failAgentTask(taskId);
      logTaskEvent('error', `Task failed: ${decision.reason}`, taskId, {
        metadata: decision.metadata,
      });
      monitoredTasks.delete(taskId);
      break;

    case 'timeout':
      taskStore.failAgentTask(taskId);
      logTaskEvent('warn', `Task timed out: ${decision.reason}`, taskId, {
        metadata: decision.metadata,
      });
      monitoredTasks.delete(taskId);
      break;

    case 'retry':
      const monitored = monitoredTasks.get(taskId);
      if (monitored) {
        monitored.retryCount++;
        monitored.startedAt = Date.now();
        monitored.lastProgressAt = Date.now();
      }
      logTaskEvent('warn', `Retrying task: ${decision.reason}`, taskId, {
        metadata: decision.metadata,
      });
      // TODO: Trigger actual retry via MoltBot
      break;

    case 'escalate':
      logTaskEvent('warn', `Task escalated: ${decision.reason}`, taskId, {
        metadata: decision.metadata,
      });
      // Could show a notification or move to a special column
      break;
  }
}

/**
 * Start monitoring a task for completion
 */
export function startTaskMonitoring(
  taskId: string,
  settings: Partial<TaskCompletionSettings> = {}
): void {
  const fullSettings = { ...DEFAULT_COMPLETION_SETTINGS, ...settings };

  monitoredTasks.set(taskId, {
    taskId,
    startedAt: Date.now(),
    lastProgressAt: Date.now(),
    settings: fullSettings,
    retryCount: 0,
  });

  logTaskEvent('info', 'Task monitoring started', taskId, {
    metadata: { settings: fullSettings },
  });

  // Ensure monitor loop is running
  startMonitorLoop();
}

/**
 * Stop monitoring a task
 */
export function stopTaskMonitoring(taskId: string): void {
  monitoredTasks.delete(taskId);

  // Stop loop if no more tasks
  if (monitoredTasks.size === 0 && monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

/**
 * Update task progress (call this when progress events come in)
 */
export function updateTaskMonitoringProgress(taskId: string): void {
  const monitored = monitoredTasks.get(taskId);
  if (monitored) {
    monitored.lastProgressAt = Date.now();
  }
}

/**
 * Monitor loop - checks all monitored tasks periodically
 */
function startMonitorLoop(): void {
  if (monitorInterval) return;

  monitorInterval = setInterval(() => {
    monitoredTasks.forEach((monitored, taskId) => {
      const decision = decideTaskFate(taskId, monitored.settings);

      if (decision.decision !== 'pending') {
        executeTaskDecision(taskId, decision);
      }
    });
  }, 5000); // Check every 5 seconds
}

/**
 * Mark a task as complete manually (for simple tasks like "say hello")
 */
export function markTaskComplete(
  taskId: string,
  options?: {
    moveToReview?: boolean;
    reason?: string;
  }
): void {
  const taskStore = useTaskStore.getState();
  const task = taskStore.getTaskById(taskId);

  if (!task) return;

  if (options?.moveToReview !== false) {
    taskStore.completeAgentTask(taskId);
  } else {
    taskStore.updateTask(taskId, { status: 'done', progress: 100 });
  }

  logTaskEvent('info', options?.reason || 'Task marked complete', taskId);
  stopTaskMonitoring(taskId);
}

/**
 * Execute a subtask as a separate agent run
 */
export async function executeSubtask(
  taskId: string,
  subtaskId: string
): Promise<void> {
  const taskStore = useTaskStore.getState();
  const task = taskStore.getTaskById(taskId);

  if (!task) return;

  const subtask = task.subtasks.find(s => s.id === subtaskId);
  if (!subtask) return;

  logTaskEvent('info', `Executing subtask: ${subtask.title}`, taskId, {
    metadata: { subtaskId, subtaskTitle: subtask.title },
  });

  // TODO: Trigger actual subtask execution via MoltBot
  // For now, just mark it complete after a delay (simulating execution)
  setTimeout(() => {
    taskStore.toggleSubtask(taskId, subtaskId);
    logTaskEvent('info', `Subtask completed: ${subtask.title}`, taskId, {
      metadata: { subtaskId },
    });
  }, 2000);
}

/**
 * Get all currently monitored tasks
 */
export function getMonitoredTasks(): Map<string, MonitoredTask> {
  return new Map(monitoredTasks);
}

/**
 * Clear all monitoring (for cleanup)
 */
export function clearAllMonitoring(): void {
  monitoredTasks.clear();
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
