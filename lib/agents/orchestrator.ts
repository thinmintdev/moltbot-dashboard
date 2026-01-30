/**
 * Swarm Orchestrator
 * Coordinates the multi-agent swarm for task execution
 */

import { useSwarmStore } from './swarm-store';
import { useTaskStore } from '../stores/task-store';
import { SwarmAgent, SwarmAgentTemplate, MODEL_TIERS } from './types';
import { SWARM_AGENT_TEMPLATES, getAgentTemplate } from './templates';
import { createExecutor, ExecutionBackend } from './executor';

// Task complexity assessment
type TaskComplexity = 'simple' | 'moderate' | 'complex';

interface TaskAnalysis {
  complexity: TaskComplexity;
  requiredAgents: string[];  // Template IDs
  estimatedTokens: number;
  canParallelize: boolean;
}

/**
 * Analyze a task to determine which agents should handle it
 */
export function analyzeTask(
  taskTitle: string,
  taskDescription: string
): TaskAnalysis {
  const text = `${taskTitle} ${taskDescription}`.toLowerCase();

  // Keywords that indicate different agent needs
  const keywords = {
    research: ['research', 'find', 'look up', 'search', 'investigate', 'analyze'],
    planning: ['plan', 'break down', 'estimate', 'prioritize', 'schedule'],
    architecture: ['design', 'architect', 'structure', 'pattern', 'adr', 'decision'],
    coding: ['implement', 'code', 'build', 'create', 'fix', 'bug', 'feature', 'refactor'],
    testing: ['test', 'coverage', 'jest', 'spec', 'unit test', 'integration'],
    review: ['review', 'check', 'audit', 'security', 'quality'],
    formatting: ['format', 'lint', 'prettier', 'eslint', 'style'],
    documentation: ['document', 'readme', 'jsdoc', 'comment', 'docs'],
  };

  const requiredAgents: string[] = [];
  let complexity: TaskComplexity = 'simple';

  // Check for keyword matches
  if (keywords.research.some(k => text.includes(k))) {
    requiredAgents.push('beta-researcher');
  }
  if (keywords.planning.some(k => text.includes(k))) {
    requiredAgents.push('alpha-planner');
  }
  if (keywords.architecture.some(k => text.includes(k))) {
    requiredAgents.push('gamma-architect');
    complexity = 'moderate';
  }
  if (keywords.coding.some(k => text.includes(k))) {
    requiredAgents.push('delta-coder');
    complexity = 'moderate';
  }
  if (keywords.testing.some(k => text.includes(k))) {
    requiredAgents.push('eta-tester');
  }
  if (keywords.review.some(k => text.includes(k))) {
    requiredAgents.push('zeta-reviewer');
  }
  if (keywords.formatting.some(k => text.includes(k))) {
    requiredAgents.push('theta-formatter');
  }
  if (keywords.documentation.some(k => text.includes(k))) {
    requiredAgents.push('iota-docwriter');
  }

  // If multiple coding agents needed or complex keywords
  if (requiredAgents.length >= 3 || text.includes('complex') || text.includes('full')) {
    complexity = 'complex';
    // Add orchestrator for complex tasks
    requiredAgents.unshift('prime-orchestrator');
  }

  // Default to coder if no agents identified
  if (requiredAgents.length === 0) {
    requiredAgents.push('delta-coder');
  }

  // Estimate tokens based on complexity
  const tokenEstimates = {
    simple: 2000,
    moderate: 5000,
    complex: 15000,
  };

  return {
    complexity,
    requiredAgents,
    estimatedTokens: tokenEstimates[complexity],
    canParallelize: requiredAgents.length > 1 && complexity !== 'simple',
  };
}

/**
 * Route a task to the appropriate agent(s)
 */
export function routeTask(
  taskId: string,
  analysis: TaskAnalysis,
  projectId?: string
): { agentInstanceId: string; templateId: string }[] {
  const swarmStore = useSwarmStore.getState();
  const assignments: { agentInstanceId: string; templateId: string }[] = [];

  for (const templateId of analysis.requiredAgents) {
    // Check if we already have an idle agent of this type
    const template = getAgentTemplate(templateId);
    if (!template) continue;

    let agent: SwarmAgent | undefined = swarmStore.agents.find(
      a => a.id === templateId &&
           a.status === 'idle' &&
           (!projectId || a.projectId === projectId)
    );

    // Spawn new agent if none available
    if (!agent) {
      agent = swarmStore.spawnAgent(templateId, projectId) ?? undefined;
    }

    if (agent) {
      assignments.push({
        agentInstanceId: agent.instanceId,
        templateId,
      });
    }
  }

  return assignments;
}

/**
 * Calculate estimated cost for a task
 */
export function estimateTaskCost(analysis: TaskAnalysis): number {
  let totalCost = 0;

  for (const templateId of analysis.requiredAgents) {
    const template = getAgentTemplate(templateId);
    if (!template) continue;

    const tierCosts = MODEL_TIERS[template.tier].costPerKToken;
    // Assume 60% input, 40% output tokens
    const inputTokens = analysis.estimatedTokens * 0.6;
    const outputTokens = analysis.estimatedTokens * 0.4;

    totalCost += (inputTokens / 1000) * tierCosts.input;
    totalCost += (outputTokens / 1000) * tierCosts.output;
  }

  return totalCost;
}

/**
 * Get recommended agent for a specific skill
 */
export function getAgentForSkill(skill: string): SwarmAgentTemplate | undefined {
  return SWARM_AGENT_TEMPLATES.find(t => t.skills.includes(skill));
}

/**
 * Initialize the swarm with default agents for a project
 */
export function initializeSwarmForProject(projectId: string): SwarmAgent[] {
  const swarmStore = useSwarmStore.getState();
  const spawnedAgents: SwarmAgent[] = [];

  // Spawn orchestrator first
  const orchestrator = swarmStore.spawnAgent('prime-orchestrator', projectId);
  if (orchestrator) spawnedAgents.push(orchestrator);

  // Spawn one of each specialist type
  const specialists = ['alpha-planner', 'beta-researcher', 'delta-coder', 'zeta-reviewer'];
  for (const templateId of specialists) {
    const agent = swarmStore.spawnAgent(templateId, projectId, orchestrator?.instanceId);
    if (agent) spawnedAgents.push(agent);
  }

  // Spawn workers
  const workers = ['eta-tester', 'theta-formatter', 'iota-docwriter'];
  for (const templateId of workers) {
    const agent = swarmStore.spawnAgent(templateId, projectId);
    if (agent) spawnedAgents.push(agent);
  }

  swarmStore.startSwarm();
  return spawnedAgents;
}

/**
 * Execute a task through the swarm
 */
export async function executeTaskWithSwarm(
  taskId: string,
  projectId?: string
): Promise<{ success: boolean; agents: string[]; error?: string }> {
  const taskStore = useTaskStore.getState();
  const swarmStore = useSwarmStore.getState();

  const task = taskStore.getTaskById(taskId);
  if (!task) {
    return { success: false, agents: [], error: 'Task not found' };
  }

  // Analyze the task
  const analysis = analyzeTask(task.title, task.description);
  console.log(`[Swarm] Task analysis:`, analysis);

  // Route to appropriate agents
  const assignments = routeTask(taskId, analysis, projectId);
  if (assignments.length === 0) {
    return { success: false, agents: [], error: 'No agents available' };
  }

  // Assign task to primary agent
  const primaryAssignment = assignments[0];
  swarmStore.assignTask(primaryAssignment.agentInstanceId, taskId);

  // Update task in store
  taskStore.assignAgentToTask(taskId, primaryAssignment.agentInstanceId, primaryAssignment.templateId);

  // If multiple agents, send coordination messages
  if (assignments.length > 1) {
    const orchestratorAssignment = assignments.find(a => a.templateId === 'prime-orchestrator');
    const fromAgent = orchestratorAssignment?.agentInstanceId || primaryAssignment.agentInstanceId;

    for (const assignment of assignments.slice(1)) {
      swarmStore.sendMessage(
        'task_assign',
        fromAgent,
        assignment.agentInstanceId,
        {
          taskId,
          taskTitle: task.title,
          taskDescription: task.description,
          role: 'support',
        },
        taskId
      );
    }
  }

  return {
    success: true,
    agents: assignments.map(a => a.agentInstanceId),
  };
}

/**
 * Get swarm health status
 */
export function getSwarmHealth(): {
  status: 'healthy' | 'degraded' | 'offline';
  agents: { total: number; running: number; idle: number; error: number };
  cost: { total: number; byTier: Record<string, number> };
} {
  const swarmStore = useSwarmStore.getState();
  const agents = swarmStore.agents;

  const agentCounts = {
    total: agents.length,
    running: agents.filter(a => a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    error: agents.filter(a => a.status === 'error').length,
  };

  const costByTier: Record<string, number> = { T1: 0, T2: 0, T3: 0 };
  agents.forEach(a => {
    costByTier[a.tier] = (costByTier[a.tier] || 0) + a.estimatedCost;
  });

  let status: 'healthy' | 'degraded' | 'offline' = 'healthy';
  if (!swarmStore.isRunning) {
    status = 'offline';
  } else if (agentCounts.error > 0 || agentCounts.total === 0) {
    status = 'degraded';
  }

  return {
    status,
    agents: agentCounts,
    cost: {
      total: swarmStore.getTotalEstimatedCost(),
      byTier: costByTier,
    },
  };
}
