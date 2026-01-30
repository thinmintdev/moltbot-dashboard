"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Terminal,
  ChevronDown,
  ChevronUp,
  Folder,
  FileJson,
  FileText,
} from "lucide-react"
import { Button } from "../ui/Button"

export type ServerStatus = "stopped" | "starting" | "running" | "error"

export type ProjectType =
  | "nextjs"
  | "react"
  | "vue"
  | "vite"
  | "node"
  | "python"
  | "unknown"

export interface DetectedProject {
  type: ProjectType
  name: string
  command: string
  port: number
  icon: React.ReactNode
  configFile: string
}

export interface ServerState {
  status: ServerStatus
  port: number | null
  pid: number | null
  startTime: Date | null
  uptime: number
  lastError?: string
}

interface DevServerControlProps {
  projectPath: string
  serverState: ServerState
  detectedProject: DetectedProject | null
  consolePreview: string[]
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onOpenInBrowser: () => void
  className?: string
}

const PROJECT_TYPE_CONFIG: Record<ProjectType, { label: string; color: string }> = {
  nextjs: { label: "Next.js", color: "text-white" },
  react: { label: "React", color: "text-sky-400" },
  vue: { label: "Vue", color: "text-emerald-400" },
  vite: { label: "Vite", color: "text-purple-400" },
  node: { label: "Node.js", color: "text-green-400" },
  python: { label: "Python", color: "text-yellow-400" },
  unknown: { label: "Unknown", color: "text-theme-400" },
}

const STATUS_CONFIG: Record<
  ServerStatus,
  { label: string; color: string; bgColor: string; pulse?: boolean }
> = {
  stopped: {
    label: "Stopped",
    color: "text-theme-400",
    bgColor: "bg-theme-600",
  },
  starting: {
    label: "Starting...",
    color: "text-amber-400",
    bgColor: "bg-amber-500",
    pulse: true,
  },
  running: {
    label: "Running",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500",
  },
  error: {
    label: "Error",
    color: "text-rose-400",
    bgColor: "bg-rose-500",
  },
}

export function DevServerControl({
  projectPath,
  serverState,
  detectedProject,
  consolePreview,
  onStart,
  onStop,
  onRestart,
  onOpenInBrowser,
  className,
}: DevServerControlProps) {
  const [showConsole, setShowConsole] = useState(false)

  const statusConfig = STATUS_CONFIG[serverState.status]
  const projectConfig = detectedProject
    ? PROJECT_TYPE_CONFIG[detectedProject.type]
    : PROJECT_TYPE_CONFIG.unknown

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const folderName = useMemo(() => {
    const parts = projectPath.split("/")
    return parts[parts.length - 1] || projectPath
  }, [projectPath])

  return (
    <div
      className={classNames(
        "bg-theme-900 border border-theme-800 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-800">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="relative">
            <span
              className={classNames(
                "w-2.5 h-2.5 rounded-full inline-block",
                statusConfig.bgColor,
                statusConfig.pulse && "animate-pulse"
              )}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Dev Server</span>
              <span className={classNames("text-xs", statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            {detectedProject && (
              <div className="flex items-center gap-1.5 text-xs text-theme-400">
                <span className={projectConfig.color}>{projectConfig.label}</span>
                <span className="text-theme-600">|</span>
                <Folder size={10} />
                <span>{folderName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {serverState.status === "stopped" || serverState.status === "error" ? (
            <Button size="sm" variant="success" onClick={onStart}>
              <Play size={14} />
              Start
            </Button>
          ) : serverState.status === "starting" ? (
            <Button size="sm" variant="secondary" disabled loading>
              Starting
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onRestart}>
                <RotateCw size={14} />
                Restart
              </Button>
              <Button size="sm" variant="danger" onClick={onStop}>
                <Square size={14} />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Server Info */}
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-theme-950/50">
        {/* Port */}
        <div>
          <div className="text-xs text-theme-500 mb-1">Port</div>
          <div className="text-sm font-medium text-white">
            {serverState.port ? `:${serverState.port}` : "--"}
          </div>
        </div>

        {/* Uptime */}
        <div>
          <div className="text-xs text-theme-500 mb-1">Uptime</div>
          <div className="text-sm font-medium text-white">
            {serverState.status === "running"
              ? formatUptime(serverState.uptime)
              : "--"}
          </div>
        </div>

        {/* Command */}
        <div className="col-span-2">
          <div className="text-xs text-theme-500 mb-1">Command</div>
          <div className="text-sm font-mono text-theme-300 truncate">
            {detectedProject?.command || "npm run dev"}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {serverState.status === "error" && serverState.lastError && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20">
          <div className="text-xs text-rose-400">{serverState.lastError}</div>
        </div>
      )}

      {/* Detected Project Info */}
      {detectedProject && (
        <div className="px-4 py-2 border-t border-theme-800 flex items-center gap-2">
          <FileJson size={14} className="text-theme-500" />
          <span className="text-xs text-theme-400">
            Detected from{" "}
            <span className="text-theme-300">{detectedProject.configFile}</span>
          </span>
        </div>
      )}

      {/* Console Preview */}
      <div className="border-t border-theme-800">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-theme-800/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-theme-400">
            <Terminal size={14} />
            <span className="text-xs">Console Output</span>
          </div>
          {showConsole ? (
            <ChevronUp size={14} className="text-theme-500" />
          ) : (
            <ChevronDown size={14} className="text-theme-500" />
          )}
        </button>

        {showConsole && (
          <div className="px-4 py-2 bg-theme-950 max-h-32 overflow-y-auto">
            {consolePreview.length === 0 ? (
              <div className="text-xs text-theme-600 text-center py-2">
                No output yet
              </div>
            ) : (
              <div className="font-mono text-xs space-y-0.5">
                {consolePreview.slice(-10).map((line, idx) => (
                  <div
                    key={idx}
                    className={classNames(
                      "whitespace-pre-wrap break-all",
                      line.toLowerCase().includes("error")
                        ? "text-rose-400"
                        : line.toLowerCase().includes("warn")
                        ? "text-amber-400"
                        : "text-theme-400"
                    )}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Open in Browser */}
      {serverState.status === "running" && serverState.port && (
        <div className="px-4 py-2 border-t border-theme-800 flex justify-end">
          <Button size="sm" variant="ghost" onClick={onOpenInBrowser}>
            <ExternalLink size={14} />
            Open in Browser
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Utility function to detect project type from file system
 */
export function detectProjectType(files: string[]): DetectedProject | null {
  const hasFile = (name: string) => files.some((f) => f.endsWith(name))

  if (hasFile("next.config.js") || hasFile("next.config.mjs") || hasFile("next.config.ts")) {
    return {
      type: "nextjs",
      name: "Next.js",
      command: "npm run dev",
      port: 3000,
      icon: <FileJson size={14} />,
      configFile: "next.config.js",
    }
  }

  if (hasFile("vite.config.js") || hasFile("vite.config.ts")) {
    return {
      type: "vite",
      name: "Vite",
      command: "npm run dev",
      port: 5173,
      icon: <FileJson size={14} />,
      configFile: "vite.config.js",
    }
  }

  if (hasFile("vue.config.js")) {
    return {
      type: "vue",
      name: "Vue CLI",
      command: "npm run serve",
      port: 8080,
      icon: <FileJson size={14} />,
      configFile: "vue.config.js",
    }
  }

  if (hasFile("package.json")) {
    // Check for react-scripts (Create React App)
    return {
      type: "react",
      name: "React",
      command: "npm start",
      port: 3000,
      icon: <FileJson size={14} />,
      configFile: "package.json",
    }
  }

  if (hasFile("requirements.txt") || hasFile("setup.py") || hasFile("pyproject.toml")) {
    return {
      type: "python",
      name: "Python",
      command: "python -m http.server 8000",
      port: 8000,
      icon: <FileText size={14} />,
      configFile: hasFile("pyproject.toml")
        ? "pyproject.toml"
        : hasFile("setup.py")
        ? "setup.py"
        : "requirements.txt",
    }
  }

  return null
}
