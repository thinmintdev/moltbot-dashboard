'use client';

import { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useSafeOperation } from '@/hooks/useSafeOperation';
import { OperationType, RiskLevel } from '@/lib/safety/types';

// ============================================================================
// Types
// ============================================================================

interface ContainerControlActionsProps {
  containerId: string;
  containerName: string;
  containerStatus: 'running' | 'stopped' | 'paused' | 'unknown';
  onStart?: () => Promise<void>;
  onStop?: () => Promise<void>;
  onRestart?: () => Promise<void>;
  onRemove?: () => Promise<void>;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  operationType: OperationType;
  targetId: string;
  targetName: string;
  onExecute: () => Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  requiresCheckbox?: boolean;
  showLabel?: boolean;
  compact?: boolean;
}

// ============================================================================
// Confirmation Dialog
// ============================================================================

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  riskLevel: RiskLevel;
  requiresCheckbox: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({
  isOpen,
  title,
  message,
  riskLevel,
  requiresCheckbox,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const riskColors: Record<RiskLevel, string> = {
    safe: 'text-[#22c55e]',
    moderate: 'text-[#eab308]',
    dangerous: 'text-[#f97316]',
    critical: 'text-[#ef4444]',
  };

  const canConfirm = !requiresCheckbox || isChecked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111113] border border-[#27272a] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className={classNames('h-6 w-6', riskColors[riskLevel])} />
          <h3 className="text-lg font-semibold text-[#fafafa]">{title}</h3>
        </div>

        <p className="text-sm text-[#a1a1aa] mb-4">{message}</p>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-[#71717a]">Risk Level:</span>
          <span className={classNames('text-xs font-medium', riskColors[riskLevel])}>
            {riskLevel.toUpperCase()}
          </span>
        </div>

        {requiresCheckbox && (
          <label className="flex items-center gap-2 p-3 bg-[#18181b] rounded-md border border-[#27272a] mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-4 h-4 rounded border-[#27272a] bg-[#0a0a0b] text-[#ef4444] focus:ring-[#ef4444] focus:ring-offset-0"
            />
            <span className="text-sm text-[#a1a1aa]">
              I understand this action cannot be undone
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-md hover:bg-[#27272a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={classNames(
              'px-4 py-2 text-sm rounded-md transition-colors',
              canConfirm
                ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                : 'bg-[#27272a] text-[#71717a] cursor-not-allowed'
            )}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Action Button Component
// ============================================================================

function ActionButton({
  label,
  icon,
  operationType,
  targetId,
  targetName,
  onExecute,
  disabled = false,
  variant = 'default',
  requiresCheckbox = false,
  showLabel = true,
  compact = false,
}: ActionButtonProps) {
  const {
    executeWithConfirmation,
    checkCooldown,
    getCooldownRemaining,
    assessRisk,
    approveOperation,
  } = useSafeOperation();

  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOperationId, setPendingOperationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const target = { type: 'container' as const, id: targetId, name: targetName };
  const riskLevel = assessRisk(operationType, target);
  const inCooldown = checkCooldown(operationType, targetId);

  // Update cooldown timer
  useEffect(() => {
    if (inCooldown) {
      const remaining = getCooldownRemaining(operationType, targetId);
      setCooldownSeconds(remaining);

      const interval = setInterval(() => {
        const newRemaining = getCooldownRemaining(operationType, targetId);
        setCooldownSeconds(newRemaining);
        if (newRemaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCooldownSeconds(0);
    }
  }, [inCooldown, operationType, targetId, getCooldownRemaining]);

  // Reset status after delay
  useEffect(() => {
    if (status !== 'idle') {
      const timeout = setTimeout(() => setStatus('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading || inCooldown) return;

    setIsLoading(true);
    setStatus('idle');

    try {
      const result = await executeWithConfirmation(
        {
          type: operationType,
          targetId,
          targetName,
          targetType: 'container',
        },
        onExecute
      );

      if (result.operation.status === 'pending') {
        // Needs confirmation
        setPendingOperationId(result.operation.id);
        setShowConfirmation(true);
        setIsLoading(false);
      } else if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      setStatus('error');
    } finally {
      if (!showConfirmation) {
        setIsLoading(false);
      }
    }
  }, [
    disabled,
    isLoading,
    inCooldown,
    executeWithConfirmation,
    operationType,
    targetId,
    targetName,
    onExecute,
    showConfirmation,
  ]);

  const handleConfirm = useCallback(async () => {
    if (!pendingOperationId) return;

    setShowConfirmation(false);
    setIsLoading(true);

    try {
      const result = await approveOperation(pendingOperationId, onExecute);
      setStatus(result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Operation failed:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
      setPendingOperationId(null);
    }
  }, [pendingOperationId, approveOperation, onExecute]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setIsLoading(false);
    setPendingOperationId(null);
  }, []);

  const isDisabled = disabled || isLoading || inCooldown;

  const baseClasses = classNames(
    'flex items-center gap-1.5 rounded-md transition-all',
    compact ? 'p-1.5' : 'px-3 py-1.5',
    {
      'opacity-50 cursor-not-allowed': isDisabled,
      'cursor-pointer': !isDisabled,
    }
  );

  const variantClasses =
    variant === 'danger'
      ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/20'
      : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a] hover:bg-[#27272a] hover:text-[#fafafa]';

  const statusIcon = () => {
    if (isLoading) return <Loader2 size={compact ? 14 : 16} className="animate-spin" />;
    if (status === 'success') return <CheckCircle size={compact ? 14 : 16} className="text-[#22c55e]" />;
    if (status === 'error') return <AlertTriangle size={compact ? 14 : 16} className="text-[#ef4444]" />;
    return icon;
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={classNames(baseClasses, isDisabled ? 'opacity-50' : variantClasses)}
        title={inCooldown ? `Cooldown: ${cooldownSeconds}s remaining` : label}
      >
        {statusIcon()}
        {showLabel && !compact && (
          <span className="text-xs">
            {inCooldown ? `${cooldownSeconds}s` : label}
          </span>
        )}
        {inCooldown && !showLabel && (
          <span className="text-xs">{cooldownSeconds}s</span>
        )}
      </button>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title={`Confirm ${label}`}
        message={`Are you sure you want to ${label.toLowerCase()} container "${targetName}"? This operation has a ${riskLevel} risk level.`}
        riskLevel={riskLevel}
        requiresCheckbox={requiresCheckbox}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ContainerControlActions({
  containerId,
  containerName,
  containerStatus,
  onStart,
  onStop,
  onRestart,
  onRemove,
  className,
  showLabels = true,
  compact = false,
}: ContainerControlActionsProps) {
  const isRunning = containerStatus === 'running';
  const isStopped = containerStatus === 'stopped' || containerStatus === 'paused';

  // Default handlers that log a warning
  const createDefaultHandler = (action: string) => async () => {
    console.warn(`No handler provided for ${action} on container ${containerId}`);
  };

  return (
    <div className={classNames('flex items-center gap-2', className)}>
      {/* Start Button - only show when stopped */}
      {isStopped && onStart && (
        <ActionButton
          label="Start"
          icon={<Play size={compact ? 14 : 16} />}
          operationType="query"
          targetId={containerId}
          targetName={containerName}
          onExecute={onStart || createDefaultHandler('start')}
          showLabel={showLabels}
          compact={compact}
        />
      )}

      {/* Restart Button - only show when running */}
      {isRunning && onRestart && (
        <ActionButton
          label="Restart"
          icon={<RotateCcw size={compact ? 14 : 16} />}
          operationType="restart"
          targetId={containerId}
          targetName={containerName}
          onExecute={onRestart || createDefaultHandler('restart')}
          showLabel={showLabels}
          compact={compact}
        />
      )}

      {/* Stop Button - only show when running */}
      {isRunning && onStop && (
        <ActionButton
          label="Stop"
          icon={<Square size={compact ? 14 : 16} />}
          operationType="stop"
          targetId={containerId}
          targetName={containerName}
          onExecute={onStop || createDefaultHandler('stop')}
          variant="danger"
          showLabel={showLabels}
          compact={compact}
        />
      )}

      {/* Remove Button - can remove when stopped */}
      {isStopped && onRemove && (
        <ActionButton
          label="Remove"
          icon={<Trash2 size={compact ? 14 : 16} />}
          operationType="delete"
          targetId={containerId}
          targetName={containerName}
          onExecute={onRemove || createDefaultHandler('remove')}
          variant="danger"
          requiresCheckbox
          showLabel={showLabels}
          compact={compact}
        />
      )}
    </div>
  );
}

export default ContainerControlActions;
