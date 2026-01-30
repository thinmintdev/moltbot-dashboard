"use client"

import { useState } from "react"
import { X, Bot, Code, Search, TestTube, Wrench, Zap, ChevronRight } from "lucide-react"
import classNames from "classnames"

interface AgentType {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  capabilities: string[]
}

const agentTypes: AgentType[] = [
  {
    id: "coder",
    name: "Coder",
    description: "Implements features, fixes bugs, writes code",
    icon: Code,
    color: "#3b82f6",
    capabilities: ["Code generation", "Bug fixes", "Refactoring"],
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Gathers information, analyzes requirements",
    icon: Search,
    color: "#a855f7",
    capabilities: ["Documentation", "Analysis", "Planning"],
  },
  {
    id: "tester",
    name: "Tester",
    description: "Writes and runs tests, validates quality",
    icon: TestTube,
    color: "#22c55e",
    capabilities: ["Unit tests", "Integration tests", "QA"],
  },
  {
    id: "devops",
    name: "DevOps",
    description: "Infrastructure, deployment, automation",
    icon: Wrench,
    color: "#f97316",
    capabilities: ["CI/CD", "Docker", "Deployment"],
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    description: "Coordinates multiple agents, complex tasks",
    icon: Bot,
    color: "#ef4444",
    capabilities: ["Task decomposition", "Coordination", "Review"],
  },
]

interface AgentSelectModalProps {
  open: boolean
  onClose: () => void
  onSelect: (agentId: string) => void
  taskTitle: string
  recommended?: string
}

export function AgentSelectModal({
  open,
  onClose,
  onSelect,
  taskTitle,
  recommended = "coder",
}: AgentSelectModalProps) {
  const [selected, setSelected] = useState<string>(recommended)
  const [autoMode, setAutoMode] = useState(false)

  if (!open) return null

  const handleStart = () => {
    onSelect(autoMode ? "auto" : selected)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#111113] border border-[#27272a] rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div>
            <h2 className="text-base font-semibold text-[#fafafa]">Select Agent</h2>
            <p className="text-xs text-[#71717a] mt-0.5 truncate max-w-[300px]">{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {/* Auto Mode Toggle */}
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={classNames(
              "w-full flex items-center gap-3 p-3 rounded-lg border mb-3 transition-all",
              autoMode
                ? "border-[#ef4444] bg-[#ef4444]/10"
                : "border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]"
            )}
          >
            <div className={classNames(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              autoMode ? "bg-[#ef4444]" : "bg-[#27272a]"
            )}>
              <Zap size={16} className={autoMode ? "text-white" : "text-[#71717a]"} />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-[#fafafa]">Auto Select</div>
              <div className="text-xs text-[#71717a]">Let MoltBot choose the best agent</div>
            </div>
            <div className={classNames(
              "w-4 h-4 rounded-full border-2",
              autoMode ? "border-[#ef4444] bg-[#ef4444]" : "border-[#52525b]"
            )} />
          </button>

          {/* Agent List */}
          <div className={classNames("space-y-2", autoMode && "opacity-50 pointer-events-none")}>
            {agentTypes.map((agent) => {
              const Icon = agent.icon
              const isSelected = selected === agent.id
              const isRecommended = agent.id === recommended

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelected(agent.id)}
                  className={classNames(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    isSelected
                      ? "border-[#ef4444]/50 bg-[#ef4444]/5"
                      : "border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    <Icon size={16} style={{ color: agent.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#fafafa]">{agent.name}</span>
                      {isRecommended && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[#f97316]/20 text-[#f97316]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#71717a] truncate">{agent.description}</div>
                  </div>
                  <div className={classNames(
                    "w-4 h-4 rounded-full border-2 shrink-0",
                    isSelected ? "border-[#ef4444] bg-[#ef4444]" : "border-[#52525b]"
                  )} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#27272a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#fafafa]"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white shadow-lg shadow-[#ef4444]/25"
          >
            Start Task
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentSelectModal
