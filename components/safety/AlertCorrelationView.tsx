"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Network,
  Server,
  Database,
  Wifi,
  RefreshCw,
  Eye,
  Box,
  Cog,
  Lightbulb,
} from "lucide-react"
import { Button } from "../ui/Button"
import {
  useSafetyStore,
  useCorrelationGroups,
  useUnresolvedAlerts,
} from "../../lib/stores/safety-store"
import {
  Alert,
  AlertSeverity,
  CorrelationGroup,
  RootCause,
} from "../../lib/safety/types"

// Severity icons
const SeverityIcons: Record<AlertSeverity, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: AlertOctagon,
}

// Severity colors
const SeverityColors: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
  info: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500",
  },
  error: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500",
  },
  critical: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500",
  },
}

// Root cause type icons
const RootCauseIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  network: Wifi,
  dns: Network,
  vm: Server,
  service: Cog,
  resource: Database,
  unknown: AlertCircle,
}

// Source type icons
const SourceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vm: Server,
  container: Box,
  service: Cog,
  network: Wifi,
  system: Database,
}

interface AlertCorrelationViewProps {
  className?: string
  maxHeight?: string
}

interface CorrelationGroupCardProps {
  group: CorrelationGroup
  onResolveGroup: (correlationId: string) => void
  onResolveAlert: (alertId: string) => void
  onAcknowledgeAlert: (alertId: string) => void
}

function CorrelationGroupCard({
  group,
  onResolveGroup,
  onResolveAlert,
  onAcknowledgeAlert,
}: CorrelationGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const unresolvedCount = group.alerts.filter((a) => !a.resolved).length
  const highestSeverity = useMemo(() => {
    const severityOrder: AlertSeverity[] = ["info", "warning", "error", "critical"]
    let highest: AlertSeverity = "info"
    for (const alert of group.alerts) {
      if (!alert.resolved && severityOrder.indexOf(alert.severity) > severityOrder.indexOf(highest)) {
        highest = alert.severity
      }
    }
    return highest
  }, [group.alerts])

  const colors = SeverityColors[highestSeverity]
  const RootCauseIcon = group.rootCause
    ? RootCauseIcons[group.rootCause.type]
    : AlertCircle

  return (
    <div
      className={classNames(
        "bg-[#27272a] rounded-lg border overflow-hidden",
        colors.border
      )}
    >
      {/* Header */}
      <div
        className={classNames(
          "flex items-center gap-3 p-3 cursor-pointer",
          colors.bg
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="text-[#a1a1aa]">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className={classNames("w-8 h-8 rounded-full flex items-center justify-center", colors.bg)}>
          <RootCauseIcon className={classNames("w-4 h-4", colors.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {group.rootCause?.type
                ? `${group.rootCause.type.charAt(0).toUpperCase() + group.rootCause.type.slice(1)} Issue`
                : "Correlated Alerts"}
            </span>
            <span className={classNames("text-xs px-1.5 py-0.5 rounded", colors.bg, colors.text)}>
              {unresolvedCount} active
            </span>
          </div>
          {group.rootCause && (
            <p className="text-sm text-[#a1a1aa] truncate">
              {group.rootCause.description}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onResolveGroup(group.id)
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Resolve All
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#3f3f46]">
          {/* Root Cause Analysis */}
          {group.rootCause && (
            <div className="p-3 border-b border-[#3f3f46]">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-white">Root Cause Analysis</span>
                <span className="text-xs text-[#71717a]">
                  ({Math.round(group.rootCause.confidence * 100)}% confidence)
                </span>
              </div>
              <p className="text-sm text-[#a1a1aa] mb-2">
                {group.rootCause.description}
              </p>
              {group.rootCause.suggestedActions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-[#71717a]">Suggested Actions:</span>
                  <ul className="text-sm text-[#a1a1aa] space-y-0.5">
                    {group.rootCause.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#52525b]">-</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#71717a]" />
              <span className="text-sm font-medium text-white">Alert Timeline</span>
            </div>

            <div className="relative pl-4 space-y-3">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#3f3f46]" />

              {group.alerts
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((alert) => {
                  const alertColors = SeverityColors[alert.severity]
                  const SeverityIcon = SeverityIcons[alert.severity]
                  const SourceIcon = SourceTypeIcons[alert.source.type]

                  return (
                    <div key={alert.id} className="relative flex items-start gap-3">
                      {/* Timeline dot */}
                      <div
                        className={classNames(
                          "absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 bg-[#18181b]",
                          alert.resolved ? "border-[#52525b]" : alertColors.border
                        )}
                      />

                      {/* Alert Content */}
                      <div
                        className={classNames(
                          "flex-1 p-2 rounded-lg ml-2",
                          alert.resolved
                            ? "bg-[#1f1f22] opacity-60"
                            : alertColors.bg
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <SeverityIcon
                              className={classNames(
                                "w-4 h-4",
                                alert.resolved ? "text-[#52525b]" : alertColors.text
                              )}
                            />
                            <span
                              className={classNames(
                                "text-sm font-medium",
                                alert.resolved ? "text-[#71717a]" : "text-white"
                              )}
                            >
                              {alert.message}
                            </span>
                          </div>

                          {!alert.resolved && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onAcknowledgeAlert(alert.id)}
                                className="p-1 rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-blue-500 transition-colors"
                                title="Acknowledge"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onResolveAlert(alert.id)}
                                className="p-1 rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-emerald-500 transition-colors"
                                title="Resolve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-[#71717a]">
                          <div className="flex items-center gap-1">
                            <SourceIcon className="w-3 h-3" />
                            <span>{alert.source.name}</span>
                          </div>
                          <span>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                          {alert.resolved && (
                            <span className="text-emerald-500">Resolved</span>
                          )}
                          {alert.acknowledgedAt && !alert.resolved && (
                            <span className="text-blue-500">Acknowledged</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AlertCorrelationView({
  className,
  maxHeight = "600px",
}: AlertCorrelationViewProps) {
  const correlationGroups = useCorrelationGroups()
  const unresolvedAlerts = useUnresolvedAlerts()
  const {
    resolveAlert,
    acknowledgeAlert,
    resolveCorrelationGroup,
  } = useSafetyStore()

  const [showResolved, setShowResolved] = useState(false)

  // Filter correlation groups
  const filteredGroups = useMemo(() => {
    if (showResolved) {
      return correlationGroups
    }
    return correlationGroups.filter((group) =>
      group.alerts.some((a) => !a.resolved)
    )
  }, [correlationGroups, showResolved])

  // Uncorrelated alerts (alerts without a correlation group)
  const uncorrelatedAlerts = useMemo(() => {
    const correlatedIds = new Set(
      correlationGroups.flatMap((g) => g.alerts.map((a) => a.id))
    )
    return unresolvedAlerts.filter((a) => !correlatedIds.has(a.id))
  }, [correlationGroups, unresolvedAlerts])

  // Stats
  const stats = useMemo(() => {
    return {
      correlationGroups: filteredGroups.length,
      totalAlerts: unresolvedAlerts.length,
      critical: unresolvedAlerts.filter((a) => a.severity === "critical").length,
      error: unresolvedAlerts.filter((a) => a.severity === "error").length,
      warning: unresolvedAlerts.filter((a) => a.severity === "warning").length,
    }
  }, [filteredGroups, unresolvedAlerts])

  return (
    <div className={classNames("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Alert Correlation</h3>
          <p className="text-sm text-[#71717a]">
            {stats.correlationGroups} correlation group{stats.correlationGroups !== 1 ? "s" : ""} |{" "}
            {stats.totalAlerts} active alert{stats.totalAlerts !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-[#a1a1aa]">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-[#3f3f46] bg-transparent"
            />
            Show resolved
          </label>
        </div>
      </div>

      {/* Stats Bar */}
      {stats.totalAlerts > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-[#27272a] rounded-lg">
          {stats.critical > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span className="text-sm text-rose-500 font-medium">
                {stats.critical} critical
              </span>
            </div>
          )}
          {stats.error > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-500 font-medium">
                {stats.error} error
              </span>
            </div>
          )}
          {stats.warning > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-500 font-medium">
                {stats.warning} warning
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto space-y-4"
        style={{ maxHeight }}
      >
        {filteredGroups.length === 0 && uncorrelatedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#27272a] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-medium text-white mb-1">All Clear</h4>
            <p className="text-[#71717a]">
              No active alerts or correlation groups
            </p>
          </div>
        ) : (
          <>
            {/* Correlation Groups */}
            {filteredGroups.map((group) => (
              <CorrelationGroupCard
                key={group.id}
                group={group}
                onResolveGroup={resolveCorrelationGroup}
                onResolveAlert={resolveAlert}
                onAcknowledgeAlert={acknowledgeAlert}
              />
            ))}

            {/* Uncorrelated Alerts */}
            {uncorrelatedAlerts.length > 0 && (
              <div className="bg-[#27272a] rounded-lg border border-[#3f3f46] overflow-hidden">
                <div className="flex items-center gap-2 p-3 border-b border-[#3f3f46]">
                  <AlertCircle className="w-4 h-4 text-[#71717a]" />
                  <span className="font-medium text-white">
                    Uncorrelated Alerts
                  </span>
                  <span className="text-xs text-[#71717a]">
                    ({uncorrelatedAlerts.length})
                  </span>
                </div>

                <div className="divide-y divide-[#3f3f46]">
                  {uncorrelatedAlerts.map((alert) => {
                    const colors = SeverityColors[alert.severity]
                    const SeverityIcon = SeverityIcons[alert.severity]
                    const SourceIcon = SourceTypeIcons[alert.source.type]

                    return (
                      <div
                        key={alert.id}
                        className="flex items-center gap-3 p-3"
                      >
                        <div
                          className={classNames(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            colors.bg
                          )}
                        >
                          <SeverityIcon className={classNames("w-4 h-4", colors.text)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{alert.message}</p>
                          <div className="flex items-center gap-3 text-xs text-[#71717a]">
                            <div className="flex items-center gap-1">
                              <SourceIcon className="w-3 h-3" />
                              <span>{alert.source.name}</span>
                            </div>
                            <span>
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="p-1.5 rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-blue-500 transition-colors"
                            title="Acknowledge"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="p-1.5 rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-emerald-500 transition-colors"
                            title="Resolve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
