/**
 * Risk Assessment Module
 * Provides functions for evaluating operation risk levels and determining
 * safety requirements based on operation type and target
 */

import {
  OperationType,
  OperationTarget,
  RiskLevel,
  SafetyConfig,
  DEFAULT_SAFETY_CONFIG,
} from './types'

// Risk level ordering for comparisons
const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  safe: 0,
  moderate: 1,
  dangerous: 2,
  critical: 3,
}

/**
 * Assess the risk level of an operation based on its type and target
 * @param operationType - The type of operation being performed
 * @param target - The target of the operation
 * @param config - Optional safety configuration override
 * @returns The assessed risk level
 */
export function assessRisk(
  operationType: OperationType,
  target: OperationTarget,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): RiskLevel {
  // Get base risk from the risk matrix
  const baseRisk = config.riskMatrix[operationType]

  // Elevate risk based on target type
  // Production VMs and critical services get elevated risk
  let riskLevel = baseRisk

  // Target-based risk elevation
  if (target.type === 'vm') {
    // VMs are more critical - elevate risk for dangerous operations
    if (baseRisk === 'moderate') {
      riskLevel = 'dangerous'
    } else if (baseRisk === 'dangerous') {
      riskLevel = 'critical'
    }
  }

  // Check for critical naming patterns that indicate production
  const criticalPatterns = [
    /^prod/i,
    /production/i,
    /master/i,
    /primary/i,
    /main/i,
    /database/i,
    /db-/i,
    /gateway/i,
    /load-?balancer/i,
    /lb-/i,
  ]

  const isCriticalTarget = criticalPatterns.some(
    (pattern) =>
      pattern.test(target.name) || pattern.test(target.id)
  )

  if (isCriticalTarget && RISK_LEVEL_ORDER[riskLevel] < RISK_LEVEL_ORDER['critical']) {
    // Elevate by one level for critical targets
    const levels: RiskLevel[] = ['safe', 'moderate', 'dangerous', 'critical']
    const currentIndex = levels.indexOf(riskLevel)
    if (currentIndex < levels.length - 1) {
      riskLevel = levels[currentIndex + 1]
    }
  }

  return riskLevel
}

/**
 * Determine if an operation requires human confirmation based on risk level
 * @param riskLevel - The risk level to evaluate
 * @param config - Optional safety configuration override
 * @returns Whether confirmation is required
 */
export function requiresConfirmation(
  riskLevel: RiskLevel,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): boolean {
  return config.confirmationThresholds[riskLevel]
}

/**
 * Get the cooldown period for an operation type
 * @param operationType - The type of operation
 * @param config - Optional safety configuration override
 * @returns Cooldown period in milliseconds
 */
export function getCooldownMs(
  operationType: OperationType,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): number {
  return config.defaultCooldowns[operationType]
}

/**
 * Get the maximum retry count for an operation type
 * @param operationType - The type of operation
 * @param config - Optional safety configuration override
 * @returns Maximum number of retries
 */
export function getMaxRetries(
  operationType: OperationType,
  config: SafetyConfig = DEFAULT_SAFETY_CONFIG
): number {
  return config.defaultMaxRetries[operationType]
}

/**
 * Compare two risk levels
 * @param a - First risk level
 * @param b - Second risk level
 * @returns Negative if a < b, 0 if equal, positive if a > b
 */
export function compareRiskLevels(a: RiskLevel, b: RiskLevel): number {
  return RISK_LEVEL_ORDER[a] - RISK_LEVEL_ORDER[b]
}

/**
 * Get the higher of two risk levels
 * @param a - First risk level
 * @param b - Second risk level
 * @returns The higher risk level
 */
export function maxRiskLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_LEVEL_ORDER[a] >= RISK_LEVEL_ORDER[b] ? a : b
}

/**
 * Check if a risk level is at or above a threshold
 * @param level - The risk level to check
 * @param threshold - The threshold to compare against
 * @returns Whether the level meets or exceeds the threshold
 */
export function isRiskAtOrAbove(level: RiskLevel, threshold: RiskLevel): boolean {
  return RISK_LEVEL_ORDER[level] >= RISK_LEVEL_ORDER[threshold]
}

/**
 * Get a human-readable description of a risk level
 * @param riskLevel - The risk level to describe
 * @returns A description string
 */
export function getRiskDescription(riskLevel: RiskLevel): string {
  const descriptions: Record<RiskLevel, string> = {
    safe: 'This operation is safe and can be executed without confirmation.',
    moderate: 'This operation may have side effects. Consider the impact before proceeding.',
    dangerous: 'This operation is potentially destructive. Human confirmation is required.',
    critical: 'This operation is highly destructive and irreversible. Exercise extreme caution.',
  }
  return descriptions[riskLevel]
}

/**
 * Get the warning message for an operation based on its risk level
 * @param operationType - The type of operation
 * @param target - The target of the operation
 * @param riskLevel - The assessed risk level
 * @returns A warning message string
 */
export function getOperationWarning(
  operationType: OperationType,
  target: OperationTarget,
  riskLevel: RiskLevel
): string {
  const targetDesc = `${target.type} "${target.name}"`

  const warnings: Record<OperationType, Record<RiskLevel, string>> = {
    query: {
      safe: `Querying ${targetDesc}.`,
      moderate: `Querying ${targetDesc}. This may take some time.`,
      dangerous: `Querying ${targetDesc}. This operation is resource-intensive.`,
      critical: `Querying ${targetDesc}. This may impact system performance.`,
    },
    restart: {
      safe: `Restarting ${targetDesc}.`,
      moderate: `Restarting ${targetDesc}. Service will be briefly unavailable.`,
      dangerous: `Restarting ${targetDesc}. Connected clients will be disconnected.`,
      critical: `Restarting ${targetDesc}. This will cause service disruption.`,
    },
    stop: {
      safe: `Stopping ${targetDesc}.`,
      moderate: `Stopping ${targetDesc}. Service will become unavailable.`,
      dangerous: `Stopping ${targetDesc}. Dependent services may be affected.`,
      critical: `Stopping ${targetDesc}. This will cause immediate service outage.`,
    },
    reboot: {
      safe: `Rebooting ${targetDesc}.`,
      moderate: `Rebooting ${targetDesc}. System will be temporarily offline.`,
      dangerous: `Rebooting ${targetDesc}. All services will be interrupted.`,
      critical: `Rebooting ${targetDesc}. This will cause extended downtime.`,
    },
    delete: {
      safe: `Deleting ${targetDesc}.`,
      moderate: `Deleting ${targetDesc}. This action cannot be undone.`,
      dangerous: `Deleting ${targetDesc}. All data will be permanently lost.`,
      critical: `Deleting ${targetDesc}. This is irreversible and will cause data loss.`,
    },
  }

  return warnings[operationType][riskLevel]
}

/**
 * Get the color class for a risk level (Tailwind CSS)
 * @param riskLevel - The risk level
 * @returns Tailwind CSS color classes
 */
export function getRiskColorClasses(riskLevel: RiskLevel): {
  bg: string
  text: string
  border: string
  bgLight: string
} {
  const colors: Record<RiskLevel, { bg: string; text: string; border: string; bgLight: string }> = {
    safe: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-500',
      border: 'border-emerald-500',
      bgLight: 'bg-emerald-500/10',
    },
    moderate: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500',
      bgLight: 'bg-amber-500/10',
    },
    dangerous: {
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      border: 'border-orange-500',
      bgLight: 'bg-orange-500/10',
    },
    critical: {
      bg: 'bg-rose-500',
      text: 'text-rose-500',
      border: 'border-rose-500',
      bgLight: 'bg-rose-500/10',
    },
  }
  return colors[riskLevel]
}
