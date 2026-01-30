/**
 * Beszel API Client
 * System monitoring and metrics from Beszel hub
 *
 * API Server: http://100.112.252.61:8090/api/
 * Reference: https://github.com/henrygd/beszel
 */

// ============================================================================
// Types
// ============================================================================

export interface BeszelSystem {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'up' | 'down' | 'pending';
  info: {
    hostname: string;
    cores: number;
    threads: number;
    cpu_model: string;
    kernel: string;
    os: string;
    uptime: number;
  } | null;
  created: string;
  updated: string;
}

export interface BeszelSystemStats {
  id: string;
  system: string;
  stats: {
    cpu: number;           // CPU usage percentage
    mp: number;            // Memory percentage
    mb: number;            // Memory bytes used
    mt: number;            // Memory total bytes
    dp: number;            // Disk percentage
    db: number;            // Disk bytes used
    dt: number;            // Disk total bytes
    n: number;             // Network in bytes/s
    ns: number;            // Network out bytes/s
    t: number[];           // Temperature readings
  };
  created: string;
}

export interface BeszelAlert {
  id: string;
  system: string;
  name: string;
  status: 'triggered' | 'resolved';
  value: number;
  threshold: number;
  triggered: string;
  resolved?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_BASE_URL = 'http://100.112.252.61:8090';

interface BeszelClientConfig {
  baseUrl?: string;
  authToken?: string;
  timeout?: number;
}

// ============================================================================
// Client Implementation
// ============================================================================

export class BeszelClient {
  private baseUrl: string;
  private authToken?: string;
  private timeout: number;
  private isConnected: boolean = false;

  constructor(config: BeszelClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.authToken = config.authToken;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Make HTTP request to Beszel API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Beszel API error: ${response.status} ${response.statusText}`);
      }

      this.isConnected = true;
      return response.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timeoutId);
      this.isConnected = false;
      throw err;
    }
  }

  /**
   * Check if API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Beszel doesn't have a dedicated health endpoint, try listing systems
      await fetch(`${this.baseUrl}/api/collections/systems/records`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      this.isConnected = true;
      return true;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): boolean {
    return this.isConnected;
  }

  /**
   * List all monitored systems
   */
  async listSystems(): Promise<BeszelSystem[]> {
    const response = await this.request<{ items: BeszelSystem[] }>(
      '/collections/systems/records'
    );
    return response.items || [];
  }

  /**
   * Get system by ID
   */
  async getSystem(systemId: string): Promise<BeszelSystem> {
    return this.request<BeszelSystem>(`/collections/systems/records/${systemId}`);
  }

  /**
   * Get latest stats for a system
   */
  async getSystemStats(systemId: string): Promise<BeszelSystemStats[]> {
    const response = await this.request<{ items: BeszelSystemStats[] }>(
      `/collections/system_stats/records?filter=(system='${systemId}')&sort=-created&perPage=1`
    );
    return response.items || [];
  }

  /**
   * Get stats for all systems
   */
  async getAllStats(): Promise<Record<string, BeszelSystemStats>> {
    const systems = await this.listSystems();
    const stats: Record<string, BeszelSystemStats> = {};

    await Promise.all(
      systems.map(async (system) => {
        try {
          const systemStats = await this.getSystemStats(system.id);
          if (systemStats.length > 0) {
            stats[system.id] = systemStats[0];
          }
        } catch {
          // Skip systems with no stats
        }
      })
    );

    return stats;
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<BeszelAlert[]> {
    const response = await this.request<{ items: BeszelAlert[] }>(
      '/collections/alerts/records?filter=(status="triggered")'
    );
    return response.items || [];
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let clientInstance: BeszelClient | null = null;

export function getBeszelClient(config?: BeszelClientConfig): BeszelClient {
  if (!clientInstance) {
    clientInstance = new BeszelClient(config);
  }
  return clientInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format uptime from seconds to human readable
 */
export function formatBeszelUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(seconds / 60)}m`;
}

/**
 * Get status color for Beszel system
 */
export function getBeszelStatusColor(status: string): string {
  switch (status) {
    case 'up':
      return '#22c55e';
    case 'down':
      return '#ef4444';
    case 'pending':
      return '#f97316';
    default:
      return '#71717a';
  }
}
