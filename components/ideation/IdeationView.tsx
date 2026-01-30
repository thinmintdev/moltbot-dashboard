"use client"

import { useState, useMemo, useCallback } from "react"
import classNames from "classnames"
import {
  Lightbulb,
  Plus,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { IdeaCard } from "./IdeaCard"
import { IdeaModal } from "./IdeaModal"
import { useIdeationStore, type Idea, type IdeaCategory, type IdeaStatus, CATEGORY_COLORS, STATUS_COLORS } from "@/lib/stores/ideation-store"
import { useToast } from "@/components/common/Toast"

interface IdeationViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string }[]
}

type SortOption = 'votes' | 'newest' | 'oldest' | 'updated'
type ViewMode = 'grid' | 'list'

const categoryLabels: Record<IdeaCategory, string> = {
  feature: "Feature",
  improvement: "Improvement",
  bugfix: "Bug Fix",
  research: "Research",
  other: "Other",
}

const statusLabels: Record<IdeaStatus, string> = {
  new: "New",
  considering: "Considering",
  planned: "Planned",
  rejected: "Rejected",
}

export function IdeationView({
  projectId,
  projectName,
  projects = [],
}: IdeationViewProps) {
  // Store
  const { ideas, addIdea, updateIdea, deleteIdea, voteIdea } = useIdeationStore()

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | "all">("all")
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all")
  const [sortBy, setSortBy] = useState<SortOption>("votes")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [quickIdeaTitle, setQuickIdeaTitle] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { success, error: showError, info } = useToast()

  // Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let filtered = projectId
      ? ideas.filter((idea) => idea.projectId === projectId)
      : ideas

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query) ||
          idea.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((idea) => idea.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((idea) => idea.status === statusFilter)
    }

    // Sort
    switch (sortBy) {
      case "votes":
        filtered = [...filtered].sort((a, b) => b.votes - a.votes)
        break
      case "newest":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case "oldest":
        filtered = [...filtered].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        break
      case "updated":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        break
    }

    return filtered
  }, [ideas, projectId, searchQuery, categoryFilter, statusFilter, sortBy])

  // Stats for current project
  const stats = useMemo(() => {
    const projectIdeas = projectId
      ? ideas.filter((idea) => idea.projectId === projectId)
      : ideas

    return {
      total: projectIdeas.length,
      new: projectIdeas.filter((i) => i.status === "new").length,
      considering: projectIdeas.filter((i) => i.status === "considering").length,
      planned: projectIdeas.filter((i) => i.status === "planned").length,
      topVoted: Math.max(...projectIdeas.map((i) => i.votes), 0),
    }
  }, [ideas, projectId])

  // Handlers
  const handleVote = useCallback(
    (id: string, delta: 1 | -1) => {
      voteIdea(id, delta)
    },
    [voteIdea]
  )

  const handleAddIdea = useCallback(
    (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'votes'>) => {
      addIdea(ideaData)
      success("Idea added", `"${ideaData.title}" has been added to the board`)
    },
    [addIdea, success]
  )

  const handleUpdateIdea = useCallback(
    (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'votes'>) => {
      if (!editingIdea) return
      updateIdea(editingIdea.id, ideaData)
      setEditingIdea(null)
      success("Idea updated", `"${ideaData.title}" has been updated`)
    },
    [editingIdea, updateIdea, success]
  )

  const handleDeleteIdea = useCallback(
    (id: string) => {
      const idea = ideas.find((i) => i.id === id)
      deleteIdea(id)
      if (idea) {
        info("Idea deleted", `"${idea.title}" has been removed`)
      }
    },
    [ideas, deleteIdea, info]
  )

  const handleEditIdea = useCallback((idea: Idea) => {
    setEditingIdea(idea)
    setIsModalOpen(true)
  }, [])

  const handleQuickAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!quickIdeaTitle.trim()) return
      if (!projectId) {
        showError("No project selected", "Please select a project to add ideas")
        return
      }

      addIdea({
        title: quickIdeaTitle.trim(),
        description: "",
        category: "feature",
        status: "new",
        projectId,
        tags: [],
        author: "system",
      })
      setQuickIdeaTitle("")
      success("Idea captured", "Quick idea added successfully")
    },
    [quickIdeaTitle, projectId, addIdea, success, showError]
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Simulate refresh - in production this would fetch from API
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsRefreshing(false)
    info("Refreshed", "Ideas synced successfully")
  }, [info])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingIdea(null)
  }, [])

  // No project selected
  if (!projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-6">
          <Lightbulb className="w-8 h-8 text-[#71717a]" />
        </div>
        <h2 className="text-[#fafafa] text-xl font-semibold mb-2">Ideation Board</h2>
        <p className="text-[#71717a] text-center max-w-md">
          Select a project to view and capture ideas for brainstorming.
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef4444]/20 to-[#f97316]/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-[#f97316]" />
            </div>
            <div>
              <h2 className="text-[#fafafa] text-lg font-semibold">Ideation</h2>
              <span className="text-[#71717a] text-sm">{projectName}</span>
            </div>
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
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Idea
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg">
            <Sparkles className="w-4 h-4 text-[#f97316]" />
            <span className="text-[#fafafa] text-sm font-medium">{stats.total}</span>
            <span className="text-[#71717a] text-sm">ideas</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.new }}
            />
            <span className="text-[#fafafa] text-sm font-medium">{stats.new}</span>
            <span className="text-[#71717a] text-sm">new</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.planned }}
            />
            <span className="text-[#fafafa] text-sm font-medium">{stats.planned}</span>
            <span className="text-[#71717a] text-sm">planned</span>
          </div>
          {stats.topVoted > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg">
              <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              <span className="text-[#fafafa] text-sm font-medium">{stats.topVoted}</span>
              <span className="text-[#71717a] text-sm">top votes</span>
            </div>
          )}
        </div>

        {/* Quick add input */}
        <form onSubmit={handleQuickAdd} className="mb-4">
          <div className="relative">
            <Lightbulb className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
            <input
              type="text"
              value={quickIdeaTitle}
              onChange={(e) => setQuickIdeaTitle(e.target.value)}
              placeholder="Quick capture: type an idea and press Enter..."
              className="w-full pl-10 pr-20 py-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!quickIdeaTitle.trim()}
              className={classNames(
                "absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded text-sm font-medium transition-colors",
                quickIdeaTitle.trim()
                  ? "bg-[#f97316] text-white hover:bg-[#ea580c]"
                  : "bg-[#27272a] text-[#52525b] cursor-not-allowed"
              )}
            >
              Add
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ideas..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#52525b]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as IdeaCategory | "all")}
              className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | "all")}
            className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
          >
            <option value="all">All Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#52525b]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
            >
              <option value="votes">Most Votes</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={classNames(
                "p-1.5 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-[#27272a] text-[#fafafa]"
                  : "text-[#52525b] hover:text-[#a1a1aa]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={classNames(
                "p-1.5 rounded transition-colors",
                viewMode === "list"
                  ? "bg-[#27272a] text-[#fafafa]"
                  : "text-[#52525b] hover:text-[#a1a1aa]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-[#52525b]" />
            </div>
            <h3 className="text-[#fafafa] font-medium mb-2">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                ? "No ideas match your filters"
                : "No ideas yet"}
            </h3>
            <p className="text-[#71717a] text-sm text-center max-w-md mb-4">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters or search query"
                : "Start brainstorming by adding your first idea using the quick capture above or the Add Idea button."}
            </p>
            {!searchQuery && categoryFilter === "all" && statusFilter === "all" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white rounded-lg font-medium hover:from-[#dc2626] hover:to-[#ea580c] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Idea
              </button>
            )}
          </div>
        ) : (
          <div
            className={classNames(
              viewMode === "grid"
                ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-3 max-w-3xl"
            )}
          >
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onVote={handleVote}
                onEdit={handleEditIdea}
                onDelete={handleDeleteIdea}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <IdeaModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingIdea ? handleUpdateIdea : handleAddIdea}
        idea={editingIdea}
        projects={projects}
        defaultProjectId={projectId}
      />
    </div>
  )
}

export default IdeationView
