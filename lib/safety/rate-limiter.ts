/**
 * Rate Limiter Module
 * Implements cooldown periods for operations to prevent rapid-fire
 * execution of potentially dangerous operations
 */

import { OperationType, DEFAULT_SAFETY_CONFIG, SafetyConfig } from './types'

// Execution record stored in memory
interface ExecutionRecord {
  operationKey: string
  lastExecutedAt: number
  executionCount: number
}

/**
 * RateLimiter class manages cooldown periods for operations
 * Stores execution times in memory and provides methods to check
 * if operations can be executed based on cooldown periods
 */
export class RateLimiter {
  private executions: Map<string, ExecutionRecord> = new Map()
  private config: SafetyConfig

  constructor(config: SafetyConfig = DEFAULT_SAFETY_CONFIG) {
    this.config = config
  }

  /**
   * Generate a unique key for an operation based on type and target
   * @param operationType - The type of operation
   * @param targetId - The target identifier
   * @returns A unique operation key
   */
  static generateKey(operationType: OperationType, targetId: string): string {
    return `${operationType}:${targetId}`
  }

  /**
   * Check if an operation can be executed (cooldown has elapsed)
   * @param operationKey - The unique operation key
   * @returns Whether the operation is allowed
   */
  canExecute(operationKey: string): boolean {
    const remaining = this.getCooldownRemaining(operationKey)
    return remaining === 0
  }

  /**
   * Check if an operation of a specific type on a target can be executed
   * @param operationType - The type of operation
   * @param targetId - The target identifier
   * @returns Whether the operation is allowed
   */
  canExecuteOperation(operationType: OperationType, targetId: string): boolean {
    const key = RateLimiter.generateKey(operationType, targetId)
    return this.canExecute(key)
  }

  /**
   * Record an operation execution
   * @param operationKey - The unique operation key
   */
  recordExecution(operationKey: string): void {
    const existing = this.executions.get(operationKey)
    this.executions.set(operationKey, {
      operationKey,
      lastExecutedAt: Date.now(),
      executionCount: (existing?.executionCount ?? 0) + 1,
    })
  }

  /**
   * Record an operation execution by type and target
   * @param operationType - The type of operation
   * @param targetId - The target identifier
   */
  recordOperationExecution(operationType: OperationType, targetId: string): void {
    const key = RateLimiter.generateKey(operationType, targetId)
    this.recordExecution(key)
  }

  /**
   * Get the remaining cooldown time for an operation
   * @param operationKey - The unique operation key
   * @returns Remaining cooldown in milliseconds (0 if no cooldown)
   */
  getCooldownRemaining(operationKey: string): number {
    const record = this.executions.get(operationKey)
    if (!record) {
      return 0
    }

    // Extract operation type from key
    const operationType = operationKey.split(':')[0] as OperationType
    const cooldownMs = this.config.defaultCooldowns[operationType] ?? 0

    const elapsed = Date.now() - record.lastExecutedAt
    const remaining = cooldownMs - elapsed

    return Math.max(0, remaining)
  }

  /**
   * Get the remaining cooldown time for an operation by type and target
   * @param operationType - The type of operation
   * @param targetId - The target identifier
   * @returns Remaining cooldown in milliseconds
   */
  getOperationCooldownRemaining(operationType: OperationType, targetId: string): number {
    const key = RateLimiter.generateKey(operationType, targetId)
    return this.getCooldownRemaining(key)
  }

  /**
   * Reset/clear the cooldown for an operation
   * @param operationKey - The unique operation key
   */
  reset(operationKey: string): void {
    this.executions.delete(operationKey)
  }

  /**
   * Reset the cooldown for an operation by type and target
   * @param operationType - The type of operation
   * @param targetId - The target identifier
   */
  resetOperation(operationType: OperationType, targetId: string): void {
    const key = RateLimiter.generateKey(operationType, targetId)
    this.reset(key)
  }

  /**
   * Get the execution count for an operation
   * @param operationKey - The unique operation key
   * @returns Number of times the operation has been executed
   */
  getExecutionCount(operationKey: string): number {
    return this.executions.get(operationKey)?.executionCount ?? 0
  }

  /**
   * Get the last execution time for an operation
   * @param operationKey - The unique operation key
   * @returns Last execution timestamp or null if never executed
   */
  getLastExecutionTime(operationKey: string): number | null {
    return this.executions.get(operationKey)?.lastExecutedAt ?? null
  }

  /**
   * Clear all execution records
   */
  clearAll(): void {
    this.executions.clear()
  }

  /**
   * Clear all execution records for a specific target
   * @param targetId - The target identifier to clear
   */
  clearTarget(targetId: string): void {
    const keys = Array.from(this.executions.keys())
    for (const key of keys) {
      if (key.endsWith(`:${targetId}`)) {
        this.executions.delete(key)
      }
    }
  }

  /**
   * Clear all execution records for a specific operation type
   * @param operationType - The operation type to clear
   */
  clearOperationType(operationType: OperationType): void {
    const keys = Array.from(this.executions.keys())
    for (const key of keys) {
      if (key.startsWith(`${operationType}:`)) {
        this.executions.delete(key)
      }
    }
  }

  /**
   * Get all active cooldowns
   * @returns Map of operation keys to remaining cooldown times
   */
  getActiveCooldowns(): Map<string, number> {
    const active = new Map<string, number>()
    const entries = Array.from(this.executions.entries())
    for (const [key] of entries) {
      const remaining = this.getCooldownRemaining(key)
      if (remaining > 0) {
        active.set(key, remaining)
      }
    }
    return active
  }

  /**
   * Get statistics about rate limiting
   * @returns Object containing rate limiting statistics
   */
  getStats(): {
    totalExecutions: number
    activeCooldowns: number
    executionsByType: Record<string, number>
  } {
    let totalExecutions = 0
    let activeCooldowns = 0
    const executionsByType: Record<string, number> = {}

    const entries = Array.from(this.executions.entries())
    for (const [key, record] of entries) {
      totalExecutions += record.executionCount
      if (this.getCooldownRemaining(key) > 0) {
        activeCooldowns++
      }
      const operationType = key.split(':')[0]
      executionsByType[operationType] = (executionsByType[operationType] ?? 0) + record.executionCount
    }

    return {
      totalExecutions,
      activeCooldowns,
      executionsByType,
    }
  }

  /**
   * Update the configuration
   * @param config - New safety configuration
   */
  updateConfig(config: SafetyConfig): void {
    this.config = config
  }
}

// Singleton instance for global use
let globalRateLimiter: RateLimiter | null = null

/**
 * Get the global rate limiter instance
 * @returns The global RateLimiter instance
 */
export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter()
  }
  return globalRateLimiter
}

/**
 * Reset the global rate limiter (useful for testing)
 */
export function resetGlobalRateLimiter(): void {
  if (globalRateLimiter) {
    globalRateLimiter.clearAll()
  }
  globalRateLimiter = null
}

/**
 * Format remaining cooldown time for display
 * @param remainingMs - Remaining time in milliseconds
 * @returns Formatted string (e.g., "1m 30s" or "45s")
 */
export function formatCooldownRemaining(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'Ready'
  }

  const seconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}
