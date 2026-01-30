'use client';

import { useState } from 'react';
import classNames from 'classnames';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  Timer,
} from 'lucide-react';
import {
  useSafetyStore,
  usePendingOperations,
  useUnresolvedAlerts,
  useSafetyStats,
} from '@/lib/stores/safety-store';
import {
  Alert,
  Operation,
  AlertSeverity,
  RiskLevel,
} from '@/lib/safety/types';
import { useSafeOperation } from '@/hooks/useSafeOperation';

// ============================================================================
// Subcomponents
// ============================================================================

interface AlertBadgeProps {
  severity: AlertSeverity;
  count: number;
}

function AlertBadge({ severity, count }: AlertBadgeProps) {
  if (count === 0) return null;

  const colors: Record<AlertSeverity, string> = {
    info: 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30',
    warning: 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/30',
    error: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
    critical: 'bg-[#dc2626]/20 text-[#dc2626] border-[#dc2626]/30 animate-pulse',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full border',
        colors[severity]
      )}
    >
      {count}
    </span>
  );
}

interface PendingOperationItemProps {
  operation: Operation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function PendingOperationItem({ operation, onApprove, onReject }: PendingOperationItemProps) {
  const riskColors: Record<RiskLevel, string> = {
    safe: 'text-[#22c55e]',
    moderate: 'text-[#eab308]',
    dangerous: 'text-[#f97316]',
    critical: 'text-[#ef4444]',
  };

  return (
    <div className="flex items-center justify-between p-2 bg-[#18181b] rounded-md border border-[#27272a]">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-[#71717a]" />
        <div>
          <span className="text-sm text-[#fafafa]">{operation.type}</span>
          <span className="text-xs text-[#71717a] ml-2">on {operation.target.name}</span>
        </div>
        <span className={classNames('text-xs', riskColors[operation.riskLevel])}>
          [{operation.riskLevel}]
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onApprove(operation.id)}
          className="p-1 rounded hover:bg-[#22c55e]/20 text-[#22c55e] transition-colors"
          title="Approve"
        >
          <CheckCircle size={16} />
        </button>
        <button
          onClick={() => onReject(operation.id)}
          className="p-1 rounded hover:bg-[#ef4444]/20 text-[#ef4444] transition-colors"
          title="Reject"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
  onResolve: (id: string) => void;
}

function AlertItem({ alert, onResolve }: AlertItemProps) {
  const severityIcons: Record<AlertSeverity, JSX.Element> = {
    info: <Bell size={14} className="text-[#3b82f6]" />,
    warning: <AlertTriangle size={14} className="text-[#eab308]" />,
    error: <XCircle size={14} className="text-[#ef4444]" />,
    critical: <AlertTriangle size={14} className="text-[#dc2626]" />,
  };

  return (
    <div className="flex items-start justify-between p-2 bg-[#18181b] rounded-md border border-[#27272a]">
      <div className="flex items-start gap-2">
        {severityIcons[alert.severity]}
        <div>
          <div className="text-sm text-[#fafafa]">{alert.type}</div>
          <div className="text-xs text-[#71717a]">{alert.message}</div>
        </div>
      </div>
      <button
        onClick={() => onResolve(alert.id)}
        className="p-1 rounded hover:bg-[#27272a] text-[#71717a] transition-colors"
        title="Resolve"
      >
        <CheckCircle size={14} />
      </button>
    </div>
  );
}

interface CooldownDisplayProps {
  operationType: string;
  remainingMs: number;
}

function CooldownDisplay({ operationType, remainingMs }: CooldownDisplayProps) {
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="p-2 bg-[#18181b] rounded-md border border-[#27272a]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-[#71717a]" />
          <span className="text-sm text-[#fafafa]">{operationType}</span>
        </div>
        <span className="text-xs text-[#71717a]">{remainingSeconds}s</span>
      </div>
      <div className="h-1 bg-[#27272a] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3b82f6] transition-all duration-1000"
          style={{ width: `${Math.min(100, (remainingMs / 60000) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface SafetyStatusBarProps {
  className?: string;
  compact?: boolean;
}

export function SafetyStatusBar({ className, compact = false }: SafetyStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pendingOperations = usePendingOperations();
  const activeAlerts = useUnresolvedAlerts();
  const stats = useSafetyStats();
  const { rejectOperation } = useSafeOperation();
  const store = useSafetyStore();

  const { alertsBySeverity } = stats;
  const totalAlerts = activeAlerts.length;
  const hasCritical = alertsBySeverity.critical > 0;
  const hasWarnings = alertsBySeverity.warning > 0 || alertsBySeverity.error > 0;
  const hasPending = pendingOperations.length > 0;

  // Handle operation approval (stub - actual execution would be handled by parent)
  const handleApprove = (operationId: string) => {
    // In a real implementation, this would trigger the actual operation
    // For now, we just approve it in the store
    store.approveOperation(operationId);
  };

  // Handle operation rejection
  const handleReject = (operationId: string) => {
    rejectOperation(operationId);
  };

  // Handle alert resolution
  const handleResolveAlert = (alertId: string) => {
    store.resolveAlert(alertId);
  };

  // Determine overall status
  const getStatusColor = () => {
    if (hasCritical) return 'text-[#dc2626]';
    if (hasWarnings) return 'text-[#eab308]';
    if (hasPending) return 'text-[#3b82f6]';
    return 'text-[#22c55e]';
  };

  const getStatusText = () => {
    if (hasCritical) return 'Critical Issues';
    if (hasWarnings) return 'Warnings Present';
    if (hasPending) return 'Pending Approvals';
    return 'All Systems Safe';
  };

  if (compact) {
    return (
      <div className={classNames('flex items-center gap-2', className)}>
        <Shield size={16} className={getStatusColor()} />
        {hasPending && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30">
            {pendingOperations.length}
          </span>
        )}
        {totalAlerts > 0 && (
          <AlertBadge
            severity={hasCritical ? 'critical' : hasWarnings ? 'warning' : 'info'}
            count={totalAlerts}
          />
        )}
      </div>
    );
  }

  return (
    <div className={classNames('bg-[#111113] border border-[#27272a] rounded-lg', className)}>
      {/* Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#18181b] transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <Shield size={18} className={getStatusColor()} />
          <span className={classNames('text-sm font-medium', getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending Approvals Badge */}
          {hasPending && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#3b82f6]/10 rounded-md border border-[#3b82f6]/30">
              <Clock size={12} className="text-[#3b82f6]" />
              <span className="text-xs text-[#3b82f6]">
                {pendingOperations.length} pending
              </span>
            </div>
          )}

          {/* Alert Badges */}
          <div className="flex items-center gap-1">
            <AlertBadge severity="critical" count={alertsBySeverity.critical} />
            <AlertBadge severity="error" count={alertsBySeverity.error} />
            <AlertBadge severity="warning" count={alertsBySeverity.warning} />
          </div>

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp size={16} className="text-[#71717a]" />
          ) : (
            <ChevronDown size={16} className="text-[#71717a]" />
          )}
        </div>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#27272a] pt-4">
          {/* Pending Operations */}
          {pendingOperations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[#71717a] uppercase tracking-wide mb-2">
                Pending Approvals
              </h4>
              <div className="space-y-2">
                {pendingOperations.map((op) => (
                  <PendingOperationItem
                    key={op.id}
                    operation={op}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[#71717a] uppercase tracking-wide mb-2">
                Active Alerts
              </h4>
              <div className="space-y-2">
                {activeAlerts.slice(0, 5).map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onResolve={handleResolveAlert}
                  />
                ))}
                {activeAlerts.length > 5 && (
                  <div className="text-xs text-[#71717a] text-center py-1">
                    +{activeAlerts.length - 5} more alerts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {pendingOperations.length === 0 && activeAlerts.length === 0 && (
            <div className="text-center py-4">
              <CheckCircle size={24} className="text-[#22c55e] mx-auto mb-2" />
              <p className="text-sm text-[#71717a]">All systems operating normally</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SafetyStatusBar;
