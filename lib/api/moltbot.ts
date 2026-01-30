// OpenClaw-compliant MoltBot API client
// Based on https://docs.openclaw.ai/concepts

// =============================================================================
// Types aligned with OpenClaw concepts
// =============================================================================

// Agent: An isolated brain with workspace, identity, sessions
export interface OpenClawAgent {
  id: string;
  workspace: string;
  agentDir: string;
  model: string;
  bindings: number;
  isDefault: boolean;
  routes: string[];
}

// Session: Conversation context within an agent
export interface OpenClawSession {
  key: string;          // Format: agent:<agentId>:<sessionKey>
  kind: 'direct' | 'group';
  updatedAt: number;
  ageMs: number;
  sessionId: string;
  systemSent: boolean;
  abortedLastRun: boolean;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  contextTokens: number;
}

// Agent run response from moltbot agent command
export interface AgentRunResponse {
  runId: string;
  status: 'ok' | 'error' | 'aborted';
  summary: string;
  result: {
    payloads: Array<{
      text: string;
      mediaUrl: string | null;
    }>;
    meta: {
      durationMs: number;
      agentMeta: {
        sessionId: string;
        provider: string;
        model: string;
        usage: {
          input: number;
          output: number;
          cacheRead: number;
          cacheWrite: number;
          total: number;
        };
      };
      aborted: boolean;
    };
  };
}

// MoltBot status response
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

// WebSocket message types
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

// =============================================================================
// MoltBot Client - OpenClaw compliant
// =============================================================================

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

  // Cache for agents list
  private cachedAgents: OpenClawAgent[] | null = null;
  private agentsCacheTime: number = 0;
  private readonly AGENTS_CACHE_TTL = 60000; // 1 minute

  constructor(wsUrl: string = 'ws://100.73.167.86:18789', httpBaseUrl: string = '/api/moltbot') {
    this.wsUrl = wsUrl;
    this.httpBaseUrl = httpBaseUrl;
  }

  // ===========================================================================
  // WebSocket Connection
  // ===========================================================================

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

        this.ws.onerror = () => {
          reject(new Error('WebSocket error'));
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

  // ===========================================================================
  // Agents API (OpenClaw compliant)
  // ===========================================================================

  /**
   * Get list of available agents from MoltBot
   * An agent is an isolated brain with its own workspace, identity, sessions
   */
  async getAgents(): Promise<OpenClawAgent[]> {
    // Check cache
    if (this.cachedAgents && Date.now() - this.agentsCacheTime < this.AGENTS_CACHE_TTL) {
      return this.cachedAgents;
    }

    const response = await fetch(`${this.httpBaseUrl}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to get agents: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get agents');
    }

    this.cachedAgents = data.data.agents;
    this.agentsCacheTime = Date.now();
    return this.cachedAgents || [];
  }

  /**
   * Get the default agent ID
   */
  async getDefaultAgentId(): Promise<string> {
    const agents = await this.getAgents();
    const defaultAgent = agents.find(a => a.isDefault);
    return defaultAgent?.id || 'main';
  }

  // ===========================================================================
  // Sessions API (OpenClaw compliant)
  // ===========================================================================

  /**
   * Get list of sessions
   * Sessions are conversation contexts within an agent
   */
  async getSessions(activeMinutes?: number): Promise<OpenClawSession[]> {
    const url = activeMinutes
      ? `${this.httpBaseUrl}/sessions?active=${activeMinutes}`
      : `${this.httpBaseUrl}/sessions`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get sessions: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get sessions');
    }

    return data.data.sessions || [];
  }

  /**
   * Build a proper OpenClaw session key
   * Format: agent:<agentId>:<sessionKey>
   */
  buildSessionKey(agentId: string, sessionKey: string): string {
    return `agent:${agentId}:${sessionKey}`;
  }

  // ===========================================================================
  // Agent Run API (OpenClaw compliant)
  // ===========================================================================

  /**
   * Send a message to an agent and get response
   * This uses the proper moltbot agent command
   *
   * @param message - The message to send
   * @param agentId - The agent ID (defaults to 'main')
   * @param sessionId - The session ID for conversation continuity
   */
  async runAgent(
    message: string,
    agentId: string = 'main',
    sessionId?: string
  ): Promise<AgentRunResponse> {
    const response = await fetch(`${this.httpBaseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session: sessionId || 'default',
        agent: agentId,
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Chat API returned non-JSON response:', text.substring(0, 200));
      throw new Error(`API returned HTML instead of JSON (status: ${response.status})`);
    }

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error?.message || data.message || response.statusText);
    }

    return data.data as AgentRunResponse;
  }

  /**
   * Spawn a task for an agent to work on
   * Returns the actual runId from MoltBot (not a fake ID)
   */
  async spawnTask(
    taskTitle: string,
    taskDescription: string,
    options: {
      agentId?: string;
      sessionId?: string;
      labels?: string[];
    } = {}
  ): Promise<{
    runId: string;
    agentId: string;
    sessionId: string;
    response: string;
    status: string;
  }> {
    const agentId = options.agentId || await this.getDefaultAgentId();
    const sessionId = options.sessionId || `task-${Date.now()}`;
    const labels = options.labels || [];

    // Format message for the agent
    const message = [
      `[Task: ${taskTitle}]`,
      taskDescription !== taskTitle ? taskDescription : '',
      labels.length > 0 ? `Labels: ${labels.join(', ')}` : '',
      'Please work on this task.',
    ].filter(Boolean).join('\n');

    try {
      const result = await this.runAgent(message, agentId, sessionId);

      return {
        runId: result.runId,
        agentId,
        sessionId: result.result.meta.agentMeta.sessionId,
        response: result.result.payloads.map(p => p.text).join('\n'),
        status: result.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to spawn task: ${errorMessage}`);
    }
  }

  // ===========================================================================
  // Status & Health APIs
  // ===========================================================================

  async getStatus(): Promise<MoltBotStatusResponse> {
    const response = await fetch(`${this.httpBaseUrl}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    return response.json();
  }

  async getHealth(): Promise<{ success: boolean; data: { ok: boolean } }> {
    const response = await fetch(`${this.httpBaseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Failed to get health: ${response.statusText}`);
    }
    return response.json();
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

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

// =============================================================================
// Singleton Instance
// =============================================================================

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
