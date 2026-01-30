/**
 * Multi-Agent Swarm Type Definitions
 * Tiered agent system with model routing and execution abstractions
 */

// Model tiers for cost optimization
export type ModelTier = 'T1' | 'T2' | 'T3';

export const MODEL_TIERS = {
  T1: {
    name: 'Strategic',
    model: 'claude-opus-4-20250514',
    costPerKToken: { input: 0.015, output: 0.075 },
    description: 'Complex reasoning, orchestration, strategic decisions',
  },
  T2: {
    name: 'Specialist',
    model: 'claude-sonnet-4-20250514',
    costPerKToken: { input: 0.003, output: 0.015 },
    description: 'Code generation, review, research, implementation',
  },
  T3: {
    name: 'Worker',
    model: 'claude-3-5-haiku-20241022',
    costPerKToken: { input: 0.00025, output: 0.00125 },
    description: 'Grunt work, formatting, tests, documentation',
  },
} as const;

// Extended agent types
export type SwarmAgentType =
  | 'orchestrator'
  | 'planner'
  | 'researcher'
  | 'architect'
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'formatter'
  | 'docwriter';

// Agent role in the swarm
export type SwarmRole = 'coordinator' | 'specialist' | 'worker';

// Execution permissions
export interface AgentPermissions {
  canExecuteCode: boolean;
  canWriteFiles: boolean;
  canReadFiles: boolean;
  canAccessNetwork: boolean;
  canSpawnAgents: boolean;
  canAccessShell: boolean;
  allowedPaths?: string[];  // Scoped file access
  blockedCommands?: string[];  // Blacklisted shell commands
}

// Agent template definition
export interface SwarmAgentTemplate {
  id: string;
  name: string;
  codename: string;  // Greek letter designation
  type: SwarmAgentType;
  tier: ModelTier;
  role: SwarmRole;
  description: string;
  systemPrompt: string;
  skills: string[];
  permissions: AgentPermissions;
  maxTokens: number;
  temperature: number;
}

// Runtime agent instance
export interface SwarmAgent extends SwarmAgentTemplate {
  instanceId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentTaskId?: string;
  projectId?: string;
  parentAgentId?: string;  // For hierarchical coordination
  childAgentIds: string[];
  tokensUsed: number;
  estimatedCost: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Inter-agent message types
export type SwarmMessageType =
  | 'task_assign'
  | 'task_complete'
  | 'task_failed'
  | 'progress_update'
  | 'context_share'
  | 'escalate'
  | 'handoff'
  | 'query'
  | 'response';

export interface SwarmMessage {
  id: string;
  type: SwarmMessageType;
  fromAgentId: string;
  toAgentId: string | 'broadcast';
  taskId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// Execution result from any backend
export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
  duration?: number;
}

// Execution options
export interface ExecuteOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}
