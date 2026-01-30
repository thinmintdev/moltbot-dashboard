'use client';

import { useEffect, useCallback, useState } from 'react';
import { getProxmoxClient, type ProxmoxVM, getVMDisplayInfo, TAILSCALE_HOSTS } from '@/lib/api/proxmox';
import { getBeszelClient, type BeszelSystem, type BeszelSystemStats } from '@/lib/api/beszel';

// ============================================================================
// Types
// ============================================================================

export interface InfraVM {
  id: string;
  vmid?: number;
  name: string;
  ip: string;
  role: string;
  status: 'online' | 'offline' | 'unknown';
  cpu: number;
  cpuCores: number;
  memory: number;
  memoryTotal: number;
  disk: number;
  diskTotal: number;
  uptime: number;
  services: string[];
  source: 'proxmox' | 'beszel' | 'static';
}

export interface UseInfrastructureOptions {
  pollingInterval?: number;
  enableProxmox?: boolean;
  enableBeszel?: boolean;
}

// ============================================================================
// Default Static VMs (fallback)
// ============================================================================

const STATIC_VMS: InfraVM[] = [
  {
    id: 'vm-103',
    vmid: 103,
    name: 'AI VM',
    ip: TAILSCALE_HOSTS.aiVm,
    role: 'AI/ML services',
    status: 'online',
    cpu: 45,
    cpuCores: 8,
    memory: 12 * 1024 * 1024 * 1024,
    memoryTotal: 20 * 1024 * 1024 * 1024,
    disk: 80 * 1024 * 1024 * 1024,
    diskTotal: 200 * 1024 * 1024 * 1024,
    uptime: 7 * 24 * 60 * 60,
    services: ['MoltBot', 'LiteLLM', 'Open WebUI', 'RagFlow', 'MCP Servers'],
    source: 'static',
  },
  {
    id: 'vm-100',
    vmid: 100,
    name: 'Infra VM',
    ip: TAILSCALE_HOSTS.infra,
    role: 'Infrastructure services',
    status: 'online',
    cpu: 25,
    cpuCores: 4,
    memory: 6 * 1024 * 1024 * 1024,
    memoryTotal: 8 * 1024 * 1024 * 1024,
    disk: 40 * 1024 * 1024 * 1024,
    diskTotal: 100 * 1024 * 1024 * 1024,
    uptime: 14 * 24 * 60 * 60,
    services: ['Traefik', 'AdGuard', 'Uptime Kuma', 'Beszel', 'Homepage'],
    source: 'static',
  },
  {
    id: 'vm-102',
    vmid: 102,
    name: 'Dev VM',
    ip: TAILSCALE_HOSTS.devVm,
    role: 'Development environment',
    status: 'online',
    cpu: 15,
    cpuCores: 4,
    memory: 4 * 1024 * 1024 * 1024,
    memoryTotal: 16 * 1024 * 1024 * 1024,
    disk: 60 * 1024 * 1024 * 1024,
    diskTotal: 150 * 1024 * 1024 * 1024,
    uptime: 3 * 24 * 60 * 60,
    services: ['Gitea', 'code-server', 'PostgreSQL', 'Redis', 'Docker'],
    source: 'static',
  },
  {
    id: 'vm-prx',
    name: 'Proxmox Host',
    ip: TAILSCALE_HOSTS.prx,
    role: 'Hypervisor management',
    status: 'online',
    cpu: 20,
    cpuCores: 16,
    memory: 32 * 1024 * 1024 * 1024,
    memoryTotal: 64 * 1024 * 1024 * 1024,
    disk: 500 * 1024 * 1024 * 1024,
    diskTotal: 2000 * 1024 * 1024 * 1024,
    uptime: 30 * 24 * 60 * 60,
    services: ['Proxmox VE', 'ZFS', 'Networking'],
    source: 'static',
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInfrastructure(options: UseInfrastructureOptions = {}) {
  const {
    pollingInterval = 30000,
    enableProxmox = true,
    enableBeszel = true,
  } = options;

  const [vms, setVMs] = useState<InfraVM[]>(STATIC_VMS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'proxmox' | 'beszel' | 'static'>('static');

  const proxmoxClient = getProxmoxClient();
  const beszelClient = getBeszelClient();

  /**
   * Convert Proxmox VM to InfraVM
   */
  const proxmoxToInfraVM = useCallback((vm: ProxmoxVM): InfraVM => {
    const displayInfo = getVMDisplayInfo(vm.vmid);
    return {
      id: `proxmox-${vm.vmid}`,
      vmid: vm.vmid,
      name: displayInfo?.name || vm.name,
      ip: displayInfo?.ip || '',
      role: displayInfo?.role || vm.type,
      status: vm.status === 'running' ? 'online' : 'offline',
      cpu: Math.round(vm.cpu * 100),
      cpuCores: vm.cpus,
      memory: vm.mem,
      memoryTotal: vm.maxmem,
      disk: vm.disk,
      diskTotal: vm.maxdisk,
      uptime: vm.uptime,
      services: displayInfo?.services || [],
      source: 'proxmox',
    };
  }, []);

  /**
   * Convert Beszel system to InfraVM
   */
  const beszelToInfraVM = useCallback((
    system: BeszelSystem,
    stats?: BeszelSystemStats
  ): InfraVM => {
    return {
      id: `beszel-${system.id}`,
      name: system.name,
      ip: system.host,
      role: system.info?.os || 'Unknown',
      status: system.status === 'up' ? 'online' : system.status === 'down' ? 'offline' : 'unknown',
      cpu: stats?.stats.cpu || 0,
      cpuCores: system.info?.cores || 0,
      memory: stats?.stats.mb || 0,
      memoryTotal: stats?.stats.mt || 0,
      disk: stats?.stats.db || 0,
      diskTotal: stats?.stats.dt || 0,
      uptime: system.info?.uptime || 0,
      services: [],
      source: 'beszel',
    };
  }, []);

  /**
   * Refresh data from available sources
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try Proxmox first
      if (enableProxmox) {
        try {
          const proxmoxVMs = await proxmoxClient.listVMs();
          if (proxmoxVMs.length > 0) {
            const infraVMs = proxmoxVMs
              .filter((vm) => vm.status === 'running' || getVMDisplayInfo(vm.vmid))
              .map(proxmoxToInfraVM);
            setVMs(infraVMs);
            setDataSource('proxmox');
            setLastUpdate(new Date());
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log('Proxmox not available, trying Beszel...');
        }
      }

      // Try Beszel
      if (enableBeszel) {
        try {
          const systems = await beszelClient.listSystems();
          if (systems.length > 0) {
            const stats = await beszelClient.getAllStats();
            const infraVMs = systems.map((s) => beszelToInfraVM(s, stats[s.id]));
            setVMs(infraVMs);
            setDataSource('beszel');
            setLastUpdate(new Date());
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log('Beszel not available, using static data...');
        }
      }

      // Fall back to static data
      setVMs(STATIC_VMS);
      setDataSource('static');
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setVMs(STATIC_VMS);
      setDataSource('static');
    } finally {
      setIsLoading(false);
    }
  }, [enableProxmox, enableBeszel, proxmoxClient, beszelClient, proxmoxToInfraVM, beszelToInfraVM]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling
  useEffect(() => {
    if (pollingInterval > 0) {
      const interval = setInterval(refresh, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [pollingInterval, refresh]);

  return {
    vms,
    isLoading,
    error,
    lastUpdate,
    dataSource,
    refresh,
  };
}
