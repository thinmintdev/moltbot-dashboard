# MoltBot API Integration

Complete WebSocket and HTTP integration for MoltBot agent execution and real-time streaming.

## Files Created

- `/mnt/dev/repos/moltbot-dashboard/lib/api/moltbot.ts` (275 lines)
- `/mnt/dev/repos/moltbot-dashboard/hooks/useMoltBot.ts` (179 lines)

## Architecture

### MoltBot Client (`lib/api/moltbot.ts`)

Low-level client for direct MoltBot communication:

- **WebSocket Connection**: `ws://100.73.167.86:18789`
  - Auto-reconnect with exponential backoff (up to 5 attempts, max 30s delay)
  - Message type routing
  - Connection state management

- **HTTP Endpoints**: `http://100.73.167.86:18790`
  - `/agents/spawn` - Spawn new agent
  - `/agents/{agentId}/status` - Get agent status
  - `/agents/{agentId}/logs` - Stream agent logs
  - `/agents/{agentId}/pause` - Pause running agent
  - `/agents/{agentId}/resume` - Resume paused agent
  - `/agents/{agentId}/stop` - Stop running agent

- **Message Types**: agent_spawned, agent_status, agent_log, agent_progress, agent_completed, agent_error, task_started, task_completed, task_failed

- **Singleton Pattern**: `getMoltBotClient()` returns shared instance

### React Hook (`hooks/useMoltBot.ts`)

High-level React hook for component integration:

- **Connection Management**: Auto-connect on mount, manual control
- **Error Handling**: Graceful error recovery with callback
- **Real-time Updates**: Message subscription system
- **Task Control**: spawnAgent, pauseAgent, resumeAgent, stopAgent
- **Monitoring**: getAgentStatus, streamLogs

## Usage Examples

### Basic Hook Setup

```typescript
import { useMoltBot } from '@/hooks/useMoltBot';

function AgentController() {
  const moltbot = useMoltBot({
    autoConnect: true,
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error)
  });

  return (
    <div>
      {moltbot.isConnected ? 'Connected' : 'Disconnected'}
      {moltbot.error && <p>Error: {moltbot.error.message}</p>}
    </div>
  );
}
```

### Spawning an Agent

```typescript
const { spawnAgent, error } = useMoltBot();

const handleSpawn = async () => {
  try {
    const response = await spawnAgent({
      taskId: 'task_123',
      agentType: 'coder',
      projectId: 'proj_456',
      config: { timeout: 3600 }
    });
    console.log('Agent spawned:', response.agentId);
  } catch (err) {
    console.error('Spawn failed:', err);
  }
};
```

### Monitoring Agent Progress

```typescript
const { subscribe, isConnected } = useMoltBot();

useEffect(() => {
  if (!isConnected) return;

  const unsubscribe = subscribe('agent_progress', (message) => {
    console.log(`Agent ${message.agentId} progress:`, message.data);
  });

  return unsubscribe;
}, [isConnected, subscribe]);
```

### Getting Agent Status

```typescript
const { getAgentStatus } = useMoltBot();

const status = await getAgentStatus('agent_123');
console.log(`Status: ${status.status}, Progress: ${status.progress}%`);
```

### Streaming Logs

```typescript
const { streamLogs } = useMoltBot();

const logsData = await streamLogs('agent_123', 0);
console.log('Logs:', logsData.logs);
console.log('More logs available:', logsData.hasMore);
```

### Controlling Agent Execution

```typescript
const { pauseAgent, resumeAgent, stopAgent } = useMoltBot();

// Pause
await pauseAgent('agent_123');

// Resume
await resumeAgent('agent_123');

// Stop
await stopAgent('agent_123');
```

## Type Definitions

All types are exported from `lib/api/moltbot.ts`:

- `MoltBotMessage` - WebSocket message format
- `MoltBotMessageType` - Message type union
- `SpawnAgentResponse` - Spawn agent response
- `AgentStatusResponse` - Agent status response
- `AgentLogEntry` - Individual log entry
- `LogsStreamResponse` - Log stream response

## Connection State Management

The client handles:

- **Initial Connection**: Promise resolves when connected
- **Auto-Reconnect**: Exponential backoff starting at 1s, max 30s
- **Max Attempts**: 5 reconnection attempts before giving up
- **Clean Shutdown**: `disconnect()` clears timeout and closes WebSocket
- **Handler Cleanup**: Automatic unsubscription on hook unmount

## Error Handling

Errors are propagated through:

1. Hook `onError` callback (if provided)
2. Hook `error` state (latest error)
3. Thrown from async functions
4. Logged to console for debugging

## Integration with Existing Stores

Works seamlessly with:
- `useAgentStore` - Update agent status
- `useTaskStore` - Track task progress
- `useLogStore` - Store log entries

Example integration:
```typescript
const { spawnAgent } = useMoltBot();
const { spawnAgent: storeSpawn } = useAgentStore();

const handleSpawn = async (taskId) => {
  const response = await spawnAgent({ taskId, agentType: 'coder' });
  storeSpawn({ ...response, type: 'coder' });
};
```
