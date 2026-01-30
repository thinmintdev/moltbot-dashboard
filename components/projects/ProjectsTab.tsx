"use client"

interface ProjectsTabProps {
  projects: any[]
  setProjects: (projects: any[]) => void
  onRefresh: () => void
}

export default function ProjectsTab({ projects, setProjects, onRefresh }: ProjectsTabProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-theme-500">
        <p className="text-4xl mb-4">📁</p>
        <p>Projects component - Coming soon</p>
        <p className="text-sm mt-2">{projects.length} projects</p>
      </div>
    </div>
  )
}
