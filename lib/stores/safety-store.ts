/**
 * Safety Store
 * Zustand store for managing safety-related state including pending operations,
 * alerts, and correlation groups
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  Operation,
  OperationInput,
  OperationStatus,
  OperationType,
  RiskLevel,
  Alert,
  AlertInput,
  AlertSeverity,
  CorrelationGroup,
} from '../safety/types'

import {
  assessRisk,
  requiresConfirmation,
  getCooldownMs,
  getMaxRetries,
} from '../safety/risk-assessment'

import { RateLimiter } from '../safety/rate-limiter'
import { AlertCorrelator } from '../safety/alert-correlation'

// Generate unique ID for operations
const generateOperationId = (): string => {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString()

// Safety store state interface
interface SafetyState {
  // State
  pendingOperations: Operation[]
  alerts: Alert[]
  correlationGroups: CorrelationGroup[]

  // Internal instances
  _rateLimiter: RateLimiter
  _alertCorrelator: AlertCorrelator

  // Operation actions
  queueOperation: (input: OperationInput) => Operation
  approveOperation: (operationId: string, approvedBy?: string) => void
  rejectOperation: (operationId: string, rejectedBy?: string) => void
  executeOperation: (operationId: string) => Promise<Operation>
  cancelOperation: (operationId: string) => void
  retryOperation: (operationId: string) => Operation | null

  // Alert actions
  addAlert: (input: AlertInput) => Alert
  resolveAlert: (alertId: string, resolvedBy?: string) => void
  acknowledgeAlert: (alertId: string, acknowledgedBy?: string) => void
  resolveCorrelationGroup: (correlationId: string, resolvedBy?: string) => void

  // Selectors / getters
  getPendingByRisk: (riskLevel?: RiskLevel) => Operation[]
  getUnresolvedAlerts: () => Alert[]
  getCorrelatedAlerts: (correlationId: string) => Alert[]
  getOperationById: (operationId: string) => Operation | undefined
  getAlertById: (alertId: string) => Alert | undefined
  getCorrelationGroupById: (correlationId: string) => CorrelationGroup | undefined

  // Rate limiting
  canExecuteOperation: (operationType: OperationType, targetId: string) => boolean
  getCooldownRemaining: (operationType: OperationType, targetId: string) => number

  // Statistics
  getStats: () => {
    pendingOperations: number
    pendingByRisk: Record<RiskLevel, number>
    unresolvedAlerts: number
    alertsBySeverity: Record<AlertSeverity, number>
    correlationGroups: number
  }

  // Cleanup
  clearResolvedAlerts: () => void
  clearExecutedOperations: () => void
}

// Create the store
export const useSafetyStore = create<SafetyState>()(
  persist(
    (set, get) => ({
      pendingOperations: [],
      alerts: [],
      correlationGroups: [],
      _rateLimiter: new RateLimiter(),
      _alertCorrelator: new AlertCorrelator(),

      // Queue a new operation
      queueOperation: (input) => {
        const riskLevel = input.riskLevel ?? assessRisk(input.type, input.target)
        const needsConfirmation = input.requiresConfirmation ?? requiresConfirmation(riskLevel)
        const cooldownMs = input.cooldownMs ?? getCooldownMs(input.type)
        const maxRetries = input.maxRetries ?? getMaxRetries(input.type)

        const operation: Operation = {
          ...input,
          id: generateOperationId(),
          riskLevel,
          requiresConfirmation: needsConfirmation,
          cooldownMs,
          maxRetries,
          status: needsConfirmation ? 'pending' : 'approved',
          createdAt: getTimestamp(),
          retryCount: input.retryCount ?? 0,
        }

        set((state) => ({
          pendingOperations: [...state.pendingOperations, operation],
        }))

        return operation
      },

      // Approve an operation
      approveOperation: (operationId, approvedBy) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: 'approved' as OperationStatus,
                  approvedAt: getTimestamp(),
                  approvedBy,
                }
              : op
          ),
        }))
      },

      // Reject an operation
      rejectOperation: (operationId, rejectedBy) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: 'rejected' as OperationStatus,
                  rejectedAt: getTimestamp(),
                  rejectedBy,
                }
              : op
          ),
        }))
      },

      // Execute an approved operation
      executeOperation: async (operationId) => {
        const { pendingOperations, _rateLimiter } = get()
        const operation = pendingOperations.find((op) => op.id === operationId)

        if (!operation) {
          throw new Error(`Operation ${operationId} not found`)
        }

        if (operation.status !== 'approved') {
          throw new Error(`Operation ${operationId} is not approved (status: ${operation.status})`)
        }

        // Check rate limiting
        const key = RateLimiter.generateKey(operation.type, operation.target.id)
        if (!_rateLimiter.canExecute(key)) {
          const remaining = _rateLimiter.getCooldownRemaining(key)
          throw new Error(`Operation ${operationId} is rate limited. Cooldown remaining: ${remaining}ms`)
        }

        // Mark as executed (fail-safe: we mark it before actual execution)
        // The actual execution would be handled by the caller
        const executedAt = getTimestamp()

        set((state) => ({
          pendingOperations: state.pendingOperations.map((op) =>
            op.id === operationId
              ? {
                  ...op,
                  status: 'executed' as OperationStatus,
                  executedAt,
                }
              : op
          ),
        }))

        // Record execution for rate limiting
        _rateLimiter.recordExecution(key)

        // Return the updated operation
        return {
          ...operation,
          status: 'executed' as OperationStatus,
          executedAt,
        }
      },

      // Cancel a pending operation
      cancelOperation: (operationId) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((op) => op.id !== operationId),
        }))
      },

      // Retry a failed operation (idempotent)
      retryOperation: (operationId) => {
        const { pendingOperations } = get()
        const operation = pendingOperations.find((op) => op.id === operationId)

        if (!operation) {
          return null
        }

        if (operation.status !== 'failed') {
          return null
        }

        if (operation.retryCount >= operation.maxRetries) {
          return null
        }

        // Create a new operation based on the failed one
        const newOperation: Operation = {
          ...operation,
          id: generateOperationId(),
          status: operation.requiresConfirmation ? 'pending' : 'approved',
          createdAt: getTimestamp(),
          retryCount: operation.retryCount + 1,
          executedAt: undefined,
          approvedAt: undefined,
          rejectedAt: undefined,
          result: undefined,
          // Keep the idempotency key for tracking
          idempotencyKey: operation.idempotencyKey ?? operation.id,
        }

        set((state) => ({
          pendingOperations: [...state.pendingOperations, newOperation],
        }))

        return newOperation
      },

      // Add a new alert
      addAlert: (input) => {
        const { _alertCorrelator } = get()
        const alert = _alertCorrelator.addAlert(input)

        // Update state with alerts and correlation groups
        set({
          alerts: _alertCorrelator.getAllAlerts(),
          correlationGroups: _alertCorrelator.correlateAlerts(),
        })

        return alert
      },

      // Resolve an alert
      resolveAlert: (alertId, resolvedBy) => {
        const { _alertCorrelator } = get()
        _alertCorrelator.resolveAlert(alertId, resolvedBy)

        set({
          alerts: _alertCorrelator.getAllAlerts(),
        })
      },

      // Acknowledge an alert
      acknowledgeAlert: (alertId, acknowledgedBy) => {
        const { _alertCorrelator } = get()
        _alertCorrelator.acknowledgeAlert(alertId, acknowledgedBy)

        set({
          alerts: _alertCorrelator.getAllAlerts(),
        })
      },

      // Resolve all alerts in a correlation group
      resolveCorrelationGroup: (correlationId, resolvedBy) => {
        const { _alertCorrelator } = get()
        _alertCorrelator.resolveCorrelationGroup(correlationId, resolvedBy)

        set({
          alerts: _alertCorrelator.getAllAlerts(),
          correlationGroups: _alertCorrelator.correlateAlerts(),
        })
      },

      // Get pending operations filtered by risk level
      getPendingByRisk: (riskLevel) => {
        const { pendingOperations } = get()
        const pending = pendingOperations.filter((op) => op.status === 'pending')

        if (riskLevel) {
          return pending.filter((op) => op.riskLevel === riskLevel)
        }
        return pending
      },

      // Get unresolved alerts
      getUnresolvedAlerts: () => {
        const { alerts } = get()
        return alerts.filter((a) => !a.resolved)
      },

      // Get alerts in a correlation group
      getCorrelatedAlerts: (correlationId) => {
        const { _alertCorrelator } = get()
        return _alertCorrelator.getCorrelationGroup(correlationId)
      },

      // Get operation by ID
      getOperationById: (operationId) => {
        return get().pendingOperations.find((op) => op.id === operationId)
      },

      // Get alert by ID
      getAlertById: (alertId) => {
        return get().alerts.find((a) => a.id === alertId)
      },

      // Get correlation group by ID
      getCorrelationGroupById: (correlationId) => {
        return get().correlationGroups.find((g) => g.id === correlationId)
      },

      // Check if an operation can be executed (rate limiting)
      canExecuteOperation: (operationType, targetId) => {
        return get()._rateLimiter.canExecuteOperation(operationType, targetId)
      },

      // Get remaining cooldown for an operation
      getCooldownRemaining: (operationType, targetId) => {
        return get()._rateLimiter.getOperationCooldownRemaining(operationType, targetId)
      },

      // Get statistics
      getStats: () => {
        const { pendingOperations, alerts, correlationGroups } = get()

        const pending = pendingOperations.filter((op) => op.status === 'pending')
        const pendingByRisk: Record<RiskLevel, number> = {
          safe: 0,
          moderate: 0,
          dangerous: 0,
          critical: 0,
        }
        for (const op of pending) {
          pendingByRisk[op.riskLevel]++
        }

        const unresolvedAlerts = alerts.filter((a) => !a.resolved)
        const alertsBySeverity: Record<AlertSeverity, number> = {
          info: 0,
          warning: 0,
          error: 0,
          critical: 0,
        }
        for (const alert of unresolvedAlerts) {
          alertsBySeverity[alert.severity]++
        }

        return {
          pendingOperations: pending.length,
          pendingByRisk,
          unresolvedAlerts: unresolvedAlerts.length,
          alertsBySeverity,
          correlationGroups: correlationGroups.length,
        }
      },

      // Clear resolved alerts
      clearResolvedAlerts: () => {
        set((state) => ({
          alerts: state.alerts.filter((a) => !a.resolved),
        }))
      },

      // Clear executed operations
      clearExecutedOperations: () => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter(
            (op) => op.status === 'pending' || op.status === 'approved'
          ),
        }))
      },
    }),
    {
      name: 'moltbot-safety-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pendingOperations: state.pendingOperations,
        alerts: state.alerts,
        correlationGroups: state.correlationGroups,
      }),
      onRehydrateStorage: () => (state) => {
        // Recreate class instances after rehydration
        if (state) {
          state._rateLimiter = new RateLimiter()
          state._alertCorrelator = new AlertCorrelator()

          // Re-add alerts to the correlator
          for (const alert of state.alerts) {
            state._alertCorrelator.addAlert(alert)
          }
        }
      },
    }
  )
)

// Selector hooks for common use cases
export const usePendingOperations = () =>
  useSafetyStore((state) => state.pendingOperations.filter((op) => op.status === 'pending'))

export const usePendingByRiskLevel = (riskLevel: RiskLevel) =>
  useSafetyStore((state) =>
    state.pendingOperations.filter(
      (op) => op.status === 'pending' && op.riskLevel === riskLevel
    )
  )

export const useDangerousOperations = () =>
  useSafetyStore((state) =>
    state.pendingOperations.filter(
      (op) =>
        op.status === 'pending' &&
        (op.riskLevel === 'dangerous' || op.riskLevel === 'critical')
    )
  )

export const useUnresolvedAlerts = () =>
  useSafetyStore((state) => state.alerts.filter((a) => !a.resolved))

export const useCriticalAlerts = () =>
  useSafetyStore((state) =>
    state.alerts.filter((a) => !a.resolved && a.severity === 'critical')
  )

export const useCorrelationGroups = () =>
  useSafetyStore((state) => state.correlationGroups)

export const useCorrelationGroupById = (correlationId: string) =>
  useSafetyStore((state) =>
    state.correlationGroups.find((g) => g.id === correlationId)
  )

export const useSafetyStats = () =>
  useSafetyStore((state) => state.getStats())
