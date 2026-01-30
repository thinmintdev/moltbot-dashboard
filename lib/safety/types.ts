/**
 * Safety Infrastructure Types
 * Defines core types for fail-safe operations, human-in-the-loop confirmation,
 * and alert correlation
 */

// Operation types supported by the safety system
export type OperationType = 'query' | 'restart' | 'stop' | 'reboot' | 'delete'

// Risk levels for operations
export type RiskLevel = 'safe' | 'moderate' | 'dangerous' | 'critical'

// Status of an operation through its lifecycle
export type OperationStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'

// Target of an operation
export interface OperationTarget {
  type: 'vm' | 'container' | 'service'
  id: string
  name: string
}

// Result of an operation execution
export interface OperationResult {
  success: boolean
  message: string
  error?: string
  executedAt: string
}

// Complete operation record
export interface Operation {
  id: string
  type: OperationType
  target: OperationTarget
  riskLevel: RiskLevel
  status: OperationStatus
  requiresConfirmation: boolean
  cooldownMs: number
  createdAt: string
  executedAt?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  result?: OperationResult
  retryCount: number
  maxRetries: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

// Input for creating a new operation
export type OperationInput = Omit<
  Operation,
  'id' | 'createdAt' | 'status' | 'retryCount' | 'result' | 'executedAt' | 'approvedAt' | 'rejectedAt'
> & {
  status?: OperationStatus
  retryCount?: number
}

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// Alert types for categorization
export type AlertType =
  | 'service_down'
  | 'service_degraded'
  | 'resource_exhausted'
  | 'network_issue'
  | 'dns_issue'
  | 'vm_issue'
  | 'container_issue'
  | 'security'
  | 'performance'
  | 'custom'

// Alert source information
export interface AlertSource {
  type: 'vm' | 'container' | 'service' | 'network' | 'system'
  id: string
  name: string
  host?: string
}

// Complete alert record
export interface Alert {
  id: string
  source: AlertSource
  type: AlertType
  severity: AlertSeverity
  message: string
  timestamp: string
  correlationId?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  metadata?: Record<string, unknown>
  relatedAlertIds?: string[]
}

// Input for creating a new alert
export type AlertInput = Omit<
  Alert,
  'id' | 'timestamp' | 'resolved' | 'correlationId'
> & {
  correlationId?: string
}

// Correlation group containing related alerts
export interface CorrelationGroup {
  id: string
  alerts: Alert[]
  rootCause?: RootCause
  createdAt: string
  updatedAt: string
}

// Root cause analysis result
export interface RootCause {
  type: 'network' | 'dns' | 'vm' | 'service' | 'resource' | 'unknown'
  description: string
  confidence: number // 0-1
  affectedSources: AlertSource[]
  suggestedActions: string[]
}

// Rate limit configuration
export interface RateLimitConfig {
  operationType: OperationType
  cooldownMs: number
  maxRetries: number
}

// Safety configuration
export interface SafetyConfig {
  defaultCooldowns: Record<OperationType, number>
  defaultMaxRetries: Record<OperationType, number>
  riskMatrix: Record<OperationType, RiskLevel>
  confirmationThresholds: Record<RiskLevel, boolean>
  correlationWindowMs: number
  alertRetentionMs: number
}

// Default safety configuration
export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  defaultCooldowns: {
    query: 0,
    restart: 30000,    // 30 seconds
    stop: 60000,       // 60 seconds
    reboot: 120000,    // 2 minutes
    delete: 300000,    // 5 minutes
  },
  defaultMaxRetries: {
    query: 3,
    restart: 2,
    stop: 1,
    reboot: 1,
    delete: 0,
  },
  riskMatrix: {
    query: 'safe',
    restart: 'moderate',
    stop: 'dangerous',
    reboot: 'dangerous',
    delete: 'critical',
  },
  confirmationThresholds: {
    safe: false,
    moderate: false,
    dangerous: true,
    critical: true,
  },
  correlationWindowMs: 60000,  // 60 seconds
  alertRetentionMs: 86400000,  // 24 hours
}
