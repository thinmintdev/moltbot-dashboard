"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  FileText,
  Plus,
  Filter,
  RefreshCw,
  Tag,
  PlusCircle,
  MinusCircle,
  Wrench,
  Trash2,
  Shield,
} from "lucide-react"
import { ChangelogEntry } from "./ChangelogEntry"
import { ChangelogModal } from "./ChangelogModal"
import {
  useChangelogStore,
  useProjectChangelog,
  useChangelogStats,
  type ChangelogEntry as ChangelogEntryType,
  type ChangeType,
  getChangeTypeConfig,
} from "@/lib/stores/changelog-store"

// ============================================================================
// Types
// ============================================================================

interface ChangelogViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string }[]
}

type ChangeTypeFilter = "all" | ChangeType

// ============================================================================
// Helper Functions
// ============================================================================

function getChangeTypeIcon(type: ChangeType) {
  switch (type) {
    case "added":
      return PlusCircle
    case "changed":
      return Wrench
    case "fixed":
      return Wrench
    case "removed":
      return MinusCircle
    case "security":
      return Shield
    default:
      return Tag
  }
}

// ============================================================================
// Filter Bar Component
// ============================================================================

function FilterBar({
  filter,
  onFilterChange,
  stats,
}: {
  filter: ChangeTypeFilter
  onFilterChange: (filter: ChangeTypeFilter) => void
  stats: ReturnType<typeof useChangelogStats>
}) {
  const filterOptions: { value: ChangeTypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "added", label: "Added" },
    { value: "changed", label: "Changed" },
    { value: "fixed", label: "Fixed" },
    { value: "removed", label: "Removed" },
    { value: "security", label: "Security" },
  ]

  return (
    <div className="flex items-center gap-2">
      <Filter size={14} className="text-[#52525b]" />
      <div className="flex items-center gap-1 bg-[#18181b] rounded-lg p-1 border border-[#27272a]">
        {filterOptions.map((option) => {
          const isActive = filter === option.value
          const count = option.value === "all"
            ? stats.totalChanges
            : stats.changesByType[option.value as ChangeType] || 0
          const config = option.value !== "all" ? getChangeTypeConfig(option.value as ChangeType) : null

          return (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={classNames(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition-colors",
                isActive
                  ? "bg-[#27272a] text-[#fafafa]"
                  : "text-[#71717a] hover:text-[#a1a1aa]"
              )}
            >
              {config && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              )}
              <span>{option.label}</span>
              {count > 0 && (
                <span className="text-xs text-[#52525b]">({count})</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ChangelogView({
  projectId,
  projectName,
  projects = [],
}: ChangelogViewProps) {
  const [filter, setFilter] = useState<ChangeTypeFilter>("all")
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ChangelogEntryType | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Store actions
  const addEntry = useChangelogStore((s) => s.addEntry)
  const updateEntry = useChangelogStore((s) => s.updateEntry)
  const deleteEntry = useChangelogStore((s) => s.deleteEntry)

  // Get project changelog and stats
  const entries = useProjectChangelog(projectId)
  const stats = useChangelogStats(projectId)

  // Filter entries by change type
  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries
    return entries.filter((e) =>
      e.changes.some((c) => c.type === filter)
    )
  }, [entries, filter])

  // Handlers
  const handleAddEntry = () => {
    setEditingEntry(null)
    setShowModal(true)
  }

  const handleEditEntry = (entry: ChangelogEntryType) => {
    setEditingEntry(entry)
    setShowModal(true)
  }

  const handleDeleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this version entry?")) {
      deleteEntry(id)
    }
  }

  const handleSubmitEntry = (data: Omit<ChangelogEntryType, "id" | "createdAt" | "updatedAt">) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, data)
    } else {
      addEntry(data)
    }
    setShowModal(false)
    setEditingEntry(null)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Empty state when no project selected
  if (!projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#0a0a0b]">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">Select a Project</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Choose a project from the tabs above to view and manage its changelog.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[#fafafa] text-lg font-semibold">Changelog</h2>
            {projectName && (
              <span className="px-2 py-0.5 bg-[#27272a] text-[#a1a1aa] rounded text-sm">
                {projectName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={classNames(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] border border-[#27272a] transition-colors",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={classNames("w-4 h-4", isRefreshing && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handleAddEntry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
            >
              <Plus size={16} />
              Add Version
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fafafa] font-mono">{stats.latestVersion}</div>
            <div className="text-xs text-[#71717a]">Latest Version</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#a1a1aa]">{stats.total}</div>
            <div className="text-xs text-[#71717a]">Releases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{stats.changesByType.added || 0}</div>
            <div className="text-xs text-[#71717a]">Added</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3b82f6]">{stats.changesByType.changed || 0}</div>
            <div className="text-xs text-[#71717a]">Changed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f97316]">{stats.changesByType.fixed || 0}</div>
            <div className="text-xs text-[#71717a]">Fixed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#ef4444]">{stats.changesByType.removed || 0}</div>
            <div className="text-xs text-[#71717a]">Removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#a855f7]">{stats.changesByType.security || 0}</div>
            <div className="text-xs text-[#71717a]">Security</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 px-6 py-3 border-b border-[#27272a]">
        <FilterBar filter={filter} onFilterChange={setFilter} stats={stats} />
      </div>

      {/* Content - Timeline View */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
              <FileText size={32} className="text-[#52525b]" />
            </div>
            <h3 className="text-[#fafafa] font-medium mb-1">No changelog entries</h3>
            <p className="text-[#71717a] text-sm mb-4">
              {filter === "all"
                ? "Create your first version entry to start tracking changes"
                : `No entries with "${filter}" changes found`}
            </p>
            {filter === "all" && (
              <button
                onClick={handleAddEntry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
              >
                <Plus size={16} />
                Add First Version
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Timeline */}
            <div className="relative">
              {filteredEntries.map((entry, index) => (
                <ChangelogEntry
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                  isFirst={index === 0}
                  isLast={index === filteredEntries.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Changelog Modal */}
      <ChangelogModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEntry(null)
        }}
        onSubmit={handleSubmitEntry}
        entry={editingEntry}
        projectId={projectId}
      />
    </div>
  )
}

export default ChangelogView
