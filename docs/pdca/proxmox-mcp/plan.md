# Plan: ProxmoxMCP Integration

## Hypothesis

Integrate ProxmoxMCP-Plus API with the Molten dashboard to provide real-time VM management, combining it with existing MoltBot infrastructure for a unified MCP orchestration layer.

## Architecture Decision

```
┌─────────────────────────────────────────────────────────────┐
│                    MOLTEN DASHBOARD                          │
│                   (localhost:3003)                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   MoltBot     │   │  ProxmoxMCP   │   │  Homelab-MCP  │
│   Gateway     │   │    Plus       │   │   (Future)    │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ WS: :18789    │   │ HTTP: :8811   │   │ HTTP: :6971   │
│ HTTP: :18790  │   │               │   │               │
│ Agent spawn   │   │ VM lifecycle  │   │ Docker ctrl   │
│ Task exec     │   │ Node status   │   │ Network scan  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │   AI VM       │
                    │ 100.73.167.86 │
                    └───────────────┘
```

## Implementation Strategy

### Phase 1: ProxmoxMCP Client (lib/api/proxmox.ts)
- HTTP client for ProxmoxMCP-Plus API
- Type definitions for VMs, nodes, storage
- Rate limiting and error handling

### Phase 2: Unified MCP Store (lib/stores/mcp-store.ts)
- Zustand store for MCP connection state
- Connection pooling for multiple MCP servers
- Health check monitoring

### Phase 3: MCP Overview View (components/mcp/MCPOverview.tsx)
- Show connected MCP servers
- Display available tools per server
- Connection status indicators

### Phase 4: Wire Infrastructure View
- Replace mock data with live ProxmoxMCP queries
- Real-time VM status updates
- Action buttons (start/stop/reboot)

## Expected Outcomes

- [ ] ProxmoxMCP client with full type safety
- [ ] Unified MCP store for connection management
- [ ] MCP Overview view in dashboard
- [ ] Live VM data in Infrastructure view
- [ ] VM control actions (with confirmation dialogs)

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| ProxmoxMCP not running | Graceful fallback to mock data |
| API token not configured | Clear error message with setup instructions |
| Network latency | Optimistic UI updates with rollback |

## API Endpoints (from spec)

```
GET  /api/nodes           - List cluster nodes
GET  /api/vms             - List all VMs
GET  /api/vms/{vmid}/status - VM details
POST /api/vms/{vmid}/start  - Start VM
POST /api/vms/{vmid}/stop   - Stop VM
POST /api/vms/{vmid}/shutdown - Graceful shutdown
POST /api/vms/{vmid}/reboot - Reboot VM
GET  /api/storage         - Storage pools
GET  /api/cluster/status  - Cluster health
```

## Success Criteria

1. Dashboard shows real VM status from ProxmoxMCP
2. Can start/stop VMs from Infrastructure view
3. MCP Overview shows all connected servers
4. Graceful degradation when servers unavailable
