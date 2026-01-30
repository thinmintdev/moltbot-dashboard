# Project Index: MoltBot Dashboard

Generated: 2026-01-30

## Project Structure

```
moltbot-dashboard/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── beszel/health/        # Beszel health check
│   │   ├── homelab/health/       # Homelab health check
│   │   ├── moltbot/              # MoltBot API (agents, chat, sessions, tasks)
│   │   ├── proxmox/health/       # Proxmox health check
│   │   ├── ssh/health/           # SSH health check
│   │   └── supabase/             # Supabase API (agent-runs, projects, tasks)
│   ├── page.tsx                  # Main dashboard entry
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Context providers
├── components/
│   ├── agents/                   # Agent management UI (AgentsView, AgentCard, SpawnAgentModal)
│   ├── chat/                     # Chat interface (ChatTab)
│   ├── common/                   # Shared components (Toast, ErrorBoundary)
│   ├── context/                  # AI Context management (ContextView, ContextDocCard, ContextModal)
│   ├── github/                   # GitHub integration (GitHubIssuesView)
│   ├── ideation/                 # Idea brainstorming (IdeationView, IdeaCard, IdeaModal)
│   ├── infrastructure/           # Infrastructure monitoring (LiveInfrastructureView)
│   ├── kanban/                   # Kanban board (KanbanBoard, TaskCard, TaskDetailModal)
│   ├── layout/                   # App shell (AppLayout, Navbar, Sidebar, ProjectTabs, StatusBar)
│   ├── mcp/                      # MCP server overview (MCPOverview)
│   ├── models/                   # Model management (ModelsTab)
│   ├── preview/                  # Dev preview (DevPreview, ConsolePanel)
│   ├── project/                  # Project management (ProjectCreateModal)
│   ├── roadmap/                  # Roadmap planning (RoadmapView, MilestoneCard, MilestoneModal)
│   ├── sessions/                 # Session management (SessionsTab)
│   ├── settings/                 # Settings panels (SettingsPanel, ConnectionsSettings, etc.)
│   ├── tasks/                    # Task list view (TasksTab)
│   ├── ui/                       # UI primitives (Button, Modal, StatusBadge)
│   └── workspace/                # Workspace management (ProjectWorkspace)
├── hooks/
│   ├── useInfrastructure.ts      # Combined infra data hook
│   ├── useMoltBot.ts             # MoltBot WebSocket/HTTP hook
│   ├── useProxmox.ts             # Proxmox API hook
│   └── useSupabase.ts            # Supabase hooks
├── lib/
│   ├── api/                      # API clients
│   │   ├── beszel.ts             # Beszel monitoring API
│   │   ├── github.ts             # GitHub API client
│   │   ├── moltbot.ts            # MoltBot gateway client
│   │   └── proxmox.ts            # Proxmox MCP client
│   ├── stores/                   # Zustand state stores
│   │   ├── agent-store.ts        # Agent state
│   │   ├── bot-store.ts          # Bot connection state
│   │   ├── context-store.ts      # AI context documents
│   │   ├── ideation-store.ts     # Ideas and brainstorming
│   │   ├── kanban-store.ts       # Kanban board state
│   │   ├── log-store.ts          # Log streaming
│   │   ├── mcp-store.ts          # MCP server connections
│   │   ├── project-store.ts      # Project management
│   │   ├── roadmap-store.ts      # Roadmap milestones
│   │   └── task-store.ts         # Task management
│   ├── supabase/                 # Supabase client and types
│   └── utils/                    # Utility functions
└── docs/                         # Documentation
```

## Entry Points

- **Main App**: `app/page.tsx` - Dashboard with multi-project tabs and view switching
- **Layout**: `app/layout.tsx` - Root HTML and providers
- **API Routes**: `app/api/` - Next.js API routes for backend integration

## Core Modules

### Views (NavigationView type)
| View | Component | Status |
|------|-----------|--------|
| kanban | KanbanBoard | ✅ Complete |
| agents | AgentsView | ✅ Complete |
| infrastructure | LiveInfrastructureView | ✅ Complete |
| mcp | MCPOverview | ✅ Complete |
| github-issues | GitHubIssuesView | ✅ Complete |
| roadmap | RoadmapView | ✅ Complete |
| ideation | IdeationView | ✅ Complete |
| context | ContextView | ✅ Complete |
| insights | PlaceholderView | ⬜ Not Implemented |
| changelog | PlaceholderView | ⬜ Not Implemented |
| worktrees | PlaceholderView | ⬜ Not Implemented |
| github-prs | PlaceholderView | ⬜ Not Implemented |

### State Stores
| Store | File | Purpose |
|-------|------|---------|
| kanban-store | lib/stores/kanban-store.ts | Kanban board state |
| task-store | lib/stores/task-store.ts | Task CRUD operations |
| agent-store | lib/stores/agent-store.ts | Agent lifecycle |
| mcp-store | lib/stores/mcp-store.ts | MCP server connections |
| roadmap-store | lib/stores/roadmap-store.ts | Milestone management |
| ideation-store | lib/stores/ideation-store.ts | Ideas and voting |
| context-store | lib/stores/context-store.ts | AI context documents |

### API Clients
| Client | File | Integration |
|--------|------|-------------|
| moltbot | lib/api/moltbot.ts | MoltBot gateway (WS+HTTP) |
| proxmox | lib/api/proxmox.ts | Proxmox MCP Plus |
| beszel | lib/api/beszel.ts | System monitoring |
| github | lib/api/github.ts | GitHub Issues/PRs |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.2.5 | React framework |
| react | ^18.2.0 | UI library |
| zustand | ^4.5.0 | State management |
| @dnd-kit/core | ^6.3.1 | Drag and drop |
| @radix-ui/* | various | UI primitives |
| @supabase/supabase-js | ^2.93.3 | Database client |
| lucide-react | ^0.307.0 | Icons |
| date-fns | ^4.1.0 | Date formatting |
| tailwindcss | ^3.3.0 | Styling |

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

## Configuration

- `.env.example` - Environment variables template
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind theme (fire colors)
- `tsconfig.json` - TypeScript configuration

## Documentation

- `ROADMAP.md` - Feature roadmap and progress
- `.dev/spec.md` - Infrastructure specification
- `MOLTBOT_INTEGRATION.md` - MoltBot API docs
- `components/infrastructure/*.md` - Component docs

---

## Feature Gap Analysis

### Views Not Yet Implemented
1. **Insights** - AI-powered analytics and project intelligence
2. **Changelog** - Version history and change tracking
3. **Worktrees** - Git worktree management
4. **GitHub PRs** - Pull request management

### Missing Infrastructure Features (from spec.md)
1. **VM Control Actions** - Start/stop/reboot VMs with confirmation
2. **Resource Usage Charts** - CPU/memory/disk visualization
3. **Network Topology Map** - Visual network diagram
4. **Uptime Kuma Integration** - Alert display and monitoring
5. **Auto-Recovery UI** - Trigger and monitor recovery workflows
6. **Incident History Log** - Past incidents and resolutions

### Missing Agent Features
1. **Agent Handoff** - Between stages (orchestrator → coder → tester)
2. **Parallel Execution** - Multiple agents on different tasks
3. **Error Recovery** - Retry logic with backoff
4. **Token Usage Tracking** - Cost monitoring

### Missing Self-Healing Features (Phase 6)
1. **Container Crash Recovery** - Automated restart workflow
2. **DNS Outage Detection** - AdGuard health monitoring
3. **VM Resource Exhaustion** - Memory/disk alerts
4. **SSL Certificate Renewal** - Traefik cert monitoring
5. **n8n Integration** - Workflow triggers and status

### Missing Integrations (Phase 7)
1. **Gitea** - Local git server
2. **GitHub Bidirectional Sync** - Kanban ↔ GitHub Issues
3. **Telegram Notifications** - Alert delivery

---

*Token efficiency: ~3KB index vs ~58KB full codebase read*
