/**
 * Alert Correlation Module
 * Implements logic for correlating related alerts and detecting root causes
 * to help operators quickly identify the source of issues
 */

import {
  Alert,
  AlertInput,
  AlertSource,
  AlertType,
  CorrelationGroup,
  RootCause,
  SafetyConfig,
  DEFAULT_SAFETY_CONFIG,
} from './types'

// Generate unique ID for alerts
const generateAlertId = (): string => {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Generate unique ID for correlation groups
const generateCorrelationId = (): string => {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString()

/**
 * AlertCorrelator class manages alerts and correlates related alerts
 * to identify root causes and affected systems
 */
export class AlertCorrelator {
  private alerts: Map<string, Alert> = new Map()
  private correlationGroups: Map<string, CorrelationGroup> = new Map()
  private config: SafetyConfig

  constructor(config: SafetyConfig = DEFAULT_SAFETY_CONFIG) {
    this.config = config
  }

  /**
   * Add a new alert to the correlator
   * @param alertInput - The alert input data
   * @returns The created alert with assigned ID and correlation
   */
  addAlert(alertInput: AlertInput): Alert {
    const alert: Alert = {
      ...alertInput,
      id: generateAlertId(),
      timestamp: getTimestamp(),
      resolved: false,
    }

    // Try to correlate with existing alerts
    const correlationId = this.findCorrelation(alert)
    if (correlationId) {
      alert.correlationId = correlationId
      this.addToCorrelationGroup(correlationId, alert)
    } else {
      // Check if we should create a new correlation group
      const relatedAlerts = this.findRelatedAlerts(alert)
      if (relatedAlerts.length > 0) {
        const newCorrelationId = generateCorrelationId()
        alert.correlationId = newCorrelationId

        // Create new correlation group
        const group: CorrelationGroup = {
          id: newCorrelationId,
          alerts: [alert, ...relatedAlerts],
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        }

        // Update related alerts with correlation ID
        for (const relatedAlert of relatedAlerts) {
          relatedAlert.correlationId = newCorrelationId
          relatedAlert.relatedAlertIds = relatedAlert.relatedAlertIds || []
          relatedAlert.relatedAlertIds.push(alert.id)
        }

        alert.relatedAlertIds = relatedAlerts.map((a) => a.id)

        this.correlationGroups.set(newCorrelationId, group)

        // Analyze root cause for the new group
        this.analyzeRootCause(newCorrelationId)
      }
    }

    this.alerts.set(alert.id, alert)
    this.cleanupOldAlerts()

    return alert
  }

  /**
   * Find existing correlation group for a new alert
   * @param alert - The alert to correlate
   * @returns Correlation ID if found, undefined otherwise
   */
  private findCorrelation(alert: Alert): string | undefined {
    const alertTime = new Date(alert.timestamp).getTime()
    const entries = Array.from(this.correlationGroups.entries())

    for (const [correlationId, group] of entries) {
      // Check if any alert in the group is within the correlation window
      for (const groupAlert of group.alerts) {
        const groupAlertTime = new Date(groupAlert.timestamp).getTime()
        const timeDiff = Math.abs(alertTime - groupAlertTime)

        if (timeDiff <= this.config.correlationWindowMs) {
          // Check if alerts are related
          if (this.areAlertsRelated(alert, groupAlert)) {
            return correlationId
          }
        }
      }
    }

    return undefined
  }

  /**
   * Find alerts related to the given alert
   * @param alert - The alert to find relations for
   * @returns Array of related alerts
   */
  private findRelatedAlerts(alert: Alert): Alert[] {
    const alertTime = new Date(alert.timestamp).getTime()
    const related: Alert[] = []
    const alertValues = Array.from(this.alerts.values())

    for (const existingAlert of alertValues) {
      if (existingAlert.id === alert.id) continue
      if (existingAlert.correlationId) continue // Already correlated

      const existingTime = new Date(existingAlert.timestamp).getTime()
      const timeDiff = Math.abs(alertTime - existingTime)

      if (timeDiff <= this.config.correlationWindowMs) {
        if (this.areAlertsRelated(alert, existingAlert)) {
          related.push(existingAlert)
        }
      }
    }

    return related
  }

  /**
   * Check if two alerts are related
   * @param a - First alert
   * @param b - Second alert
   * @returns Whether the alerts are related
   */
  private areAlertsRelated(a: Alert, b: Alert): boolean {
    // Same source
    if (a.source.id === b.source.id) {
      return true
    }

    // Same host
    if (a.source.host && b.source.host && a.source.host === b.source.host) {
      return true
    }

    // Related alert types
    const networkRelated: AlertType[] = ['network_issue', 'dns_issue', 'service_down']
    const serviceRelated: AlertType[] = ['service_down', 'service_degraded', 'container_issue']

    if (
      networkRelated.includes(a.type) &&
      networkRelated.includes(b.type)
    ) {
      return true
    }

    if (
      serviceRelated.includes(a.type) &&
      serviceRelated.includes(b.type) &&
      a.source.type === b.source.type
    ) {
      return true
    }

    return false
  }

  /**
   * Add an alert to an existing correlation group
   * @param correlationId - The correlation group ID
   * @param alert - The alert to add
   */
  private addToCorrelationGroup(correlationId: string, alert: Alert): void {
    const group = this.correlationGroups.get(correlationId)
    if (group) {
      // Update related alert IDs
      for (const existingAlert of group.alerts) {
        existingAlert.relatedAlertIds = existingAlert.relatedAlertIds || []
        existingAlert.relatedAlertIds.push(alert.id)
      }
      alert.relatedAlertIds = group.alerts.map((a) => a.id)

      group.alerts.push(alert)
      group.updatedAt = getTimestamp()

      // Re-analyze root cause with new information
      this.analyzeRootCause(correlationId)
    }
  }

  /**
   * Correlate all alerts and group related ones
   * @returns Array of correlation groups
   */
  correlateAlerts(): CorrelationGroup[] {
    // Return existing correlation groups
    return Array.from(this.correlationGroups.values())
  }

  /**
   * Detect the root cause from a set of alerts
   * @param alerts - The alerts to analyze
   * @returns The detected root cause or undefined
   */
  detectRootCause(alerts: Alert[]): RootCause | undefined {
    if (alerts.length === 0) {
      return undefined
    }

    // Analyze patterns in the alerts
    const sources = alerts.map((a) => a.source)
    const types = alerts.map((a) => a.type)
    const hosts = sources.map((s) => s.host).filter((h): h is string => !!h)
    const uniqueHosts = Array.from(new Set(hosts))
    const uniqueTypes = Array.from(new Set(types))

    // Rule 1: Multiple services down within window = likely network/DNS issue
    const serviceDownCount = types.filter((t) => t === 'service_down').length
    if (serviceDownCount >= 2 && uniqueHosts.length > 1) {
      // Check if all on same network segment (simplified: same host prefix)
      const hasNetworkIssue = uniqueTypes.includes('network_issue')
      const hasDnsIssue = uniqueTypes.includes('dns_issue')

      if (hasNetworkIssue || hasDnsIssue) {
        return {
          type: hasDnsIssue ? 'dns' : 'network',
          description: hasDnsIssue
            ? 'DNS resolution failures detected across multiple services'
            : 'Network connectivity issues detected affecting multiple services',
          confidence: 0.85,
          affectedSources: sources,
          suggestedActions: hasDnsIssue
            ? [
                'Check DNS server health',
                'Verify DNS configuration',
                'Check network connectivity to DNS servers',
              ]
            : [
                'Check network switch/router status',
                'Verify firewall rules',
                'Check for network congestion',
              ],
        }
      }

      // Multiple services down without network/DNS alerts
      return {
        type: 'network',
        description: 'Multiple services became unavailable simultaneously, suggesting a network issue',
        confidence: 0.7,
        affectedSources: sources,
        suggestedActions: [
          'Check network connectivity',
          'Verify DNS resolution',
          'Check upstream services',
        ],
      }
    }

    // Rule 2: Same service alerting repeatedly = specific service issue
    const sourceIds = sources.map((s) => s.id)
    const sourceCounts = sourceIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const repeatingSource = Object.entries(sourceCounts).find(([, count]) => count >= 2)
    if (repeatingSource) {
      const [sourceId] = repeatingSource
      const source = sources.find((s) => s.id === sourceId)!
      return {
        type: 'service',
        description: `Service "${source.name}" is repeatedly alerting, indicating a specific issue with this service`,
        confidence: 0.8,
        affectedSources: [source],
        suggestedActions: [
          `Check logs for ${source.name}`,
          `Verify ${source.name} configuration`,
          `Consider restarting ${source.name}`,
          `Check resource usage for ${source.name}`,
        ],
      }
    }

    // Rule 3: All services on same VM down = VM issue
    const vmSources = sources.filter((s) => s.type === 'vm')
    if (vmSources.length > 0) {
      const vmIds = Array.from(new Set(vmSources.map((s) => s.id)))
      if (vmIds.length === 1) {
        return {
          type: 'vm',
          description: `All alerts originate from VM "${vmSources[0].name}", indicating a VM-level issue`,
          confidence: 0.9,
          affectedSources: vmSources,
          suggestedActions: [
            'Check VM health and status',
            'Verify VM resource usage (CPU, memory, disk)',
            'Check hypervisor status',
            'Consider rebooting the VM',
          ],
        }
      }
    }

    // Rule 4: Container issues
    const containerAlerts = alerts.filter((a) => a.type === 'container_issue')
    if (containerAlerts.length >= 2) {
      return {
        type: 'service',
        description: 'Multiple container issues detected, may indicate orchestration or host issues',
        confidence: 0.75,
        affectedSources: containerAlerts.map((a) => a.source),
        suggestedActions: [
          'Check container orchestration platform',
          'Verify container host resources',
          'Check for image pull issues',
          'Review container logs',
        ],
      }
    }

    // Rule 5: Resource exhaustion
    const resourceAlerts = alerts.filter((a) => a.type === 'resource_exhausted')
    if (resourceAlerts.length > 0) {
      return {
        type: 'resource',
        description: 'Resource exhaustion detected, services may be competing for limited resources',
        confidence: 0.8,
        affectedSources: resourceAlerts.map((a) => a.source),
        suggestedActions: [
          'Check disk space',
          'Monitor memory usage',
          'Review CPU utilization',
          'Consider scaling resources',
        ],
      }
    }

    // Default: Unknown root cause
    return {
      type: 'unknown',
      description: 'Unable to determine specific root cause from available alerts',
      confidence: 0.3,
      affectedSources: sources,
      suggestedActions: [
        'Review individual alert details',
        'Check system logs',
        'Monitor for additional alerts',
      ],
    }
  }

  /**
   * Analyze and set root cause for a correlation group
   * @param correlationId - The correlation group ID
   */
  private analyzeRootCause(correlationId: string): void {
    const group = this.correlationGroups.get(correlationId)
    if (group) {
      group.rootCause = this.detectRootCause(group.alerts)
      group.updatedAt = getTimestamp()
    }
  }

  /**
   * Get all alerts in a correlation group
   * @param correlationId - The correlation group ID
   * @returns Array of alerts in the group
   */
  getCorrelationGroup(correlationId: string): Alert[] {
    const group = this.correlationGroups.get(correlationId)
    return group?.alerts ?? []
  }

  /**
   * Get a correlation group by ID
   * @param correlationId - The correlation group ID
   * @returns The correlation group or undefined
   */
  getCorrelationGroupDetails(correlationId: string): CorrelationGroup | undefined {
    return this.correlationGroups.get(correlationId)
  }

  /**
   * Resolve an alert
   * @param alertId - The alert ID
   * @param resolvedBy - Who resolved the alert
   */
  resolveAlert(alertId: string, resolvedBy?: string): void {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = getTimestamp()
      alert.resolvedBy = resolvedBy
    }
  }

  /**
   * Acknowledge an alert
   * @param alertId - The alert ID
   * @param acknowledgedBy - Who acknowledged the alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): void {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledgedAt = getTimestamp()
      alert.acknowledgedBy = acknowledgedBy
    }
  }

  /**
   * Resolve all alerts in a correlation group
   * @param correlationId - The correlation group ID
   * @param resolvedBy - Who resolved the alerts
   */
  resolveCorrelationGroup(correlationId: string, resolvedBy?: string): void {
    const group = this.correlationGroups.get(correlationId)
    if (group) {
      for (const alert of group.alerts) {
        this.resolveAlert(alert.id, resolvedBy)
      }
    }
  }

  /**
   * Get an alert by ID
   * @param alertId - The alert ID
   * @returns The alert or undefined
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId)
  }

  /**
   * Get all alerts
   * @returns Array of all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Get unresolved alerts
   * @returns Array of unresolved alerts
   */
  getUnresolvedAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.resolved)
  }

  /**
   * Get alerts by severity
   * @param severity - The severity to filter by
   * @returns Array of alerts with the specified severity
   */
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => a.severity === severity)
  }

  /**
   * Clean up old alerts based on retention period
   */
  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - this.config.alertRetentionMs
    const alertEntries = Array.from(this.alerts.entries())

    for (const [alertId, alert] of alertEntries) {
      const alertTime = new Date(alert.timestamp).getTime()
      if (alertTime < cutoff && alert.resolved) {
        this.alerts.delete(alertId)
      }
    }

    // Clean up empty correlation groups
    const groupEntries = Array.from(this.correlationGroups.entries())
    for (const [correlationId, group] of groupEntries) {
      const hasActiveAlerts = group.alerts.some((a: Alert) => this.alerts.has(a.id))
      if (!hasActiveAlerts) {
        this.correlationGroups.delete(correlationId)
      }
    }
  }

  /**
   * Clear all alerts and correlation groups
   */
  clearAll(): void {
    this.alerts.clear()
    this.correlationGroups.clear()
  }

  /**
   * Get statistics about alerts
   * @returns Alert statistics
   */
  getStats(): {
    total: number
    unresolved: number
    bySeverity: Record<string, number>
    correlationGroups: number
  } {
    const alerts = Array.from(this.alerts.values())
    const bySeverity: Record<string, number> = {}

    for (const alert of alerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    }

    return {
      total: alerts.length,
      unresolved: alerts.filter((a) => !a.resolved).length,
      bySeverity,
      correlationGroups: this.correlationGroups.size,
    }
  }
}

// Singleton instance for global use
let globalAlertCorrelator: AlertCorrelator | null = null

/**
 * Get the global alert correlator instance
 * @returns The global AlertCorrelator instance
 */
export function getGlobalAlertCorrelator(): AlertCorrelator {
  if (!globalAlertCorrelator) {
    globalAlertCorrelator = new AlertCorrelator()
  }
  return globalAlertCorrelator
}

/**
 * Reset the global alert correlator (useful for testing)
 */
export function resetGlobalAlertCorrelator(): void {
  if (globalAlertCorrelator) {
    globalAlertCorrelator.clearAll()
  }
  globalAlertCorrelator = null
}
