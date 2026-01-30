# Code Examples: InfrastructureView Component

Quick reference for using and integrating the InfrastructureView component.

## Basic Usage

### Minimal Implementation

```typescript
import { InfrastructureView } from "@/components/infrastructure";

export default function InfrastructurePage() {
  return <InfrastructureView />;
}
```

This renders the component with pre-configured default VMs:
- Dev VM (100.104.67.12)
- Infra VM (100.112.252.61)
- AI VM (100.73.167.86)
- Proxmox (100.75.100.113)

## Custom Data

### Providing Custom VMs

```typescript
import { InfrastructureView } from "@/components/infrastructure";

export default function CustomInfraPage() {
  const customVMs = [
    {
      id: "web-server-1",
      name: "Web Server 1",
      ip: "192.168.1.10",
      role: "Frontend API Gateway",
      status: "online" as const,
      services: ["nginx", "Let's Encrypt", "Monitoring Agent"],
      cpu: { usage: 35, cores: 8 },
      memory: { usage: 4.2, total: 16 },
      uptime: "120d 6h 42m",
      lastUpdate: "Just now",
    },
    {
      id: "db-server-1",
      name: "Database Server",
      ip: "192.168.1.20",
      role: "PostgreSQL Primary",
      status: "online" as const,
      services: ["PostgreSQL", "pg_dump", "WAL Archive"],
      cpu: { usage: 62, cores: 16 },
      memory: { usage: 24.5, total: 32 },
      uptime: "180d 2h 15m",
      lastUpdate: "1 minute ago",
    },
    {
      id: "backup-server",
      name: "Backup Server",
      ip: "192.168.1.30",
      role: "Backup & Archive",
      status: "offline" as const,
      services: ["Rsync", "Bacula", "NFS"],
      cpu: { usage: 5, cores: 4 },
      memory: { usage: 0.8, total: 8 },
      uptime: "N/A",
      lastUpdate: "3 days ago",
    },
  ];

  return <InfrastructureView vms={customVMs} />;
}
```

## Integration with State Management

### Zustand Store Pattern

```typescript
// lib/stores/infrastructureStore.ts
import { create } from "zustand";

interface VM {
  id: string;
  name: string;
  ip: string;
  role: string;
  status: "online" | "offline";
  services: string[];
  cpu: { usage: number; cores: number };
  memory: { usage: number; total: number };
  uptime?: string;
  lastUpdate?: string;
}

interface InfrastructureState {
  vms: VM[];
  loading: boolean;
  error: string | null;
  fetchVMs: () => Promise<void>;
  updateVMStatus: (vmId: string, status: "online" | "offline") => void;
  updateVMMetrics: (vmId: string, cpu: number, memory: number) => void;
}

export const useInfrastructureStore = create<InfrastructureState>((set) => ({
  vms: [],
  loading: false,
  error: null,

  fetchVMs: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/infrastructure/vms");
      if (!response.ok) throw new Error("Failed to fetch VMs");
      const vms = await response.json();
      set({ vms, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateVMStatus: (vmId: string, status: "online" | "offline") =>
    set((state) => ({
      vms: state.vms.map((vm) =>
        vm.id === vmId
          ? {
              ...vm,
              status,
              lastUpdate: new Date().toLocaleTimeString(),
            }
          : vm
      ),
    })),

  updateVMMetrics: (vmId: string, cpu: number, memory: number) =>
    set((state) => ({
      vms: state.vms.map((vm) =>
        vm.id === vmId
          ? {
              ...vm,
              cpu: { ...vm.cpu, usage: cpu },
              memory: { ...vm.memory, usage: memory },
              lastUpdate: new Date().toLocaleTimeString(),
            }
          : vm
      ),
    })),
}));
```

### Using the Store in Component

```typescript
"use client";

import { useEffect } from "react";
import { InfrastructureView } from "@/components/infrastructure";
import { useInfrastructureStore } from "@/lib/stores/infrastructureStore";

export default function InfrastructurePage() {
  const { vms, loading, error, fetchVMs } = useInfrastructureStore();

  useEffect(() => {
    fetchVMs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchVMs, 30000);
    return () => clearInterval(interval);
  }, [fetchVMs]);

  if (loading && vms.length === 0) {
    return <div className="p-8">Loading infrastructure data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading infrastructure: {error}
      </div>
    );
  }

  return <InfrastructureView vms={vms} />;
}
```

## WebSocket Integration

### Real-Time Metrics Updates

```typescript
"use client";

import { useEffect } from "react";
import { InfrastructureView } from "@/components/infrastructure";
import { useInfrastructureStore } from "@/lib/stores/infrastructureStore";

export default function LiveInfrastructurePage() {
  const { vms, fetchVMs, updateVMMetrics, updateVMStatus } =
    useInfrastructureStore();

  useEffect(() => {
    // Initial fetch
    fetchVMs();

    // WebSocket connection for real-time updates
    const ws = new WebSocket(
      `ws://${window.location.hostname}:8000/infrastructure/metrics`
    );

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "metric_update":
            // Update CPU and memory metrics
            updateVMMetrics(
              message.vmId,
              message.cpu,
              message.memory
            );
            break;

          case "status_change":
            // Update VM status
            updateVMStatus(message.vmId, message.status);
            break;

          case "heartbeat":
            // Keep connection alive
            ws.send(JSON.stringify({ type: "pong" }));
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [fetchVMs, updateVMMetrics, updateVMStatus]);

  return <InfrastructureView vms={vms} />;
}
```

## API Endpoint Example

### Next.js API Route

```typescript
// app/api/infrastructure/vms/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch from various sources
    const vms = await Promise.all([
      fetchVMFromProxmox("100.104.67.12"),
      fetchVMFromUptime Kuma("100.112.252.61"),
      fetchVMMetrics("100.73.167.86"),
      fetchProxmoxHost("100.75.100.113"),
    ]);

    return NextResponse.json(vms, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch infrastructure status" },
      { status: 500 }
    );
  }
}

async function fetchVMFromProxmox(host: string) {
  // Implementation would call Proxmox API
  // curl -s https://proxmox:8006/api2/json/nodes/hostname/qemu
  return {
    id: host,
    name: `VM ${host}`,
    ip: host,
    role: "Compute Node",
    status: "online" as const,
    services: ["QEMU", "KVM", "Container Runtime"],
    cpu: { usage: 45, cores: 8 },
    memory: { usage: 6.2, total: 16 },
    lastUpdate: new Date().toISOString(),
  };
}

async function fetchVMFromUptime Kuma(host: string) {
  // Implementation would call Uptime Kuma API
  // GET https://uptime-kuma:3001/api/status-page/slug/status
  return {
    id: host,
    name: `Monitor ${host}`,
    ip: host,
    role: "Monitoring & Uptime",
    status: "online" as const,
    services: ["Uptime Kuma", "Prometheus", "Alert Manager"],
    cpu: { usage: 22, cores: 4 },
    memory: { usage: 3.8, total: 8 },
    lastUpdate: new Date().toISOString(),
  };
}

async function fetchVMMetrics(host: string) {
  // Implementation would call local metrics service
  // or query Prometheus directly
  return {
    id: host,
    name: `AI VM ${host}`,
    ip: host,
    role: "AI & Processing",
    status: "online" as const,
    services: ["MoltBot", "LiteLLM", "Open WebUI", "MCP Servers"],
    cpu: { usage: 78, cores: 16 },
    memory: { usage: 12.5, total: 32 },
    lastUpdate: new Date().toISOString(),
  };
}

async function fetchProxmoxHost(host: string) {
  // Implementation would call Proxmox host API
  return {
    id: host,
    name: `Hypervisor ${host}`,
    ip: host,
    role: "Physical Host",
    status: "online" as const,
    services: ["Proxmox VE", "ZFS", "Ceph"],
    cpu: { usage: 25, cores: 12 },
    memory: { usage: 18.3, total: 64 },
    lastUpdate: new Date().toISOString(),
  };
}
```

## Integration with View System

### Adding to Navbar View Switcher

```typescript
// In your main app component
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { KanbanBoard } from "@/components/kanban";
import { AgentPanel } from "@/components/agents";
import { InfrastructureView } from "@/components/infrastructure";
import type { ViewType } from "@/components/layout/Navbar";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("kanban");
  const [projects, setProjects] = useState([
    { id: "1", name: "Project 1", color: "#ef4444" },
  ]);

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        projects={projects}
        activeProjectId="1"
        onProjectChange={() => {}}
        onNewProject={() => {}}
        onNewTask={() => {}}
        onOpenSettings={() => {}}
        isConnected={true}
        currentModel="claude-opus-4.5"
      />

      <div className="flex-1 overflow-auto">
        {currentView === "kanban" && <KanbanBoard />}
        {currentView === "agents" && <AgentPanel />}
        {currentView === "infrastructure" && <InfrastructureView />}
      </div>
    </div>
  );
}
```

## CSS Customization

### Extending Tailwind Config

If you need custom colors or effects:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom infrastructure colors
        "infra-online": "#22c55e",
        "infra-offline": "#ef4444",
        "infra-warning": "#f59e0b",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

## Testing

### Jest Test Example

```typescript
// components/infrastructure/InfrastructureView.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { InfrastructureView } from "./InfrastructureView";

describe("InfrastructureView", () => {
  it("renders with default VMs", () => {
    render(<InfrastructureView />);
    expect(screen.getByText("Dev VM")).toBeInTheDocument();
    expect(screen.getByText("AI VM")).toBeInTheDocument();
  });

  it("renders custom VMs", () => {
    const customVMs = [
      {
        id: "test-1",
        name: "Test Server",
        ip: "10.0.0.1",
        role: "Testing",
        status: "online" as const,
        services: ["nginx"],
        cpu: { usage: 50, cores: 4 },
        memory: { usage: 4, total: 8 },
      },
    ];

    render(<InfrastructureView vms={customVMs} />);
    expect(screen.getByText("Test Server")).toBeInTheDocument();
  });

  it("expands card on click", () => {
    render(<InfrastructureView />);
    const expandButton = screen.getAllByRole("button")[0];
    fireEvent.click(expandButton);
    expect(screen.getByText("All Services")).toBeInTheDocument();
  });

  it("shows status badges correctly", () => {
    render(<InfrastructureView />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });
});
```

## Performance Tips

### Memoization for Large Datasets

```typescript
import { memo } from "react";
import { InfrastructureView } from "@/components/infrastructure";

const MemoizedInfrastructureView = memo(InfrastructureView);

export default function Page() {
  return <MemoizedInfrastructureView />;
}
```

### Pagination for Many VMs

```typescript
"use client";

import { useState } from "react";
import { InfrastructureView } from "@/components/infrastructure";

const ITEMS_PER_PAGE = 4;

export default function PaginatedInfrastructure({
  allVMs,
}: {
  allVMs: any[];
}) {
  const [page, setPage] = useState(0);

  const vms = allVMs.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(allVMs.length / ITEMS_PER_PAGE);

  return (
    <div>
      <InfrastructureView vms={vms} />
      <div className="flex gap-2 justify-center p-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`px-3 py-1 rounded ${
              page === i ? "bg-orange-500" : "bg-[#27272a]"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

### With Error Boundary

```typescript
import { ReactNode } from "react";

export class InfrastructureErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-500">
            Failed to load infrastructure monitor
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

For more information, see:
- [README.md](./README.md) - Component documentation
- [INTEGRATION.md](./INTEGRATION.md) - Integration guide
