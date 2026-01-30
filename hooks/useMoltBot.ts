'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getMoltBotClient, MoltBotMessage, MoltBotMessageType } from '@/lib/api/moltbot';

export interface UseMoltBotOptions {
  autoConnect?: boolean;
  onMessage?: (message: MoltBotMessage) => void;
  onError?: (error: Error) => void;
}

export interface SpawnAgentOptions {
  taskId: string;
  agentType: string;
  projectId?: string;
  config?: Record<string, unknown>;
}

export function useMoltBot(options: UseMoltBotOptions = {}) {
  const { autoConnect = true, onMessage, onError } = options;

  const clientRef = useRef(getMoltBotClient());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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

  const spawnAgent = useCallback(async (options: SpawnAgentOptions) => {
    try {
      const response = await clientRef.current.spawnAgent(
        options.taskId,
        options.agentType,
        options.projectId,
        options.config
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const pauseAgent = useCallback(async (agentId: string) => {
    try {
      await clientRef.current.pauseAgent(agentId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const resumeAgent = useCallback(async (agentId: string) => {
    try {
      await clientRef.current.resumeAgent(agentId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const stopAgent = useCallback(async (agentId: string) => {
    try {
      await clientRef.current.stopAgent(agentId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const getAgentStatus = useCallback(async (agentId: string) => {
    try {
      const status = await clientRef.current.getAgentStatus(agentId);
      return status;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const streamLogs = useCallback(async (agentId: string, offset?: number) => {
    try {
      const logs = await clientRef.current.streamLogs(agentId, offset);
      return logs;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const subscribe = useCallback((messageType: MoltBotMessageType | '*', handler: (message: MoltBotMessage) => void) => {
    const unsubscribe = clientRef.current.onMessage(messageType, handler);
    unsubscribeRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

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

    return () => {
      unsubscribeRef.current.forEach(unsub => unsub());
      unsubscribeRef.current.clear();
    };
  }, [autoConnect, connect, handleConnect, handleDisconnect, handleMessage]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    spawnAgent,
    pauseAgent,
    resumeAgent,
    stopAgent,
    getAgentStatus,
    streamLogs,
    subscribe,
  };
}
