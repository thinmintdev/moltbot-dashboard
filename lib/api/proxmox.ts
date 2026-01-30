/**
 * ProxmoxMCP-Plus API Client
 * Interfaces with the ProxmoxMCP-Plus server for VM/container management
 *
 * API Server: http://100.73.167.86:8811
 * Reference: https://github.com/RekklesNA/ProxmoxMCP-Plus
 */

// ============================================================================
// Types
// ============================================================================

export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline' | 'unknown';
  cpu: number;        // CPU usage percentage (0-1)
  maxcpu: number;     // Total CPU cores
  mem: number;        // Memory used (bytes)
  maxmem: number;     // Total memory (bytes)
  disk: number;       // Disk used (bytes)
  maxdisk: number;    // Total disk (bytes)
  uptime: number;     // Uptime in seconds
}

export interface ProxmoxVM {
  vmid: number;
  name: string;
  node: string;
  type: 'qemu' | 'lxc';
  status: 'running' | 'stopped' | 'paused' | 'suspended';
  cpu: number;        // CPU usage (0-1)
  cpus: number;       // Allocated CPUs
  mem: number;        // Memory used (bytes)
  maxmem: number;     // Allocated memory (bytes)
  disk: number;       // Disk used (bytes)
  maxdisk: number;    // Allocated disk (bytes)
  netin: number;      // Network in (bytes)
  netout: number;     // Network out (bytes)
  uptime: number;     // Uptime in seconds
  pid?: number;       // Process ID (if running)
  template?: boolean; // Is this a template?
}

export interface ProxmoxStorage {
  storage: string;
  node: string;
  type: string;
  content: string;
  used: number;
  avail: number;
  total: number;
  active: boolean;
  enabled: boolean;
}

export interface ProxmoxClusterStatus {
  quorate: boolean;
  nodes: number;
  nodesOnline: number;
  version: number;
  name: string;
}

export interface VMActionResult {
  success: boolean;
  vmid: number;
  action: string;
  upid?: string;      // Proxmox task ID
  error?: string;
}

export interface ProxmoxApiError extends Error {
  status: number;
  endpoint: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_BASE_URL = 'http://100.73.167.86:8811';

interface ProxmoxClientConfig {
  baseUrl?: string;
  timeout?: number;
}

// ============================================================================
// Client Implementation
// ============================================================================

export class ProxmoxMCPClient {
  private baseUrl: string;
  private timeout: number;
  private isConnected: boolean = false;
  private lastError: Error | null = null;

  constructor(config: ProxmoxClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Make HTTP request to ProxmoxMCP API
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(
          `ProxmoxMCP API error: ${response.statusText}`
        ) as ProxmoxApiError;
        error.status = response.status;
        error.endpoint = endpoint;
        this.lastError = error;
        throw error;
      }

      this.isConnected = true;
      this.lastError = null;
      return response.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        const error = new Error('Request timeout') as ProxmoxApiError;
        error.status = 408;
        error.endpoint = endpoint;
        this.lastError = error;
        this.isConnected = false;
        throw error;
      }

      this.isConnected = false;
      this.lastError = err instanceof Error ? err : new Error(String(err));
      throw err;
    }
  }

  // ==========================================================================
  // Query Operations (Safe - No Confirmation Required)
  // ==========================================================================

  /**
   * Check if API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request<unknown>('GET', '/api/cluster/status');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; error: Error | null } {
    return {
      connected: this.isConnected,
      error: this.lastError,
    };
  }

  /**
   * List all cluster nodes with status and resources
   */
  async listNodes(): Promise<ProxmoxNode[]> {
    return this.request<ProxmoxNode[]>('GET', '/api/nodes');
  }

  /**
   * List all VMs and containers
   */
  async listVMs(): Promise<ProxmoxVM[]> {
    return this.request<ProxmoxVM[]>('GET', '/api/vms');
  }

  /**
   * Get detailed status for a specific VM
   */
  async getVMStatus(vmid: number): Promise<ProxmoxVM> {
    return this.request<ProxmoxVM>('GET', `/api/vms/${vmid}/status`);
  }

  /**
   * Get storage pools and usage
   */
  async getStorage(): Promise<ProxmoxStorage[]> {
    return this.request<ProxmoxStorage[]>('GET', '/api/storage');
  }

  /**
   * Get overall cluster health
   */
  async getClusterStatus(): Promise<ProxmoxClusterStatus> {
    return this.request<ProxmoxClusterStatus>('GET', '/api/cluster/status');
  }

  // ==========================================================================
  // Control Operations (Require Confirmation in UI)
  // ==========================================================================

  /**
   * Start a VM
   */
  async startVM(vmid: number): Promise<VMActionResult> {
    return this.request<VMActionResult>('POST', `/api/vms/${vmid}/start`);
  }

  /**
   * Stop a VM (immediate)
   */
  async stopVM(vmid: number): Promise<VMActionResult> {
    return this.request<VMActionResult>('POST', `/api/vms/${vmid}/stop`);
  }

  /**
   * Graceful shutdown
   */
  async shutdownVM(vmid: number): Promise<VMActionResult> {
    return this.request<VMActionResult>('POST', `/api/vms/${vmid}/shutdown`);
  }

  /**
   * Reboot a VM
   */
  async rebootVM(vmid: number): Promise<VMActionResult> {
    return this.request<VMActionResult>('POST', `/api/vms/${vmid}/reboot`);
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let clientInstance: ProxmoxMCPClient | null = null;

export function getProxmoxClient(config?: ProxmoxClientConfig): ProxmoxMCPClient {
  if (!clientInstance) {
    clientInstance = new ProxmoxMCPClient(config);
  }
  return clientInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format uptime seconds to human readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate CPU percentage from Proxmox values
 */
export function cpuPercentage(cpu: number): number {
  return Math.round(cpu * 100);
}

/**
 * Calculate memory percentage
 */
export function memoryPercentage(used: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((used / max) * 100);
}

/**
 * Map VMID to known infrastructure names (real homelab data)
 */
export function getVMDisplayInfo(vmid: number): { name: string; ip: string; role: string; services: string[] } | null {
  const vmMap: Record<number, { name: string; ip: string; role: string; services: string[] }> = {
    100: {
      name: 'Infra VM',
      ip: '100.112.252.61',
      role: 'Infrastructure services',
      services: ['Traefik', 'AdGuard', 'Uptime Kuma', 'Beszel', 'Homepage', 'Bitwarden']
    },
    102: {
      name: 'Dev VM',
      ip: '100.104.67.12',
      role: 'Development environment',
      services: ['Gitea', 'code-server', 'PostgreSQL', 'Redis', 'Docker']
    },
    103: {
      name: 'AI VM',
      ip: '100.73.167.86',
      role: 'AI/ML services',
      services: ['MoltBot', 'LiteLLM', 'Open WebUI', 'RagFlow', 'MCP Servers']
    },
    110: {
      name: 'TrueNAS',
      ip: '100.107.227.75',
      role: 'Storage server',
      services: ['NFS', 'SMB', 'ZFS']
    },
    111: {
      name: 'PBS',
      ip: '100.78.46.88',
      role: 'Proxmox Backup Server',
      services: ['Backups', 'Deduplication']
    },
  };
  return vmMap[vmid] || null;
}

/**
 * Known Tailscale hosts
 */
export const TAILSCALE_HOSTS = {
  prx: '100.75.100.113',
  infra: '100.112.252.61',
  devVm: '100.104.67.12',
  aiVm: '100.73.167.86',
  truenas: '100.107.227.75',
  pbs: '100.78.46.88',
  windowsDesktop: '100.100.132.101',
} as const;
