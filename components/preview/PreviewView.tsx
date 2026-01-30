"use client"

import { DevPreview } from "./DevPreview"

interface PreviewViewProps {
  projectId?: string | null
  projectName?: string
  projectPath?: string
}

export function PreviewView({
  projectId,
  projectName,
  projectPath,
}: PreviewViewProps) {
  // Default path if none provided
  const path = projectPath || "/mnt/dev/repos/moltbot-dashboard"

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b] overflow-hidden">
      <DevPreview
        projectPath={path}
        className="flex-1 m-4 rounded-xl"
      />
    </div>
  )
}

export default PreviewView
