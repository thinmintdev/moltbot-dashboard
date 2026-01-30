'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  getMoltBotClient,
  MoltBotMessage,
  MoltBotMessageType,
  OpenClawAgent,
  OpenClawSession,
} from '@/lib/api/moltbot';

export interface UseMoltBotOptions {
  autoConnect?: boolean;
  onMessage?: (message: MoltBotMessage) => void;
  onError?: (error: Error) => void;
}

export interface SpawnTaskOptions {
  taskTitle: string;
  taskDescription: string;
  agentId?: string;
  sessionId?: string;
  labels?: string[];
}

export function useMoltBot(options: UseMoltBotOptions = {}) {
  const { autoConnect = true, onMessage, onError } = options;

  const clientRef = useRef(getMoltBotClient());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [agents, setAgents] = useState<OpenClawAgent[]>([]);
  const [sessions, setSessions] = useState<OpenClawSession[]>([]);
  const unsubscribeRef = useRef<Set<() => void>>(new Set());

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setIsConnecting(false);
    setError(null);
  }, []);

  const handleDisconnect = useCallback((err?: Error) => {
    setIsConnected(false);
    if (err) {
      setError(err);
      onError?.(err);
    }
  }, [onError]);

  const handleMessage = useCallback((message: MoltBotMessage) => {
    onMessage?.(message);
  }, [onMessage]);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    try {
      await clientRef.current.connect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, onError]);

  const disconnect = useCallback(() => {
    clientRef.current.disconnect();
    setIsConnected(false);
  }, []);

  // =========================================================================
  // Agents API (OpenClaw compliant)
  // =========================================================================

  const fetchAgents = useCallback(async () => {
    try {
      const agentsList = await clientRef.current.getAgents();
      setAgents(agentsList);
      return agentsList;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const getDefaultAgentId = useCallback(async () => {
    try {
      return await clientRef.current.getDefaultAgentId();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  // =========================================================================
  // Sessions API (OpenClaw compliant)
  // =========================================================================

  const fetchSessions = useCallback(async (activeMinutes?: number) => {
    try {
      const sessionsList = await clientRef.current.getSessions(activeMinutes);
      setSessions(sessionsList);
      return sessionsList;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  // =========================================================================
  // Agent Run API (OpenClaw compliant)
  // =========================================================================

  const runAgent = useCallback(async (
    message: string,
    agentId?: string,
    sessionId?: string
  ) => {
    try {
      return await clientRef.current.runAgent(message, agentId, sessionId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const spawnTask = useCallback(async (options: SpawnTaskOptions) => {
    try {
      const response = await clientRef.current.spawnTask(
        options.taskTitle,
        options.taskDescription,
        {
          agentId: options.agentId,
          sessionId: options.sessionId,
          labels: options.labels,
        }
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  // =========================================================================
  // Status & Health
  // =========================================================================

  const getStatus = useCallback(async () => {
    try {
      return await clientRef.current.getStatus();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const getHealth = useCallback(async () => {
    try {
      return await clientRef.current.getHealth();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  // =========================================================================
  // Event Subscriptions
  // =========================================================================

  const subscribe = useCallback((messageType: MoltBotMessageType | '*', handler: (message: MoltBotMessage) => void) => {
    const unsubscribe = clientRef.current.onMessage(messageType, handler);
    unsubscribeRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  // =========================================================================
  // Lifecycle
  // =========================================================================

  useEffect(() => {
    const client = clientRef.current;
    const unsubConnectHandler = client.onConnect(handleConnect);
    const unsubDisconnectHandler = client.onDisconnect(handleDisconnect);
    const unsubMessageHandler = client.onMessage('*', handleMessage);

    unsubscribeRef.current.add(unsubConnectHandler);
    unsubscribeRef.current.add(unsubDisconnectHandler);
    unsubscribeRef.current.add(unsubMessageHandler);

    if (autoConnect && !client.getIsConnected()) {
      connect();
    }

    // Fetch initial data
    fetchAgents().catch(() => {});
    fetchSessions().catch(() => {});

    return () => {
      unsubscribeRef.current.forEach(unsub => unsub());
      unsubscribeRef.current.clear();
    };
  }, [autoConnect, connect, handleConnect, handleDisconnect, handleMessage, fetchAgents, fetchSessions]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,

    // Agents (OpenClaw compliant)
    agents,
    fetchAgents,
    getDefaultAgentId,

    // Sessions (OpenClaw compliant)
    sessions,
    fetchSessions,

    // Agent runs (OpenClaw compliant)
    runAgent,
    spawnTask,

    // Status & Health
    getStatus,
    getHealth,

    // Subscriptions
    subscribe,
  };
}
