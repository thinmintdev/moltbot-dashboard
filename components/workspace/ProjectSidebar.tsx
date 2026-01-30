"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import classNames from "classnames"
import { formatDistanceToNow } from "date-fns"
import {
  Archive,
  Bot,
  ChevronRight,
  FolderPlus,
  GripVertical,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Settings,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "../ui/Button"
import { NewProjectModal } from "./NewProjectModal"

export interface Project {
  id: string
  name: string
  description?: string
  status: "active" | "paused" | "completed" | "archived"
  color: string
  path?: string
  gitUrl?: string
  model?: string
  autoAssign?: boolean
  stats: {
    totalTasks: number
    completedTasks: number
    activeAgents: number
    lastActivity: string
  }
  createdAt: string
  updatedAt: string
}

interface ProjectSidebarProps {
  projects: Project[]
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
  onCreateProject: (project: Partial<Project>) => void
  onDeleteProject: (projectId: string) => void
  onArchiveProject: (projectId: string) => void
  onReorderProjects: (projects: Project[]) => void
}

const statusConfig = {
  active: {
    icon: <Play className="w-3 h-3" />,
    color: "text-emerald-400",
    bg: "bg-emerald-400",
    label: "Active",
  },
  paused: {
    icon: <Pause className="w-3 h-3" />,
    color: "text-amber-400",
    bg: "bg-amber-400",
    label: "Paused",
  },
  completed: {
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: "text-blue-400",
    bg: "bg-blue-400",
    label: "Completed",
  },
  archived: {
    icon: <Archive className="w-3 h-3" />,
    color: "text-theme-500",
    bg: "bg-theme-500",
    label: "Archived",
  },
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onArchiveProject,
  onReorderProjects,
}: ProjectSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [draggingProject, setDraggingProject] = useState<Project | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }

    // Filter out archived unless showing archived
    if (!showArchived) {
      filtered = filtered.filter((p) => p.status !== "archived")
    }

    return filtered
  }, [projects, searchQuery, showArchived])

  const archivedCount = projects.filter((p) => p.status === "archived").length

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id)
    if (project) {
      setDraggingProject(project)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggingProject(null)

    if (!over || active.id === over.id) return

    const oldIndex = projects.findIndex((p) => p.id === active.id)
    const newIndex = projects.findIndex((p) => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newProjects = [...projects]
    const [removed] = newProjects.splice(oldIndex, 1)
    newProjects.splice(newIndex, 0, removed)

    onReorderProjects(newProjects)
  }

  const handleCreateProject = (projectData: Partial<Project>) => {
    onCreateProject(projectData)
    setShowNewProjectModal(false)
  }

  return (
    <div className="h-full flex flex-col bg-theme-900">
      {/* Header */}
      <div className="p-4 border-b border-theme-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Projects
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewProjectModal(true)}
            className="!p-1.5"
            title="New Project"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 bg-theme-800 border border-theme-700 rounded-lg text-white placeholder-theme-600 text-sm focus:outline-none focus:ring-2 focus:ring-theme-500"
          />
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredProjects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredProjects.map((project) => (
              <SortableProjectItem
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onSelect={() => onSelectProject(project.id)}
                onDelete={() => onDeleteProject(project.id)}
                onArchive={() => onArchiveProject(project.id)}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {draggingProject && (
              <ProjectItemContent
                project={draggingProject}
                isActive={false}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>

        {filteredProjects.length === 0 && (
          <div className="px-4 py-8 text-center text-theme-500">
            <p className="text-sm">No projects found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-theme-400 hover:text-white mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer - show archived toggle */}
      {archivedCount > 0 && (
        <div className="p-3 border-t border-theme-800">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-theme-500 hover:text-white transition-colors w-full"
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? "Hide" : "Show"} archived ({archivedCount})</span>
            <ChevronRight
              className={classNames(
                "w-4 h-4 ml-auto transition-transform",
                showArchived && "rotate-90"
              )}
            />
          </button>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}

interface SortableProjectItemProps {
  project: Project
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onArchive: () => void
}

function SortableProjectItem({
  project,
  isActive,
  onSelect,
  onDelete,
  onArchive,
}: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(isDragging && "opacity-50")}
    >
      <ProjectItemContent
        project={project}
        isActive={isActive}
        onSelect={onSelect}
        onDelete={onDelete}
        onArchive={onArchive}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

interface ProjectItemContentProps {
  project: Project
  isActive: boolean
  isDragging?: boolean
  onSelect?: () => void
  onDelete?: () => void
  onArchive?: () => void
  dragHandleProps?: Record<string, unknown>
}

function ProjectItemContent({
  project,
  isActive,
  isDragging,
  onSelect,
  onDelete,
  onArchive,
  dragHandleProps,
}: ProjectItemContentProps) {
  const status = statusConfig[project.status]
  const lastActivity = formatDistanceToNow(new Date(project.stats.lastActivity), {
    addSuffix: true,
  })

  return (
    <div
      className={classNames(
        "group mx-2 mb-1 rounded-lg transition-colors",
        isActive
          ? "bg-theme-700/50 border border-theme-600"
          : "hover:bg-theme-800/50 border border-transparent",
        isDragging && "bg-theme-700 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2 p-2">
        {/* Drag handle */}
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            className="p-1 text-theme-600 hover:text-theme-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Color indicator */}
        <div
          className="w-1 h-10 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: project.color }}
        />

        {/* Main content - clickable */}
        <button
          onClick={onSelect}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate text-sm">
              {project.name}
            </span>
            <span className={classNames("shrink-0", status.color)}>
              {status.icon}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-theme-500">
            <span className="flex items-center gap-1">
              <Circle className="w-3 h-3" />
              {project.stats.completedTasks}/{project.stats.totalTasks}
            </span>
            {project.stats.activeAgents > 0 && (
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3" />
                {project.stats.activeAgents}
              </span>
            )}
            <span className="flex items-center gap-1 truncate">
              <Clock className="w-3 h-3" />
              {lastActivity}
            </span>
          </div>
        </button>

        {/* Actions menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 text-theme-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[160px] bg-theme-800 border border-theme-700 rounded-lg shadow-xl py-1 z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 cursor-pointer outline-none"
                onClick={onSelect}
              >
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 border-t border-theme-700" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-theme-300 hover:text-white hover:bg-theme-700 cursor-pointer outline-none"
                onClick={onArchive}
              >
                <Archive className="w-4 h-4" />
                {project.status === "archived" ? "Unarchive" : "Archive"}
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-theme-700 cursor-pointer outline-none"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}

export default ProjectSidebar
