'use client';

import { useCallback, useMemo } from 'react';
import {
  useSafetyStore,
  useUnresolvedAlerts,
  useCorrelationGroups,
} from '@/lib/stores/safety-store';
import {
  Alert,
  AlertInput,
  AlertSeverity,
  CorrelationGroup,
} from '@/lib/safety/types';

// ============================================================================
// Types
// ============================================================================

export interface AlertCorrelationHook {
  // All alerts
  alerts: Alert[];

  // Active (unresolved) alerts
  activeAlerts: Alert[];

  // Correlated alert groups
  correlatedGroups: CorrelationGroup[];

  // Add a new alert
  addAlert: (alert: AlertInput) => Alert;

  // Resolve a single alert
  resolveAlert: (id: string) => void;

  // Resolve all alerts in a correlation group
  resolveGroup: (correlationId: string) => void;

  // Get root cause for a correlation group
  getRootCause: (correlationId: string) => string | null;

  // Get alerts by severity
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];

  // Get alert counts by severity
  alertCounts: Record<AlertSeverity, number>;

  // Clear all resolved alerts
  clearResolved: () => void;

  // Acknowledge an alert
  acknowledgeAlert: (id: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAlertCorrelation(): AlertCorrelationHook {
  const store = useSafetyStore();
  const alerts = useSafetyStore((state) => state.alerts);
  const activeAlerts = useUnresolvedAlerts();
  const correlatedGroups = useCorrelationGroups();

  /**
   * Calculate alert counts by severity
   */
  const alertCounts = useMemo(() => {
    const counts: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    for (const alert of activeAlerts) {
      counts[alert.severity]++;
    }

    return counts;
  }, [activeAlerts]);

  /**
   * Add a new alert
   */
  const addAlert = useCallback(
    (alertData: AlertInput): Alert => {
      return store.addAlert(alertData);
    },
    [store]
  );

  /**
   * Resolve a single alert
   */
  const resolveAlert = useCallback(
    (id: string): void => {
      store.resolveAlert(id);
    },
    [store]
  );

  /**
   * Resolve all alerts in a correlation group
   */
  const resolveGroup = useCallback(
    (correlationId: string): void => {
      store.resolveCorrelationGroup(correlationId);
    },
    [store]
  );

  /**
   * Get root cause for a correlation group
   */
  const getRootCause = useCallback(
    (correlationId: string): string | null => {
      const group = correlatedGroups.find((g) => g.id === correlationId);
      return group?.rootCause?.description || null;
    },
    [correlatedGroups]
  );

  /**
   * Get alerts by severity
   */
  const getAlertsBySeverity = useCallback(
    (severity: AlertSeverity): Alert[] => {
      return activeAlerts.filter((alert) => alert.severity === severity);
    },
    [activeAlerts]
  );

  /**
   * Clear all resolved alerts
   */
  const clearResolved = useCallback((): void => {
    store.clearResolvedAlerts();
  }, [store]);

  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = useCallback(
    (id: string): void => {
      store.acknowledgeAlert(id);
    },
    [store]
  );

  return {
    alerts,
    activeAlerts,
    correlatedGroups,
    addAlert,
    resolveAlert,
    resolveGroup,
    getRootCause,
    getAlertsBySeverity,
    alertCounts,
    clearResolved,
    acknowledgeAlert,
  };
}

export default useAlertCorrelation;
