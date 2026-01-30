"use client";

import { useInfrastructure, type InfraVM } from "@/hooks/useInfrastructure";
import { InfrastructureView } from "./InfrastructureView";
import { SafetyStatusBar } from "@/components/safety/SafetyStatusBar";
import { VMControlActions } from "@/components/safety/VMControlActions";
import { usePendingOperations } from "@/lib/stores/safety-store";
import { RefreshCw, Wifi, WifiOff, Database, Zap, Server } from "lucide-react";
import classNames from "classnames";

interface LiveInfrastructureViewProps {
  enableLiveData?: boolean;
  showSafetyStatus?: boolean;
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

/**
 * Pending Operations Panel - shows when there are approvals needed
 */
function PendingOperationsPanel() {
  const pendingOperations = usePendingOperations();

  if (pendingOperations.length === 0) return null;

  return (
    <div className="px-6 py-3 bg-[#3b82f6]/5 border-b border-[#3b82f6]/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#3b82f6]">
            {pendingOperations.length} operation{pendingOperations.length !== 1 ? 's' : ''} awaiting approval
          </span>
        </div>
        <span className="text-xs text-[#71717a]">
          Expand safety panel to review
        </span>
      </div>
    </div>
  );
}

export function LiveInfrastructureView({
  enableLiveData = true,
  showSafetyStatus = true,
}: LiveInfrastructureViewProps) {
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

  // VM control handlers (these would connect to actual API calls)
  const createVMHandler = (vmId: string, action: string) => async () => {
    console.log(`Executing ${action} on VM ${vmId}`);
    // In a real implementation, this would call the Proxmox API
    // await proxmoxClient.vmAction(vmId, action);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Safety Status Bar */}
      {showSafetyStatus && (
        <div className="shrink-0 px-6 pt-4">
          <SafetyStatusBar />
        </div>
      )}

      {/* Pending Operations Panel */}
      <PendingOperationsPanel />

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
        <InfrastructureView
          vms={convertedVMs}
          renderVMActions={(vm) => (
            <VMControlActions
              vmId={vm.id}
              vmName={vm.name}
              vmStatus={vm.status}
              onStart={createVMHandler(vm.id, 'start')}
              onStop={createVMHandler(vm.id, 'stop')}
              onRestart={createVMHandler(vm.id, 'restart')}
              onReboot={createVMHandler(vm.id, 'reboot')}
              compact
              showLabels={false}
            />
          )}
        />
      </div>
    </div>
  );
}

export default LiveInfrastructureView;
