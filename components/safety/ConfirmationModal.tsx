"use client"

import { useState, useEffect, useCallback } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import classNames from "classnames"
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldOff,
  X,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "../ui/Button"
import {
  Operation,
  RiskLevel,
} from "../../lib/safety/types"
import {
  getRiskDescription,
  getOperationWarning,
  getRiskColorClasses,
} from "../../lib/safety/risk-assessment"

interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  operation: Operation | null
  onApprove: (operationId: string) => void
  onReject: (operationId: string) => void
}

// Critical countdown duration in seconds
const CRITICAL_COUNTDOWN_SECONDS = 5

// Risk level icons
const RiskIcons: Record<RiskLevel, React.ComponentType<{ className?: string }>> = {
  safe: Shield,
  moderate: AlertTriangle,
  dangerous: ShieldAlert,
  critical: ShieldOff,
}

export function ConfirmationModal({
  open,
  onClose,
  operation,
  onApprove,
  onReject,
}: ConfirmationModalProps) {
  const [countdown, setCountdown] = useState(CRITICAL_COUNTDOWN_SECONDS)
  const [acknowledged, setAcknowledged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset state when modal opens with a new operation
  useEffect(() => {
    if (open && operation) {
      setCountdown(CRITICAL_COUNTDOWN_SECONDS)
      setAcknowledged(false)
      setIsSubmitting(false)
    }
  }, [open, operation?.id])

  // Countdown timer for critical operations
  useEffect(() => {
    if (!open || !operation || operation.riskLevel !== "critical") {
      return
    }

    if (countdown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [open, operation, countdown])

  const handleApprove = useCallback(async () => {
    if (!operation) return

    // For critical operations, require countdown and acknowledgment
    if (operation.riskLevel === "critical") {
      if (countdown > 0 || !acknowledged) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      onApprove(operation.id)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }, [operation, countdown, acknowledged, onApprove, onClose])

  const handleReject = useCallback(() => {
    if (!operation) return
    onReject(operation.id)
    onClose()
  }, [operation, onReject, onClose])

  if (!operation) {
    return null
  }

  const RiskIcon = RiskIcons[operation.riskLevel]
  const colorClasses = getRiskColorClasses(operation.riskLevel)
  const warning = getOperationWarning(
    operation.type,
    operation.target,
    operation.riskLevel
  )
  const description = getRiskDescription(operation.riskLevel)

  const canApprove =
    operation.riskLevel !== "critical" ||
    (countdown === 0 && acknowledged)

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content
          className={classNames(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "bg-[#18181b] rounded-xl border w-full max-w-lg z-50",
            "shadow-2xl",
            colorClasses.border
          )}
        >
          {/* Header */}
          <div
            className={classNames(
              "flex items-center gap-3 p-4 border-b rounded-t-xl",
              colorClasses.bgLight,
              colorClasses.border
            )}
          >
            <div
              className={classNames(
                "w-10 h-10 rounded-full flex items-center justify-center",
                colorClasses.bg
              )}
            >
              <RiskIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-white">
                Confirm {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} Operation
              </Dialog.Title>
              <Dialog.Description className={classNames("text-sm", colorClasses.text)}>
                Risk Level: {operation.riskLevel.charAt(0).toUpperCase() + operation.riskLevel.slice(1)}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-[#71717a] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Target Info */}
            <div className="bg-[#27272a] rounded-lg p-3">
              <div className="text-sm text-[#71717a] mb-1">Target</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-[#3f3f46] rounded text-[#a1a1aa] uppercase">
                  {operation.target.type}
                </span>
                <span className="text-white font-medium">
                  {operation.target.name}
                </span>
                <span className="text-[#71717a] text-sm">
                  ({operation.target.id})
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div
              className={classNames(
                "rounded-lg p-3 border",
                colorClasses.bgLight,
                colorClasses.border
              )}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={classNames("w-5 h-5 mt-0.5 shrink-0", colorClasses.text)} />
                <div>
                  <p className="text-white">{warning}</p>
                  <p className="text-sm text-[#a1a1aa] mt-1">{description}</p>
                </div>
              </div>
            </div>

            {/* Critical Operation Countdown */}
            {operation.riskLevel === "critical" && (
              <>
                {/* Countdown Timer */}
                <div className="bg-rose-500/10 border border-rose-500 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="w-6 h-6 text-rose-500" />
                    <div className="text-center">
                      {countdown > 0 ? (
                        <>
                          <div className="text-3xl font-mono font-bold text-rose-500">
                            {countdown}
                          </div>
                          <div className="text-sm text-rose-400">
                            seconds before you can confirm
                          </div>
                        </>
                      ) : (
                        <div className="text-rose-400">
                          Countdown complete. Please acknowledge the risks below.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acknowledgment Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    disabled={countdown > 0}
                    className={classNames(
                      "mt-1 w-5 h-5 rounded border-2 bg-transparent",
                      "focus:ring-2 focus:ring-rose-500 focus:ring-offset-0",
                      countdown > 0
                        ? "border-[#3f3f46] cursor-not-allowed"
                        : "border-rose-500 cursor-pointer"
                    )}
                  />
                  <span
                    className={classNames(
                      "text-sm",
                      countdown > 0 ? "text-[#71717a]" : "text-white"
                    )}
                  >
                    I understand that this is a critical operation that may cause data loss
                    or service disruption. I have verified the target and accept full
                    responsibility for this action.
                  </span>
                </label>
              </>
            )}

            {/* Operation Details */}
            <div className="text-sm text-[#71717a] space-y-1">
              <div className="flex justify-between">
                <span>Operation ID:</span>
                <span className="font-mono text-[#a1a1aa]">{operation.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="text-[#a1a1aa]">
                  {new Date(operation.createdAt).toLocaleString()}
                </span>
              </div>
              {operation.retryCount > 0 && (
                <div className="flex justify-between">
                  <span>Retry Attempt:</span>
                  <span className="text-[#a1a1aa]">
                    {operation.retryCount} / {operation.maxRetries}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[#27272a]">
            <Button
              variant="ghost"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              variant={operation.riskLevel === "critical" ? "danger" : "primary"}
              onClick={handleApprove}
              disabled={!canApprove || isSubmitting}
              loading={isSubmitting}
            >
              <CheckCircle2 className="w-4 h-4" />
              {operation.riskLevel === "critical"
                ? countdown > 0
                  ? `Wait ${countdown}s`
                  : !acknowledged
                  ? "Acknowledge first"
                  : "Confirm Operation"
                : "Approve"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
