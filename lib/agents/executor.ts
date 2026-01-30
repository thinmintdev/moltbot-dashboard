/**
 * Agent Execution Backend Abstraction
 * MVP: Local execution with permission scoping
 * Future: Docker containers, E2B sandboxes
 */

import { ExecutionResult, ExecuteOptions, AgentPermissions } from './types';

// Abstract execution backend interface
export interface ExecutionBackend {
  name: string;
  execute(command: string, options?: ExecuteOptions): Promise<ExecutionResult>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  cleanup(): Promise<void>;
}

// Permission-scoped local executor (MVP)
export class LocalExecutor implements ExecutionBackend {
  name = 'local';
  private permissions: AgentPermissions;
  private blockedPatterns: RegExp[];

  constructor(permissions: AgentPermissions) {
    this.permissions = permissions;
    this.blockedPatterns = [
      /rm\s+-rf\s+[\/~]/,  // Dangerous recursive deletes
      />\s*\/dev\/sd/,      // Writing to block devices
      /mkfs/,               // Formatting filesystems
      /dd\s+if=/,           // Direct disk operations
      /:(){ :|:& };:/,      // Fork bomb
      /chmod\s+-R\s+777/,   // Insecure permissions
      /curl.*\|\s*sh/,      // Pipe to shell
      /wget.*\|\s*sh/,
    ];
  }

  async execute(command: string, options?: ExecuteOptions): Promise<ExecutionResult> {
    // Check permissions
    if (!this.permissions.canAccessShell) {
      return {
        success: false,
        error: 'Shell access not permitted for this agent',
      };
    }

    // Check for blocked commands
    if (this.permissions.blockedCommands?.some(blocked => command.includes(blocked))) {
      return {
        success: false,
        error: `Command contains blocked pattern`,
      };
    }

    // Check for dangerous patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(command)) {
        return {
          success: false,
          error: `Command blocked: matches dangerous pattern`,
        };
      }
    }

    // In browser environment, we can't actually execute
    // This would be handled by the MoltBot gateway in production
    console.log(`[LocalExecutor] Would execute: ${command}`);

    return {
      success: true,
      stdout: `[Simulated] Command queued for execution via MoltBot gateway`,
      exitCode: 0,
    };
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.permissions.canWriteFiles) {
      throw new Error('Write access not permitted for this agent');
    }

    // Check path permissions
    if (this.permissions.allowedPaths?.length) {
      const allowed = this.permissions.allowedPaths.some(p => path.startsWith(p));
      if (!allowed) {
        throw new Error(`Path not in allowed list: ${path}`);
      }
    }

    // Would be handled by MoltBot gateway
    console.log(`[LocalExecutor] Would write to: ${path}`);
  }

  async readFile(path: string): Promise<string> {
    if (!this.permissions.canReadFiles) {
      throw new Error('Read access not permitted for this agent');
    }

    // Would be handled by MoltBot gateway
    console.log(`[LocalExecutor] Would read: ${path}`);
    return '';
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for local executor
  }
}

// Docker executor stub (for future implementation)
export class DockerExecutor implements ExecutionBackend {
  name = 'docker';
  private containerId?: string;
  private image: string;
  private workspaceMount: string;

  constructor(config: { image?: string; workspaceMount: string }) {
    this.image = config.image || 'node:20-slim';
    this.workspaceMount = config.workspaceMount;
  }

  async execute(command: string, options?: ExecuteOptions): Promise<ExecutionResult> {
    // TODO: Implement Docker execution
    // docker run --rm -v ${workspaceMount}:/workspace -w /workspace ${image} sh -c "${command}"
    throw new Error('Docker executor not yet implemented');
  }

  async writeFile(path: string, content: string): Promise<void> {
    throw new Error('Docker executor not yet implemented');
  }

  async readFile(path: string): Promise<string> {
    throw new Error('Docker executor not yet implemented');
  }

  async cleanup(): Promise<void> {
    // docker stop ${containerId} && docker rm ${containerId}
  }
}

// Factory to create appropriate executor
export function createExecutor(
  type: 'local' | 'docker',
  permissions: AgentPermissions,
  config?: { image?: string; workspaceMount?: string }
): ExecutionBackend {
  switch (type) {
    case 'docker':
      if (!config?.workspaceMount) {
        throw new Error('Docker executor requires workspaceMount');
      }
      return new DockerExecutor({ image: config.image, workspaceMount: config.workspaceMount });
    case 'local':
    default:
      return new LocalExecutor(permissions);
  }
}
