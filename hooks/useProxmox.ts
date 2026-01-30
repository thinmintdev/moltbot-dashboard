'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  getProxmoxClient,
  type ProxmoxVM,
  type ProxmoxNode,
  type VMActionResult,
  formatBytes,
  formatUptime,
  cpuPercentage,
  memoryPercentage,
} from '@/lib/api/proxmox';

export interface UseProxmoxOptions {
  autoConnect?: boolean;
  pollingInterval?: number; // ms, 0 to disable
}

export interface UseProxmoxReturn {
  // Connection
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;

  // Data
  vms: ProxmoxVM[];
  nodes: ProxmoxNode[];
  lastUpdate: Date | null;

  // Actions
  refresh: () => Promise<void>;
  startVM: (vmid: number) => Promise<VMActionResult>;
  stopVM: (vmid: number) => Promise<VMActionResult>;
  shutdownVM: (vmid: number) => Promise<VMActionResult>;
  rebootVM: (vmid: number) => Promise<VMActionResult>;

  // Utilities
  formatBytes: typeof formatBytes;
  formatUptime: typeof formatUptime;
  cpuPercentage: typeof cpuPercentage;
  memoryPercentage: typeof memoryPercentage;
}

export function useProxmox(options: UseProxmoxOptions = {}): UseProxmoxReturn {
  const { autoConnect = true, pollingInterval = 30000 } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [vms, setVMs] = useState<ProxmoxVM[]>([]);
  const [nodes, setNodes] = useState<ProxmoxNode[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const client = getProxmoxClient();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [vmData, nodeData] = await Promise.all([
        client.listVMs(),
        client.listNodes(),
      ]);

      setVMs(vmData);
      setNodes(nodeData);
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const startVM = useCallback(async (vmid: number): Promise<VMActionResult> => {
    try {
      const result = await client.startVM(vmid);
      // Refresh data after action
      setTimeout(refresh, 2000);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [client, refresh]);

  const stopVM = useCallback(async (vmid: number): Promise<VMActionResult> => {
    try {
      const result = await client.stopVM(vmid);
      setTimeout(refresh, 2000);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [client, refresh]);

  const shutdownVM = useCallback(async (vmid: number): Promise<VMActionResult> => {
    try {
      const result = await client.shutdownVM(vmid);
      setTimeout(refresh, 5000); // Longer delay for graceful shutdown
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [client, refresh]);

  const rebootVM = useCallback(async (vmid: number): Promise<VMActionResult> => {
    try {
      const result = await client.rebootVM(vmid);
      setTimeout(refresh, 10000); // Longer delay for reboot
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [client, refresh]);

  // Initial connection
  useEffect(() => {
    if (autoConnect) {
      refresh();
    }
  }, [autoConnect, refresh]);

  // Polling
  useEffect(() => {
    if (pollingInterval > 0 && isConnected) {
      const interval = setInterval(refresh, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [pollingInterval, isConnected, refresh]);

  return {
    isConnected,
    isLoading,
    error,
    vms,
    nodes,
    lastUpdate,
    refresh,
    startVM,
    stopVM,
    shutdownVM,
    rebootVM,
    formatBytes,
    formatUptime,
    cpuPercentage,
    memoryPercentage,
  };
}
