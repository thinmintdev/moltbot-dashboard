"use client";

import { useInfrastructure, type InfraVM } from "@/hooks/useInfrastructure";
import { InfrastructureView } from "./InfrastructureView";
import { RefreshCw, Wifi, WifiOff, Database, Zap, Server } from "lucide-react";
import classNames from "classnames";

interface LiveInfrastructureViewProps {
  enableLiveData?: boolean;
}

/**
 * Format bytes to GB for display
 */
function bytesToGB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10;
}

/**
 * Format uptime seconds to string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(seconds / 60)}m`;
}

/**
 * Convert InfraVM to the format expected by InfrastructureView
 */
function convertToViewFormat(vm: InfraVM) {
  return {
    id: vm.id,
    name: vm.name,
    ip: vm.ip,
    role: vm.role,
    status: vm.status === 'online' ? 'online' as const : 'offline' as const,
    services: vm.services,
    cpu: {
      usage: vm.cpu,
      cores: vm.cpuCores,
    },
    memory: {
      usage: bytesToGB(vm.memory),
      total: bytesToGB(vm.memoryTotal),
    },
    uptime: formatUptime(vm.uptime),
    lastUpdate: 'Just now',
  };
}

export function LiveInfrastructureView({ enableLiveData = true }: LiveInfrastructureViewProps) {
  const { vms, isLoading, error, lastUpdate, dataSource, refresh } = useInfrastructure({
    pollingInterval: enableLiveData ? 30000 : 0,
    enableProxmox: enableLiveData,
    enableBeszel: enableLiveData,
  });

  // Convert VMs to the format expected by InfrastructureView
  const convertedVMs = vms.map(convertToViewFormat);

  // Get source icon and label
  const sourceInfo = {
    proxmox: { icon: Server, label: 'Proxmox', color: 'text-[#22c55e]' },
    beszel: { icon: Zap, label: 'Beszel', color: 'text-[#3b82f6]' },
    static: { icon: Database, label: 'Static', color: 'text-[#71717a]' },
  }[dataSource];

  const SourceIcon = sourceInfo.icon;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Live Data Header */}
      {enableLiveData && (
        <div className="shrink-0 px-6 py-3 border-b border-[#27272a] flex items-center justify-between bg-[#111113]">
          <div className="flex items-center gap-4">
            {/* Data Source Indicator */}
            <div className={classNames(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
              dataSource !== 'static' ? "bg-[#22c55e]/10" : "bg-[#71717a]/10"
            )}>
              {dataSource !== 'static' ? (
                <Wifi size={12} className="text-[#22c55e]" />
              ) : (
                <WifiOff size={12} className="text-[#71717a]" />
              )}
              <SourceIcon size={12} className={sourceInfo.color} />
              <span className={sourceInfo.color}>{sourceInfo.label}</span>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <span className="text-xs text-[#71717a]">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}

            {/* VM Count */}
            <span className="text-xs text-[#71717a]">
              {vms.length} VMs
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] border border-[#27272a] transition-colors",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-6 py-2 bg-[#ef4444]/10 border-b border-[#ef4444]/30 text-[#ef4444] text-xs">
          Failed to fetch live data: {error.message}. Showing cached/static data.
        </div>
      )}

      {/* Main Infrastructure View */}
      <div className="flex-1 overflow-hidden">
        <InfrastructureView vms={convertedVMs} />
      </div>
    </div>
  );
}

export default LiveInfrastructureView;
