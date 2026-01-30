"use client"

import { useMemo } from "react"
import classNames from "classnames"
import { format, formatDistanceToNow } from "date-fns"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { type Insight, INSIGHT_TYPE_COLORS, STATUS_COLORS } from "@/lib/stores/insights-store"

// ============================================================================
// Types
// ============================================================================

interface InsightCardProps {
  insight: Insight
  variant?: "default" | "compact"
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTypeIcon(type: Insight["type"]) {
  switch (type) {
    case "trend":
      return TrendingUp
    case "alert":
      return AlertTriangle
    case "recommendation":
      return Lightbulb
    case "metric":
      return BarChart3
    default:
      return BarChart3
  }
}

function getTypeLabel(type: Insight["type"]) {
  switch (type) {
    case "trend":
      return "Trend"
    case "alert":
      return "Alert"
    case "recommendation":
      return "Recommendation"
    case "metric":
      return "Metric"
    default:
      return "Insight"
  }
}

function getChangeIcon(change: number) {
  if (change > 0) return ArrowUp
  if (change < 0) return ArrowDown
  return Minus
}

// ============================================================================
// Component
// ============================================================================

export function InsightCard({ insight, variant = "default" }: InsightCardProps) {
  const TypeIcon = getTypeIcon(insight.type)
  const ChangeIcon = getChangeIcon(insight.change)
  const typeColor = INSIGHT_TYPE_COLORS[insight.type]
  const statusColor = STATUS_COLORS[insight.status]

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })
  }, [insight.createdAt])

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg hover:border-[#3f3f46] transition-colors">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#fafafa] font-medium truncate">{insight.title}</p>
          <p className="text-xs text-[#71717a] truncate">{insight.description}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-semibold text-[#fafafa]">{insight.value}</span>
          {insight.change !== 0 && (
            <div
              className="flex items-center justify-end gap-0.5 text-xs"
              style={{ color: statusColor }}
            >
              <ChangeIcon className="w-3 h-3" />
              <span>{Math.abs(insight.change)}%</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-colors">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${typeColor}20` }}
          >
            <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
          </div>
          <div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
            >
              {getTypeLabel(insight.type)}
            </span>
          </div>
        </div>
        <span className="text-xs text-[#52525b]">{timeAgo}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <h4 className="text-[#fafafa] font-medium mb-1">{insight.title}</h4>
        <p className="text-sm text-[#71717a] mb-4 line-clamp-2">{insight.description}</p>

        {/* Value and Change */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-[#fafafa]">{insight.value}</span>
          </div>
          {insight.change !== 0 && (
            <div
              className={classNames(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium"
              )}
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
              }}
            >
              <ChangeIcon className="w-4 h-4" />
              <span>{Math.abs(insight.change)}%</span>
            </div>
          )}
          {insight.change === 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium bg-[#27272a] text-[#71717a]">
              <Minus className="w-4 h-4" />
              <span>No change</span>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator bar */}
      <div
        className="h-1"
        style={{ backgroundColor: statusColor }}
      />
    </div>
  )
}

export default InsightCard
