# Infrastructure Monitoring Components

Real-time infrastructure monitoring and management for the Molten dashboard.

## Components

### InfrastructureView

A comprehensive infrastructure monitoring dashboard displaying VM status, resource usage, and service information.

#### Features

- **VM Status Cards**: Visual grid displaying all infrastructure components
- **Online/Offline Indicators**: Real-time status with animated pulse indicator
- **Resource Monitoring**: 
  - CPU usage with color-coded progress bars (blue <50%, orange 50-75%, red >75%)
  - Memory usage with visual indicators
- **Service Listing**: Shows all running services with categorized icons
- **Expandable Details**: Click any card to see:
  - Complete service list with status indicators
  - Uptime information
  - Action buttons (Details, Monitor, Manage)
- **Fire-Themed Styling**: Matches Molten dashboard aesthetic with red/orange gradients

#### Props

```typescript
interface InfrastructureViewProps {
  vms?: VM[];
}

interface VM {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  ip: string;                    // Tailscale IP address
  role: string;                  // Infrastructure role description
  status: "online" | "offline";  // Current status
  services: string[];            // List of running services
  cpu: {
    usage: number;               // CPU usage percentage (0-100)
    cores: number;               // Available CPU cores
  };
  memory: {
    usage: number;               // Used memory in GB
    total: number;               // Total memory in GB
  };
  uptime?: string;               // Optional uptime string (e.g., "45d 12h")
  lastUpdate?: string;           // Optional last update timestamp
}
```

#### Default Infrastructure

The component comes with pre-configured infrastructure data:

| Host | IP | Role | Services |
|------|----|----|----------|
| Dev VM | 100.104.67.12 | Development & Code Storage | Gitea, code-server, PostgreSQL, Redis |
| Infra VM | 100.112.252.61 | Networking & Monitoring | Traefik, AdGuard, Uptime Kuma |
| AI VM | 100.73.167.86 | AI & Orchestration | MoltBot, LiteLLM, Open WebUI, MCP Servers |
| Proxmox Host | 100.75.100.113 | Hypervisor Management | Proxmox VE, VM Management, Backup |

#### Usage

```typescript
import { InfrastructureView } from "@/components/infrastructure";

// Use default infrastructure data
export function InfrastructurePage() {
  return <InfrastructureView />;
}

// Or provide custom data
export function CustomInfrastructure() {
  const customVMs = [
    {
      id: "custom-vm",
      name: "Custom Server",
      ip: "10.0.0.1",
      role: "Custom Role",
      status: "online",
      services: ["Service A", "Service B"],
      cpu: { usage: 50, cores: 8 },
      memory: { usage: 8, total: 16 },
    },
  ];

  return <InfrastructureView vms={customVMs} />;
}
```

## Styling

Uses Tailwind CSS with the Molten color scheme:

- **Background**: `bg-[#0a0a0b]` (primary), `bg-[#18181b]` (cards)
- **Borders**: `border-[#27272a]`
- **Text**: `text-[#fafafa]` (primary), `text-[#71717a]` (muted)
- **Accents**: Red/orange gradients with fire-theme glow effects
- **Status Colors**:
  - Online: Green (`#22c55e`)
  - Offline: Red (`#ef4444`)
  - CPU/Memory: Blue → Yellow → Red gradient based on usage

## Icons

Uses `lucide-react` icons:
- `Server` - Main header and status
- `Cpu` - CPU usage indicator
- `HardDrive` - Memory usage indicator
- `Database` - Services section header
- `Globe` - Git/code services
- `Radio` - Network services
- `Zap` - AI/Bot services
- `CheckCircle` - Online status
- `AlertCircle` - Offline status
- `ChevronDown` - Expand/collapse toggle

## Interactions

### Card Hover
- Border shifts to orange with subtle glow
- Smooth color transitions

### Card Click
- Expands to show detailed information
- Animated slide-in for details section
- Collapsible by clicking again or the chevron button

### Service Icons
- Hover effects change color to orange
- Icons categorized by service type:
  - Git/Code services: Globe icon
  - Database services: Database icon
  - Network services: Radio icon
  - AI/Bot services: Zap icon

### Progress Bars
- Color-coded based on usage percentage
- Smooth width animations
- Glow shadow effects

## Responsive Design

- **Mobile**: Single column grid
- **Tablet**: 2 column grid (md breakpoint)
- **Desktop**: 2 column grid (lg/xl breakpoints)
- Fully touch-friendly card interactions

## Future Enhancements

- [ ] Real-time data integration with MCP servers
- [ ] Uptime Kuma integration for historical data
- [ ] WebSocket updates for live metrics
- [ ] Alert system for resource thresholds
- [ ] Performance charts and graphs
- [ ] Network topology visualization
- [ ] Auto-recovery trigger UI
- [ ] Custom alert thresholds
- [ ] Export monitoring data

## Dependencies

- `react` - UI library
- `lucide-react` - Icons
- `tailwindcss` - Styling

## File Structure

```
components/infrastructure/
├── InfrastructureView.tsx    # Main component
├── index.ts                   # Export barrel file
└── README.md                  # This file
```
