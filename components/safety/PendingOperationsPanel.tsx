"use client"

import { useState, useMemo, useEffect } from "react"
import classNames from "classnames"
import {
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Server,
  Box,
  Cog,
} from "lucide-react"
import { Button } from "../ui/Button"
import { ConfirmationModal } from "./ConfirmationModal"
import {
  useSafetyStore,
  usePendingOperations,
} from "../../lib/stores/safety-store"
import {
  Operation,
  RiskLevel,
  OperationType,
} from "../../lib/safety/types"
import {
  getRiskColorClasses,
} from "../../lib/safety/risk-assessment"
import { formatCooldownRemaining } from "../../lib/safety/rate-limiter"

// Risk level icons
const RiskIcons: Record<RiskLevel, React.ComponentType<{ className?: string }>> = {
  safe: Shield,
  moderate: AlertTriangle,
  dangerous: ShieldAlert,
  critical: ShieldOff,
}

// Operation type icons
const OperationIcons: Record<OperationType, React.ComponentType<{ className?: string }>> = {
  query: RefreshCw,
  restart: RotateCcw,
  stop: Square,
  reboot: Play,
  delete: Trash2,
}

// Target type icons
const TargetIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vm: Server,
  container: Box,
  service: Cog,
}

interface PendingOperationsPanelProps {
  className?: string
  maxHeight?: string
  showFilters?: boolean
}

export function PendingOperationsPanel({
  className,
  maxHeight = "400px",
  showFilters = true,
}: PendingOperationsPanelProps) {
  const pendingOperations = usePendingOperations()
  const {
    approveOperation,
    rejectOperation,
    cancelOperation,
    getCooldownRemaining,
    canExecuteOperation,
  } = useSafetyStore()

  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all")
  const [showRiskDropdown, setShowRiskDropdown] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [cooldowns, setCooldowns] = useState<Map<string, number>>(new Map())

  // Filter operations
  const filteredOperations = useMemo(() => {
    if (riskFilter === "all") {
      return pendingOperations
    }
    return pendingOperations.filter((op) => op.riskLevel === riskFilter)
  }, [pendingOperations, riskFilter])

  // Update cooldowns periodically
  useEffect(() => {
    const updateCooldowns = () => {
      const newCooldowns = new Map<string, number>()
      for (const op of pendingOperations) {
        const remaining = getCooldownRemaining(op.type, op.target.id)
        if (remaining > 0) {
          newCooldowns.set(op.id, remaining)
        }
      }
      setCooldowns(newCooldowns)
    }

    updateCooldowns()
    const interval = setInterval(updateCooldowns, 1000)
    return () => clearInterval(interval)
  }, [pendingOperations, getCooldownRemaining])

  // Stats
  const stats = useMemo(() => {
    return {
      total: pendingOperations.length,
      safe: pendingOperations.filter((op) => op.riskLevel === "safe").length,
      moderate: pendingOperations.filter((op) => op.riskLevel === "moderate").length,
      dangerous: pendingOperations.filter((op) => op.riskLevel === "dangerous").length,
      critical: pendingOperations.filter((op) => op.riskLevel === "critical").length,
    }
  }, [pendingOperations])

  const handleQuickApprove = (operation: Operation) => {
    if (operation.riskLevel === "dangerous" || operation.riskLevel === "critical") {
      setSelectedOperation(operation)
      setShowConfirmModal(true)
    } else {
      approveOperation(operation.id)
    }
  }

  const handleConfirmApprove = (operationId: string) => {
    approveOperation(operationId)
    setShowConfirmModal(false)
    setSelectedOperation(null)
  }

  const handleConfirmReject = (operationId: string) => {
    rejectOperation(operationId)
    setShowConfirmModal(false)
    setSelectedOperation(null)
  }

  return (
    <div className={classNames("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Pending Operations</h3>
          <p className="text-sm text-[#71717a]">
            {stats.total} operation{stats.total !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>

        {showFilters && (
          <div className="relative">
            <button
              onClick={() => setShowRiskDropdown(!showRiskDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-sm text-[#a1a1aa] hover:border-[#52525b]"
            >
              <Filter className="w-4 h-4" />
              <span className="capitalize">
                {riskFilter === "all" ? "All Risks" : riskFilter}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showRiskDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRiskDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-[#27272a] border border-[#3f3f46] rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  {(["all", "safe", "moderate", "dangerous", "critical"] as const).map(
                    (risk) => (
                      <button
                        key={risk}
                        onClick={() => {
                          setRiskFilter(risk)
                          setShowRiskDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#3f3f46] text-left capitalize"
                      >
                        <span
                          className={classNames(
                            riskFilter === risk ? "text-white" : "text-[#a1a1aa]"
                          )}
                        >
                          {risk === "all" ? "All Risks" : risk}
                        </span>
                        {risk !== "all" && (
                          <span className="ml-auto text-xs text-[#71717a]">
                            {stats[risk]}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Risk Summary */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(["safe", "moderate", "dangerous", "critical"] as const).map((risk) => {
            const colors = getRiskColorClasses(risk)
            const RiskIcon = RiskIcons[risk]
            return (
              <button
                key={risk}
                onClick={() => setRiskFilter(riskFilter === risk ? "all" : risk)}
                className={classNames(
                  "p-2 rounded-lg border transition-all",
                  riskFilter === risk
                    ? classNames(colors.border, colors.bgLight)
                    : "border-[#3f3f46] hover:border-[#52525b]"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <RiskIcon
                    className={classNames(
                      "w-3.5 h-3.5",
                      riskFilter === risk ? colors.text : "text-[#71717a]"
                    )}
                  />
                  <span
                    className={classNames(
                      "text-xs capitalize",
                      riskFilter === risk ? colors.text : "text-[#71717a]"
                    )}
                  >
                    {risk}
                  </span>
                </div>
                <div
                  className={classNames(
                    "text-lg font-semibold mt-0.5",
                    riskFilter === risk ? "text-white" : "text-[#a1a1aa]"
                  )}
                >
                  {stats[risk]}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Operations List */}
      <div
        className="flex-1 overflow-y-auto space-y-2"
        style={{ maxHeight }}
      >
        {filteredOperations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#27272a] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-[#a1a1aa]">
              {riskFilter === "all"
                ? "No pending operations"
                : `No ${riskFilter} operations pending`}
            </p>
          </div>
        ) : (
          filteredOperations.map((operation) => {
            const colors = getRiskColorClasses(operation.riskLevel)
            const RiskIcon = RiskIcons[operation.riskLevel]
            const OpIcon = OperationIcons[operation.type]
            const TargetIcon = TargetIcons[operation.target.type]
            const cooldownRemaining = cooldowns.get(operation.id) ?? 0
            const isRateLimited = cooldownRemaining > 0

            return (
              <div
                key={operation.id}
                className={classNames(
                  "bg-[#27272a] rounded-lg border p-3",
                  colors.border
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Risk Icon */}
                  <div
                    className={classNames(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      colors.bgLight
                    )}
                  >
                    <RiskIcon className={classNames("w-4 h-4", colors.text)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Operation Type and Target */}
                    <div className="flex items-center gap-2 mb-1">
                      <OpIcon className="w-4 h-4 text-[#a1a1aa]" />
                      <span className="font-medium text-white capitalize">
                        {operation.type}
                      </span>
                      <span className="text-[#71717a]">-</span>
                      <div className="flex items-center gap-1.5">
                        <TargetIcon className="w-3.5 h-3.5 text-[#71717a]" />
                        <span className="text-[#a1a1aa]">
                          {operation.target.name}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-xs text-[#71717a]">
                      <span>
                        {new Date(operation.createdAt).toLocaleTimeString()}
                      </span>
                      {operation.retryCount > 0 && (
                        <span>
                          Retry {operation.retryCount}/{operation.maxRetries}
                        </span>
                      )}
                      {isRateLimited && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Clock className="w-3 h-3" />
                          {formatCooldownRemaining(cooldownRemaining)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => rejectOperation(operation.id)}
                      className="p-1.5 rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-rose-500 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuickApprove(operation)}
                      disabled={isRateLimited}
                      className={classNames(
                        "p-1.5 rounded transition-colors",
                        isRateLimited
                          ? "text-[#52525b] cursor-not-allowed"
                          : "hover:bg-[#3f3f46] text-[#71717a] hover:text-emerald-500"
                      )}
                      title={isRateLimited ? "Rate limited" : "Approve"}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => cancelOperation(operation.id)}
                      className="p-1.5 rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-[#a1a1aa] transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setSelectedOperation(null)
        }}
        operation={selectedOperation}
        onApprove={handleConfirmApprove}
        onReject={handleConfirmReject}
      />
    </div>
  )
}
