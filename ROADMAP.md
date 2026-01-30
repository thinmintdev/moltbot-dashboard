# Molten - Development Roadmap

> AutoClaude-style AI development dashboard with Kanban, agent orchestration, and infrastructure automation

## Vision

A comprehensive development and infrastructure control panel that:
- Manages projects with Kanban-based task orchestration
- Monitors and controls homelab infrastructure via MCP servers
- Orchestrates AI agents for automated recovery and development
- Integrates with Proxmox, Docker, Uptime Kuma, and more

---

## Infrastructure Context

| Host | Tailscale IP | Role |
|------|-------------|------|
| Dev VM | 100.104.67.12 | Gitea, code-server, databases |
| Infra VM | 100.112.252.61 | Traefik, AdGuard, Uptime Kuma |
| AI VM | 100.73.167.86 | Open WebUI, LiteLLM, MCP servers, MoltBot |
| Windows Desktop | 100.100.132.101 | llama-swap GPU inference |
| Proxmox Host | 100.75.100.113 | Hypervisor management |

---

## UI Layout Design

### Navigation: Navbar + Tabs + Dropdowns (NOT sidebar)

```
+------------------------------------------------------------------+
| [MoltBot] [Projects ▼] [View ▼] [+Task]     [🔍] [⚙️] [Status 🟢] |
+------------------------------------------------------------------+
| [project-a ×] [project-b ×] [project-c ×]                   [+]  |
+------------------------------------------------------------------+
|                                                                   |
|  +-----------+  +-----------+  +-----------+  +-----------+      |
|  | Planning  |  |In Progress|  | AI Review |  |   Done    |      |
|  |     3     |  |     2     |  |     1     |  |     5     |      |
|  +-----------+  +-----------+  +-----------+  +-----------+      |
|  |           |  |           |  |           |  |           |      |
|  | [Task 1]  |  | [Task 4]  |  | [Task 6]  |  | [Task 7]  |      |
|  | [Task 2]  |  | [Task 5]  |  |           |  | [Task 8]  |      |
|  | [Task 3]  |  |           |  |           |  | [Task 9]  |      |
|  |           |  |           |  |           |  | [Task 10] |      |
|  |   [+]     |  |   [+]     |  |   [+]     |  | [Task 11] |      |
|  |           |  |           |  |           |  |           |      |
|  +-----------+  +-----------+  +-----------+  +-----------+      |
|                                                                   |
+------------------------------------------------------------------+
| [Agent: coder] Running Task 4... 45%  [Logs] [Stop]              |
+------------------------------------------------------------------+
```

### Navbar Elements

1. **MoltBot Logo** - Brand, click for home
2. **Projects Dropdown** - Switch between projects, create new
3. **View Dropdown** - Kanban | Agents | Insights | Roadmap | Infrastructure | Settings
4. **+Task Button** - Quick task creation
5. **Search** - Global search
6. **Settings Gear** - Opens settings panel/modal
7. **Status Indicator** - MoltBot connection status

### Project Tabs Bar
- Horizontal tabs for open projects
- Close button (×) per tab
- + button to add new project
- Scrollable if many projects

### Main Content Area
- Full width for Kanban board
- Maximizes task card visibility
- Responsive columns

### Bottom Status Bar (Optional)
- Shows currently running agent
- Task progress
- Quick actions (logs, stop)

---

## Phase 1: Core Dashboard ✅ COMPLETE

### Completed
- [x] Next.js 14 + Tailwind + TypeScript setup
- [x] Zustand stores (task, project, agent, log, bot, kanban)
- [x] Kanban board with @dnd-kit drag-drop
- [x] Task cards with priority, labels, subtasks
- [x] Agent monitoring components
- [x] Live log viewer (terminal-style)
- [x] Settings panels (MCP, Skills, Connections)
- [x] Dev server preview component
- [x] Toast notifications

---

## Phase 2: Navbar Layout ✅ COMPLETE

### Completed
- [x] Replace sidebar-based nav with navbar + dropdowns
- [x] Implement Projects dropdown
- [x] Implement View dropdown (Kanban/Agents/Insights/etc)
- [x] Project tabs bar (horizontal, closeable)
- [x] Bottom status bar for running agents
- [x] Global keyboard shortcuts (K=Kanban, A=Agents, etc)
- [x] Fire/molten color scheme with red/orange gradients
- [x] Glow effects for important elements

### Components Created
- [x] `components/layout/Navbar.tsx` - Main navigation bar
- [x] `components/layout/ProjectTabs.tsx` - Horizontal project tabs
- [x] `components/layout/StatusBar.tsx` - Bottom agent status with fire gradient
- [x] `app/page.tsx` - New layout structure with AppLayout

---

## Phase 3: Kanban Enhancements ✅ COMPLETE

### AutoClaude-Style Task Cards
- [x] Error column (red) for failed tasks
- [x] "Start" button with play icon on cards
- [x] Progress bar with percentage
- [x] Subtask dots indicator (+N count)
- [x] Timestamp ("just now", "2 min ago")
- [x] "Refresh Tasks" button
- [x] Empty state messages per column
- [x] Fire-themed progress bars

### Task Execution
- [x] "Start" moves task to in_progress
- [ ] Agent selection modal (or auto-select)
- [ ] Progress updates in real-time via WebSocket
- [ ] Move to "AI Review" when agent completes
- [ ] Move to "Done" on human approval

---

## Phase 4: Infrastructure Integration (In Progress)

### MCP Servers (from spec.md)
- [x] ProxmoxMCP-Plus client (lib/api/proxmox.ts) - HTTP client with full types
- [x] Beszel client (lib/api/beszel.ts) - System monitoring API
- [x] Unified MCP store (lib/stores/mcp-store.ts) - 5 servers, health checks
- [x] MCPOverview component - View connected servers and tools
- [x] useProxmox hook - React integration with polling
- [x] useInfrastructure hook - Combined Proxmox/Beszel/static data
- [ ] homelab-mcp integration (Docker, network)
- [ ] SSH Orchestrator integration (direct host access)

### Infrastructure Views
- [x] InfrastructureView component with VM status grid
- [x] MCPOverview component with server status cards
- [x] LiveInfrastructureView with data source indicator
- [x] Real infrastructure config (VMIDs 100, 102, 103, 110, 111)
- [x] Tailscale hosts mapping
- [ ] VM control actions (start/stop/reboot) with confirmation
- [ ] Resource usage charts
- [ ] Network topology map

### Monitoring
- [x] Beszel API integration (http://100.112.252.61:8090)
- [ ] Uptime Kuma integration (via Traefik)
- [ ] Alert display in dashboard
- [ ] Auto-recovery trigger UI
- [ ] Incident history log

---

## Phase 5: Agent Orchestration (In Progress)

### Agent Types
- [x] Agent type definitions (Orchestrator, Coder, Researcher, Tester, DevOps)
- [x] Agent selection modal with recommendations
- [x] Auto-select mode for MoltBot to choose

### MoltBot API Integration
- [x] WebSocket client (ws://100.73.167.86:18789)
- [x] HTTP client (http://100.73.167.86:18790)
- [x] useMoltBot React hook
- [x] Auto-reconnect with exponential backoff
- [x] spawnAgent, pauseAgent, resumeAgent, stopAgent functions

### Execution Pipeline
- [x] Start button opens agent selection modal
- [x] Task → Planning → In Progress → AI Review → Done
- [x] Agent spawning via MoltBot API from KanbanBoard
- [x] Real-time progress updates via WebSocket subscription
- [x] Automatic status transitions (completed → review, error → error column)
- [x] Pause/resume agent functionality
- [ ] Agent handoff between stages
- [ ] Parallel execution support
- [ ] Error recovery with retry logic

### Live Monitoring
- [x] Real-time WebSocket message streaming
- [x] MoltBot connection status indicator in Kanban header
- [x] Toast notifications for agent events (spawn, complete, error)
- [ ] Token usage tracking
- [ ] Cost estimation
- [x] Progress indicators on task cards

---

## Phase 6: Self-Healing Automation

### From spec.md Scenarios
- [ ] Container crash recovery workflow
- [ ] DNS outage detection and recovery
- [ ] VM resource exhaustion handling
- [ ] SSL certificate renewal

### n8n Integration
- [ ] Webhook trigger UI
- [ ] Workflow status display
- [ ] Manual workflow trigger
- [ ] Execution history

### Permission Model
| Operation | Automated | Requires Approval |
|-----------|-----------|-------------------|
| Query status | ✅ | - |
| View logs | ✅ | - |
| Restart container | ✅ | - |
| Stop container | ❌ | ✅ |
| Reboot VM | ❌ | ✅ |
| Delete VM | ❌ | ✅✅ |

---

## Phase 7: Integrations

### Priority Integrations
- [x] **GitHub** - API client with issues/PR fetching, rate limiting (lib/api/github.ts)
- [x] **GitHub** - Issue/PR to task converters (lib/utils/github-to-task.ts)
- [x] **GitHub** - GitHubIssuesView component (components/github/GitHubIssuesView.tsx)
- [x] **GitHub** - View dropdown → GitHub Issues for GitHub-sourced projects
- [ ] **GitHub** - Bidirectional sync (Kanban ↔ GitHub Issues)
- [ ] **Gitea** - Local git server integration
- [ ] **Proxmox** - VM/CT management
- [ ] **Docker** - Container control

### Future Integrations
- [ ] Google Workspace
- [ ] Notion
- [ ] Obsidian
- [ ] Linear
- [ ] Telegram notifications

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Components**: Radix UI
- **Drag & Drop**: @dnd-kit
- **Icons**: lucide-react

### Colors (AutoClaude-inspired)
```css
--bg-primary: #0a0a0b;
--bg-secondary: #111113;
--bg-card: #18181b;
--border: #27272a;
--text-primary: #fafafa;
--text-muted: #71717a;
--accent-yellow: #eab308;
--status-error: #ef4444;
--status-success: #22c55e;
--status-progress: #3b82f6;
--status-review: #a855f7;
```

### Backend Integration
- MoltBot Gateway: `ws://100.73.167.86:18789`
- MoltBot API: `http://100.73.167.86:18790`
- Proxmox MCP: `http://100.73.167.86:8811`
- Uptime Kuma: `http://100.112.252.61:3001`

---

## File Structure

```
moltbot-dashboard/
├── app/
│   ├── page.tsx              # Main app with navbar layout
│   ├── layout.tsx            # Root layout
│   ├── providers.tsx         # Context providers
│   └── api/moltbot/          # API proxy routes
├── components/
│   ├── layout/               # Navbar, ProjectTabs, StatusBar
│   ├── kanban/               # KanbanBoard, Column, TaskCard
│   ├── agents/               # AgentPanel, LogViewer
│   ├── infrastructure/       # ClusterHealth, VMGrid (new)
│   ├── settings/             # Settings panels
│   └── ui/                   # Base components
├── lib/
│   └── stores/               # Zustand stores
└── ROADMAP.md
```

---

## Commands

```bash
# Development
cd /mnt/dev/repos/moltbot-dashboard
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

---

*Last Updated: 2026-01-30*
*Reference: /home/thinmint/repos/moltbot-dashboard/.dev/spec.md*
