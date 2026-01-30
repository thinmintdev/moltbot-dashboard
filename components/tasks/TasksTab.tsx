"use client"

import { KanbanBoard } from "../kanban"

interface Project {
  id: string
  name: string
}

interface TasksTabProps {
  projects: Project[]
}

export default function TasksTab({ projects }: TasksTabProps) {
  // Convert projects to the format expected by KanbanBoard
  const kanbanProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
  }))

  const handleTaskCreate = (task: any) => {
    console.log("Task created:", task)
    // TODO: Send to backend API
  }

  const handleTaskUpdate = (task: any) => {
    console.log("Task updated:", task)
    // TODO: Send to backend API
  }

  const handleTaskDelete = (taskId: string) => {
    console.log("Task deleted:", taskId)
    // TODO: Send to backend API
  }

  return (
    <KanbanBoard
      projects={kanbanProjects}
      onTaskCreate={handleTaskCreate}
      onTaskUpdate={handleTaskUpdate}
      onTaskDelete={handleTaskDelete}
    />
  )
}
