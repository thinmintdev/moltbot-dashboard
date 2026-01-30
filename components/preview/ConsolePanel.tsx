"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import classNames from "classnames"
import {
  Trash2,
  Search,
  ArrowDown,
  Filter,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Button } from "../ui/Button"

export type LogLevel = "error" | "warn" | "info" | "log"

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  source?: string
}

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
  className?: string
  maxHeight?: string
}

const LOG_LEVEL_CONFIG: Record<
  LogLevel,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  error: {
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    icon: <AlertCircle size={12} />,
    label: "Error",
  },
  warn: {
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    icon: <AlertTriangle size={12} />,
    label: "Warning",
  },
  info: {
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    icon: <Info size={12} />,
    label: "Info",
  },
  log: {
    color: "text-theme-300",
    bgColor: "bg-transparent",
    icon: null,
    label: "Log",
  },
}

export function ConsolePanel({
  logs,
  onClear,
  className,
  maxHeight = "300px",
}: ConsolePanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(
    new Set<LogLevel>(["error", "warn", "info", "log"])
  )
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Filter logs based on search query and active filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesFilter = activeFilters.has(log.level)
      const matchesSearch = searchQuery
        ? log.message.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchesFilter && matchesSearch
    })
  }, [logs, searchQuery, activeFilters])

  const toggleFilter = (level: LogLevel) => {
    const newFilters = new Set(activeFilters)
    if (newFilters.has(level)) {
      newFilters.delete(level)
    } else {
      newFilters.add(level)
    }
    setActiveFilters(newFilters)
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const logCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = { error: 0, warn: 0, info: 0, log: 0 }
    logs.forEach((log) => {
      counts[log.level]++
    })
    return counts
  }, [logs])

  return (
    <div
      className={classNames(
        "flex flex-col bg-theme-950 border border-theme-800 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Console Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-theme-900 border-b border-theme-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Console</span>
          <div className="flex items-center gap-1.5">
            {logCounts.error > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-rose-500/20 text-rose-400 rounded">
                {logCounts.error} errors
              </span>
            )}
            {logCounts.warn > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">
                {logCounts.warn} warnings
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-40 pl-7 pr-7 py-1 text-xs bg-theme-800 border border-theme-700 rounded text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={classNames(
                "p-1.5 rounded transition-colors",
                showFilterDropdown || activeFilters.size < 4
                  ? "bg-theme-600 text-white"
                  : "text-theme-400 hover:text-white hover:bg-theme-700"
              )}
            >
              <Filter size={14} />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-theme-800 border border-theme-700 rounded-lg shadow-lg z-10 py-1">
                {(Object.keys(LOG_LEVEL_CONFIG) as LogLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleFilter(level)}
                    className={classNames(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors",
                      activeFilters.has(level)
                        ? LOG_LEVEL_CONFIG[level].color
                        : "text-theme-500"
                    )}
                  >
                    <span
                      className={classNames(
                        "w-3 h-3 rounded border",
                        activeFilters.has(level)
                          ? "bg-theme-500 border-theme-500"
                          : "border-theme-600"
                      )}
                    />
                    {LOG_LEVEL_CONFIG[level].label}
                    <span className="ml-auto text-theme-500">
                      {logCounts[level]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={classNames(
              "p-1.5 rounded transition-colors",
              autoScroll
                ? "bg-theme-600 text-white"
                : "text-theme-400 hover:text-white hover:bg-theme-700"
            )}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            <ArrowDown size={14} />
          </button>

          {/* Clear Button */}
          <Button size="sm" variant="ghost" onClick={onClear}>
            <Trash2 size={14} />
            Clear
          </Button>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto font-mono text-xs"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-theme-500">
            {logs.length === 0
              ? "No console output yet"
              : "No logs match your filters"}
          </div>
        ) : (
          <div className="divide-y divide-theme-800/50">
            {filteredLogs.map((log) => {
              const config = LOG_LEVEL_CONFIG[log.level]
              return (
                <div
                  key={log.id}
                  className={classNames(
                    "flex items-start gap-2 px-3 py-1.5",
                    config.bgColor,
                    "hover:bg-theme-800/50"
                  )}
                >
                  {/* Timestamp */}
                  <span className="text-theme-600 shrink-0 tabular-nums">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  {/* Level Icon */}
                  {config.icon && (
                    <span className={classNames("shrink-0 mt-0.5", config.color)}>
                      {config.icon}
                    </span>
                  )}

                  {/* Source */}
                  {log.source && (
                    <span className="text-theme-500 shrink-0">[{log.source}]</span>
                  )}

                  {/* Message */}
                  <span
                    className={classNames("break-all whitespace-pre-wrap", config.color)}
                  >
                    {log.message}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
