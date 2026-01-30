export type MoltBotMessageType =
  | 'agent_spawned'
  | 'agent_status'
  | 'agent_log'
  | 'agent_progress'
  | 'agent_completed'
  | 'agent_error'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'status_update';

export interface MoltBotMessage {
  type: MoltBotMessageType;
  agentId: string;
  taskId?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface SpawnAgentRequest {
  taskId: string;
  agentType: string;
  projectId?: string;
  config?: Record<string, unknown>;
}

export interface SpawnAgentResponse {
  agentId: string;
  taskId: string;
  status: string;
  createdAt: string;
}

export interface AgentStatusResponse {
  agentId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  error?: string;
  updatedAt: string;
}

export interface AgentLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LogsStreamResponse {
  agentId: string;
  logs: AgentLogEntry[];
  hasMore: boolean;
}

// MoltBot actual API types
export interface MoltBotTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  priority?: string;
  labels?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MoltBotStatusResponse {
  success: boolean;
  data: {
    linkChannel?: {
      id: string;
      label: string;
      linked: boolean;
    };
    heartbeat?: {
      defaultAgentId: string;
      agents: Array<{
        agentId: string;
        enabled: boolean;
        every: string;
      }>;
    };
    sessions?: {
      count: number;
    };
  };
}

export class MoltBotClient {
  private wsUrl: string;
  private httpBaseUrl: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(message: MoltBotMessage) => void>> = new Map();
  private connectionHandlers: Set<() => void> = new Set();
  private disconnectionHandlers: Set<(error?: Error) => void> = new Set();
  private statusPollInterval: NodeJS.Timeout | null = null;
  private lastStatus: MoltBotStatusResponse | null = null;

  // Use the API proxy to avoid CORS issues
  constructor(wsUrl: string = 'ws://100.73.167.86:18789', httpBaseUrl: string = '/api/moltbot') {
    this.wsUrl = wsUrl;
    this.httpBaseUrl = httpBaseUrl;
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.ws) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MoltBotMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket error');
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.ws = null;
          this.disconnectionHandlers.forEach(handler => handler());
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const error = new Error('Max reconnection attempts reached');
      this.disconnectionHandlers.forEach(handler => handler(error));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection attempt failed:', error);
      });
    }, Math.min(delay, 30000));
  }

  private handleMessage(message: MoltBotMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  async spawnAgent(taskId: string, agentType: string, projectId?: string, config?: Record<string, unknown>): Promise<SpawnAgentResponse> {
    // Send task to MoltBot via chat endpoint
    const taskTitle = config?.title || `Task ${taskId}`;
    const taskDescription = config?.description || taskTitle;
    const labels = (config?.labels as string[] | undefined) || [];

    // Format message for MoltBot to work on
    const message = [
      `[Task: ${taskTitle}]`,
      taskDescription !== taskTitle ? taskDescription : '',
      labels.length > 0 ? `Labels: ${labels.join(', ')}` : '',
      `Agent type: ${agentType}`,
      `Please work on this task.`,
    ].filter(Boolean).join('\n');

    try {
      const response = await fetch(`${this.httpBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session: projectId || 'default',
        }),
      });

      // Check response
      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMessage = data?.error?.message || data?.message || response.statusText;
        throw new Error(errorMessage);
      }

      // Return a response matching expected interface
      const agentId = `agent-${taskId}-${Date.now()}`;
      return {
        agentId,
        taskId,
        status: 'running',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      // Re-throw with better context
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`MoltBot task failed: ${message}`);
    }
  }

  async getAgentStatus(agentId: string): Promise<AgentStatusResponse> {
    // Get status from MoltBot's status endpoint
    const response = await fetch(`${this.httpBaseUrl}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get agent status: ${response.statusText}`);
    }

    const data = await response.json();

    // Map MoltBot status to expected format
    return {
      agentId,
      status: data?.heartbeat?.agents?.[0]?.enabled ? 'running' : 'idle',
      progress: 0,
      currentStep: undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  async streamLogs(agentId: string, offset: number = 0): Promise<LogsStreamResponse> {
    const response = await fetch(`${this.httpBaseUrl}/logs?offset=${offset}`);

    if (!response.ok) {
      throw new Error(`Failed to stream logs: ${response.statusText}`);
    }

    const data = await response.json();

    // Map to expected format
    const logs: AgentLogEntry[] = (data?.logs || []).map((log: { timestamp?: string; level?: string; message?: string }) => ({
      timestamp: log.timestamp || new Date().toISOString(),
      level: log.level || 'info',
      message: log.message || '',
    }));

    return {
      agentId,
      logs,
      hasMore: false,
    };
  }

  async pauseAgent(agentId: string): Promise<void> {
    // Extract taskId from agentId (format: agent-{taskId}-{timestamp})
    const taskId = agentId.split('-')[1];

    // Update task status to paused via task/update
    const response = await fetch(`${this.httpBaseUrl}/task/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: taskId,
        status: 'todo', // Move back to todo (paused)
      }),
    });

    if (!response.ok) {
      console.warn('Failed to pause via task/update, task may still be running');
    }
  }

  async resumeAgent(agentId: string): Promise<void> {
    // Extract taskId from agentId
    const taskId = agentId.split('-')[1];

    const response = await fetch(`${this.httpBaseUrl}/task/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: taskId,
        status: 'inProgress',
      }),
    });

    if (!response.ok) {
      console.warn('Failed to resume via task/update');
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    // Extract taskId from agentId
    const taskId = agentId.split('-')[1];

    const response = await fetch(`${this.httpBaseUrl}/task/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      console.warn('Failed to stop task');
    }
  }

  // Get MoltBot system status
  async getStatus(): Promise<MoltBotStatusResponse> {
    const response = await fetch(`${this.httpBaseUrl}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }

  // Get tasks list
  async getTasks(): Promise<MoltBotTask[]> {
    const response = await fetch(`${this.httpBaseUrl}/tasks`);

    if (!response.ok) {
      throw new Error(`Failed to get tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return [
      ...(data?.todo || []),
      ...(data?.inProgress || []),
      ...(data?.done || []),
    ];
  }

  onMessage(type: MoltBotMessageType | '*', handler: (message: MoltBotMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    const handlers = this.messageHandlers.get(type)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    };
  }

  onConnect(handler: () => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onDisconnect(handler: (error?: Error) => void): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

let clientInstance: MoltBotClient | null = null;

export function getMoltBotClient(): MoltBotClient {
  if (!clientInstance) {
    clientInstance = new MoltBotClient();
  }
  return clientInstance;
}

export function resetMoltBotClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}
