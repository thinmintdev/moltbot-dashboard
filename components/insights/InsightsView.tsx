"use client"

import { useState, useMemo, useCallback } from "react"
import classNames from "classnames"
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  CheckCircle,
  Clock,
  Bug,
  Zap,
} from "lucide-react"
import { InsightCard } from "./InsightCard"
import {
  useInsightsStore,
  useProjectInsights,
  useInsightStats,
  type InsightType,
} from "@/lib/stores/insights-store"

// ============================================================================
// Types
// ============================================================================

interface InsightsViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string }[]
}

type FilterType = "all" | InsightType

// ============================================================================
// Filter Configuration
// ============================================================================

const filterConfig: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "trend", label: "Trends", icon: TrendingUp },
  { value: "alert", label: "Alerts", icon: AlertTriangle },
  { value: "recommendation", label: "Recommendations", icon: Lightbulb },
  { value: "metric", label: "Metrics", icon: BarChart3 },
]

// ============================================================================
// Stats Card Component
// ============================================================================

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  trend?: string
}) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-sm text-[#71717a]">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-[#fafafa]">{value}</span>
        {trend && (
          <span className="text-xs text-[#22c55e]">{trend}</span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function InsightsView({
  projectId,
  projectName,
  projects = [],
}: InsightsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get insights and stats
  const insights = useProjectInsights(projectId)
  const stats = useInsightStats(projectId)

  // Filter insights
  const filteredInsights = useMemo(() => {
    if (activeFilter === "all") return insights
    return insights.filter((i) => i.type === activeFilter)
  }, [insights, activeFilter])

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Simulate refresh - in production this would fetch from AI analytics API
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsRefreshing(false)
  }, [])

  // Empty state when no project selected
  if (!projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#0a0a0b]">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">AI Insights</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Select a project from the tabs above to view AI-powered analytics and intelligent recommendations.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef4444]/20 to-[#f97316]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#f97316]" />
            </div>
            <div>
              <h2 className="text-[#fafafa] text-lg font-semibold">AI Insights</h2>
              <span className="text-[#71717a] text-sm">{projectName}</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={classNames(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={classNames("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Analyzing..." : "Refresh Insights"}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatsCard
            icon={CheckCircle}
            label="Tasks Completed"
            value={stats.tasksCompleted}
            color="#22c55e"
            trend="+12%"
          />
          <StatsCard
            icon={Zap}
            label="Agent Runs"
            value={stats.agentRuns}
            color="#f97316"
            trend="+25%"
          />
          <StatsCard
            icon={Clock}
            label="Avg Completion Time"
            value={`${stats.avgCompletionTime}h`}
            color="#3b82f6"
          />
          <StatsCard
            icon={Bug}
            label="Active Issues"
            value={stats.activeIssues}
            color="#ef4444"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#18181b] rounded-lg p-1 border border-[#27272a] w-fit">
          {filterConfig.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={classNames(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                activeFilter === value
                  ? "bg-[#27272a] text-[#fafafa]"
                  : "text-[#71717a] hover:text-[#a1a1aa]"
              )}
            >
              <Icon size={14} />
              {label}
              {value !== "all" && (
                <span
                  className={classNames(
                    "ml-1 px-1.5 py-0.5 text-xs rounded",
                    activeFilter === value
                      ? "bg-[#3f3f46] text-[#fafafa]"
                      : "bg-[#27272a] text-[#71717a]"
                  )}
                >
                  {value === "trend"
                    ? stats.trends
                    : value === "alert"
                    ? stats.alerts
                    : value === "recommendation"
                    ? stats.recommendations
                    : stats.metrics}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#52525b]" />
            </div>
            <h3 className="text-[#fafafa] font-medium mb-2">
              {activeFilter === "all"
                ? "No insights yet"
                : `No ${activeFilter}s found`}
            </h3>
            <p className="text-[#71717a] text-sm text-center max-w-md mb-4">
              {activeFilter === "all"
                ? "AI insights will appear here as your project progresses and patterns emerge."
                : `Try selecting a different filter or wait for new ${activeFilter}s to be generated.`}
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white rounded-lg font-medium hover:from-[#dc2626] hover:to-[#ea580c] transition-colors"
            >
              <RefreshCw className={classNames("w-4 h-4", isRefreshing && "animate-spin")} />
              Generate Insights
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InsightsView
