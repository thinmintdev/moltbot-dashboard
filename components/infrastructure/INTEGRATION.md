# Integration Guide: InfrastructureView

This guide shows how to integrate the InfrastructureView component into the Molten dashboard.

## Quick Integration

### 1. Import in Your Page/Component

```typescript
import { InfrastructureView } from "@/components/infrastructure";
```

### 2. Render as a View

If implementing in the main app page with the navigation system:

```typescript
"use client";

import { useState } from "react";
import { InfrastructureView } from "@/components/infrastructure";
import type { ViewType } from "@/components/layout/Navbar";

export function AppContent({ currentView }: { currentView: ViewType }) {
  return (
    <div className="flex-1 overflow-auto">
      {currentView === "infrastructure" && <InfrastructureView />}
    </div>
  );
}
```

### 3. Update Navbar ViewType (if needed)

The `ViewType` in `Navbar.tsx` already includes "infrastructure":

```typescript
export type ViewType = 
  | "kanban" 
  | "agents" 
  | "infrastructure"  // ← Already included
  | ...other views;
```

## Connecting to Live Data

### Using Zustand Store

Create a store for infrastructure state:

```typescript
// lib/stores/infrastructureStore.ts
import { create } from "zustand";
import type { VM } from "@/components/infrastructure/InfrastructureView";

interface InfrastructureStore {
  vms: VM[];
  isLoading: boolean;
  error: string | null;
  fetchVMs: () => Promise<void>;
  updateVMStatus: (vmId: string, status: "online" | "offline") => void;
  updateVMMetrics: (vmId: string, metrics: Partial<VM>) => void;
}

export const useInfrastructureStore = create<InfrastructureStore>((set) => ({
  vms: [],
  isLoading: false,
  error: null,
  fetchVMs: async () => {
    set({ isLoading: true });
    try {
      // Fetch from API endpoint
      const response = await fetch("/api/infrastructure/vms");
      const vms = await response.json();
      set({ vms, error: null });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  updateVMStatus: (vmId, status) =>
    set((state) => ({
      vms: state.vms.map((vm) =>
        vm.id === vmId ? { ...vm, status } : vm
      ),
    })),
  updateVMMetrics: (vmId, metrics) =>
    set((state) => ({
      vms: state.vms.map((vm) =>
        vm.id === vmId ? { ...vm, ...metrics } : vm
      ),
    })),
}));
```

### Using WebSocket for Real-Time Updates

```typescript
"use client";

import { useEffect } from "react";
import { InfrastructureView } from "@/components/infrastructure";
import { useInfrastructureStore } from "@/lib/stores/infrastructureStore";

export function InfrastructurePage() {
  const { vms, fetchVMs, updateVMMetrics } = useInfrastructureStore();

  useEffect(() => {
    // Initial fetch
    fetchVMs();

    // Set up WebSocket connection
    const ws = new WebSocket("ws://100.73.167.86:8000/infrastructure");
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "metric_update") {
        updateVMMetrics(data.vmId, {
          cpu: data.cpu,
          memory: data.memory,
          lastUpdate: new Date().toLocaleString(),
        });
      }
    };

    // Polling fallback (every 30 seconds)
    const interval = setInterval(fetchVMs, 30000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [fetchVMs, updateVMMetrics]);

  return <InfrastructureView vms={vms} />;
}
```

## API Endpoint Example

If you need to create a backend endpoint to fetch VM data:

```typescript
// app/api/infrastructure/vms/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch from Uptime Kuma, Proxmox, or other sources
    const vms = await Promise.all([
      fetchVMStatus("100.104.67.12"),
      fetchVMStatus("100.112.252.61"),
      fetchVMStatus("100.73.167.86"),
      fetchVMStatus("100.75.100.113"),
    ]);

    return NextResponse.json(vms);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch VM data" },
      { status: 500 }
    );
  }
}

async function fetchVMStatus(ip: string) {
  // Implement actual status fetching logic
  // Could query Proxmox API, SSH, Uptime Kuma, etc.
  return {
    id: ip,
    name: `VM ${ip}`,
    ip,
    status: "online",
    // ... rest of VM data
  };
}
```

## MCP Server Integration

To integrate with MCP servers (ProxmoxMCP-Plus, homelab-mcp):

```typescript
// lib/services/infrastructureService.ts
import { useMCPServer } from "@/lib/mcp/useMCPServer";

export async function getInfrastructureStatus() {
  const mcp = useMCPServer("proxmox");
  
  // Call MCP tool to get VM status
  const result = await mcp.callTool("get_vms", {});
  
  return result.content[0].text; // Parse and return
}
```

## Integration with MoltBot Gateway

Connect to the MoltBot WebSocket gateway:

```typescript
// lib/services/moltbotGateway.ts
export function createGatewayConnection() {
  const ws = new WebSocket("ws://100.73.167.86:18789");

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === "infrastructure_update") {
      // Update local store with infrastructure data
      handleInfrastructureUpdate(message.data);
    }
  };

  return ws;
}
```

## Testing the Component

### Standalone View

```bash
# Run the dev server
npm run dev

# Navigate to /infrastructure (if routed)
# Or import in a page:
import { InfrastructureView } from "@/components/infrastructure";

export default function Page() {
  return <InfrastructureView />;
}
```

### With Custom Data

```typescript
const mockVMs = [
  {
    id: "test-1",
    name: "Test VM",
    ip: "10.0.0.1",
    role: "Testing",
    status: "online",
    services: ["nginx", "postgres"],
    cpu: { usage: 50, cores: 4 },
    memory: { usage: 4, total: 8 },
  },
];

<InfrastructureView vms={mockVMs} />
```

## Styling Customization

To customize colors or styling:

1. Modify Tailwind CSS values in `tailwind.config.ts`
2. Update color variables in the component
3. Keep fire-themed red/orange gradients for consistency

```typescript
// Example: Change primary card color
// In InfrastructureView.tsx
<div className="bg-[#18181b]"> {/* Change hex value */}
```

## Performance Considerations

- **Lazy Loading**: Component is self-contained and loads independently
- **Memoization**: Consider wrapping in `React.memo()` if re-renders are excessive
- **WebSocket Limits**: Cap updates to prevent overwhelming the client
- **Polling Interval**: Set appropriate intervals (30s recommended for infrastructure)

## Accessibility

The component includes:

- Semantic HTML with proper heading hierarchy
- Color contrast ratios meeting WCAG AA standards
- Icon labels with text descriptions
- Interactive elements are keyboard-accessible
- Status indicators use color + symbol combinations

## Troubleshooting

### Component Not Appearing

1. Check that lucide-react is installed: `npm list lucide-react`
2. Verify imports are correct: `@/components/infrastructure`
3. Ensure Tailwind CSS is configured properly

### Styling Issues

1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Check tailwind.config.ts for color definitions

### Real-Time Data Not Updating

1. Verify WebSocket URL is correct
2. Check browser console for connection errors
3. Ensure backend endpoint is responding

## Support

For issues or questions, refer to:
- Component README: `/components/infrastructure/README.md`
- Main ROADMAP: `/ROADMAP.md`
