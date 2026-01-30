/**
 * Convert GitHub issues and PRs to Kanban Task format
 * Maps GitHub labels to task priority and labels
 */

import type { Task, TaskPriority, TaskStatus } from '../stores/task-store';
import type { GitHubIssue, GitHubPullRequest } from '../api/github';

/**
 * Label to priority mapping
 * Common GitHub label conventions:
 * - priority/critical, priority/high, priority/medium, priority/low
 * - type/bug, type/feature, type/enhancement
 */
const LABEL_PRIORITY_MAP: Record<string, TaskPriority> = {
  'critical': 'critical',
  'priority/critical': 'critical',
  'urgent': 'critical',
  'high': 'high',
  'priority/high': 'high',
  'important': 'high',
  'medium': 'medium',
  'priority/medium': 'medium',
  'low': 'low',
  'priority/low': 'low',
  'trivial': 'low',
};

/**
 * Determine task status based on issue state
 */
function getTaskStatus(issueState: 'open' | 'closed'): TaskStatus {
  if (issueState === 'closed') {
    return 'done';
  }
  return 'todo';
}

/**
 * Extract priority from issue labels
 * Returns the highest priority found, defaults to 'medium'
 */
function extractPriority(labels: Array<{ name: string }>): TaskPriority {
  const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

  for (const priority of priorities) {
    const found = labels.some(
      (label) =>
        LABEL_PRIORITY_MAP[label.name.toLowerCase()] === priority
    );
    if (found) return priority;
  }

  return 'medium';
}

/**
 * Extract non-priority labels from issue
 * Filters out priority-related labels
 */
function extractTaskLabels(labels: Array<{ name: string }>): string[] {
  return labels
    .map((label) => label.name)
    .filter(
      (name) =>
        !LABEL_PRIORITY_MAP[name.toLowerCase()] &&
        !name.toLowerCase().startsWith('priority/')
    );
}

/**
 * Convert GitHub issue to Kanban Task
 */
export function issueToTask(
  issue: GitHubIssue,
  projectId?: string
): Task {
  const priority = extractPriority(issue.labels);
  const labels = extractTaskLabels(issue.labels);
  const status = getTaskStatus(issue.state);

  return {
    id: `github-issue-${issue.id}`,
    title: issue.title,
    description: issue.body || '',
    status,
    priority,
    projectId,
    assignedAgent: issue.assignee?.login,
    createdAt: new Date(issue.created_at).toISOString(),
    updatedAt: new Date(issue.updated_at).toISOString(),
    dueDate: undefined,
    labels: [...labels, 'github-issue', `#${issue.number}`],
    subtasks: [],
  };
}

/**
 * Convert GitHub PR to Kanban Task
 * PRs are treated as review items with special handling for draft status
 */
export function prToTask(
  pr: GitHubPullRequest,
  projectId?: string
): Task {
  const priority = extractPriority(pr.labels);
  const labels = extractTaskLabels(pr.labels);

  // Draft PRs start in backlog, merged PRs are done, others are in review
  let status: TaskStatus = 'review';
  if (pr.draft) {
    status = 'backlog';
  } else if (pr.merged_at) {
    status = 'done';
  } else if (pr.state === 'closed') {
    status = 'done';
  }

  return {
    id: `github-pr-${pr.id}`,
    title: pr.title,
    description: pr.body || '',
    status,
    priority,
    projectId,
    assignedAgent: pr.assignee?.login,
    createdAt: new Date(pr.created_at).toISOString(),
    updatedAt: new Date(pr.updated_at).toISOString(),
    dueDate: undefined,
    labels: [
      ...labels,
      'github-pr',
      `#${pr.number}`,
      ...(pr.draft ? ['draft'] : []),
      ...(pr.merged_at ? ['merged'] : []),
    ],
    subtasks: [],
  };
}

/**
 * Batch convert multiple issues to tasks
 */
export function issuesToTasks(
  issues: GitHubIssue[],
  projectId?: string
): Task[] {
  return issues.map((issue) => issueToTask(issue, projectId));
}

/**
 * Batch convert multiple PRs to tasks
 */
export function prsToTasks(
  prs: GitHubPullRequest[],
  projectId?: string
): Task[] {
  return prs.map((pr) => prToTask(pr, projectId));
}

/**
 * Get priority color for display (CSS hex color)
 */
export function getPriorityColor(priority: TaskPriority): string {
  const colorMap: Record<TaskPriority, string> = {
    critical: '#ef4444', // red
    high: '#f97316', // orange
    medium: '#eab308', // yellow
    low: '#6366f1', // indigo
  };
  return colorMap[priority];
}
