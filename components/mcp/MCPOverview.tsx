"use client"

import { useEffect, useState } from "react"
import {
  Wrench,
  Server,
  Bot,
  Terminal,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Activity,
} from "lucide-react"
import classNames from "classnames"
import { useMCPStore, useMCPStatus, type MCPServer, type MCPTool } from "@/lib/stores/mcp-store"

// ============================================================================
// Helper Functions
// ============================================================================

function getServerIcon(type: string) {
  switch (type) {
    case "proxmox":
      return Server
    case "moltbot":
      return Bot
    case "beszel":
      return Activity
    case "homelab":
      return Terminal
    case "ssh":
      return Shield
    default:
      return Wrench
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "connected":
      return "text-[#22c55e]"
    case "connecting":
      return "text-[#f97316]"
    case "error":
      return "text-[#ef4444]"
    default:
      return "text-[#71717a]"
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "connected":
      return "bg-[#22c55e]/10"
    case "connecting":
      return "bg-[#f97316]/10"
    case "error":
      return "bg-[#ef4444]/10"
    default:
      return "bg-[#71717a]/10"
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "query":
      return "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30"
    case "control":
      return "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30"
    case "automation":
      return "bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30"
    default:
      return "bg-[#71717a]/10 text-[#71717a] border-[#71717a]/30"
  }
}

function formatLastCheck(date: Date | null): string {
  if (!date) return "Never"
  const diff = Date.now() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return date.toLocaleTimeString()
}

// ============================================================================
// Server Card Component
// ============================================================================

function ServerCard({ server, onRefresh }: { server: MCPServer; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getServerIcon(server.type)
  const isConnecting = server.status === "connecting"

  const queryTools = server.tools.filter((t) => t.category === "query")
  const controlTools = server.tools.filter((t) => t.category === "control")
  const automationTools = server.tools.filter((t) => t.category === "automation")

  return (
    <div
      className={classNames(
        "bg-[#18181b] border rounded-lg overflow-hidden transition-all",
        server.status === "connected"
          ? "border-[#22c55e]/30 hover:border-[#22c55e]/50"
          : server.status === "error"
          ? "border-[#ef4444]/30 hover:border-[#ef4444]/50"
          : "border-[#27272a] hover:border-[#3f3f46]"
      )}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={classNames(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                getStatusBg(server.status)
              )}
            >
              <Icon size={20} className={getStatusColor(server.status)} />
            </div>
            <div>
              <h3 className="text-[#fafafa] font-medium">{server.name}</h3>
              <p className="text-[#71717a] text-xs font-mono">{server.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <div
              className={classNames(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                getStatusBg(server.status),
                getStatusColor(server.status)
              )}
            >
              {server.status === "connected" && <Wifi size={12} />}
              {server.status === "connecting" && (
                <Loader2 size={12} className="animate-spin" />
              )}
              {server.status === "error" && <WifiOff size={12} />}
              {server.status === "disconnected" && <WifiOff size={12} />}
              <span className="capitalize">{server.status}</span>
            </div>
            {/* Expand Toggle */}
            {expanded ? (
              <ChevronDown size={16} className="text-[#71717a]" />
            ) : (
              <ChevronRight size={16} className="text-[#71717a]" />
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-[#71717a]">
          <span className="flex items-center gap-1">
            <Wrench size={12} />
            {server.tools.length} tools
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatLastCheck(server.lastCheck)}
          </span>
          {server.error && (
            <span className="flex items-center gap-1 text-[#ef4444]">
              <AlertTriangle size={12} />
              {server.error}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[#27272a] p-4">
          {/* Refresh Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRefresh()
              }}
              disabled={isConnecting}
              className={classNames(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#fafafa] transition-colors",
                isConnecting && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw size={12} className={isConnecting ? "animate-spin" : ""} />
              Reconnect
            </button>
          </div>

          {/* Tools by Category */}
          {queryTools.length > 0 && (
            <ToolCategory title="Query Tools" icon={Search} tools={queryTools} />
          )}
          {controlTools.length > 0 && (
            <ToolCategory title="Control Tools" icon={Zap} tools={controlTools} />
          )}
          {automationTools.length > 0 && (
            <ToolCategory title="Automation Tools" icon={Bot} tools={automationTools} />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tool Category Component
// ============================================================================

function ToolCategory({
  title,
  icon: Icon,
  tools,
}: {
  title: string
  icon: React.ElementType
  tools: MCPTool[]
}) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="flex items-center gap-2 text-xs text-[#71717a] font-medium mb-2">
        <Icon size={12} />
        {title}
      </h4>
      <div className="space-y-1.5">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="flex items-center justify-between p-2 rounded bg-[#111113]"
          >
            <div className="flex items-center gap-2">
              <code className="text-xs text-[#fafafa] font-mono">{tool.name}</code>
              {tool.requiresConfirmation && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30">
                  Confirm
                </span>
              )}
            </div>
            <span className="text-xs text-[#52525b] max-w-[200px] truncate">
              {tool.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function MCPOverview() {
  const { servers, isInitialized, connectedCount, totalCount, initializeServers, checkAllServers } =
    useMCPStatus()
  const checkServerHealth = useMCPStore((s) => s.checkServerHealth)
  const getTotalTools = useMCPStore((s) => s.getTotalTools)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initializeServers()
    }
  }, [isInitialized, initializeServers])

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    await checkAllServers()
    setIsRefreshing(false)
  }

  const totalTools = getTotalTools()
  const connectedTools = servers
    .filter((s) => s.status === "connected")
    .reduce((sum, s) => sum + s.tools.length, 0)

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[#fafafa] text-lg font-semibold">MCP Overview</h2>
            {/* Connection Summary */}
            <div
              className={classNames(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                connectedCount === totalCount
                  ? "bg-[#22c55e]/10 text-[#22c55e]"
                  : connectedCount > 0
                  ? "bg-[#f97316]/10 text-[#f97316]"
                  : "bg-[#ef4444]/10 text-[#ef4444]"
              )}
            >
              {connectedCount === totalCount ? (
                <CheckCircle size={12} />
              ) : (
                <AlertTriangle size={12} />
              )}
              {connectedCount}/{totalCount} connected
            </div>
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className={classNames(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] border border-[#27272a] transition-colors",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={classNames("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh All
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fafafa]">{totalCount}</div>
            <div className="text-xs text-[#71717a]">Servers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{connectedCount}</div>
            <div className="text-xs text-[#71717a]">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f97316]">{totalTools}</div>
            <div className="text-xs text-[#71717a]">Total Tools</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3b82f6]">{connectedTools}</div>
            <div className="text-xs text-[#71717a]">Available</div>
          </div>
        </div>
      </div>

      {/* Server Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 max-w-4xl">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onRefresh={() => checkServerHealth(server.id)}
            />
          ))}
        </div>

        {/* Architecture Diagram */}
        <div className="mt-8 p-4 bg-[#18181b] border border-[#27272a] rounded-lg max-w-4xl">
          <h3 className="text-[#fafafa] font-medium mb-3">MCP Architecture</h3>
          <pre className="text-xs text-[#71717a] font-mono overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────────────┐
│                        MOLTEN DASHBOARD                              │
│                        (localhost:3003)                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
    ▼                               ▼                               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  MoltBot    │   │ ProxmoxMCP  │   │   Beszel    │   │ Homelab-MCP │
│  Gateway    │   │    Plus     │   │  Monitoring │   │  (Future)   │
├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤
│ WS: :18789  │   │ HTTP: :8811 │   │ HTTP: :8090 │   │ HTTP: :6971 │
│ Agent spawn │   │ VM control  │   │ System stats│   │ Docker ctrl │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
       │                 │                 │                 │
       │    ┌────────────┘                 │                 │
       │    │                              │                 │
       ▼    ▼                              ▼                 ▼
┌─────────────────┐              ┌─────────────────┐  ┌─────────────────┐
│     AI VM       │              │    Infra VM     │  │     Dev VM      │
│ 100.73.167.86   │              │ 100.112.252.61  │  │ 100.104.67.12   │
│ (VMID: 103)     │              │ (VMID: 100)     │  │ (VMID: 102)     │
├─────────────────┤              ├─────────────────┤  ├─────────────────┤
│ • MoltBot       │              │ • Traefik       │  │ • Gitea         │
│ • LiteLLM       │              │ • Uptime Kuma   │  │ • code-server   │
│ • Open WebUI    │              │ • Beszel        │  │ • PostgreSQL    │
│ • MCP Servers   │              │ • AdGuard Home  │  │ • Redis         │
└─────────────────┘              └─────────────────┘  └─────────────────┘
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │   Proxmox Host  │     │    TrueNAS      │
                    │ 100.75.100.113  │     │ 100.107.227.75  │
                    │ (prx)           │     │ (VMID: 110)     │
                    └─────────────────┘     └─────────────────┘`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default MCPOverview
