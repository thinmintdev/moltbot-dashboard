"use client";

import { useState } from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Globe,
  Radio,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Zap,
} from "lucide-react";

interface VM {
  id: string;
  name: string;
  ip: string;
  role: string;
  status: "online" | "offline";
  services: string[];
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    usage: number;
    total: number;
  };
  uptime?: string;
  lastUpdate?: string;
}

interface InfrastructureViewProps {
  vms?: VM[];
  renderVMActions?: (vm: VM) => React.ReactNode;
}

const defaultVMs: VM[] = [
  {
    id: "dev-vm",
    name: "Dev VM",
    ip: "100.104.67.12",
    role: "Development & Code Storage",
    status: "online",
    services: ["Gitea", "code-server", "PostgreSQL", "Redis"],
    cpu: {
      usage: 45,
      cores: 8,
    },
    memory: {
      usage: 6.2,
      total: 16,
    },
    uptime: "45d 12h",
    lastUpdate: "2 minutes ago",
  },
  {
    id: "infra-vm",
    name: "Infra VM",
    ip: "100.112.252.61",
    role: "Networking & Monitoring",
    status: "online",
    services: ["Traefik", "AdGuard", "Uptime Kuma"],
    cpu: {
      usage: 22,
      cores: 4,
    },
    memory: {
      usage: 3.8,
      total: 8,
    },
    uptime: "60d 3h",
    lastUpdate: "Just now",
  },
  {
    id: "ai-vm",
    name: "AI VM",
    ip: "100.73.167.86",
    role: "AI & Orchestration",
    status: "online",
    services: ["MoltBot", "LiteLLM", "Open WebUI", "MCP Servers"],
    cpu: {
      usage: 78,
      cores: 16,
    },
    memory: {
      usage: 12.5,
      total: 32,
    },
    uptime: "15d 8h",
    lastUpdate: "30 seconds ago",
  },
  {
    id: "proxmox",
    name: "Proxmox Host",
    ip: "100.75.100.113",
    role: "Hypervisor Management",
    status: "online",
    services: ["Proxmox VE", "VM Management", "Backup"],
    cpu: {
      usage: 25,
      cores: 12,
    },
    memory: {
      usage: 18.3,
      total: 64,
    },
    uptime: "120d 5h",
    lastUpdate: "5 minutes ago",
  },
];

export function InfrastructureView({
  vms = defaultVMs,
  renderVMActions,
}: InfrastructureViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (
    status: "online" | "offline"
  ): { bg: string; text: string; dot: string } => {
    return status === "online"
      ? {
          bg: "bg-green-500/10",
          text: "text-green-500",
          dot: "bg-green-500",
        }
      : {
          bg: "bg-red-500/10",
          text: "text-red-500",
          dot: "bg-red-500",
        };
  };

  const getCpuColor = (usage: number): string => {
    if (usage < 50) return "from-blue-500 to-cyan-500";
    if (usage < 75) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-orange-500";
  };

  const getMemoryColor = (usage: number, total: number): string => {
    const percentage = (usage / total) * 100;
    if (percentage < 50) return "from-blue-500 to-cyan-500";
    if (percentage < 75) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-orange-500";
  };

  const getServiceIcon = (service: string): React.ReactNode => {
    const lowerService = service.toLowerCase();
    if (
      lowerService.includes("git") ||
      lowerService.includes("github") ||
      lowerService.includes("code")
    ) {
      return <Globe size={14} />;
    }
    if (lowerService.includes("postgres") || lowerService.includes("sql")) {
      return <Database size={14} />;
    }
    if (lowerService.includes("traefik") || lowerService.includes("network")) {
      return <Radio size={14} />;
    }
    if (lowerService.includes("bot") || lowerService.includes("llm")) {
      return <Zap size={14} />;
    }
    return <Server size={14} />;
  };

  return (
    <div className="w-full h-full bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <div className="border-b border-[#27272a] p-6 bg-gradient-to-r from-[#18181b] to-[#111113]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Server size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Infrastructure Monitor
            </h1>
            <p className="text-sm text-[#71717a] mt-1">
              {vms.filter((vm) => vm.status === "online").length} of {vms.length}{" "}
              hosts online
            </p>
          </div>
        </div>
      </div>

      {/* VM Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {vms.map((vm) => {
            const isExpanded = expandedId === vm.id;
            const statusColor = getStatusColor(vm.status);
            const cpuColor = getCpuColor(vm.cpu.usage);
            const memoryColor = getMemoryColor(vm.memory.usage, vm.memory.total);
            const cpuPercentage = Math.round((vm.cpu.usage / 100) * 100);
            const memoryPercentage = Math.round(
              (vm.memory.usage / vm.memory.total) * 100
            );

            return (
              <div
                key={vm.id}
                className="group cursor-pointer transition-all duration-300"
                onClick={() => toggleExpand(vm.id)}
              >
                {/* VM Card */}
                <div
                  className={`bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 ${
                    isExpanded
                      ? "shadow-lg shadow-orange-500/20 border-orange-500/50"
                      : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#27272a] bg-gradient-to-r from-[#18181b] via-[#18181b] to-transparent">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Status Indicator */}
                        <div className="flex flex-col gap-2 items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${statusColor.bg} ring-2 ring-offset-2 ring-offset-[#18181b] ring-[#27272a]`}
                          >
                            {vm.status === "online" ? (
                              <CheckCircle
                                size={16}
                                className={statusColor.text}
                              />
                            ) : (
                              <AlertCircle size={16} className={statusColor.text} />
                            )}
                          </div>
                          <div
                            className={`w-2 h-2 rounded-full animate-pulse ${statusColor.dot}`}
                          />
                        </div>

                        {/* VM Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-[#fafafa] truncate">
                            {vm.name}
                          </h2>
                          <p className="text-xs text-[#71717a] mt-1">{vm.role}</p>
                          <p className="text-xs text-orange-500/70 font-mono mt-2">
                            {vm.ip}
                          </p>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button
                        className="p-1 rounded hover:bg-[#27272a] transition-colors text-[#71717a] hover:text-orange-500 flex-shrink-0 mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(vm.id);
                        }}
                      >
                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-300 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Quick Status Badges & Actions */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
                        >
                          {vm.status === "online" ? "Online" : "Offline"}
                        </span>
                        {vm.lastUpdate && (
                          <span className="text-xs text-[#71717a]">
                            {vm.lastUpdate}
                          </span>
                        )}
                      </div>
                      {/* VM Control Actions */}
                      {renderVMActions && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center"
                        >
                          {renderVMActions(vm)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics Section */}
                  <div className="p-4 space-y-3 border-b border-[#27272a]">
                    {/* CPU Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu size={14} className="text-[#71717a]" />
                          <span className="text-xs text-[#71717a]">CPU Usage</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-orange-500">
                          {vm.cpu.usage}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${cpuColor} transition-all duration-300 shadow-lg shadow-orange-500/20`}
                          style={{ width: `${vm.cpu.usage}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#71717a]">
                        {vm.cpu.cores} cores available
                      </p>
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive size={14} className="text-[#71717a]" />
                          <span className="text-xs text-[#71717a]">
                            Memory Usage
                          </span>
                        </div>
                        <span className="text-sm font-mono font-bold text-orange-500">
                          {vm.memory.usage.toFixed(1)}GB / {vm.memory.total}GB
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${memoryColor} transition-all duration-300 shadow-lg shadow-orange-500/20`}
                          style={{ width: `${memoryPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#71717a]">
                        {memoryPercentage}% utilization
                      </p>
                    </div>
                  </div>

                  {/* Services List */}
                  <div className="p-4 bg-[#111113]/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Database size={14} className="text-orange-500/70" />
                      <span className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">
                        Services ({vm.services.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vm.services.slice(0, 3).map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#27272a] border border-[#27272a] hover:border-orange-500/30 transition-colors group/service"
                        >
                          <span className="text-[#71717a] group-hover/service:text-orange-500 transition-colors">
                            {getServiceIcon(service)}
                          </span>
                          <span className="text-xs text-[#fafafa] font-medium">
                            {service}
                          </span>
                        </div>
                      ))}
                      {vm.services.length > 3 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-orange-500/10 border border-orange-500/30">
                          <span className="text-xs text-orange-500 font-medium">
                            +{vm.services.length - 3} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[#27272a] p-4 bg-gradient-to-b from-[#18181b] to-[#111113] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* All Services */}
                      <div>
                        <h3 className="text-sm font-semibold text-[#fafafa] mb-2">
                          All Services
                        </h3>
                        <div className="space-y-1">
                          {vm.services.map((service, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-2 rounded bg-[#27272a]/50 hover:bg-[#27272a] transition-colors group/fullservice"
                            >
                              <div className="text-[#71717a] group-hover/fullservice:text-orange-500 transition-colors">
                                {getServiceIcon(service)}
                              </div>
                              <span className="text-sm text-[#fafafa]">
                                {service}
                              </span>
                              <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Uptime Info */}
                      {vm.uptime && (
                        <div>
                          <h3 className="text-sm font-semibold text-[#fafafa] mb-2">
                            Uptime
                          </h3>
                          <div className="px-3 py-2 rounded bg-[#27272a]/50 border border-green-500/20">
                            <p className="text-sm font-mono text-green-500">
                              {vm.uptime}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button className="flex-1 px-3 py-2 rounded text-sm font-medium bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 transition-colors">
                          Details
                        </button>
                        <button className="flex-1 px-3 py-2 rounded text-sm font-medium bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500/20 transition-colors">
                          Monitor
                        </button>
                        <button className="flex-1 px-3 py-2 rounded text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-colors">
                          Manage
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {vms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-lg bg-[#27272a] flex items-center justify-center mb-4">
              <Server size={32} className="text-[#71717a]" />
            </div>
            <h3 className="text-lg font-semibold text-[#fafafa] mb-2">
              No Infrastructure Data
            </h3>
            <p className="text-sm text-[#71717a] max-w-sm">
              Infrastructure monitoring will display connected VMs and their
              status when available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
