/**
 * Insights Store
 * Manages AI-powered analytics and project intelligence
 */

import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

export type InsightType = 'trend' | 'alert' | 'recommendation' | 'metric'
export type MetricType = 'task_completion_rate' | 'agent_efficiency' | 'bug_fix_time' | 'code_quality'

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  value: string | number
  change: number // percentage change (+/-)
  status: 'positive' | 'negative' | 'neutral'
  projectId: string
  metricType?: MetricType
  createdAt: string
}

export interface InsightsStore {
  insights: Insight[]
  addInsight: (insight: Omit<Insight, 'id' | 'createdAt'>) => void
  getInsightsByProject: (projectId: string) => Insight[]
  getInsightsByType: (projectId: string, type: InsightType) => Insight[]
}

// ============================================================================
// Type Colors
// ============================================================================

export const INSIGHT_TYPE_COLORS: Record<InsightType, string> = {
  trend: '#3b82f6',
  alert: '#ef4444',
  recommendation: '#f97316',
  metric: '#22c55e',
}

export const STATUS_COLORS: Record<Insight['status'], string> = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#71717a',
}

// ============================================================================
// Demo Data
// ============================================================================

const demoInsights: Insight[] = [
  // MoltBot Dashboard (proj-1) insights
  {
    id: 'insight-1',
    type: 'metric',
    title: 'Task Completion Rate',
    description: 'Overall task completion rate improved this week compared to last week.',
    value: '78%',
    change: 12,
    status: 'positive',
    projectId: 'proj-1',
    metricType: 'task_completion_rate',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-2',
    type: 'trend',
    title: 'Agent Utilization Rising',
    description: 'AI agent usage has increased by 25% over the past 7 days, indicating higher automation adoption.',
    value: '25%',
    change: 25,
    status: 'positive',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-3',
    type: 'alert',
    title: 'Blocked Tasks Increasing',
    description: 'Number of blocked tasks has increased. Consider reviewing dependencies and removing blockers.',
    value: '4 tasks',
    change: -15,
    status: 'negative',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-4',
    type: 'recommendation',
    title: 'Consider Code Review Automation',
    description: 'Based on your workflow patterns, adding automated code review could reduce review time by ~40%.',
    value: '40%',
    change: 0,
    status: 'neutral',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-5',
    type: 'metric',
    title: 'Agent Efficiency Score',
    description: 'Average agent task completion speed has improved. Agents are completing tasks faster.',
    value: '92',
    change: 8,
    status: 'positive',
    projectId: 'proj-1',
    metricType: 'agent_efficiency',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-6',
    type: 'trend',
    title: 'Sprint Velocity Stable',
    description: 'Your team maintains a consistent sprint velocity of 24 story points per sprint.',
    value: '24 pts',
    change: 2,
    status: 'positive',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  // MoltenCalc (proj-2) insights
  {
    id: 'insight-7',
    type: 'metric',
    title: 'Task Completion Rate',
    description: 'Task completion rate has slightly decreased this week. Review pending tasks.',
    value: '62%',
    change: -5,
    status: 'negative',
    projectId: 'proj-2',
    metricType: 'task_completion_rate',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-8',
    type: 'alert',
    title: 'Bug Fix Time Increasing',
    description: 'Average time to fix bugs has increased to 4.2 hours. Consider prioritizing bug fixes.',
    value: '4.2 hrs',
    change: -18,
    status: 'negative',
    projectId: 'proj-2',
    metricType: 'bug_fix_time',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-9',
    type: 'recommendation',
    title: 'Add Unit Test Coverage',
    description: 'Current test coverage is 45%. Adding tests for core calculations would prevent regressions.',
    value: '45%',
    change: 0,
    status: 'neutral',
    projectId: 'proj-2',
    metricType: 'code_quality',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-10',
    type: 'trend',
    title: 'Feature Requests Growing',
    description: 'New feature requests have increased by 30% this month, showing strong user interest.',
    value: '12 requests',
    change: 30,
    status: 'positive',
    projectId: 'proj-2',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-11',
    type: 'metric',
    title: 'Code Quality Score',
    description: 'Static analysis shows improved code quality metrics with fewer lint warnings.',
    value: '85',
    change: 5,
    status: 'positive',
    projectId: 'proj-2',
    metricType: 'code_quality',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'insight-12',
    type: 'recommendation',
    title: 'Refactor Calculator Engine',
    description: 'The calculation engine has grown complex. Consider extracting operations into separate modules.',
    value: '320 LOC',
    change: 0,
    status: 'neutral',
    projectId: 'proj-2',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================================================
// Store Implementation
// ============================================================================

export const useInsightsStore = create<InsightsStore>((set, get) => ({
  insights: demoInsights,

  addInsight: (insightData) => {
    const newInsight: Insight = {
      ...insightData,
      id: `insight-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      insights: [newInsight, ...state.insights],
    }))
  },

  getInsightsByProject: (projectId) => {
    return get().insights.filter((insight) => insight.projectId === projectId)
  },

  getInsightsByType: (projectId, type) => {
    return get().insights.filter(
      (insight) => insight.projectId === projectId && insight.type === type
    )
  },
}))

// ============================================================================
// Hooks
// ============================================================================

export function useProjectInsights(projectId: string | null | undefined) {
  const insights = useInsightsStore((s) => s.insights)

  if (!projectId) return []
  return insights.filter((i) => i.projectId === projectId)
}

export function useInsightStats(projectId: string | null | undefined) {
  const insights = useProjectInsights(projectId)

  // Calculate demo stats (in production these would come from real data)
  const tasksCompleted = insights.length > 0 ? Math.floor(Math.random() * 20) + 15 : 0
  const agentRuns = insights.length > 0 ? Math.floor(Math.random() * 50) + 30 : 0
  const avgCompletionTime = insights.length > 0 ? (Math.random() * 2 + 1).toFixed(1) : '0'
  const activeIssues = insights.length > 0 ? Math.floor(Math.random() * 10) + 3 : 0

  return {
    tasksCompleted,
    agentRuns,
    avgCompletionTime,
    activeIssues,
    trends: insights.filter((i) => i.type === 'trend').length,
    alerts: insights.filter((i) => i.type === 'alert').length,
    recommendations: insights.filter((i) => i.type === 'recommendation').length,
    metrics: insights.filter((i) => i.type === 'metric').length,
  }
}
