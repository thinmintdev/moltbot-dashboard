# Do: ProxmoxMCP Integration

## Implementation Log

### 2026-01-30 Session

**10:00** - Started ProxmoxMCP integration based on spec.md

**10:15** - Created architecture plan in plan.md
- Defined integration pattern with existing MoltBot infrastructure
- Mapped API endpoints from ProxmoxMCP-Plus

**10:30** - Implemented ProxmoxMCP client (`lib/api/proxmox.ts`)
- Full TypeScript types for VMs, nodes, storage, cluster
- HTTP client with timeout and error handling
- Singleton factory pattern (matches MoltBot client pattern)
- Utility functions: formatBytes, formatUptime, cpuPercentage, memoryPercentage
- VM info mapping for known infrastructure (VMIDs 100-102)
- ~200 lines

**10:45** - Created unified MCP store (`lib/stores/mcp-store.ts`)
- Zustand store for connection management
- Defined 4 MCP servers: ProxmoxMCP, MoltBot, Homelab-MCP, SSH Orchestrator
- Tool definitions with categories (query/control/automation)
- Health check functionality per server
- ~220 lines

**11:00** - Built MCPOverview component (`components/mcp/MCPOverview.tsx`)
- Server cards with connection status
- Expandable tool lists by category
- Visual architecture diagram
- Stats: servers, online count, total tools, available tools
- Fire-themed styling matching dashboard
- ~380 lines

**11:15** - Created useProxmox hook (`hooks/useProxmox.ts`)
- React hook for Proxmox data with polling
- VM control actions (start, stop, shutdown, reboot)
- Auto-refresh after actions
- ~145 lines

**11:20** - Wired MCPOverview into main page
- Added to app/page.tsx view routing
- Available via View menu → "MCP Overview"

**11:25** - TypeScript compilation verified
- No errors
- All types properly defined

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `lib/api/proxmox.ts` | ~200 | ProxmoxMCP-Plus HTTP client |
| `lib/stores/mcp-store.ts` | ~220 | Unified MCP connection store |
| `components/mcp/MCPOverview.tsx` | ~380 | MCP Overview view |
| `components/mcp/index.ts` | 1 | Barrel export |
| `hooks/useProxmox.ts` | ~145 | React hook for Proxmox |
| `docs/pdca/proxmox-mcp/plan.md` | ~100 | Architecture plan |
| `docs/pdca/proxmox-mcp/do.md` | This file | Implementation log |

**Total: ~1,050 lines of new code**

## Architecture Decisions

1. **Singleton Clients**: Both MoltBot and Proxmox use singleton pattern for connection reuse
2. **Unified Store**: Single Zustand store manages all MCP server states
3. **Tool Categories**: Query (safe) vs Control (requires confirmation) vs Automation
4. **Health Checks**: Per-server health monitoring with status indicators
5. **Graceful Degradation**: Views work with mock data when MCP servers unavailable

## Learnings

- ProxmoxMCP-Plus API follows REST conventions
- Health check endpoint varies by MCP server type
- MoltBot uses WebSocket for events, HTTP for commands
- Tool confirmations should be handled in UI, not API layer

**11:30** - Created Beszel API client (`lib/api/beszel.ts`)
- PocketBase-style REST API client
- List systems, get stats, get alerts
- ~180 lines

**11:40** - Updated MCP store with Beszel server
- Added 'beszel' server type
- Added BESZEL_TOOLS definition
- Added health check case

**11:45** - Updated Proxmox client with real infrastructure data
- Added correct VMIDs (100, 102, 103, 110, 111)
- Added TAILSCALE_HOSTS constant
- Added services list per VM

**11:50** - Created useInfrastructure hook (`hooks/useInfrastructure.ts`)
- Combines Proxmox + Beszel + static fallback
- Auto-polls for live data
- Converts between formats
- ~200 lines

**11:55** - Created LiveInfrastructureView wrapper
- Shows data source indicator (Proxmox/Beszel/Static)
- Shows connection status
- Shows last update time
- Refresh button
- Error banner with graceful degradation

**12:00** - Updated MCPOverview architecture diagram
- Real infrastructure layout
- All VMs with correct IPs and VMIDs
- Service mappings

**12:05** - Verified TypeScript compilation
- All files compile without errors
- Dev server running on localhost:3002

## Files Created in Session

| File | Lines | Purpose |
|------|-------|---------|
| `lib/api/proxmox.ts` | ~220 | ProxmoxMCP-Plus HTTP client |
| `lib/api/beszel.ts` | ~180 | Beszel monitoring client |
| `lib/stores/mcp-store.ts` | ~260 | Unified MCP connection store |
| `components/mcp/MCPOverview.tsx` | ~420 | MCP Overview view |
| `components/infrastructure/LiveInfrastructureView.tsx` | ~120 | Live data wrapper |
| `hooks/useProxmox.ts` | ~145 | React hook for Proxmox |
| `hooks/useInfrastructure.ts` | ~200 | Combined infrastructure hook |

**Total: ~1,550 lines of new code**

## Next Steps

1. [ ] Deploy ProxmoxMCP-Plus container on AI VM
2. [ ] Add VM control actions with confirmation dialogs
3. [ ] Install Beszel agents on VMs
4. [ ] Create SSH Orchestrator client for remote commands
5. [ ] Implement Uptime Kuma integration via Traefik
