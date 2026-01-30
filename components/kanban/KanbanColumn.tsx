"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import classNames from "classnames"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { useState } from "react"
import { TaskCard, type Task } from "./TaskCard"

export interface ColumnConfig {
  id: string
  title: string
  color: string
  bgColor: string
}

interface KanbanColumnProps {
  column: ColumnConfig
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask?: () => void
}

export function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const [collapsed, setCollapsed] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      className={classNames(
        "flex flex-col bg-theme-900/50 rounded-xl border border-theme-800 min-w-[300px] max-w-[300px] h-full",
        isOver && "ring-2 ring-theme-500 border-theme-500"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-theme-800 shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 group"
          >
            <span
              className={classNames(
                "w-3 h-3 rounded-full",
                column.bgColor
              )}
            />
            <h3 className="font-semibold text-white text-sm">{column.title}</h3>
            <span className="text-theme-500 text-xs bg-theme-800 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-theme-600 group-hover:text-theme-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-theme-600 group-hover:text-theme-400" />
            )}
          </button>

          {onAddTask && !collapsed && (
            <button
              onClick={onAddTask}
              className="text-theme-500 hover:text-theme-300 hover:bg-theme-700 p-1 rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tasks Container */}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={classNames(
            "flex-1 overflow-y-auto p-2 space-y-2 transition-colors",
            isOver && "bg-theme-800/30"
          )}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-theme-600 text-sm">
                No tasks
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
          </SortableContext>

          {/* Drop zone indicator */}
          {isOver && (
            <div className="border-2 border-dashed border-theme-500 rounded-lg h-16 flex items-center justify-center text-theme-500 text-sm">
              Drop here
            </div>
          )}
        </div>
      )}

      {/* Collapsed view */}
      {collapsed && (
        <div className="flex-1 flex items-center justify-center text-theme-600 text-sm p-4">
          <span className="writing-mode-vertical-rl rotate-180">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  )
}
