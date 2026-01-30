/**
 * Unified MCP Store
 * Manages connections to multiple MCP servers with health monitoring
 */

import { create } from 'zustand';
import { getProxmoxClient, type ProxmoxVM, type ProxmoxNode } from '../api/proxmox';
import { getMoltBotClient } from '../api/moltbot';
import { getBeszelClient } from '../api/beszel';

// ============================================================================
// Types
// ============================================================================

export type MCPServerType = 'proxmox' | 'moltbot' | 'homelab' | 'ssh' | 'beszel';

export interface MCPServer {
  id: string;
  name: string;
  type: MCPServerType;
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  error?: string;
  lastCheck: Date | null;
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  category: 'query' | 'control' | 'automation';
  requiresConfirmation: boolean;
}

// ============================================================================
// Tool Definitions
// ============================================================================

const PROXMOX_TOOLS: MCPTool[] = [
  { name: 'list_nodes', description: 'List cluster nodes with status/resources', category: 'query', requiresConfirmation: false },
  { name: 'list_vms', description: 'List all VMs/containers with metrics', category: 'query', requiresConfirmation: false },
  { name: 'get_vm_status', description: 'Get detailed VM status', category: 'query', requiresConfirmation: false },
  { name: 'get_storage', description: 'Get storage pools and usage', category: 'query', requiresConfirmation: false },
  { name: 'get_cluster_status', description: 'Get overall cluster health', category: 'query', requiresConfirmation: false },
  { name: 'start_vm', description: 'Start a stopped VM', category: 'control', requiresConfirmation: true },
  { name: 'stop_vm', description: 'Force stop a VM', category: 'control', requiresConfirmation: true },
  { name: 'shutdown_vm', description: 'Graceful VM shutdown', category: 'control', requiresConfirmation: true },
  { name: 'reboot_vm', description: 'Reboot a running VM', category: 'control', requiresConfirmation: true },
];

const MOLTBOT_TOOLS: MCPTool[] = [
  { name: 'spawn_agent', description: 'Spawn an AI agent for a task', category: 'automation', requiresConfirmation: false },
  { name: 'get_agent_status', description: 'Get agent execution status', category: 'query', requiresConfirmation: false },
  { name: 'stream_logs', description: 'Stream agent logs', category: 'query', requiresConfirmation: false },
  { name: 'pause_agent', description: 'Pause running agent', category: 'control', requiresConfirmation: false },
  { name: 'resume_agent', description: 'Resume paused agent', category: 'control', requiresConfirmation: false },
  { name: 'stop_agent', description: 'Stop running agent', category: 'control', requiresConfirmation: true },
];

const HOMELAB_TOOLS: MCPTool[] = [
  { name: 'docker_list', description: 'List Docker containers', category: 'query', requiresConfirmation: false },
  { name: 'docker_stats', description: 'Container resource stats', category: 'query', requiresConfirmation: false },
  { name: 'docker_restart', description: 'Restart a container', category: 'control', requiresConfirmation: true },
  { name: 'network_ping', description: 'Ping network hosts', category: 'query', requiresConfirmation: false },
  { name: 'ollama_models', description: 'List Ollama models', category: 'query', requiresConfirmation: false },
];

const SSH_TOOLS: MCPTool[] = [
  { name: 'execute_command', description: 'Execute allowed SSH command', category: 'control', requiresConfirmation: true },
  { name: 'get_system_info', description: 'Get system information', category: 'query', requiresConfirmation: false },
];

const BESZEL_TOOLS: MCPTool[] = [
  { name: 'list_systems', description: 'List all monitored systems', category: 'query', requiresConfirmation: false },
  { name: 'get_system', description: 'Get system details', category: 'query', requiresConfirmation: false },
  { name: 'get_stats', description: 'Get system metrics (CPU, memory, disk)', category: 'query', requiresConfirmation: false },
  { name: 'get_alerts', description: 'Get active alerts', category: 'query', requiresConfirmation: false },
];

// ============================================================================
// Store Interface
// ============================================================================

interface MCPState {
  servers: MCPServer[];
  isInitialized: boolean;

  // Proxmox data cache
  proxmoxVMs: ProxmoxVM[];
  proxmoxNodes: ProxmoxNode[];
  proxmoxLastUpdate: Date | null;

  // Actions
  initializeServers: () => Promise<void>;
  checkServerHealth: (serverId: string) => Promise<void>;
  checkAllServers: () => Promise<void>;
  refreshProxmoxData: () => Promise<void>;
  getServerByType: (type: MCPServerType) => MCPServer | undefined;
  getConnectedServers: () => MCPServer[];
  getTotalTools: () => number;
}

// ============================================================================
// Default Servers Configuration
// ============================================================================

const DEFAULT_SERVERS: MCPServer[] = [
  {
    id: 'proxmox-mcp',
    name: 'ProxmoxMCP-Plus',
    type: 'proxmox',
    url: 'http://100.73.167.86:8811',
    status: 'disconnected',
    lastCheck: null,
    tools: PROXMOX_TOOLS,
  },
  {
    id: 'moltbot',
    name: 'MoltBot Gateway',
    type: 'moltbot',
    url: 'ws://100.73.167.86:18789',
    status: 'disconnected',
    lastCheck: null,
    tools: MOLTBOT_TOOLS,
  },
  {
    id: 'beszel',
    name: 'Beszel Monitoring',
    type: 'beszel',
    url: 'http://100.112.252.61:8090',
    status: 'disconnected',
    lastCheck: null,
    tools: BESZEL_TOOLS,
  },
  {
    id: 'homelab-mcp',
    name: 'Homelab-MCP',
    type: 'homelab',
    url: 'http://100.73.167.86:6971',
    status: 'disconnected',
    lastCheck: null,
    tools: HOMELAB_TOOLS,
  },
  {
    id: 'ssh-orchestrator',
    name: 'SSH Orchestrator',
    type: 'ssh',
    url: 'http://100.73.167.86:8822',
    status: 'disconnected',
    lastCheck: null,
    tools: SSH_TOOLS,
  },
];

// ============================================================================
// Store Implementation
// ============================================================================

export const useMCPStore = create<MCPState>((set, get) => ({
  servers: DEFAULT_SERVERS,
  isInitialized: false,
  proxmoxVMs: [],
  proxmoxNodes: [],
  proxmoxLastUpdate: null,

  initializeServers: async () => {
    set({ isInitialized: true });
    await get().checkAllServers();
  },

  checkServerHealth: async (serverId: string) => {
    const { servers } = get();
    const serverIndex = servers.findIndex((s) => s.id === serverId);
    if (serverIndex === -1) return;

    const server = servers[serverIndex];

    // Update to connecting status
    set({
      servers: servers.map((s, i) =>
        i === serverIndex ? { ...s, status: 'connecting' as const } : s
      ),
    });

    try {
      let isHealthy = false;

      // Use API proxy routes to avoid CORS issues from browser
      switch (server.type) {
        case 'proxmox': {
          try {
            const response = await fetch('/api/proxmox/health', {
              method: 'GET',
              signal: AbortSignal.timeout(5000),
            });
            isHealthy = response.ok;
          } catch {
            isHealthy = false;
          }
          break;
        }
        case 'moltbot': {
          try {
            const response = await fetch('/api/moltbot/health', {
              method: 'GET',
              signal: AbortSignal.timeout(5000),
            });
            isHealthy = response.ok;
          } catch {
            isHealthy = false;
          }
          break;
        }
        case 'beszel': {
          try {
            const response = await fetch('/api/beszel/health', {
              method: 'GET',
              signal: AbortSignal.timeout(5000),
            });
            isHealthy = response.ok;
          } catch {
            isHealthy = false;
          }
          break;
        }
        case 'homelab': {
          try {
            const response = await fetch('/api/homelab/health', {
              method: 'GET',
              signal: AbortSignal.timeout(5000),
            });
            isHealthy = response.ok;
          } catch {
            isHealthy = false;
          }
          break;
        }
        case 'ssh': {
          try {
            const response = await fetch('/api/ssh/health', {
              method: 'GET',
              signal: AbortSignal.timeout(5000),
            });
            isHealthy = response.ok;
          } catch {
            isHealthy = false;
          }
          break;
        }
      }

      set({
        servers: servers.map((s, i) =>
          i === serverIndex
            ? {
                ...s,
                status: isHealthy ? 'connected' : 'error',
                error: isHealthy ? undefined : 'Health check failed',
                lastCheck: new Date(),
              }
            : s
        ),
      });
    } catch (err) {
      set({
        servers: servers.map((s, i) =>
          i === serverIndex
            ? {
                ...s,
                status: 'error',
                error: err instanceof Error ? err.message : 'Unknown error',
                lastCheck: new Date(),
              }
            : s
        ),
      });
    }
  },

  checkAllServers: async () => {
    const { servers } = get();
    await Promise.all(servers.map((s) => get().checkServerHealth(s.id)));
  },

  refreshProxmoxData: async () => {
    const proxmoxServer = get().servers.find((s) => s.type === 'proxmox');
    if (!proxmoxServer || proxmoxServer.status !== 'connected') {
      return;
    }

    try {
      const client = getProxmoxClient({ baseUrl: proxmoxServer.url });
      const [vms, nodes] = await Promise.all([
        client.listVMs(),
        client.listNodes(),
      ]);

      set({
        proxmoxVMs: vms,
        proxmoxNodes: nodes,
        proxmoxLastUpdate: new Date(),
      });
    } catch (err) {
      console.error('Failed to refresh Proxmox data:', err);
    }
  },

  getServerByType: (type: MCPServerType) => {
    return get().servers.find((s) => s.type === type);
  },

  getConnectedServers: () => {
    return get().servers.filter((s) => s.status === 'connected');
  },

  getTotalTools: () => {
    return get().servers.reduce((sum, s) => sum + s.tools.length, 0);
  },
}));

// ============================================================================
// React Hook for MCP Status
// ============================================================================

export function useMCPStatus() {
  const servers = useMCPStore((s) => s.servers);
  const isInitialized = useMCPStore((s) => s.isInitialized);
  const initializeServers = useMCPStore((s) => s.initializeServers);
  const checkAllServers = useMCPStore((s) => s.checkAllServers);

  const connectedCount = servers.filter((s) => s.status === 'connected').length;
  const totalCount = servers.length;
  const hasErrors = servers.some((s) => s.status === 'error');

  return {
    servers,
    isInitialized,
    connectedCount,
    totalCount,
    hasErrors,
    initializeServers,
    checkAllServers,
  };
}
