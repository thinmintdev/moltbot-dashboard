"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import { format, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import {
  Map,
  Plus,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
} from "lucide-react"
import { MilestoneCard } from "./MilestoneCard"
import { MilestoneModal } from "./MilestoneModal"
import {
  useRoadmapStore,
  useProjectMilestones,
  useMilestoneStats,
  type Milestone,
} from "@/lib/stores/roadmap-store"

// ============================================================================
// Types
// ============================================================================

interface RoadmapViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string }[]
}

type ViewMode = "timeline" | "list"
type StatusFilter = "all" | Milestone["status"]

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusConfig(status: Milestone["status"]) {
  switch (status) {
    case "planned":
      return { color: "#71717a", Icon: Target, label: "Planned" }
    case "in_progress":
      return { color: "#f97316", Icon: Loader2, label: "In Progress" }
    case "completed":
      return { color: "#22c55e", Icon: CheckCircle, label: "Completed" }
    case "blocked":
      return { color: "#ef4444", Icon: AlertTriangle, label: "Blocked" }
  }
}

function getMilestoneMonth(milestone: Milestone): string {
  return format(new Date(milestone.dueDate), "yyyy-MM")
}

// ============================================================================
// Timeline View Component
// ============================================================================

function TimelineView({
  milestones,
  onEdit,
  onDelete,
}: {
  milestones: Milestone[]
  onEdit: (milestone: Milestone) => void
  onDelete: (id: string) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get milestones for the visible months (current + 2 months forward, 1 month back)
  const visibleMonths = useMemo(() => {
    const months: Date[] = []
    for (let i = -1; i <= 2; i++) {
      months.push(addMonths(currentMonth, i))
    }
    return months
  }, [currentMonth])

  // Group milestones by month
  const milestonesByMonth = useMemo(() => {
    const grouped: Record<string, Milestone[]> = {}
    milestones.forEach((m) => {
      const monthKey = getMilestoneMonth(m)
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(m)
    })
    // Sort milestones within each month by due date
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    })
    return grouped
  }, [milestones])

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Timeline Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46] text-sm transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <span className="text-sm text-[#71717a]">
          Showing {format(visibleMonths[0], "MMM yyyy")} - {format(visibleMonths[visibleMonths.length - 1], "MMM yyyy")}
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-4 gap-4">
        {visibleMonths.map((month) => {
          const monthKey = format(month, "yyyy-MM")
          const monthMilestones = milestonesByMonth[monthKey] || []
          const isCurrentMonth = format(new Date(), "yyyy-MM") === monthKey
          const isPast = isBefore(endOfMonth(month), new Date())

          return (
            <div
              key={monthKey}
              className={classNames(
                "bg-[#111113] border rounded-lg overflow-hidden",
                isCurrentMonth ? "border-[#f97316]/40" : "border-[#27272a]"
              )}
            >
              {/* Month Header */}
              <div
                className={classNames(
                  "px-3 py-2 border-b",
                  isCurrentMonth ? "bg-[#f97316]/10 border-[#f97316]/30" : "bg-[#18181b] border-[#27272a]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={classNames(
                      "font-medium text-sm",
                      isCurrentMonth ? "text-[#f97316]" : isPast ? "text-[#52525b]" : "text-[#fafafa]"
                    )}
                  >
                    {format(month, "MMMM")}
                  </span>
                  <span className="text-xs text-[#52525b]">
                    {format(month, "yyyy")}
                  </span>
                </div>
                {monthMilestones.length > 0 && (
                  <div className="text-xs text-[#71717a] mt-0.5">
                    {monthMilestones.length} milestone{monthMilestones.length !== 1 && "s"}
                  </div>
                )}
              </div>

              {/* Milestones */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {monthMilestones.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#52525b] text-sm">
                    No milestones
                  </div>
                ) : (
                  monthMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// List View Component
// ============================================================================

function ListView({
  milestones,
  onEdit,
  onDelete,
}: {
  milestones: Milestone[]
  onEdit: (milestone: Milestone) => void
  onDelete: (id: string) => void
}) {
  // Sort by due date
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [milestones])

  if (sortedMilestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
          <Map size={32} className="text-[#52525b]" />
        </div>
        <h3 className="text-[#fafafa] font-medium mb-1">No milestones yet</h3>
        <p className="text-[#71717a] text-sm">Create your first milestone to start planning your roadmap</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {sortedMilestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RoadmapView({
  projectId,
  projectName,
  projects = [],
}: RoadmapViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [showModal, setShowModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Store actions
  const addMilestone = useRoadmapStore((s) => s.addMilestone)
  const updateMilestone = useRoadmapStore((s) => s.updateMilestone)
  const deleteMilestone = useRoadmapStore((s) => s.deleteMilestone)

  // Get project milestones and stats
  const milestones = useProjectMilestones(projectId)
  const stats = useMilestoneStats(projectId)

  // Filter milestones by status
  const filteredMilestones = useMemo(() => {
    if (statusFilter === "all") return milestones
    return milestones.filter((m) => m.status === statusFilter)
  }, [milestones, statusFilter])

  // Handlers
  const handleAddMilestone = () => {
    setEditingMilestone(null)
    setShowModal(true)
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setShowModal(true)
  }

  const handleDeleteMilestone = (id: string) => {
    deleteMilestone(id)
  }

  const handleSubmitMilestone = (data: Omit<Milestone, "id" | "createdAt" | "updatedAt">) => {
    if (editingMilestone) {
      updateMilestone(editingMilestone.id, data)
    } else {
      addMilestone(data)
    }
    setShowModal(false)
    setEditingMilestone(null)
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
          <Map className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">Select a Project</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Choose a project from the tabs above to view and manage its roadmap milestones.
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
            <h2 className="text-[#fafafa] text-lg font-semibold">Roadmap</h2>
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
              onClick={handleAddMilestone}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
            >
              <Plus size={16} />
              Add Milestone
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fafafa]">{stats.total}</div>
            <div className="text-xs text-[#71717a]">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{stats.completed}</div>
            <div className="text-xs text-[#71717a]">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f97316]">{stats.inProgress}</div>
            <div className="text-xs text-[#71717a]">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#ef4444]">{stats.blocked}</div>
            <div className="text-xs text-[#71717a]">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#71717a]">{stats.planned}</div>
            <div className="text-xs text-[#71717a]">Planned</div>
          </div>
          <div className="ml-auto text-center">
            <div className="text-2xl font-bold text-[#fafafa]">{stats.overallProgress}%</div>
            <div className="text-xs text-[#71717a]">Overall Progress</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ef4444] to-[#f97316] transition-all"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 px-6 py-3 border-b border-[#27272a] flex items-center justify-between">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#18181b] rounded-lg p-1 border border-[#27272a]">
          <button
            onClick={() => setViewMode("timeline")}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors",
              viewMode === "timeline"
                ? "bg-[#27272a] text-[#fafafa]"
                : "text-[#71717a] hover:text-[#a1a1aa]"
            )}
          >
            <Calendar size={14} />
            Timeline
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors",
              viewMode === "list"
                ? "bg-[#27272a] text-[#fafafa]"
                : "text-[#71717a] hover:text-[#a1a1aa]"
            )}
          >
            <List size={14} />
            List
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#52525b]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "timeline" ? (
          <TimelineView
            milestones={filteredMilestones}
            onEdit={handleEditMilestone}
            onDelete={handleDeleteMilestone}
          />
        ) : (
          <ListView
            milestones={filteredMilestones}
            onEdit={handleEditMilestone}
            onDelete={handleDeleteMilestone}
          />
        )}
      </div>

      {/* Milestone Modal */}
      <MilestoneModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingMilestone(null)
        }}
        onSubmit={handleSubmitMilestone}
        milestone={editingMilestone}
        projectId={projectId}
      />
    </div>
  )
}

export default RoadmapView
