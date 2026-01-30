"use client"

import { useState, useMemo, useCallback } from "react"
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  File,
  Code,
  FileText,
  Link as LinkIcon,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react"
import classNames from "classnames"
import { ContextDocCard } from "./ContextDocCard"
import { ContextModal } from "./ContextModal"
import { ContextPreview } from "./ContextPreview"
import {
  useContextStore,
  type ContextDocument,
  type ContextDocumentType,
  estimateTokens,
} from "@/lib/stores/context-store"
import { useToast } from "@/components/common/Toast"

// ============================================================================
// Types
// ============================================================================

interface ContextViewProps {
  projectId?: string | null
  projectName?: string
  projects?: { id: string; name: string }[]
}

type FilterType = "all" | ContextDocumentType
type FilterActive = "all" | "active" | "inactive"

// ============================================================================
// Filter Options
// ============================================================================

const TYPE_FILTERS: { value: FilterType; label: string; icon: typeof File }[] = [
  { value: "all", label: "All", icon: BookOpen },
  { value: "file", label: "Files", icon: File },
  { value: "snippet", label: "Snippets", icon: Code },
  { value: "note", label: "Notes", icon: FileText },
  { value: "link", label: "Links", icon: LinkIcon },
]

const ACTIVE_FILTERS: { value: FilterActive; label: string; icon: typeof Eye }[] = [
  { value: "all", label: "All", icon: BookOpen },
  { value: "active", label: "Active", icon: Eye },
  { value: "inactive", label: "Inactive", icon: EyeOff },
]

// ============================================================================
// Helper Functions
// ============================================================================

function getTypeColor(type: ContextDocumentType) {
  switch (type) {
    case "file":
      return "#3b82f6"
    case "snippet":
      return "#a855f7"
    case "note":
      return "#22c55e"
    case "link":
      return "#f97316"
    default:
      return "#71717a"
  }
}

// ============================================================================
// Component
// ============================================================================

export function ContextView({
  projectId,
  projectName,
  projects = [],
}: ContextViewProps) {
  const { success, error: showError, info } = useToast()

  // Store
  const documents = useContextStore((state) => state.documents)
  const addDocument = useContextStore((state) => state.addDocument)
  const updateDocument = useContextStore((state) => state.updateDocument)
  const deleteDocument = useContextStore((state) => state.deleteDocument)
  const toggleActive = useContextStore((state) => state.toggleActive)

  // Local state
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FilterType>("all")
  const [activeFilter, setActiveFilter] = useState<FilterActive>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<ContextDocument | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Get current project ID
  const currentProjectId = projectId || "proj-1"
  const currentProjectName = projectName || projects.find((p) => p.id === currentProjectId)?.name || "Project"

  // Filter documents for current project
  const projectDocuments = useMemo(() => {
    return documents.filter((doc) => doc.projectId === currentProjectId)
  }, [documents, currentProjectId])

  // Apply filters
  const filteredDocuments = useMemo(() => {
    let filtered = projectDocuments

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((doc) => doc.type === typeFilter)
    }

    // Active filter
    if (activeFilter === "active") {
      filtered = filtered.filter((doc) => doc.isActive)
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((doc) => !doc.isActive)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Sort by updated date (newest first)
    return filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [projectDocuments, typeFilter, activeFilter, searchQuery])

  // Get active documents for preview
  const activeDocuments = useMemo(() => {
    return projectDocuments.filter((doc) => doc.isActive)
  }, [projectDocuments])

  // Stats
  const stats = useMemo(() => {
    const total = projectDocuments.length
    const active = projectDocuments.filter((doc) => doc.isActive).length
    const totalTokens = activeDocuments.reduce((sum, doc) => {
      return sum + estimateTokens(doc.content) + estimateTokens(doc.title) + 10
    }, 0)

    const byType = {
      file: projectDocuments.filter((doc) => doc.type === "file").length,
      snippet: projectDocuments.filter((doc) => doc.type === "snippet").length,
      note: projectDocuments.filter((doc) => doc.type === "note").length,
      link: projectDocuments.filter((doc) => doc.type === "link").length,
    }

    return { total, active, totalTokens, byType }
  }, [projectDocuments, activeDocuments])

  // Handlers
  const handleAddDocument = useCallback(() => {
    setEditingDocument(null)
    setModalOpen(true)
  }, [])

  const handleEditDocument = useCallback((doc: ContextDocument) => {
    setEditingDocument(doc)
    setModalOpen(true)
  }, [])

  const handleDeleteDocument = useCallback((id: string) => {
    setConfirmDelete(id)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (confirmDelete) {
      deleteDocument(confirmDelete)
      success("Document Deleted", "Context document has been removed")
      setConfirmDelete(null)
    }
  }, [confirmDelete, deleteDocument, success])

  const handleToggleActive = useCallback((id: string) => {
    toggleActive(id)
    const doc = documents.find((d) => d.id === id)
    if (doc) {
      info(
        doc.isActive ? "Removed from Context" : "Added to Context",
        doc.isActive
          ? `"${doc.title}" will not be included in AI context`
          : `"${doc.title}" will be included in AI context`
      )
    }
  }, [toggleActive, documents, info])

  const handleSubmitDocument = useCallback(
    (data: Omit<ContextDocument, "id" | "createdAt" | "updatedAt">) => {
      if (editingDocument) {
        updateDocument(editingDocument.id, data)
        success("Document Updated", `"${data.title}" has been updated`)
      } else {
        addDocument(data)
        success("Document Added", `"${data.title}" has been added to context`)
      }
      setModalOpen(false)
      setEditingDocument(null)
    },
    [editingDocument, addDocument, updateDocument, success]
  )

  const handleClearFilters = useCallback(() => {
    setSearchQuery("")
    setTypeFilter("all")
    setActiveFilter("all")
  }, [])

  const hasActiveFilters = searchQuery || typeFilter !== "all" || activeFilter !== "all"

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-[#27272a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[#fafafa] text-lg font-semibold">Context</h2>
            <span className="px-2 py-0.5 rounded bg-[#27272a] text-[#71717a] text-xs">
              {currentProjectName}
            </span>
          </div>
          <button
            onClick={handleAddDocument}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] shadow-sm shadow-[#ef4444]/20 hover:shadow-[#ef4444]/40 transition-all"
          >
            <Plus size={16} />
            Add Context
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#fafafa]">{stats.total}</div>
            <div className="text-xs text-[#71717a]">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#22c55e]">{stats.active}</div>
            <div className="text-xs text-[#71717a]">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f97316]">
              {stats.totalTokens < 1000
                ? stats.totalTokens
                : `${(stats.totalTokens / 1000).toFixed(1)}k`}
            </div>
            <div className="text-xs text-[#71717a]">Tokens</div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {(["file", "snippet", "note", "link"] as const).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getTypeColor(type) }}
                />
                <span className="text-[#71717a] text-xs">{stats.byType[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="shrink-0 px-6 py-3 border-b border-[#27272a] flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] text-sm placeholder-[#52525b] focus:outline-none focus:border-[#3f3f46] transition-colors"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={classNames(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
            showFilters || hasActiveFilters
              ? "bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]"
              : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46]"
          )}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
          )}
          <ChevronDown
            size={14}
            className={classNames(
              "transition-transform",
              showFilters && "rotate-180"
            )}
          />
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#71717a] hover:text-[#fafafa] transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="shrink-0 px-6 py-3 border-b border-[#27272a] bg-[#111113]">
          <div className="flex items-center gap-6">
            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[#52525b] text-xs">Type:</span>
              {TYPE_FILTERS.map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.value}
                    onClick={() => setTypeFilter(filter.value)}
                    className={classNames(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                      typeFilter === filter.value
                        ? "bg-[#27272a] text-[#fafafa]"
                        : "text-[#71717a] hover:text-[#a1a1aa]"
                    )}
                  >
                    <Icon size={12} />
                    {filter.label}
                  </button>
                )
              })}
            </div>

            {/* Active Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[#52525b] text-xs">Status:</span>
              {ACTIVE_FILTERS.map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={classNames(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                      activeFilter === filter.value
                        ? "bg-[#27272a] text-[#fafafa]"
                        : "text-[#71717a] hover:text-[#a1a1aa]"
                    )}
                  >
                    <Icon size={12} />
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Document List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocuments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
                {hasActiveFilters ? (
                  <Search size={24} className="text-[#52525b]" />
                ) : (
                  <BookOpen size={24} className="text-[#52525b]" />
                )}
              </div>
              <h3 className="text-[#fafafa] font-medium mb-2">
                {hasActiveFilters ? "No matching documents" : "No context documents"}
              </h3>
              <p className="text-[#71717a] text-sm mb-4 max-w-md">
                {hasActiveFilters
                  ? "Try adjusting your filters or search query"
                  : "Add files, code snippets, notes, or links to provide context for AI agents"}
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={handleAddDocument}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:from-[#dc2626] hover:to-[#ea580c] transition-all"
                >
                  <Plus size={16} />
                  Add First Document
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 max-w-3xl">
              {filteredDocuments.map((doc) => (
                <ContextDocCard
                  key={doc.id}
                  document={doc}
                  onToggleActive={handleToggleActive}
                  onEdit={handleEditDocument}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Context Preview */}
        <div className="w-[380px] shrink-0 border-l border-[#27272a] p-4">
          <ContextPreview documents={activeDocuments} />
        </div>
      </div>

      {/* Modal */}
      <ContextModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingDocument(null)
        }}
        onSubmit={handleSubmitDocument}
        document={editingDocument}
        projectId={currentProjectId}
      />

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-[#18181b] rounded-xl border border-[#27272a] p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#fafafa] mb-2">
              Delete Document?
            </h3>
            <p className="text-[#71717a] text-sm mb-6">
              This will permanently remove the document from your context. This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg font-medium bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContextView
