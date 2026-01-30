/**
 * Safety Infrastructure Module
 * Exports all safety-related types, utilities, and classes
 */

// Types
export type {
  OperationType,
  RiskLevel,
  OperationStatus,
  OperationTarget,
  OperationResult,
  Operation,
  OperationInput,
  AlertSeverity,
  AlertType,
  AlertSource,
  Alert,
  AlertInput,
  CorrelationGroup,
  RootCause,
  RateLimitConfig,
  SafetyConfig,
} from './types'

export { DEFAULT_SAFETY_CONFIG } from './types'

// Risk Assessment
export {
  assessRisk,
  requiresConfirmation,
  getCooldownMs,
  getMaxRetries,
  compareRiskLevels,
  maxRiskLevel,
  isRiskAtOrAbove,
  getRiskDescription,
  getOperationWarning,
  getRiskColorClasses,
} from './risk-assessment'

// Rate Limiter
export {
  RateLimiter,
  getGlobalRateLimiter,
  resetGlobalRateLimiter,
  formatCooldownRemaining,
} from './rate-limiter'

// Alert Correlation
export {
  AlertCorrelator,
  getGlobalAlertCorrelator,
  resetGlobalAlertCorrelator,
} from './alert-correlation'
