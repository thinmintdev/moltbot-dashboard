"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  Square,
  Terminal,
  ChevronUp,
  Cpu,
  Clock,
} from "lucide-react";

interface RunningAgent {
  id: string;
  name: string;
  type: string;
  taskName: string;
  progress: number;
  tokensUsed: number;
  startedAt: string;
  status: "running" | "paused";
}

interface StatusBarProps {
  runningAgents: RunningAgent[];
  onPauseAgent: (agentId: string) => void;
  onResumeAgent: (agentId: string) => void;
  onStopAgent: (agentId: string) => void;
  onOpenLogs: (agentId: string) => void;
  onExpandPanel: () => void;
}

export function StatusBar({
  runningAgents,
  onPauseAgent,
  onResumeAgent,
  onStopAgent,
  onOpenLogs,
  onExpandPanel,
}: StatusBarProps) {
  if (runningAgents.length === 0) {
    return (
      <div className="h-8 bg-[#111113] border-t border-[#27272a] flex items-center px-4">
        <span className="text-xs text-[#71717a]">No agents running</span>
        <div className="flex-1" />
        <span className="text-xs text-[#71717a]">Ready</span>
      </div>
    );
  }

  const primaryAgent = runningAgents[0];
  const otherCount = runningAgents.length - 1;

  const formatTime = (isoString: string) => {
    const start = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  return (
    <div className="h-10 bg-[#111113] border-t border-[#27272a] flex items-center px-3 gap-3">
      {/* Expand Button */}
      <button
        onClick={onExpandPanel}
        className="p-1 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#fafafa] transition-colors"
        title="Expand agent panel"
      >
        <ChevronUp size={14} />
      </button>

      {/* Primary Agent Info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              primaryAgent.status === "running"
                ? "bg-green-500 animate-pulse"
                : "bg-gradient-to-r from-red-500 to-orange-500"
            }`}
          />
          <span className="text-xs font-medium text-[#fafafa]">
            {primaryAgent.name}
          </span>
        </div>
        <span className="text-xs text-[#71717a]">·</span>
        <span className="text-xs text-[#71717a] truncate max-w-[200px]">
          {primaryAgent.taskName}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
            style={{ width: `${primaryAgent.progress}%` }}
          />
        </div>
        <span className="text-xs text-[#71717a] w-8">
          {primaryAgent.progress}%
        </span>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-3 text-xs text-[#71717a]">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{formatTime(primaryAgent.startedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Cpu size={12} />
          <span>{primaryAgent.tokensUsed.toLocaleString()} tokens</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {primaryAgent.status === "running" ? (
          <button
            onClick={() => onPauseAgent(primaryAgent.id)}
            className="p-1.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-orange-500 transition-colors"
            title="Pause"
          >
            <Pause size={14} />
          </button>
        ) : (
          <button
            onClick={() => onResumeAgent(primaryAgent.id)}
            className="p-1.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-green-500 transition-colors"
            title="Resume"
          >
            <Play size={14} />
          </button>
        )}
        <button
          onClick={() => onStopAgent(primaryAgent.id)}
          className="p-1.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-red-500 transition-colors"
          title="Stop"
        >
          <Square size={14} />
        </button>
        <button
          onClick={() => onOpenLogs(primaryAgent.id)}
          className="p-1.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#fafafa] transition-colors"
          title="View Logs"
        >
          <Terminal size={14} />
        </button>
      </div>

      {/* Other Agents Count */}
      {otherCount > 0 && (
        <>
          <div className="w-px h-4 bg-[#27272a]" />
          <button
            onClick={onExpandPanel}
            className="text-xs text-[#71717a] hover:text-[#fafafa] transition-colors"
          >
            +{otherCount} more agent{otherCount > 1 ? "s" : ""}
          </button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Total Running */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-[#71717a]">{runningAgents.length} running</span>
      </div>
    </div>
  );
}

export default StatusBar;
