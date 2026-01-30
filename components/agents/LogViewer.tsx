"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import classNames from "classnames"
import {
  Search,
  Copy,
  ArrowDown,
  Filter,
  Check,
  X,
} from "lucide-react"
import { LogEntry, LogLevel } from "./types"

interface LogViewerProps {
  logs: LogEntry[]
  className?: string
  agentFilter?: string
  taskFilter?: string
  showFilters?: boolean
  maxHeight?: string
}

const levelConfig: Record<LogLevel, { bg: string; text: string; badge: string }> = {
  debug: {
    bg: "bg-theme-600/30",
    text: "text-theme-400",
    badge: "bg-theme-600/50 text-theme-300",
  },
  info: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
  },
  warn: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
  },
  error: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    badge: "bg-rose-500/20 text-rose-400",
  },
}

export function LogViewer({
  logs,
  className,
  agentFilter: externalAgentFilter,
  taskFilter: externalTaskFilter,
  showFilters = true,
  maxHeight = "400px",
}: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilters, setLevelFilters] = useState<LogLevel[]>([
    "debug",
    "info",
    "warn",
    "error",
  ])
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Level filter
      if (!levelFilters.includes(log.level)) return false

      // Agent filter
      if (externalAgentFilter && log.agentId !== externalAgentFilter) return false

      // Task filter
      if (externalTaskFilter && log.taskId !== externalTaskFilter) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          log.message.toLowerCase().includes(query) ||
          log.agentName.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [logs, levelFilters, externalAgentFilter, externalTaskFilter, searchQuery])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  // Handle manual scroll
  const handleScroll = () => {
    if (!logContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  // Copy logs to clipboard
  const copyLogs = async () => {
    const logText = filteredLogs
      .map(
        (log) =>
          `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] [${log.agentName}] ${log.message}`
      )
      .join("\n")
    await navigator.clipboard.writeText(logText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Toggle level filter
  const toggleLevel = (level: LogLevel) => {
    setLevelFilters((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
  }

  return (
    <div
      className={classNames(
        "bg-theme-950 rounded-xl border border-theme-700 flex flex-col overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      {showFilters && (
        <div className="flex items-center gap-2 p-2 border-b border-theme-700 bg-theme-900/50">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-800 border border-theme-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-theme-400 focus:outline-none focus:border-theme-500"
            />
          </div>

          {/* Level Filter */}
          <div className="relative">
            <button
              onClick={() => setShowLevelDropdown(!showLevelDropdown)}
              className={classNames(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                "bg-theme-800 border border-theme-700 text-theme-300 hover:border-theme-500"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>Level</span>
            </button>

            {showLevelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLevelDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-theme-800 border border-theme-700 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                  {(["debug", "info", "warn", "error"] as LogLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-theme-700 text-left"
                    >
                      <span
                        className={classNames(
                          "w-4 h-4 rounded border flex items-center justify-center",
                          levelFilters.includes(level)
                            ? "bg-theme-500 border-theme-500"
                            : "border-theme-600"
                        )}
                      >
                        {levelFilters.includes(level) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </span>
                      <span
                        className={classNames("capitalize", levelConfig[level].text)}
                      >
                        {level}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              autoScroll
                ? "bg-theme-600 text-white"
                : "bg-theme-800 border border-theme-700 text-theme-400 hover:border-theme-500"
            )}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* Copy button */}
          <button
            onClick={copyLogs}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              "bg-theme-800 border border-theme-700 text-theme-400 hover:border-theme-500 hover:text-white"
            )}
            title="Copy logs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Log Container */}
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        className="overflow-y-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-theme-400">
            <span>No logs to display</span>
          </div>
        ) : (
          <div className="divide-y divide-theme-800/50">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={classNames(
                  "flex items-start gap-2 px-3 py-1.5 hover:bg-theme-900/30 transition-colors",
                  levelConfig[log.level].bg
                )}
              >
                {/* Timestamp */}
                <span className="text-theme-500 shrink-0 text-xs">
                  {formatTime(log.timestamp)}
                </span>

                {/* Level Badge */}
                <span
                  className={classNames(
                    "px-1.5 py-0.5 rounded text-xs font-medium uppercase shrink-0",
                    levelConfig[log.level].badge
                  )}
                >
                  {log.level.slice(0, 4)}
                </span>

                {/* Agent Name */}
                <span className="text-theme-300 shrink-0 text-xs">
                  [{log.agentName}]
                </span>

                {/* Message */}
                <span className={classNames("flex-1 break-all", levelConfig[log.level].text)}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-theme-700 bg-theme-900/50 text-xs text-theme-400">
        <span>
          {filteredLogs.length} / {logs.length} entries
        </span>
        {autoScroll && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>
    </div>
  )
}
