'use client';

import { useCallback, useState } from 'react';
import { useSafetyStore } from '@/lib/stores/safety-store';
import {
  Operation,
  OperationType,
  OperationTarget,
  RiskLevel,
} from '@/lib/safety/types';
import { assessRisk, requiresConfirmation } from '@/lib/safety/risk-assessment';

// ============================================================================
// Types
// ============================================================================

export interface OperationRequest {
  type: OperationType;
  targetId: string;
  targetName: string;
  targetType: 'vm' | 'container' | 'service';
  metadata?: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  operation: Operation;
  error?: string;
}

export interface SafeOperationHook {
  // Execute an operation with safety checks
  executeWithConfirmation: (
    request: OperationRequest,
    onExecute: () => Promise<void>
  ) => Promise<ExecutionResult>;

  // Direct execute (skip confirmation for safe operations)
  executeDirectly: (
    request: OperationRequest,
    onExecute: () => Promise<void>
  ) => Promise<ExecutionResult>;

  // Check if operation is in cooldown
  checkCooldown: (operationType: OperationType, targetId: string) => boolean;

  // Get cooldown remaining time
  getCooldownRemaining: (operationType: OperationType, targetId: string) => number;

  // Get pending approvals for current operations
  getPendingApprovals: () => Operation[];

  // Assess risk for an operation type
  assessRisk: (operationType: OperationType, target: OperationTarget) => RiskLevel;

  // Check if rate limit allows operation
  checkRateLimit: (operationType: OperationType, targetId: string) => boolean;

  // Approve a pending operation
  approveOperation: (operationId: string, onExecute: () => Promise<void>) => Promise<ExecutionResult>;

  // Reject a pending operation
  rejectOperation: (operationId: string) => void;

  // Current execution state
  isExecuting: boolean;
  currentOperation: Operation | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSafeOperation(): SafeOperationHook {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);

  const store = useSafetyStore();

  /**
   * Check if operation is in cooldown
   */
  const checkCooldown = useCallback(
    (operationType: OperationType, targetId: string): boolean => {
      return !store.canExecuteOperation(operationType, targetId);
    },
    [store]
  );

  /**
   * Get cooldown remaining time in seconds
   */
  const getCooldownRemainingFn = useCallback(
    (operationType: OperationType, targetId: string): number => {
      const ms = store.getCooldownRemaining(operationType, targetId);
      return Math.ceil(ms / 1000);
    },
    [store]
  );

  /**
   * Get pending operations awaiting approval
   */
  const getPendingApprovals = useCallback((): Operation[] => {
    return store.getPendingByRisk();
  }, [store]);

  /**
   * Assess risk level for an operation
   */
  const assessRiskFn = useCallback(
    (operationType: OperationType, target: OperationTarget): RiskLevel => {
      return assessRisk(operationType, target);
    },
    []
  );

  /**
   * Check if rate limit allows operation
   */
  const checkRateLimit = useCallback(
    (operationType: OperationType, targetId: string): boolean => {
      return store.canExecuteOperation(operationType, targetId);
    },
    [store]
  );

  /**
   * Execute operation with safety checks
   */
  const executeWithConfirmation = useCallback(
    async (
      request: OperationRequest,
      onExecute: () => Promise<void>
    ): Promise<ExecutionResult> => {
      const target: OperationTarget = {
        type: request.targetType,
        id: request.targetId,
        name: request.targetName,
      };

      const riskLevel = assessRisk(request.type, target);
      const needsConfirmation = requiresConfirmation(riskLevel);

      // Check cooldown
      if (checkCooldown(request.type, request.targetId)) {
        const remaining = getCooldownRemainingFn(request.type, request.targetId);
        // Create operation in failed state for tracking
        const operation: Operation = {
          id: `temp_${Date.now()}`,
          type: request.type,
          target,
          riskLevel,
          status: 'failed',
          requiresConfirmation: needsConfirmation,
          cooldownMs: 0,
          maxRetries: 0,
          createdAt: new Date().toISOString(),
          retryCount: 0,
          result: {
            success: false,
            message: `Operation in cooldown. ${remaining}s remaining.`,
            error: `Cooldown active`,
            executedAt: new Date().toISOString(),
          },
        };
        return {
          success: false,
          operation,
          error: `Operation in cooldown. ${remaining}s remaining.`,
        };
      }

      // Check rate limit
      if (!checkRateLimit(request.type, request.targetId)) {
        const operation: Operation = {
          id: `temp_${Date.now()}`,
          type: request.type,
          target,
          riskLevel,
          status: 'failed',
          requiresConfirmation: needsConfirmation,
          cooldownMs: 0,
          maxRetries: 0,
          createdAt: new Date().toISOString(),
          retryCount: 0,
          result: {
            success: false,
            message: 'Rate limit exceeded. Please wait.',
            error: 'Rate limited',
            executedAt: new Date().toISOString(),
          },
        };
        return {
          success: false,
          operation,
          error: 'Rate limit exceeded. Please wait.',
        };
      }

      // Queue the operation
      const operation = store.queueOperation({
        type: request.type,
        target,
        riskLevel,
        requiresConfirmation: needsConfirmation,
        cooldownMs: 30000,
        maxRetries: 3,
        metadata: request.metadata,
      });

      // If confirmation is required, return pending status
      if (operation.status === 'pending') {
        return {
          success: true,
          operation,
        };
      }

      // No confirmation required - execute directly
      return executeOperation(operation, onExecute);
    },
    [store, checkCooldown, getCooldownRemainingFn, checkRateLimit]
  );

  /**
   * Execute operation directly without confirmation
   */
  const executeDirectly = useCallback(
    async (
      request: OperationRequest,
      onExecute: () => Promise<void>
    ): Promise<ExecutionResult> => {
      const target: OperationTarget = {
        type: request.targetType,
        id: request.targetId,
        name: request.targetName,
      };

      const riskLevel = assessRisk(request.type, target);

      // Check cooldown
      if (checkCooldown(request.type, request.targetId)) {
        const remaining = getCooldownRemainingFn(request.type, request.targetId);
        const operation: Operation = {
          id: `temp_${Date.now()}`,
          type: request.type,
          target,
          riskLevel,
          status: 'failed',
          requiresConfirmation: false,
          cooldownMs: 0,
          maxRetries: 0,
          createdAt: new Date().toISOString(),
          retryCount: 0,
          result: {
            success: false,
            message: `Operation in cooldown. ${remaining}s remaining.`,
            error: `Cooldown active`,
            executedAt: new Date().toISOString(),
          },
        };
        return {
          success: false,
          operation,
          error: `Operation in cooldown. ${remaining}s remaining.`,
        };
      }

      // Queue with no confirmation required
      const operation = store.queueOperation({
        type: request.type,
        target,
        riskLevel,
        requiresConfirmation: false,
        cooldownMs: 30000,
        maxRetries: 3,
        metadata: request.metadata,
      });

      return executeOperation(operation, onExecute);
    },
    [store, checkCooldown, getCooldownRemainingFn]
  );

  /**
   * Internal: Execute an operation
   */
  const executeOperation = async (
    operation: Operation,
    onExecute: () => Promise<void>
  ): Promise<ExecutionResult> => {
    setIsExecuting(true);
    setCurrentOperation(operation);

    try {
      // Execute the store operation (this handles rate limiting)
      await store.executeOperation(operation.id);

      // Execute the actual operation
      await onExecute();

      const updatedOperation = store.getOperationById(operation.id);
      return {
        success: true,
        operation: updatedOperation || { ...operation, status: 'executed' },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        operation: { ...operation, status: 'failed' },
        error: errorMessage,
      };
    } finally {
      setIsExecuting(false);
      setCurrentOperation(null);
    }
  };

  /**
   * Approve a pending operation and execute it
   */
  const approveOperationFn = useCallback(
    async (
      operationId: string,
      onExecute: () => Promise<void>
    ): Promise<ExecutionResult> => {
      const operation = store.getOperationById(operationId);
      if (!operation) {
        return {
          success: false,
          operation: {
            id: operationId,
            type: 'query',
            target: { type: 'vm', id: '', name: '' },
            riskLevel: 'safe',
            status: 'failed',
            requiresConfirmation: false,
            cooldownMs: 0,
            maxRetries: 0,
            createdAt: new Date().toISOString(),
            retryCount: 0,
          },
          error: 'Operation not found',
        };
      }

      if (operation.status !== 'pending') {
        return {
          success: false,
          operation,
          error: `Operation is not pending (status: ${operation.status})`,
        };
      }

      store.approveOperation(operationId);
      return executeOperation({ ...operation, status: 'approved' }, onExecute);
    },
    [store]
  );

  /**
   * Reject a pending operation
   */
  const rejectOperationFn = useCallback(
    (operationId: string): void => {
      store.rejectOperation(operationId);
    },
    [store]
  );

  return {
    executeWithConfirmation,
    executeDirectly,
    checkCooldown,
    getCooldownRemaining: getCooldownRemainingFn,
    getPendingApprovals,
    assessRisk: assessRiskFn,
    checkRateLimit,
    approveOperation: approveOperationFn,
    rejectOperation: rejectOperationFn,
    isExecuting,
    currentOperation,
  };
}

export default useSafeOperation;
